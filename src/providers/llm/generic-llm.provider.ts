import { ILLMProvider, IntentMapping } from '../../types';

export class GenericLLMProvider implements ILLMProvider {
  async detectIntent(message: string, availableIntents: IntentMapping[]): Promise<string | null> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Buscar coincidencias por palabras clave
    for (const intentMapping of availableIntents) {
      for (const keyword of intentMapping.keywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          return intentMapping.goTo;
        }
      }
    }
    
    return null;
  }
}

// Instancia por defecto
export const defaultLLMProvider = new GenericLLMProvider();