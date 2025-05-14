//@ts-nocheck
import { Waurik, BaileysProvider, Flow, Step, Func, Event, Files, Api, Info } from '../src';

@Flow('*')
class RegistroFlow {
  @Info('🤖 Iniciando el proceso de registro...')
  async inicio(context: any) {
    // Este método se ejecutará al inicio pero no esperará respuesta
  }

  @Info('Por favor, lee atentamente las instrucciones.')
  async instrucciones(context: any) {
    // Este método se ejecutará al inicio pero no esperará respuesta
  }

  @Step('vamos a proeder con el registro. Por favor, ingresa tu nombre:')
  async nombre(context: any) {
    return context.message.body;
  }

  // @Step('Gracias {{nombre}}. Ahora ingresa tu edad:')
  // async edad(context: any) {
  //   const edad = parseInt(context.message.body);
  //   if (isNaN(edad)) {
  //     await context.provider.sendMessage(context.message.from, 'Por favor, ingresa un número válido.');
  //     return null;
  //   }
  //   return edad;
  // }
  // @Func()
  // async validarEdad(context: any) {
  //   console.log(context.state);
  //   if (context.state.edad < 18) {
  //     await context.provider.sendMessage(context.message.from, 'Lo siento, debes ser mayor de edad para registrarte.');
  //     return false;
  //   }
  //   return true;
  // }

  @Info('Hello {{nombre}}, thanks for your interest!')
  async agradecimiento(context: any) {
    // Este método se ejecutará después de enviar el mensaje de agradecimiento
    // No necesita retornar nada ya que no espera respuesta del usuario
  }

  // @Files('./uploads')
  // async documento(context: any) {
  //   return context.state.documento;
  // }
  // @Api('GET', 'https://jsonplaceholder.typicode.com/todos/1')
  // async guardarRegistro(context: any) {
  //   return context.state.data;
  // }

  // @Step('¡Registro completado! Tu ID es: {{guardarRegistro}}')
  // async finalizar(context: any) {
  //   return null;
  // }

  // @Event('messages.upsert')
  // async onAnyMessage(context: any) {
  //   // Puedes acceder a toda la información del mensaje recibido
  //   console.log('Evento global: mensaje recibido', context.message);
  //   // Por ejemplo, podrías guardar logs, estadísticas, etc.
  // }




}


async function main() {
  const provider = new BaileysProvider();
  const waurik = new Waurik(provider);

  waurik.registerFlow(RegistroFlow);
  await waurik.initialize();
}

main().catch(console.error);