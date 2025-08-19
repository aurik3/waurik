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
  // Ahora puedes especificar un nombre para tu sesión
  // Esto creará una carpeta específica en auth/{sessionName}
  const provider = new BaileysProvider({
    port: 4005,
    sessionName: 'registro-bot' // Nombre personalizado para esta sesión
  });
  
  // Verificar información de la sesión
  console.log('=== Información de Sesión ===');
  console.log('Sesión:', provider.getSessionInfo());
  console.log('Sesiones disponibles:', BaileysProvider.listAvailableSessions());
  
  const waurik = new Waurik(provider);
  waurik.registerFlow(RegistroFlow);
  
  console.log('\n=== Endpoints de Gestión de Sesiones ===');
  console.log('- Estado: http://localhost:4005/status');
  console.log('- Info de sesión: http://localhost:4005/session/info');
  console.log('- Todas las sesiones: http://localhost:4005/sessions');
  console.log('- QR Code: http://localhost:4005/qr');
  
  await waurik.initialize();
}

main().catch(console.error);

// Ejemplo de cómo crear múltiples sesiones
// Descomenta para probar:
/*
async function createMultipleSessions() {
  // Sesión para trabajo
  const workProvider = new BaileysProvider({
    port: 4002,
    sessionName: 'trabajo'
  });
  
  // Sesión personal
  const personalProvider = new BaileysProvider({
    port: 4003,
    sessionName: 'personal'
  });
  
  console.log('Sesión trabajo:', workProvider.getSessionInfo());
  console.log('Sesión personal:', personalProvider.getSessionInfo());
}
*/