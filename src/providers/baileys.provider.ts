import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import express from 'express';
import QRCode from 'qrcode';
import pino from 'pino';
import { IProvider, IMessage, MessageType, ConnectionStatus } from '../types';
import { EventEmitter } from 'events';

export interface BaileysProviderOptions {
  authFolder?: string;
  port?: number;
}

export class BaileysProvider implements IProvider {
  private sock: any;
  private app: express.Application;
  private connectionCallback?: (status: ConnectionStatus) => void;
  private messageCallback?: (message: IMessage) => void;
  private qrCode: string = '';
  private isConnected: boolean = false;
  private serverStarted: boolean = false;
  private eventEmitter = new EventEmitter();
  private port: number;
  private authFolder:string;

  constructor(options: BaileysProviderOptions = {}) {
    const { authFolder = './auth', port = 3000 } = options;
    this.port = port;
    this.app = express();
    this.app.use(express.json());
    this.setupExpress();
    this.authFolder = authFolder;
  }

  private setupExpress() {

    this.app.get('/status', (req, res) => {
      res.json({ 
        status: this.isConnected ? 'connected' : 'disconnected',
        qrCode: this.qrCode ? 'available' : 'not available',
        connectionDetails: {
          isConnected: this.isConnected,
          hasSocket: !!this.sock,
          serverStarted: this.serverStarted
        }
      });
    });

    this.app.get('/qr', (req, res) => {
      if (this.qrCode) {
        res.send(`
          <html>
            <head>
              <title>WhatsApp QR Code</title>
              <style>
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  font-family: Arial, sans-serif;
                }
                img {
                  max-width: 300px;
                  margin: 20px;
                }
                .status {
                  margin-top: 20px;
                  padding: 10px;
                  border-radius: 5px;
                }
                .connected {
                  background-color: #4CAF50;
                  color: white;
                }
                .disconnected {
                  background-color: #f44336;
                  color: white;
                }
              </style>
            </head>
            <body>
              <h1>WhatsApp QR Code</h1>
              <img src="${this.qrCode}" alt="QR Code" />
              <div class="status ${this.isConnected ? 'connected' : 'disconnected'}">
                Estado: ${this.isConnected ? 'Conectado' : 'Desconectado'}
              </div>
              <p>Escanea este código QR con WhatsApp para conectar</p>
            </body>
          </html>
        `);
      } else {
        res.status(404).send('No QR code available');
      }
    });

    this.app.post('/api/v1/message', async (req, res) => {

      console.log(req.body);
      const { to, message } = req.body;
      if (!to || !message) {
        return res.status(400).send('Bad Request');
      }
      const response = await this.sock.sendMessage(to, { text: message });
      if (response) {
        res.status(200).send('Message sent');
      } else {
        res.status(500).send('Error sending message');
      }
    }); 
  }

  async initialize(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      
      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
      });

      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = await QRCode.toDataURL(qr);
          this.connectionCallback?.(ConnectionStatus.CONNECTING);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.isConnected = false;
          this.connectionCallback?.(ConnectionStatus.DISCONNECTED);
          
          if (shouldReconnect) {
            console.log('Reconectando...');
            await this.initialize();
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.qrCode = '';
          this.connectionCallback?.(ConnectionStatus.CONNECTED);
        }
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('messages.upsert', async (m: any) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && msg.message) {
          const message: IMessage = {
            from: msg.key.remoteJid,
            body: msg.message?.conversation || msg.message?.extendedTextMessage?.text || '',
            type: MessageType.TEXT,
            timestamp: msg.messageTimestamp,
            metadata: msg
          };
          this.messageCallback?.(message);
        }
        this.eventEmitter.emit('messages.upsert', m);
      });

      if (!this.serverStarted) {
        this.app.listen(this.port, () => {
          console.log(`Servidor Express ejecutándose en http://localhost:${this.port}`);
          console.log(`Para ver el estado de la conexión, visita: http://localhost:${this.port}/status`);
          console.log(`Para escanear el código QR, visita: http://localhost:${this.port}/qr`);
          console.log(`Para enviar mensajes, usa: http://localhost:${this.port}/api/v1/message`);
        });
        this.serverStarted = true;
      }
    } catch (error) {
      console.error('Error al inicializar:', error);
      this.connectionCallback?.(ConnectionStatus.DISCONNECTED);
      throw error;
    }
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('No conectado a WhatsApp');
    }
    await this.sock.sendMessage(to, { text: message });
  }

  onMessage(callback: (message: IMessage) => void): void {
    this.messageCallback = callback;
  }

  onConnection(callback: (status: ConnectionStatus) => void): void {
    this.connectionCallback = callback;
  }

  on(eventName: string, callback: (...args: any[]) => void): void {
    this.eventEmitter.on(eventName, callback);
  }
} 