import { Waurik } from '../src';
import { BaileysProvider } from '../src/providers/baileys.provider';
import { Flow, Menu, Step, Info } from '../src/decorators';

@Flow('SessionFlow')
class SessionFlow {
  @Menu('Menú Principal', [
    { key: '1', label: 'Información de Sesión' },
    { key: '2', label: 'Listar Sesiones' },
    { key: '3', label: 'Salir' }
  ])
  async mainMenu() {
    return 'Bienvenido al sistema de gestión de sesiones. Selecciona una opción:';
  }

  @Step('1')
  async sessionInfo() {
    return 'Esta es información sobre la sesión actual. Puedes verificar el estado en /session/info';
  }

  @Step('2')
  async listSessions() {
    return 'Puedes ver todas las sesiones disponibles en /sessions';
  }

  @Info('3')
  async exit() {
    return 'Gracias por usar el sistema. ¡Hasta luego!';
  }
}

async function main() {
  // Ejemplo 1: Sesión con nombre personalizado
  console.log('=== Creando sesión con nombre "mi-sesion-personal" ===');
  const provider1 = new BaileysProvider({
    port: 4001,
    sessionName: 'mi-sesion-personal'
  });
  
  // Verificar información de la sesión antes de inicializar
  console.log('Información de sesión antes de inicializar:', provider1.getSessionInfo());
  
  const waurik1 = new Waurik(provider1);
  waurik1.registerFlow(SessionFlow);
  
  console.log('\n=== Endpoints disponibles para gestión de sesiones ===');
  console.log('- Estado general: http://localhost:4001/status');
  console.log('- Información de sesión: http://localhost:4001/session/info');
  console.log('- Listar todas las sesiones: http://localhost:4001/sessions');
  console.log('- Eliminar sesión actual: DELETE http://localhost:4001/session');
  console.log('- Código QR: http://localhost:4001/qr');
  
  console.log('\n=== Iniciando sesión "mi-sesion-personal" ===');
  await waurik1.initialize();
}

// Función para demostrar múltiples sesiones
async function demoMultipleSessions() {
  console.log('\n=== DEMO: Múltiples Sesiones ===');
  
  // Listar sesiones existentes
  const existingSessions = BaileysProvider.listAvailableSessions();
  console.log('Sesiones existentes:', existingSessions);
  
  // Crear diferentes sesiones (solo para demostrar, no inicializar todas)
  const sessions = [
    { name: 'trabajo', port: 4002 },
    { name: 'personal', port: 4003 },
    { name: 'empresa', port: 4004 }
  ];
  
  sessions.forEach(session => {
    const provider = new BaileysProvider({
      sessionName: session.name,
      port: session.port
    });
    
    console.log(`Sesión "${session.name}":`, provider.getSessionInfo());
    console.log(`  - Puerto: ${session.port}`);
    console.log(`  - Carpeta auth: ${provider.getSessionInfo().authFolder}`);
    console.log(`  - Existe: ${provider.validateSession()}`);
  });
}

// Ejecutar demo de múltiples sesiones primero
demoMultipleSessions().then(() => {
  // Luego ejecutar la sesión principal
  main().catch(console.error);
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n=== Cerrando aplicación ===');
  console.log('Las sesiones se mantienen guardadas en sus respectivas carpetas.');
  process.exit(0);
});