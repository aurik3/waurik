//@ts-nocheck
import { Waurik, BaileysProvider, Flow, Step, Func, Event, Files, Api, Info, Menu } from '../src';

@Flow('*')
class RegistroFlow {

  @Menu(
    '¿En qué puedo ayudarte hoy? Por favor, selecciona una opción:',
    [
      {
        option: "1 - Soporte",
        goTo: "menuSoporte"
      },
      {
        option: "2 - Servicio al Cliente",
        goTo: "menuSAC"
      },
      {
        option: "3 - Pagos",      
        goTo: "menuPagos"
      },
      {
        menuCommand: "0",
      }    
    ]    
  )
  async mainMenu(context: any) {
    // Este método se ejecuta cuando se muestra el menú
    // No requires cambios en el estado aquí
  }  
  
  @Step('Por favor, ingrese su número de cédula:\n\n(Digite 0 para volver al menú principal)', 
    { id: 'menuSoporte', backToMenu: true, saveAs: 'numeroCedula' })
  async cedula(context: any) {
    const input = context.message.body.trim();
    console.log('Cédula ingresada:', input);
    console.log('Estado actual:', context.state);
    return input;
  }

  @Step('Por favor, ingrese su nombre completo:', 
    { saveAs: 'nombreCompleto' })
  async nombre(context: any) {
    const input = context.message.body.trim();
    console.log('Nombre ingresado:', input);
    console.log('Estado actual:', context.state);
    return input;
  }

  @Info('Gracias {{nombreCompleto}}, su cédula {{numeroCedula}} ha sido registrada correctamente.')
  async confirmacion(context: any) {
    console.log('Datos finales guardados:', {
      cedula: context.state.numeroCedula,
      nombre: context.state.nombreCompleto
    });
  }

  // @Info('📞 Información de Servicio al Cliente:\nHorario de atención: 24/7\nLínea gratuita: 018000123456\n\n(Digite 0 para volver al menú principal)', 
  //   { id: 'menuSAC', backToMenu: true })
  // async infoSAC(context: any) {
  //   // Método vacío ya que solo es informativo
  // }

  // @Info('💰 Información de Pagos:\nPuede realizar sus pagos en:\n- PSE\n- Efecty\n- Bancolombia\n\n(Digite 0 para volver al menú principal)', 
  //   { id: 'menuPagos', backToMenu: true })
  // async infoPagos(context: any) {
  //   // Método vacío ya que solo es informativo
  // }

}


async function main() {
  const provider = new BaileysProvider({
    port: 4001
  });
  const waurik = new Waurik(provider);

  waurik.registerFlow(RegistroFlow);
  await waurik.initialize();
}

main().catch(console.error);