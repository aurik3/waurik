import { IProvider, IMessage, IFlow, IState, IFlowContext, MenuState } from '../types';
import { getFlowMetadata, getStepMetadata, getStepsOrderMetadata, getFuncMetadata, getFuncsOrderMetadata, 
  getApiMetadata, getApisOrderMetadata, getEventMetadata, getEventsOrderMetadata, getFilesMetadata, 
  getInfoMetadata, getInfoOrderMetadata, getMenuMetadata, getMenuOrderMetadata, findDecoratorByIdInFlow } from '../decorators';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

export class FlowManager {
  private flows: Map<string, any> = new Map();
  private states: Map<string, IState & { __stepIndex?: number, __flowKeyword?: string, __started?: boolean }> = new Map();

  // Helper method to clean state when returning to menu
  private cleanStateForMenu(state: MenuState) {
    // Elimina todas las claves que no sean de sistema (las que empiezan con '__')
    Object.keys(state).forEach(key => {
      if (!key.startsWith('__')) {
        delete state[key];
      }
    });
    // Opcional: limpia también __currentId si existe
    delete state.__currentId;
  }

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
    let state: MenuState = this.states.get(message.from) || {};
    let flow: any;
    let stepIndex: number;
    let stepProps: string[] = [];

    // Si no hay flujo en curso, buscar por keyword
    if (!state.__flowKeyword) {
      const keyword = message.body.split(' ')[0].toLowerCase();
      flow = this.flows.get(keyword);
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

    // Obtener los pasos del flujo en el orden correcto
    stepProps = getStepsOrderMetadata(Object.getPrototypeOf(flow));
    const funcProps = getFuncsOrderMetadata(Object.getPrototypeOf(flow));
    const apiProps = getApisOrderMetadata(Object.getPrototypeOf(flow));
    const infoProps = getInfoOrderMetadata(Object.getPrototypeOf(flow));

    stepIndex = state.__stepIndex || 0;
    const currentStep = stepProps[stepIndex];
    const context: IFlowContext = {
      state,
      message,
      provider: this.provider
    };

    try {
      // --- MANEJO DE MENÚ PRINCIPAL ---
      if (currentStep) {
        const menuMetadata = getMenuMetadata(flow, currentStep);
        if (menuMetadata) {
          // Si es la primera vez (no se ha mostrado el menú), solo mostrar el menú y marcar como iniciado
          if (state.__started !== true) {
            const fullMenuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
            await this.provider.sendMessage(message.from, fullMenuText);
            state.__started = true;
            this.states.set(message.from, state);
            return;
          }

          // Si el usuario digita '0' en el menú principal, simplemente vuelve a mostrar el menú (sin error)
          if (message.body.trim() === '0') {
            const fullMenuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
            await this.provider.sendMessage(message.from, fullMenuText);
            this.states.set(message.from, state);
            return;
          }

          // Procesar la opción del usuario SOLO si ya se mostró el menú antes
          const selectedOption = menuMetadata.options.find(opt => 
            message.body.trim() === opt.option.split('-')[0].trim());

          if (selectedOption) {
            // Encontrar el decorador con el ID correspondiente
            const targetDecorator = findDecoratorByIdInFlow(flow, selectedOption.goTo);
            if (targetDecorator) {
              // Limpiar el estado antes de manejar la nueva opción
              this.cleanStateForMenu(state);
              state.__currentId = selectedOption.goTo;

              if (targetDecorator.type === 'info') {
                let messageText = targetDecorator.metadata.message;
                messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
                  state[key] || `{{${key}}}`);
                await this.provider.sendMessage(message.from, messageText);
                await flow[targetDecorator.name](context);
                // Guardar el estado y salir (espera comando de menú en la sección informativa)
                this.states.set(message.from, state);
                return;
              } else if (targetDecorator.type === 'step') {
                // Ir al paso
                const newStepIndex = stepProps.indexOf(targetDecorator.name);
                if (newStepIndex !== -1) {
                  state.__stepIndex = newStepIndex;
                  let messageText = targetDecorator.metadata.message;
                  messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
                    state[key] || `{{${key}}}`);
                  await this.provider.sendMessage(message.from, messageText);
                  this.states.set(message.from, state);
                  return;
                }
              }
            }
          }

          // Si no se seleccionó una opción válida, mostrar el menú de nuevo con error
          const fullMenuText = `❌ Opción no válida. Por favor seleccione una opción:\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
          await this.provider.sendMessage(message.from, fullMenuText);
          this.states.set(message.from, state);
          return;
        }
      }

      // --- MANEJO DE SECCIONES INFORMATIVAS (INFO) ---
      if (state.__currentId) {
        // Buscar el decorador actual
        const targetDecorator = findDecoratorByIdInFlow(flow, state.__currentId);
        if (targetDecorator && targetDecorator.type === 'info') {
          // Si el usuario digita '0', volver al menú principal
          if (message.body.trim() === (targetDecorator.metadata.menuCommand || '0')) {
            // Buscar el paso de menú principal
            let menuStepName = stepProps.find(prop => getMenuMetadata(flow, prop));
            if (menuStepName) {
              this.cleanStateForMenu(state);
              state.__stepIndex = stepProps.indexOf(menuStepName);
              state.__started = false;
              this.states.set(message.from, state);
              // Mostrar menú principal
              const menuMetadata = getMenuMetadata(flow, menuStepName);
              const menuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
              await this.provider.sendMessage(message.from, menuText);
              return;
            }
          } else {
            // Si no es comando de menú, solo repetir el mensaje informativo
            let messageText = targetDecorator.metadata.message;
            messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
            await this.provider.sendMessage(message.from, messageText);
            this.states.set(message.from, state);
            return;
          }
        }
      }

      // --- FLUJO NORMAL (pasos y validaciones) ---
      if (state.__started === false) {
        // Encontrar todos los decoradores en orden hasta el primer @Step
        const allDecorators = [...stepProps, ...infoProps].sort((a, b) => {
          const aIndex = Object.getOwnPropertyNames(flow.constructor.prototype).indexOf(a);
          const bIndex = Object.getOwnPropertyNames(flow.constructor.prototype).indexOf(b);
          return aIndex - bIndex;
        });

        for (const decoratorName of allDecorators) {
          const stepMetadata = getStepMetadata(flow, decoratorName);
          const infoMetadata = getInfoMetadata(flow, decoratorName);

          if (stepMetadata && stepMetadata.message) {
            // Si encontramos un @Step, enviamos su mensaje y detenemos
            let messageText = stepMetadata.message;
            messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
            await this.provider.sendMessage(message.from, messageText);
            state.__started = true;
            this.states.set(message.from, state);
            return;
          } else if (infoMetadata && infoMetadata.message) {
            // Si encontramos un @Info, enviamos su mensaje y continuamos
            let messageText = infoMetadata.message;
            messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
            await this.provider.sendMessage(message.from, messageText);
            await flow[decoratorName](context);
          }
        }
      }

      // --- FLUJO DE PASOS (si aplica) ---
      if (currentStep) {
        const stepMetadata = getStepMetadata(flow, currentStep);
        const infoMetadata = getInfoMetadata(flow, currentStep);
        // Check for menu return command if backToMenu is enabled
        if ((stepMetadata?.backToMenu || infoMetadata?.backToMenu) && 
            message.body.trim().toLowerCase() === (stepMetadata?.menuCommand || infoMetadata?.menuCommand || '0').toLowerCase()) {
          // Find the first menu step in the flow
          let menuStepName = stepProps.find(prop => getMenuMetadata(flow, prop));
          if (menuStepName) {
            this.cleanStateForMenu(state);
            state.__stepIndex = stepProps.indexOf(menuStepName);
            state.__started = false;
            this.states.set(message.from, state);
            // Mostrar menú inmediatamente
            const menuMetadata = getMenuMetadata(flow, menuStepName);
            const menuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
            await this.provider.sendMessage(message.from, menuText);
            return;
          }
        }

        // Ejecutar el paso actual (validación)
        const result = await this.executeStep(flow, currentStep, context);
        // Solo si el resultado es válido, guardar la respuesta y avanzar
        if (result !== null && result !== undefined) {
          state[currentStep] = message.body;

          // Buscar si hay algún @Info que deba ejecutarse después de este paso
          const allDecorators = [...stepProps, ...infoProps].sort((a, b) => {
            const aIndex = Object.getOwnPropertyNames(flow.constructor.prototype).indexOf(a);
            const bIndex = Object.getOwnPropertyNames(flow.constructor.prototype).indexOf(b);
            return aIndex - bIndex;
          });

          const currentStepIndex = allDecorators.indexOf(currentStep);
          const nextStep = allDecorators[currentStepIndex + 1];

          if (nextStep && getInfoMetadata(flow, nextStep)) {
            const infoMetadata = getInfoMetadata(flow, nextStep);
            let messageText = infoMetadata.message;
            messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => state[key] || `{{${key}}}`);
            await this.provider.sendMessage(message.from, messageText);
            await flow[nextStep](context);
          }

          // Ejecutar los métodos @Func en orden
          for (const funcName of funcProps) {
            const funcResult = await this.executeFunc(flow, funcName, context);
            if (funcResult === false) {
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