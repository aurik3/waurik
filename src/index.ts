export * from './types';
export * from './decorators';
export * from './providers/baileys.provider';
export * from './providers/meta.provider';
export * from './providers/custom.provider';
export * from './core/flow-manager';

import { FlowManager } from './core/flow-manager';
import { IProvider } from './types';

export class Waurik {
  private flowManager: FlowManager;

  constructor(provider: IProvider) {
    this.flowManager = new FlowManager(provider);
  }

  async initialize() {
    await this.flowManager['provider'].initialize();
  }

  registerFlow(flowClass: any) {
    this.flowManager.registerFlow(flowClass);
  }
} 