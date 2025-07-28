import 'reflect-metadata';
import { MenuOption, DecoratorOptions, MenuMetadata, StepMetadata, InfoMetadata, AIMetadata, IntentMapping, ILLMProvider, ApiMetadata, ApiOptions, MetaButton, MetaButtonsMetadata, MetaButtonsOptions, MetaListSection, MetaListMetadata, MetaListOptions } from '../types';

const FLOW_METADATA_KEY = 'waurik:flow';
const STEP_METADATA_KEY = 'waurik:step';
const STEPS_ORDER_METADATA_KEY = 'waurik:steps_order';
const INFO_METADATA_KEY = 'waurik:info';
const INFO_ORDER_METADATA_KEY = 'waurik:info_order';
const MENU_METADATA_KEY = 'waurik:menu';
const MENU_ORDER_METADATA_KEY = 'waurik:menu_order';
const FUNC_METADATA_KEY = 'waurik:func';
const FUNCS_ORDER_METADATA_KEY = 'waurik:funcs_order';
const EVENT_METADATA_KEY = 'waurik:event';
const EVENTS_ORDER_METADATA_KEY = 'waurik:events_order';
const FILES_METADATA_KEY = 'waurik:files';
const API_METADATA_KEY = 'waurik:api';
const APIS_ORDER_METADATA_KEY = 'waurik:apis_order';
const AI_METADATA_KEY = 'waurik:ai';
const AI_ORDER_METADATA_KEY = 'waurik:ai_order';
const META_BUTTONS_METADATA_KEY = 'waurik:meta_buttons';
const META_BUTTONS_ORDER_METADATA_KEY = 'waurik:meta_buttons_order';
const META_LIST_METADATA_KEY = 'waurik:meta_list';
const META_LIST_ORDER_METADATA_KEY = 'waurik:meta_list_order';

export function Flow(keyword: string) {
  return function (target: any) {
    Reflect.defineMetadata(FLOW_METADATA_KEY, { keyword }, target);
  };
}

export function Menu(message: string, options: MenuOption[] ) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(MENU_METADATA_KEY, { message, options }, target, propertyKey);
    // Save the order of menu steps
    const menus: string[] = Reflect.getMetadata(MENU_ORDER_METADATA_KEY, target) || [];
    if (!menus.includes(propertyKey)) {
      menus.push(propertyKey);
      Reflect.defineMetadata(MENU_ORDER_METADATA_KEY, menus, target);
    }

    // Also add to steps order since it behaves like a step
    const steps: string[] = Reflect.getMetadata(STEPS_ORDER_METADATA_KEY, target) || [];
    if (!steps.includes(propertyKey)) {
      steps.push(propertyKey);
      Reflect.defineMetadata(STEPS_ORDER_METADATA_KEY, steps, target);
    }
  };
}

export function Step(message: string, options: DecoratorOptions = {}) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(STEP_METADATA_KEY, { message, id: options.id, saveAs: options.saveAs }, target, propertyKey);
    // Guardar el orden de los steps
    const steps: string[] = Reflect.getMetadata(STEPS_ORDER_METADATA_KEY, target) || [];
    if (!steps.includes(propertyKey)) {
      steps.push(propertyKey);
      Reflect.defineMetadata(STEPS_ORDER_METADATA_KEY, steps, target);
    }
  };
}

export function Info(message: string, options: DecoratorOptions = {}) {

  console.log("incomming",options.id)
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(INFO_METADATA_KEY, { message, id: options.id, saveAs: options.saveAs }, target, propertyKey);
    // Save the order of the info steps
    const infos: string[] = Reflect.getMetadata(INFO_ORDER_METADATA_KEY, target) || [];
    if (!infos.includes(propertyKey)) {
      infos.push(propertyKey);
      Reflect.defineMetadata(INFO_ORDER_METADATA_KEY, infos, target);
    }
  };
}

export function Func() {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(FUNC_METADATA_KEY, {}, target, propertyKey);
    // Guardar el orden de los funcs
    const funcs: string[] = Reflect.getMetadata(FUNCS_ORDER_METADATA_KEY, target) || [];
    if (!funcs.includes(propertyKey)) {
      funcs.push(propertyKey);
      Reflect.defineMetadata(FUNCS_ORDER_METADATA_KEY, funcs, target);
    }
  };
}

export function Event(eventName: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(EVENT_METADATA_KEY, { eventName }, target, propertyKey);
    // Guardar el orden de los events
    const events: string[] = Reflect.getMetadata(EVENTS_ORDER_METADATA_KEY, target) || [];
    if (!events.includes(propertyKey)) {
      events.push(propertyKey);
      Reflect.defineMetadata(EVENTS_ORDER_METADATA_KEY, events, target);
    }
  };
}

export function Files(path: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(FILES_METADATA_KEY, { path }, target, propertyKey);
  };
}

export function Api(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, options: ApiOptions = {}) {
  return function (target: any, propertyKey: string) {
    const metadata: ApiMetadata = {
      method,
      url,
      headers: options.headers || { 'Content-Type': 'application/json' },
      timeout: options.timeout || 10000,
      retries: options.retries || 1,
      onSuccess: options.onSuccess,
      onError: options.onError,
      saveAs: options.saveAs || propertyKey
    };
    
    Reflect.defineMetadata(API_METADATA_KEY, metadata, target, propertyKey);
    // Guardar el orden de los apis
    const apis: string[] = Reflect.getMetadata(APIS_ORDER_METADATA_KEY, target) || [];
    if (!apis.includes(propertyKey)) {
      apis.push(propertyKey);
      Reflect.defineMetadata(APIS_ORDER_METADATA_KEY, apis, target);
    }
  };
}

export function AI(greeting: string, question: string, intents: IntentMapping[], llmProvider?: ILLMProvider, fallbackMessage?: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(AI_METADATA_KEY, { 
      greeting, 
      question, 
      intents, 
      llmProvider, 
      fallbackMessage: fallbackMessage || 'Lo siento, no pude entender tu solicitud. ¿Podrías ser más específico?' 
    }, target, propertyKey);
    // Guardar el orden de los AI
    const ais: string[] = Reflect.getMetadata(AI_ORDER_METADATA_KEY, target) || [];
    if (!ais.includes(propertyKey)) {
      ais.push(propertyKey);
      Reflect.defineMetadata(AI_ORDER_METADATA_KEY, ais, target);
    }
  };
}

export function MetaButtons(body: string, buttons: MetaButton[], options: MetaButtonsOptions = {}) {
  return function (target: any, propertyKey: string) {
    const metadata: MetaButtonsMetadata = {
      header: options.header,
      body,
      footer: options.footer,
      buttons
    };
    
    Reflect.defineMetadata(META_BUTTONS_METADATA_KEY, metadata, target, propertyKey);
    // Guardar el orden de los meta buttons
    const metaButtons: string[] = Reflect.getMetadata(META_BUTTONS_ORDER_METADATA_KEY, target) || [];
    if (!metaButtons.includes(propertyKey)) {
      metaButtons.push(propertyKey);
      Reflect.defineMetadata(META_BUTTONS_ORDER_METADATA_KEY, metaButtons, target);
    }

    // También agregar al orden de steps ya que se comporta como un step
    const steps: string[] = Reflect.getMetadata(STEPS_ORDER_METADATA_KEY, target) || [];
    if (!steps.includes(propertyKey)) {
      steps.push(propertyKey);
      Reflect.defineMetadata(STEPS_ORDER_METADATA_KEY, steps, target);
    }
  };
}

export function MetaList(body: string, sections: MetaListSection[], options: MetaListOptions = {}) {
  return function (target: any, propertyKey: string) {
    const metadata: MetaListMetadata = {
      header: options.header,
      body,
      footer: options.footer,
      button_text: options.button_text || 'Ver opciones',
      sections
    };
    
    Reflect.defineMetadata(META_LIST_METADATA_KEY, metadata, target, propertyKey);
    // Guardar el orden de las meta lists
    const metaLists: string[] = Reflect.getMetadata(META_LIST_ORDER_METADATA_KEY, target) || [];
    if (!metaLists.includes(propertyKey)) {
      metaLists.push(propertyKey);
      Reflect.defineMetadata(META_LIST_ORDER_METADATA_KEY, metaLists, target);
    }

    // También agregar al orden de steps ya que se comporta como un step
    const steps: string[] = Reflect.getMetadata(STEPS_ORDER_METADATA_KEY, target) || [];
    if (!steps.includes(propertyKey)) {
      steps.push(propertyKey);
      Reflect.defineMetadata(STEPS_ORDER_METADATA_KEY, steps, target);
    }
  };
}

export function getFlowMetadata(target: any) {
  return Reflect.getMetadata(FLOW_METADATA_KEY, target);
}

export function getStepMetadata(target: any, propertyKey: string) {
  return Reflect.getMetadata(STEP_METADATA_KEY, target, propertyKey);
}

export function getStepsOrderMetadata(target: any) {
  return Reflect.getMetadata(STEPS_ORDER_METADATA_KEY, target) || [];
}

export function getInfoMetadata(target: any, propertyKey: string) {
  return Reflect.getMetadata(INFO_METADATA_KEY, target, propertyKey);
}

export function getInfoOrderMetadata(target: any) {
  return Reflect.getMetadata(INFO_ORDER_METADATA_KEY, target) || [];
}

export function getMenuMetadata(target: any, propertyKey: string): MenuMetadata | undefined {
  return Reflect.getMetadata(MENU_METADATA_KEY, target, propertyKey);
}

export function getMenuOrderMetadata(target: any): string[] {
  return Reflect.getMetadata(MENU_ORDER_METADATA_KEY, target) || [];
}

export function getFuncMetadata(target: any, propertyKey: string) {
  return Reflect.getMetadata(FUNC_METADATA_KEY, target, propertyKey);
}

export function getFuncsOrderMetadata(target: any) {
  return Reflect.getMetadata(FUNCS_ORDER_METADATA_KEY, target) || [];
}

export function getApiMetadata(target: any, propertyKey: string): ApiMetadata | undefined {
  return Reflect.getMetadata(API_METADATA_KEY, target, propertyKey);
}

export function getApisOrderMetadata(target: any) {
  return Reflect.getMetadata(APIS_ORDER_METADATA_KEY, target) || [];
}

export function getEventMetadata(target: any, propertyKey: string) {
  return Reflect.getMetadata(EVENT_METADATA_KEY, target, propertyKey);
}

export function getEventsOrderMetadata(target: any) {
  return Reflect.getMetadata(EVENTS_ORDER_METADATA_KEY, target) || [];
}

export function getFilesMetadata(target: any, propertyKey: string) {
  return Reflect.getMetadata(FILES_METADATA_KEY, target, propertyKey);
}

export function getAIMetadata(target: any, propertyKey: string): AIMetadata | undefined {
  return Reflect.getMetadata(AI_METADATA_KEY, target, propertyKey);
}

export function getMetaButtonsMetadata(target: any, propertyKey: string): MetaButtonsMetadata | undefined {
  return Reflect.getMetadata(META_BUTTONS_METADATA_KEY, target, propertyKey);
}

export function getMetaButtonsOrderMetadata(target: any): string[] {
  return Reflect.getMetadata(META_BUTTONS_ORDER_METADATA_KEY, target) || [];
}

export function getMetaListMetadata(target: any, propertyKey: string): MetaListMetadata | undefined {
  return Reflect.getMetadata(META_LIST_METADATA_KEY, target, propertyKey);
}

export function getMetaListOrderMetadata(target: any): string[] {
  return Reflect.getMetadata(META_LIST_ORDER_METADATA_KEY, target) || [];
}

export function getAIOrderMetadata(target: any): string[] {
  return Reflect.getMetadata(AI_ORDER_METADATA_KEY, target) || [];
}

export function findDecoratorByIdInFlow(flow: any, id: string): { type: string; name: string; metadata: any } | undefined {
  const prototype = Object.getPrototypeOf(flow);
  const properties = Object.getOwnPropertyNames(prototype);

  for (const prop of properties) {
    const stepMeta = getStepMetadata(flow, prop);
    if (stepMeta?.id === id) return { type: 'step', name: prop, metadata: stepMeta };

    const infoMeta = getInfoMetadata(flow, prop);
    if (infoMeta?.id === id) return { type: 'info', name: prop, metadata: infoMeta };

    const aiMeta = getAIMetadata(flow, prop);
    if (aiMeta) return { type: 'ai', name: prop, metadata: aiMeta };
  }

  return undefined;
}