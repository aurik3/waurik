import { Waurik, MetaProvider, Flow, Step, Menu, Info, Api } from '../src';
import { IFlowContext, MenuOption } from '../src/types';

// Configuración del flujo con Meta Provider
@Flow('*')
class MetaBusinessFlow {

  @Menu('🏢 ¡Bienvenido a nuestro servicio empresarial! ¿En qué podemos ayudarte?', [
    { option: '1 - Información de productos', goTo: 'productos' },
    { option: '2 - Soporte técnico', goTo: 'soporte' },
    { option: '3 - Contactar ventas', goTo: 'ventas' },
    { option: '4 - Estado de pedido', goTo: 'pedido' }
  ])
  async menuPrincipal(context: IFlowContext) {
    console.log('📋 Menú principal mostrado');
  }

  @Info('📦 Nuestros productos incluyen:\n\n• Software empresarial\n• Consultoría IT\n• Soporte 24/7\n• Integración de sistemas\n\n¿Te interesa algún producto específico?', { id: 'productos' })
  async mostrarProductos(context: IFlowContext) {
    console.log('📦 Información de productos enviada');
  }

  @Step('🛠️ Describe tu problema técnico para poder ayudarte mejor:', { id: 'soporte', saveAs: 'problemaDescripcion' })
  async solicitarProblema(context: IFlowContext) {
    return context.message.body;
  }

  @Step('📧 Por favor proporciona tu email para contactarte:', { saveAs: 'emailSoporte' })
  async solicitarEmailSoporte(context: IFlowContext) {
    const email = context.message.body.trim();
    if (!email.includes('@')) {
      await context.provider.sendMessage(context.message.from, '❌ Por favor ingresa un email válido.');
      return null;
    }
    return email;
  }

  @Api('POST', 'https://jsonplaceholder.typicode.com/posts', {
    timeout: 15000,
    retries: 2,
    saveAs: 'ticketSoporte',
    onSuccess: 'confirmarTicket',
    onError: 'errorTicket'
  })
  async crearTicketSoporte(context: IFlowContext) {
    console.log('🎫 Creando ticket de soporte...');
    console.log('📊 Datos del ticket:', {
      problema: context.state.problemaDescripcion,
      email: context.state.emailSoporte
    });
  }

  @Info('✅ ¡Ticket creado exitosamente!\n\n🎫 ID del ticket: {{ticketSoporte.id}}\n📧 Email: {{emailSoporte}}\n\nNuestro equipo te contactará en las próximas 24 horas.')
  async confirmarTicket(context: IFlowContext) {
    console.log('✅ Ticket de soporte confirmado:', context.state.ticketSoporte);
  }

  @Info('❌ Hubo un problema al crear tu ticket. Por favor intenta nuevamente o contacta directamente a soporte@empresa.com')
  async errorTicket(context: IFlowContext) {
    console.log('❌ Error al crear ticket de soporte');
  }

  @Step('💼 ¿Qué tipo de solución empresarial te interesa?', { id: 'ventas', saveAs: 'tipoSolucion' })
  async consultarVentas(context: IFlowContext) {
    return context.message.body;
  }

  @Step('📱 Proporciona tu número de teléfono para que un ejecutivo te contacte:', { saveAs: 'telefonoVentas' })
  async solicitarTelefono(context: IFlowContext) {
    const telefono = context.message.body.trim();
    if (telefono.length < 8) {
      await context.provider.sendMessage(context.message.from, '❌ Por favor ingresa un número de teléfono válido.');
      return null;
    }
    return telefono;
  }

  @Info('🎯 ¡Perfecto! Hemos registrado tu interés en: {{tipoSolucion}}\n\n📱 Te contactaremos al: {{telefonoVentas}}\n\nUn ejecutivo de ventas se comunicará contigo en las próximas 2 horas.')
  async confirmarContactoVentas(context: IFlowContext) {
    console.log('💼 Contacto de ventas registrado:', {
      solucion: context.state.tipoSolucion,
      telefono: context.state.telefonoVentas
    });
  }

  @Step('📦 Ingresa el número de tu pedido para consultar el estado:', { id: 'pedido', saveAs: 'numeroPedido' })
  async consultarPedido(context: IFlowContext) {
    return context.message.body.trim();
  }

  @Api('GET', 'https://jsonplaceholder.typicode.com/posts/{{numeroPedido}}', {
    timeout: 10000,
    saveAs: 'estadoPedido',
    onSuccess: 'mostrarEstadoPedido',
    onError: 'pedidoNoEncontrado'
  })
  async verificarPedido(context: IFlowContext) {
    console.log('🔍 Consultando pedido:', context.state.numeroPedido);
  }

  @Info('📦 Estado de tu pedido #{{numeroPedido}}:\n\n✅ Estado: Procesado\n📅 Fecha estimada de entrega: 3-5 días hábiles\n🚚 Transportadora: Express Delivery\n\n¡Tu pedido está en camino!')
  async mostrarEstadoPedido(context: IFlowContext) {
    console.log('📦 Estado del pedido consultado exitosamente');
  }

  @Info('❌ No pudimos encontrar el pedido #{{numeroPedido}}.\n\nVerifica el número e intenta nuevamente o contacta a atención al cliente: 📞 +1-800-SUPPORT')
  async pedidoNoEncontrado(context: IFlowContext) {
    console.log('❌ Pedido no encontrado:', context.state.numeroPedido);
  }
}

async function main() {
  // Verificar si estamos en modo demostración
  try {
    // Configuración del proveedor Meta (WhatsApp Business API)
    const provider = new MetaProvider(
      process.env.META_ACCESS_TOKEN!,
      process.env.META_PHONE_NUMBER_ID!,
      process.env.META_VERIFY_TOKEN || 'waurik-verify-token'
    );

    // Inicializar Waurik con el proveedor Meta
    const waurik = new Waurik(provider);

    // Registrar el flujo
    waurik.registerFlow(MetaBusinessFlow);

    // Inicializar el bot
    await waurik.initialize();

    console.log('🤖 Bot empresarial con Meta Provider iniciado exitosamente');
    console.log('🌐 Webhook disponible en: http://localhost:3000/webhook');
    console.log('✅ Proveedor Meta conectado correctamente');
    console.log('📱 Listo para recibir mensajes de WhatsApp Business');
    
  } catch (error) {
    console.error('❌ Error al conectar con Meta Provider:', error);
    console.log('\n🔧 Verifica tu configuración:');
    console.log('   • META_ACCESS_TOKEN debe ser válido');
    console.log('   • META_PHONE_NUMBER_ID debe ser correcto');
    console.log('   • El webhook debe estar configurado en Meta Developer Console');
    throw error;
  }
}

// Manejo de errores
main().catch(error => {
  console.error('❌ Error al inicializar el bot:', error);
  console.log('\n🔧 Posibles soluciones:');
  console.log('   • Verifica que las variables de entorno estén configuradas');
  console.log('   • Asegúrate de que el token de acceso sea válido');
  console.log('   • Confirma que el Phone Number ID sea correcto');
  console.log('   • Revisa la configuración del webhook en Meta Developer Console');
});