import 'reflect-metadata';
import { MenuOption, DecoratorOptions, MenuMetadata, StepMetadata, InfoMetadata } from '../types';

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

export function Flow(keyword: string) {
  return function (target: any) {
    Reflect.defineMetadata(FLOW_METADATA_KEY, { keyword }, target);
  };
}

export function Menu(message: string, options: MenuOption[]) {
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
    Reflect.defineMetadata(STEP_METADATA_KEY, { message, id: options.id }, target, propertyKey);
    // Guardar el orden de los steps
    const steps: string[] = Reflect.getMetadata(STEPS_ORDER_METADATA_KEY, target) || [];
    if (!steps.includes(propertyKey)) {
      steps.push(propertyKey);
      Reflect.defineMetadata(STEPS_ORDER_METADATA_KEY, steps, target);
    }
  };
}

export function Info(message: string, options: DecoratorOptions = {}) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(INFO_METADATA_KEY, { message, id: options.id }, target, propertyKey);
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

export function Api(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(API_METADATA_KEY, { method, url }, target, propertyKey);
    // Guardar el orden de los apis
    const apis: string[] = Reflect.getMetadata(APIS_ORDER_METADATA_KEY, target) || [];
    if (!apis.includes(propertyKey)) {
      apis.push(propertyKey);
      Reflect.defineMetadata(APIS_ORDER_METADATA_KEY, apis, target);
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

export function getApiMetadata(target: any, propertyKey: string) {
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

export function findDecoratorByIdInFlow(flow: any, id: string): { type: string; name: string; metadata: any } | undefined {
  const prototype = Object.getPrototypeOf(flow);
  const properties = Object.getOwnPropertyNames(prototype);

  for (const prop of properties) {
    const stepMeta = getStepMetadata(flow, prop);
    if (stepMeta?.id === id) return { type: 'step', name: prop, metadata: stepMeta };

    const infoMeta = getInfoMetadata(flow, prop);
    if (infoMeta?.id === id) return { type: 'info', name: prop, metadata: infoMeta };
  }

  return undefined;
}