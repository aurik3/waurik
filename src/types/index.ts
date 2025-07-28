export interface IProvider {
  initialize(): Promise<void>;
  sendMessage(to: string, message: string): Promise<void>;
  onMessage(callback: (message: IMessage) => void): void;
  onConnection(callback: (status: ConnectionStatus) => void): void;
  on?(eventName: string, callback: Function): void;
}

export interface IMessage {
  from: string;
  body: string;
  type: MessageType;
  timestamp: number;
  metadata?: any;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  STICKER = 'sticker'
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected'
}

export interface IFlow {
  keyword: string;
  steps: IStep[];
}

export interface IStep {
  id: string;
  message: string;
  next?: string;
  validation?: (message: IMessage) => boolean;
}

export interface IInfo {
  message: string;
  metadata?: any;
}

export interface IState {
  [key: string]: any;
}

export interface IFlowContext {
  state: IState;
  message: IMessage;
  provider: IProvider;
}

export interface MenuOption {
  option: string;
  goTo: string;
  menuCommand?: string;
}

export interface DecoratorOptions {
  id?: string;
  backToMenu?: boolean;
  menuCommand?: string;
  saveAs?: string;
}

export interface MenuMetadata {
  message: string;
  options: MenuOption[];
}

export interface StepMetadata {
  message: string;
  id?: string;
  saveAs?: string;
}

export interface InfoMetadata {
  message: string;
  id?: string;
  saveAs?: string;
}

export interface MenuState extends IState {
  __currentId?: string;
  __awaitingRestart?: boolean;
}

export interface ILLMProvider {
  detectIntent(message: string, availableIntents: IntentMapping[]): Promise<string | null>;
}

export interface IntentMapping {
  intent: string;
  keywords: string[];
  goTo: string;
  description?: string;
}

export interface AIMetadata {
  greeting: string;
  question: string;
  intents: IntentMapping[];
  llmProvider?: ILLMProvider;
  fallbackMessage?: string;
}

export interface ApiMetadata {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  onSuccess?: string;
  onError?: string;
  saveAs?: string;
}

export interface ApiOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  onSuccess?: string;
  onError?: string;
  saveAs?: string;
}

// Meta Button Types
export interface MetaButton {
  type: 'reply' | 'url' | 'phone_number';
  title: string;
  id?: string;
  url?: string;
  phone_number?: string;
}

export interface MetaButtonsMetadata {
  header?: string;
  body: string;
  footer?: string;
  buttons: MetaButton[];
}

export interface MetaButtonsOptions {
  id?: string;
  saveAs?: string;
  header?: string;
  footer?: string;
}

export interface MetaListItem {
  id: string;
  title: string;
  description?: string;
}

export interface MetaListSection {
  title?: string;
  rows: MetaListItem[];
}

export interface MetaListMetadata {
  header?: string;
  body: string;
  footer?: string;
  button_text: string;
  sections: MetaListSection[];
}

export interface MetaListOptions {
  id?: string;
  saveAs?: string;
  header?: string;
  footer?: string;
  button_text?: string;
}