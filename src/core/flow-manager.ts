import { IProvider, IMessage, IFlow, IState, IFlowContext, MenuState } from '../types';
import { getFlowMetadata, getStepMetadata, getStepsOrderMetadata, getFuncMetadata, getFuncsOrderMetadata, 
  getApiMetadata, getApisOrderMetadata, getEventMetadata, getEventsOrderMetadata, getFilesMetadata, 
  getInfoMetadata, getInfoOrderMetadata, getMenuMetadata, getMenuOrderMetadata, findDecoratorByIdInFlow,
  getAIMetadata, getAIOrderMetadata } from '../decorators';
import { defaultLLMProvider } from '../providers/llm/generic-llm.provider';
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

  // Helper method to restart flow from beginning
  private async restartFlow(flow: any, state: MenuState, from: string) {
    // Marcar que estamos esperando confirmación para reiniciar
    state.__awaitingRestart = true;
    state.__flowKeyword = this.getFlowKeyword(flow);
    
    // Enviar mensaje de confirmación
    await this.provider.sendMessage(from, '¿Necesitas algo más o puedo ayudarte en algo más? (Responde "si" para continuar o "no" para finalizar)');
  }

  // Helper method to handle restart confirmation
  private async handleRestartConfirmation(flow: any, state: MenuState, from: string, userResponse: string) {
    const response = userResponse.toLowerCase().trim();
    
    if (response === 'si' || response === 'sí') {
      // Usuario quiere continuar - reiniciar el flujo
      await this.performFlowRestart(flow, state, from);
    } else if (response === 'no') {
      // Usuario quiere finalizar - limpiar estado completamente
      await this.provider.sendMessage(from, '¡Gracias por usar nuestro servicio! Que tengas un excelente día. 👋');
      this.states.delete(from); // Eliminar completamente el estado
    } else {
      // Respuesta no válida - volver a preguntar
      await this.provider.sendMessage(from, 'Por favor responde "si" para continuar o "no" para finalizar.');
    }
  }

  // Helper method to perform the actual flow restart
  private async performFlowRestart(flow: any, state: MenuState, from: string) {
    // Limpiar todo el estado excepto las banderas de sistema
    Object.keys(state).forEach(key => {
      delete state[key];
    });
    
    // Buscar si hay un menú principal en el flujo
    const stepProps = getStepsOrderMetadata(Object.getPrototypeOf(flow));
    const menuStepName = stepProps.find(prop => getMenuMetadata(flow, prop));
    
    if (menuStepName) {
      // Si hay menú, volver al menú principal
      state.__stepIndex = stepProps.indexOf(menuStepName);
      state.__started = false;
      state.__flowKeyword = this.getFlowKeyword(flow);
      
      // Mostrar el menú
      const menuMetadata = getMenuMetadata(flow, menuStepName);
      const menuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
      await this.provider.sendMessage(from, menuText);
    } else {
      // Si no hay menú, reiniciar desde el primer paso o AI
      const aiProps = getAIOrderMetadata(Object.getPrototypeOf(flow));
      
      if (aiProps.length > 0) {
        // Si hay decorador AI, reiniciar desde ahí
        state.__stepIndex = 0;
        state.__started = false;
        state.__flowKeyword = this.getFlowKeyword(flow);
        
        // Enviar saludo del AI
        const aiMetadata = getAIMetadata(flow, aiProps[0]);
        if (aiMetadata) {
          await this.provider.sendMessage(from, aiMetadata.greeting);
        }
      } else {
        // Si no hay AI ni menú, reiniciar desde el primer paso
        state.__stepIndex = 0;
        state.__started = false;
        state.__flowKeyword = this.getFlowKeyword(flow);
        
        // Enviar mensaje del primer paso si existe
        if (stepProps.length > 0) {
          const firstStep = stepProps[0];
          const stepMetadata = getStepMetadata(flow, firstStep);
          if (stepMetadata && stepMetadata.message) {
            let messageText = stepMetadata.message;
            messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
              state[key] || `{{${key}}}`);
            await this.provider.sendMessage(from, messageText);
            state.__started = true;
          }
        }
      }
    }
  }

  // Helper method to get flow keyword
  private getFlowKeyword(flow: any): string {
    const metadata = getFlowMetadata(flow.constructor);
    return metadata ? metadata.keyword : '*';
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
    // Rechazar mensajes que vengan de grupos
    if (message.from.endsWith('@g.us')) {
      console.log(`Mensaje rechazado de grupo: ${message.from}`);
      return;
    }

    let state: MenuState = this.states.get(message.from) || {};
    let flow: any;
    let stepIndex: number;
    let stepProps: string[] = [];

    // Verificar si estamos esperando confirmación de reinicio
    if (state.__awaitingRestart) {
      flow = this.flows.get(state.__flowKeyword!);
      if (flow) {
        await this.handleRestartConfirmation(flow, state, message.from, message.body);
        this.states.set(message.from, state);
        return;
      }
    }

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
    const aiProps = getAIOrderMetadata(Object.getPrototypeOf(flow));

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


        console.log(menuMetadata)

       

        if (menuMetadata) {
          // Si es la primera vez (no se ha mostrado el menú), solo mostrar el menú y marcar como iniciado
          if (state.__started !== true) {
            const fullMenuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
            await this.provider.sendMessage(message.from, fullMenuText);
            state.__started = true;
            this.states.set(message.from, state);
            return;
          }

          const menuCommand = menuMetadata.options.find(opt => opt.menuCommand)?.menuCommand || '0';

         
         
          // Si el usuario digita '0' en el menú principal, simplemente vuelve a mostrar el menú (sin error)
          if (message.body.trim() === menuCommand) {
            const fullMenuText = `${menuMetadata.message}\n\n${menuMetadata.options.map(opt => opt.option).join('\n')}`;
            await this.provider.sendMessage(message.from, fullMenuText);
            this.states.set(message.from, state);
            return;
          }

          // Procesar la opción del usuario SOLO si ya se mostró el menú antes
          const selectedOption = menuMetadata.options.find(opt => message.body.trim() === opt.option.split('-')[0].trim());

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
                  state.__started = true; // Marcar como iniciado para que espere la respuesta
                  state.__currentId = undefined; // Limpiar el currentId para salir del modo menú
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
        const targetDecorator = findDecoratorByIdInFlow(flow, state.__currentId);
        if (targetDecorator && targetDecorator.type === 'info') {
          // Obtener el menuCommand configurado o usar # como default
          const menuCommand = targetDecorator.metadata.menuCommand || '#';

          // Comparar con el comando específico configurado
          if (message.body.trim() === menuCommand) {
            let menuStepName = stepProps.find(prop => getMenuMetadata(flow, prop));
            if (menuStepName) {
              this.cleanStateForMenu(state);
              state.__stepIndex = stepProps.indexOf(menuStepName);
              state.__started = false;
              this.states.set(message.from, state);
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

      // --- MANEJO DE DECORADOR AI ---
      if (aiProps.length > 0) {
        const aiMethodName = aiProps[0]; // Tomar el primer decorador AI
        const aiMetadata = getAIMetadata(flow, aiMethodName);
        
        if (aiMetadata && !state.__aiProcessed) {
          // Primera vez: enviar saludo
          if (!state.__aiGreetingSent) {
            await this.provider.sendMessage(message.from, aiMetadata.greeting);
            state.__aiGreetingSent = true;
            this.states.set(message.from, state);
            return;
          }
          
          // Segunda vez: enviar pregunta
          if (!state.__aiQuestionSent) {
            await this.provider.sendMessage(message.from, aiMetadata.question);
            state.__aiQuestionSent = true;
            this.states.set(message.from, state);
            return;
          }
          
          // Detectar intención y redirigir
          const llmProvider = aiMetadata.llmProvider || defaultLLMProvider;
          const detectedGoTo = await llmProvider.detectIntent(message.body, aiMetadata.intents);
          
          if (detectedGoTo) {
            // Encontrar el decorador con el ID correspondiente
            const targetDecorator = findDecoratorByIdInFlow(flow, detectedGoTo);
            if (targetDecorator) {
              state.__aiProcessed = true;
              
              if (targetDecorator.type === 'info') {
                state.__currentId = detectedGoTo;
                let messageText = targetDecorator.metadata.message;
                messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
                  state[key] || `{{${key}}}`);
                await this.provider.sendMessage(message.from, messageText);
                await flow[targetDecorator.name](context);
                this.states.set(message.from, state);
                return;
              } else if (targetDecorator.type === 'step') {
                const newStepIndex = stepProps.indexOf(targetDecorator.name);
                if (newStepIndex !== -1) {
                  state.__stepIndex = newStepIndex;
                  state.__started = true;
                  let messageText = targetDecorator.metadata.message;
                  messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
                    state[key] || `{{${key}}}`);
                  await this.provider.sendMessage(message.from, messageText);
                  this.states.set(message.from, state);
                  return;
                }
              }
            }
          } else {
            // No se detectó intención, enviar mensaje de fallback
            await this.provider.sendMessage(message.from, aiMetadata.fallbackMessage || 'Lo siento, no pude entender tu solicitud. ¿Podrías ser más específico?');
            await this.provider.sendMessage(message.from, aiMetadata.question);
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
        
        // Mover la verificación del menuCommand aquí, antes de cualquier otra validación
        const menuCommand = (stepMetadata?.menuCommand || infoMetadata?.menuCommand || '9');

        console.log("stepmetadata",stepMetadata)
        console.log("infometadata",infoMetadata)

        // if ((stepMetadata?.backToMenu || infoMetadata?.backToMenu) && message.body.trim() === menuCommand) {
        if (message.body.trim() === menuCommand) {
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
          // Usar saveAs si está definido, sino usar el nombre del método
          const saveKey = stepMetadata?.saveAs || currentStep;
          state[saveKey] = result !== undefined ? result : message.body;

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
          // Si no hay más pasos, reiniciar el flujo
          if (state.__stepIndex >= stepProps.length) {
            await this.restartFlow(flow, state, message.from);
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
        // Si no hay más pasos, reiniciar el flujo
        await this.restartFlow(flow, state, message.from);
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
    let lastError: any;
    const maxRetries = metadata.retries || 1;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🌐 Ejecutando API ${metadata.method} ${metadata.url} (intento ${attempt}/${maxRetries})`);
        
        // Preparar los datos para enviar
        let requestData = undefined;
        if (['POST', 'PUT', 'PATCH'].includes(metadata.method.toUpperCase())) {
          // Para métodos que envían datos, usar el estado actual
          requestData = { ...context.state };
          // Remover propiedades del sistema
          Object.keys(requestData).forEach(key => {
            if (key.startsWith('__')) {
              delete requestData[key];
            }
          });
        }
        
        // Configurar la petición
        const axiosConfig: any = {
          method: metadata.method.toLowerCase(),
          url: metadata.url,
          headers: metadata.headers || { 'Content-Type': 'application/json' },
          timeout: metadata.timeout || 10000
        };
        
        if (requestData) {
          axiosConfig.data = requestData;
        }
        
        console.log('📤 Datos enviados a la API:', requestData);
        
        const response = await axios(axiosConfig);
        
        console.log('📥 Respuesta de la API:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data
        });
        
        // Guardar la respuesta en el estado usando saveAs o el nombre del método
        const saveKey = metadata.saveAs || prop;
        context.state[saveKey] = response.data;
        
        // Si hay un callback de éxito definido, ejecutarlo
        if (metadata.onSuccess) {
          const successDecorator = findDecoratorByIdInFlow(flow, metadata.onSuccess);
          if (successDecorator) {
            if (successDecorator.type === 'info') {
              let messageText = successDecorator.metadata.message;
              messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
                context.state[key] || `{{${key}}}`);
              await this.provider.sendMessage(context.message.from, messageText);
            }
          }
        }
        
        // Ejecutar el método del flujo
        await flow[prop](context);
        
        // Si llegamos aquí, la API fue exitosa
        return;
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Error en API (intento ${attempt}/${maxRetries}):`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        
        // Si no es el último intento, esperar antes de reintentar
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Backoff exponencial
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    console.error('💥 Todos los intentos de API fallaron:', lastError.message);
    
    // Si hay un callback de error definido, ejecutarlo
    if (metadata.onError) {
      const errorDecorator = findDecoratorByIdInFlow(flow, metadata.onError);
      if (errorDecorator) {
        if (errorDecorator.type === 'info') {
          let messageText = errorDecorator.metadata.message;
          messageText = messageText.replace(/\{\{(.*?)\}\}/g, (_: string, key: string) => 
            context.state[key] || `{{${key}}}`);
          await this.provider.sendMessage(context.message.from, messageText);
        }
      }
    } else {
      // Si no hay callback de error, enviar mensaje genérico
      await this.provider.sendMessage(
        context.message.from, 
        '❌ Error al conectar con el servicio. Por favor intenta más tarde.'
      );
    }
    
    // Guardar información del error en el estado
    context.state[`${prop}_error`] = {
      message: lastError.message,
      status: lastError.response?.status,
      attempts: maxRetries
    };
    
    // Ejecutar el método del flujo incluso si la API falló
    await flow[prop](context);
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