
//@ts-nocheck
import { Waurik, BaileysProvider, Flow, Step } from '../src';

@Flow('test')
class TestFlow {
  @Step('¡Hola! Este es un mensaje de prueba. ¿Cómo estás?')
  async saludar(context: any) {
    return context.message.body;
  }

  @Step('Me alegro de que estés {saludar}. ¿Quieres probar otro mensaje?')
  async segundoMensaje(context: any) {
    return context.message.body;
  }

  @Step('¡Perfecto! Has completado el flujo de prueba.')
  async finalizar(context: any) {
    return null;
  }
}

async function main() {
  const provider = new BaileysProvider();
  const waurik = new Waurik(provider);

  // Manejar eventos de conexión
  provider.onConnection((status) => {
    console.log(`Estado de conexión: ${status}`);
    if (status === 'disconnected') {
      console.log('Intentando reconectar...');
      setTimeout(() => {
        provider.initialize().catch(console.error);
      }, 5000); // Esperar 5 segundos antes de intentar reconectar
    }
  });

  waurik.registerFlow(TestFlow);
  await waurik.initialize();
}

main().catch(console.error); 