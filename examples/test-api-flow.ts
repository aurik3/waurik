import { Waurik, BaileysProvider, Flow, Step, Api, Info } from '../src';
import { IFlowContext } from '../src/types';

@Flow('*')
class TestApiFlow {

  @Step('¿Cuál es tu nombre?', { saveAs: 'nombre' })
  async pedirNombre(context: IFlowContext) {
    return context.message.body;
  }

  @Step('¿Cuál es tu email?', { saveAs: 'email' })
  async pedirEmail(context: IFlowContext) {
    const email = context.message.body.trim();
    // Validación básica de email
    if (!email.includes('@')) {
      await context.provider.sendMessage(context.message.from, '❌ Por favor ingresa un email válido.');
      return null;
    }
    return email;
  }

  @Api('POST', 'https://jsonplaceholder.typicode.com/users', {
    timeout: 15000,
    retries: 3,
    saveAs: 'usuarioCreado',
    onSuccess: 'exitoApi',
    onError: 'errorApi'
  })
  async guardarUsuario(context: IFlowContext) {
    console.log('🔄 Procesando creación de usuario...');
    console.log('📊 Estado actual:', context.state);
    
    // Verificar si la API respondió correctamente
    if (context.state.usuarioCreado && context.state.usuarioCreado.id) {
      console.log('✅ Usuario creado exitosamente:', context.state.usuarioCreado);
    } else if (context.state.guardarUsuario_error) {
      console.log('❌ Error en la API:', context.state.guardarUsuario_error);
    }
  }

  @Info('✅ ¡Excelente! Tu usuario ha sido creado exitosamente con ID: {{usuarioCreado.id}}')
  async exitoApi(context: IFlowContext) {
    console.log('✅ Callback de éxito ejecutado');
  }

  @Info('❌ Lo siento, hubo un problema al crear tu usuario. Nuestro equipo técnico ha sido notificado.')
  async errorApi(context: IFlowContext) {
    console.log('❌ Callback de error ejecutado');
  }

  @Info('¡Proceso completado! Gracias por usar nuestro servicio.')
  async confirmacion(context: IFlowContext) {
    console.log('Estado final:', context.state);
  }
}

async function main() {
  const provider = new BaileysProvider({
    port: 4004
  });
  const waurik = new Waurik(provider);

  waurik.registerFlow(TestApiFlow);
  await waurik.initialize();

  console.log('🤖 Bot de prueba API iniciado. Escribe "api" para comenzar...');
  console.log('Servidor Express ejecutándose en http://localhost:4004');
}

main().catch(console.error);