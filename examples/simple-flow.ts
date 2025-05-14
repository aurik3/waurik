//@ts-nocheck
import { Waurik, BaileysProvider, Flow, Step, Func, Event, Files, Api, Info, Menu } from '../src';

@Flow('*')
class RegistroFlow {
  // @Info('🤖 Iniciando el proceso de registro...')
  // async inicio(context: any) {
  //   // Este método se ejecutará al inicio pero no esperará respuesta
  // }

  // @Info('Por favor, lee atentamente las instrucciones.')
  // async instrucciones(context: any) {
  //   // Este método se ejecutará al inicio pero no esperará respuesta
  // }

  // @Step('vamos a proeder con el registro. Por favor, ingresa tu nombre:')
  // async nombre(context: any) {
  //   return context.message.body;
  // }

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
  @Menu(
    '¿En qué puedo ayudarte hoy? Por favor, selecciona una opción:',
    [
      {
        option: "1 - Soporte",
        goTo: "soporte"
      },
      {
        option: "2 - Servicio al Cliente",
        goTo: "sac"
      },
      {
        option: "3 - Pagos",
        goTo: "pagos"
      }
    ]
  )
  async mainMenu(context: any) {
    // Este método se ejecutará cuando se muestre el menú
    // Puedes usar el context para acceder al estado y otras funcionalidades
  }  @Step('Por favor, ingrese su número de cédula:\n\n(Digite 0 para volver al menú principal)', 
    { id: 'soporte', backToMenu: true, menuCommand: '0' })
  async cedula(context: any) {
    const input = context.message.body.trim();
    if (input === '0') {
      return undefined; // Retornamos undefined para que el flow manager maneje el retorno
    }
    return input;
  }

  @Info('📞 Información de Servicio al Cliente:\nHorario de atención: 24/7\nLínea gratuita: 018000123456\n\n(Digite 0 para volver al menú principal)', 
    { id: 'sac', backToMenu: true, menuCommand: '0' })
  async infoSAC(context: any) {
    // Este método se ejecutará cuando se seleccione SAC
  }

  @Info('💰 Información de Pagos:\nPuede realizar sus pagos en:\n- PSE\n- Efecty\n- Bancolombia\n\n(Digite 0 para volver al menú principal)', 
    { id: 'pagos', backToMenu: true, menuCommand: '0' })
  async infoPagos(context: any) {
    // Este método se ejecutará cuando se seleccione Pagos
  }

}


async function main() {
  const provider = new BaileysProvider();
  const waurik = new Waurik(provider);

  waurik.registerFlow(RegistroFlow);
  await waurik.initialize();
}

main().catch(console.error);