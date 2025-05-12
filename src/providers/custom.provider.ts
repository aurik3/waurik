import { IProvider, IMessage, MessageType, ConnectionStatus } from '../types';

export class CustomProvider implements IProvider {
  private connectionCallback?: (status: ConnectionStatus) => void;
  private messageCallback?: (message: IMessage) => void;
  private isConnected: boolean = false;

  constructor(private config: any) {
    // Aquí puedes inicializar tu proveedor personalizado con la configuración necesaria
  }

  async initialize(): Promise<void> {
    try {
      // Implementa tu lógica de inicialización aquí
      this.isConnected = true;
      this.connectionCallback?.(ConnectionStatus.CONNECTED);
    } catch (error) {
      this.isConnected = false;
      this.connectionCallback?.(ConnectionStatus.DISCONNECTED);
      throw error;
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Provider not connected');
    }

    // Implementa tu lógica de envío de mensajes aquí
    console.log(`Sending message to ${to}: ${message}`);
  }

  onMessage(callback: (message: IMessage) => void): void {
    this.messageCallback = callback;
  }

  onConnection(callback: (status: ConnectionStatus) => void): void {
    this.connectionCallback = callback;
  }

  // Método de ejemplo para simular la recepción de un mensaje
  simulateMessage(from: string, body: string) {
    const message: IMessage = {
      from,
      body,
      type: MessageType.TEXT,
      timestamp: Date.now()
    };
    this.messageCallback?.(message);
  }
} 