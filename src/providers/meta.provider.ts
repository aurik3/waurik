import express from 'express';
import { IProvider, IMessage, MessageType, ConnectionStatus } from '../types';
import axios from 'axios';

export class MetaProvider implements IProvider {
  private app: express.Application;
  private connectionCallback?: (status: ConnectionStatus) => void;
  private messageCallback?: (message: IMessage) => void;
  private accessToken: string;
  private phoneNumberId: string;
  private verifyToken: string;

  constructor(
    accessToken: string,
    phoneNumberId: string,
    verifyToken: string = 'waurik-verify-token'
  ) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.verifyToken = verifyToken;
    this.app = express();
    this.setupExpress();
  }

  private setupExpress() {
    this.app.use(express.json());

    this.app.get('/webhook', (req, res) => {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      if (mode && token) {
        if (mode === 'subscribe' && token === this.verifyToken) {
          console.log('Webhook verified');
          res.status(200).send(challenge);
        } else {
          res.sendStatus(403);
        }
      }
    });

    this.app.post('/webhook', (req, res) => {
      const { body } = req;

      if (body.object === 'whatsapp_business_account') {
        body.entry.forEach((entry: any) => {
          entry.changes.forEach((change: any) => {
            if (change.value.messages) {
              change.value.messages.forEach((message: any) => {
                const msg: IMessage = {
                  from: message.from,
                  body: message.text?.body || '',
                  type: MessageType.TEXT,
                  timestamp: message.timestamp,
                  metadata: message
                };
                this.messageCallback?.(msg);
              });
            }
          });
        });
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    });
  }

  async initialize(): Promise<void> {
    try {
      await axios.get(`https://graph.facebook.com/v17.0/${this.phoneNumberId}`, {
        params: {
          access_token: this.accessToken
        }
      });
      this.connectionCallback?.(ConnectionStatus.CONNECTED);
    } catch (error) {
      this.connectionCallback?.(ConnectionStatus.DISCONNECTED);
      throw error;
    }

    this.app.listen(3000, () => {
      console.log('Express server running on port 3000');
    });
  }

  async sendMessage(to: string, message: string): Promise<void> {
    try {
      await axios.post(
        `https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  onMessage(callback: (message: IMessage) => void): void {
    this.messageCallback = callback;
  }

  onConnection(callback: (status: ConnectionStatus) => void): void {
    this.connectionCallback = callback;
  }
} 