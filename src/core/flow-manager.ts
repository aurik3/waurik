import { IProvider, IMessage, IFlow, IState, IFlowContext } from '../types';
import { getFlowMetadata, getStepMetadata, getStepsOrderMetadata, getFuncMetadata, getFuncsOrderMetadata, getApiMetadata, getApisOrderMetadata, getEventMetadata, getEventsOrderMetadata, getFilesMetadata } from '../decorators';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export class FlowManager {
  private flows: Map<string, any> = new Map();
  private states: Map<string, IState & { __stepIndex?: number, __flowKeyword?: string, __started?: boolean }> = new Map();

  constructor(private provider: IProvider) {
    this.setupProvider();
  }

  private setupProvider() {
    this.provider.onMessage(this.handleMessage.bind(this));
    this.provider.onConnection((status) => {
      console.log(`Provider connection status: ${status}`);
    });
  }

  registerFlow(flowClass: any) {
    const metadata = getFlowMetadata(flowClass);
    if (!metadata) {
      throw new Error('Flow class must be decorated with @Flow');
    }

    const flow = new flowClass();
    this.flows.set(metadata.keyword, flow);

    // Registrar listeners para los métodos @Event
    const eventProps = getEventsOrderMetadata(flowClass.prototype);
    for (const eventName of eventProps) {
      const eventMeta = getEventMetadata(flow, eventName);
      if (eventMeta && eventMeta.eventName) {
        // Suponiendo que el proveedor tiene un método on(eventName, callback)
        if (typeof this.provider.on === 'function') {
          this.provider.on(eventMeta.eventName, async (eventData: any) => {
            const context: IFlowContext = {
              state: {},
              message: eventData,
              provider: this.provider
            };
            await flow[eventName](context);
          });
        }
      }
    }
  }

  private async handleMessage(message: IMessage) {
    let state = this.states.get(message.from) || {};
    let flow: any;
    let stepIndex: number;
    let stepProps: string[] = [];

    // Si no hay flujo en curso, buscar por keyword
    if (!state.__flowKeyword) {
      const keyword = message.body.split(' ')[0].toLowerCase();
      flow = this.flows.get(keyword);
      // Si no hay coincidencia exacta, buscar flujo comodín '*'
      if (!flow) {
        flow = this.flows.get('*');
        if (!flow) return;
        state.__flowKeyword = '*';
      } else {
        state.__flowKeyword = keyword;
      }
      state.__stepIndex = 0;
      state.__started = false;
    } else {
      flow = this.flows.get(state.__flowKeyword);
      if (!flow) return;
    }

    // Obtener los pasos del flujo en el orden correcto usando el metadata
    stepProps = getStepsOrderMetadata(Object.getPrototypeOf(flow));
    const funcProps = getFuncsOrderMetadata(Object.getPrototypeOf(flow));
    const apiProps = getApisOrderMetadata(Object.getPrototypeOf(flow));

    stepIndex = state.__stepIndex || 0;
    const currentStep = stepProps[stepIndex];
    const context: IFlowContext = {
      state,
      message,
      provider: this.provider
    };

    try {
      // Si el flujo acaba de iniciar, mostrar el mensaje del primer step y esperar respuesta
      if (state.__started === false) {
        const metadata = getStepMetadata(flow, currentStep);
        let messageText = metadata.message;
        messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
        await this.provider.sendMessage(message.from, messageText);
        state.__started = true;
        this.states.set(message.from, state);
        return;
      }

      if (currentStep) {
        // Ejecutar el paso actual (validación)
        const result = await this.executeStep(flow, currentStep, context);
        // Solo si el resultado es válido, guardar la respuesta y avanzar
        if (result !== null && result !== undefined) {
          state[currentStep] = message.body;

          // Ejecutar los métodos @Func en orden
          for (const funcName of funcProps) {
            const funcResult = await this.executeFunc(flow, funcName, context);
            if (funcResult === false) {
              // Si algún @Func retorna false, detener el flujo y no avanzar
              this.states.set(message.from, state);
              return;
            }
          }

          // Ejecutar los métodos @Api en orden
          for (const apiName of apiProps) {
            await this.executeApi(flow, apiName, context, getApiMetadata(flow, apiName));
          }

          state.__stepIndex = stepIndex + 1;
          // Si no hay más pasos, limpiar el estado
          if (state.__stepIndex >= stepProps.length) {
            delete state.__stepIndex;
            delete state.__flowKeyword;
            delete state.__started;
          } else {
            // Enviar el mensaje del siguiente paso
            const nextStep = stepProps[state.__stepIndex];
            if (nextStep) {
              const metadata = getStepMetadata(flow, nextStep);
              let messageText = metadata.message;
              messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
              await this.provider.sendMessage(message.from, messageText);
            }
          }
        } else {
          // Si es null, volver a mostrar el mensaje del mismo paso
          const metadata = getStepMetadata(flow, currentStep);
          let messageText = metadata.message;
          messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
          await this.provider.sendMessage(message.from, messageText);
        }
      } else {
        // Si no hay más pasos, limpiar el estado
        delete state.__stepIndex;
        delete state.__flowKeyword;
        delete state.__started;
      }
      this.states.set(message.from, state);
    } catch (error) {
      console.error('Error executing flow:', error);
      await this.provider.sendMessage(message.from, 'Lo siento, ha ocurrido un error en el flujo.');
    }
  }

  private async executeStep(flow: any, prop: string, context: IFlowContext): Promise<any> {
    return await flow[prop](context);
  }

  private async executeFunc(flow: any, prop: string, context: IFlowContext): Promise<any> {
    if (typeof flow[prop] === 'function') {
      return await flow[prop](context);
    }
    return undefined;
  }

  private async executeApi(flow: any, prop: string, context: IFlowContext, metadata: any) {
    try {
      const response = await axios({
        method: metadata.method.toLowerCase(),
        url: metadata.url,
        data: context.state
      });
      context.state[prop] = response.data;
      await flow[prop](context);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async executeEvent(flow: any, prop: string, context: IFlowContext) {
    const metadata = getEventMetadata(flow, prop);
    if (context.message.metadata?.type === metadata.eventName) {
      await flow[prop](context);
    }
  }

  private async executeFiles(flow: any, prop: string, context: IFlowContext, metadata: any) {
    if (context.message.type === 'document' || context.message.type === 'image' || context.message.type === 'audio') {
      const filePath = path.join(metadata.path, `${Date.now()}-${context.message.metadata.filename}`);
      await fs.promises.writeFile(filePath, context.message.metadata.data);
      context.state[prop] = filePath;
      await flow[prop](context);
    }
  }
} 