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
}

export interface DecoratorOptions {
  id?: string;
  backToMenu?: boolean;
  menuCommand?: string;
}

export interface MenuMetadata {
  message: string;
  options: MenuOption[];
}

export interface StepMetadata {
  message: string;
  id?: string;
}

export interface InfoMetadata {
  message: string;
  id?: string;
}

export interface MenuState extends IState {
  __currentId?: string;
}