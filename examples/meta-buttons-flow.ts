import { Waurik, MetaProvider, Flow, Step, Info, MetaButtons, MetaList } from '../src';
import { IFlowContext, MetaButton, MetaListSection } from '../src/types';

// Flujo de ejemplo con botones y listas de Meta
@Flow('*')
class MetaButtonsFlow {

  @MetaButtons(
    '🏪 ¡Bienvenido a nuestra tienda! ¿Qué te gustaría hacer hoy?',
    [
      { type: 'reply', title: '🛍️ Ver productos', id: 'ver_productos' },
      { type: 'reply', title: '📞 Contactar soporte', id: 'contactar_soporte' },
      { type: 'reply', title: '📍 Ubicaciones', id: 'ubicaciones' }
    ],
    {
      header: '🏪 Tienda Online',
      footer: 'Selecciona una opción para continuar'
    }
  )
  async menuPrincipal(context: IFlowContext) {
    console.log('🏪 Menú principal con botones mostrado');
    
    const selectedOption = context.message.body;
    
    switch (selectedOption) {
      case '🛍️ Ver productos':
        return 'mostrarCategorias';
      case '📞 Contactar soporte':
        return 'contactarSoporte';
      case '📍 Ubicaciones':
        return 'mostrarUbicaciones';
      default:
        await context.provider.sendMessage(context.message.from, '❌ Opción no válida. Por favor selecciona una de las opciones disponibles.');
        return null;
    }
  }

  @MetaList(
    '🛍️ Selecciona una categoría de productos:',
    [
      {
        title: '👕 Ropa',
        rows: [
          { id: 'camisetas', title: '👕 Camisetas', description: 'Camisetas de algodón premium' },
          { id: 'pantalones', title: '👖 Pantalones', description: 'Pantalones casuales y formales' },
          { id: 'zapatos', title: '👟 Zapatos', description: 'Calzado deportivo y formal' }
        ]
      },
      {
        title: '📱 Electrónicos',
        rows: [
          { id: 'smartphones', title: '📱 Smartphones', description: 'Últimos modelos disponibles' },
          { id: 'laptops', title: '💻 Laptops', description: 'Computadoras portátiles' },
          { id: 'accesorios', title: '🎧 Accesorios', description: 'Auriculares, cables y más' }
        ]
      }
    ],
    {
      id: 'mostrarCategorias',
      header: '🛍️ Catálogo de Productos',
      footer: 'Precios especiales esta semana',
      button_text: 'Ver categorías'
    }
  )
  async mostrarCategorias(context: IFlowContext) {
    console.log('🛍️ Categorías de productos mostradas');
    
    const selectedCategory = context.message.body;
    
    // Mapear las selecciones a productos específicos
    const categoryMap: { [key: string]: string } = {
      '👕 Camisetas': 'camisetas',
      '👖 Pantalones': 'pantalones', 
      '👟 Zapatos': 'zapatos',
      '📱 Smartphones': 'smartphones',
      '💻 Laptops': 'laptops',
      '🎧 Accesorios': 'accesorios'
    };
    
    const categoryId = categoryMap[selectedCategory];
    
    if (categoryId) {
      // Guardar la categoría seleccionada
      context.state.categoriaSeleccionada = categoryId;
      return 'mostrarProductos';
    } else {
      await context.provider.sendMessage(context.message.from, '❌ Categoría no válida. Por favor selecciona una categoría de la lista.');
      return null;
    }
  }

  @MetaButtons(
    '🛒 Productos disponibles en {{categoriaSeleccionada}}:',
    [
      { type: 'reply', title: '🛒 Agregar al carrito', id: 'agregar_carrito' },
      { type: 'reply', title: 'ℹ️ Más información', id: 'mas_info' },
      { type: 'reply', title: '🔙 Volver al menú', id: 'volver_menu' }
    ],
    {
      id: 'mostrarProductos',
      header: '🛒 Productos Destacados',
      footer: 'Envío gratis en compras mayores a $50'
    }
  )
  async mostrarProductos(context: IFlowContext) {
    console.log('🛒 Productos mostrados para categoría:', context.state.categoriaSeleccionada);
    
    const selectedAction = context.message.body;
    
    switch (selectedAction) {
      case '🛒 Agregar al carrito':
        return 'agregarAlCarrito';
      case 'ℹ️ Más información':
        return 'mostrarInformacion';
      case '🔙 Volver al menú':
        return 'menuPrincipal';
      default:
        await context.provider.sendMessage(context.message.from, '❌ Acción no válida. Por favor selecciona una de las opciones disponibles.');
        return null;
    }
  }

  @Info('✅ ¡Producto agregado al carrito!\n\n🛒 Carrito actual:\n• {{categoriaSeleccionada}} - $25.99\n\n💳 ¿Deseas proceder al pago?', { id: 'agregarAlCarrito' })
  async agregarAlCarrito(context: IFlowContext) {
    console.log('✅ Producto agregado al carrito:', context.state.categoriaSeleccionada);
  }

  @Info('ℹ️ Información detallada del producto:\n\n📦 Categoría: {{categoriaSeleccionada}}\n💰 Precio: $25.99\n📏 Tallas disponibles: S, M, L, XL\n🎨 Colores: Azul, Rojo, Negro\n⭐ Calificación: 4.8/5\n\n🚚 Envío disponible a todo el país', { id: 'mostrarInformacion' })
  async mostrarInformacion(context: IFlowContext) {
    console.log('ℹ️ Información mostrada para:', context.state.categoriaSeleccionada);
  }

  @MetaButtons(
    '📞 ¿Cómo podemos ayudarte?',
    [
      { type: 'reply', title: '🛠️ Problema técnico', id: 'problema_tecnico' },
      { type: 'reply', title: '📦 Estado de pedido', id: 'estado_pedido' },
      { type: 'reply', title: '💰 Devoluciones', id: 'devoluciones' },
      { type: 'phone_number', title: '📞 Llamar ahora', phone_number: '+1234567890' }
    ],
    {
      id: 'contactarSoporte',
      header: '📞 Soporte al Cliente',
      footer: 'Estamos aquí para ayudarte 24/7'
    }
  )
  async contactarSoporte(context: IFlowContext) {
    console.log('📞 Opciones de soporte mostradas');
    
    const selectedSupport = context.message.body;
    
    switch (selectedSupport) {
      case '🛠️ Problema técnico':
        return 'problemaTecnico';
      case '📦 Estado de pedido':
        return 'estadoPedido';
      case '💰 Devoluciones':
        return 'devoluciones';
      default:
        await context.provider.sendMessage(context.message.from, '❌ Opción de soporte no válida.');
        return null;
    }
  }

  @Step('🛠️ Describe tu problema técnico para poder ayudarte mejor:', { id: 'problemaTecnico', saveAs: 'problemaDescripcion' })
  async problemaTecnico(context: IFlowContext) {
    return context.message.body;
  }

  @Info('✅ ¡Problema registrado!\n\n🎫 Ticket #12345 creado\n📝 Descripción: {{problemaDescripcion}}\n\nNuestro equipo técnico te contactará en las próximas 2 horas.')
  async confirmarProblema(context: IFlowContext) {
    console.log('🛠️ Problema técnico registrado:', context.state.problemaDescripcion);
  }

  @Step('📦 Ingresa el número de tu pedido:', { id: 'estadoPedido', saveAs: 'numeroPedido' })
  async estadoPedido(context: IFlowContext) {
    return context.message.body;
  }

  @Info('📦 Estado de tu pedido #{{numeroPedido}}:\n\n✅ Estado: En tránsito\n📅 Fecha estimada: 2-3 días\n🚚 Transportadora: Express Delivery\n📍 Última ubicación: Centro de distribución\n\n🔔 Te notificaremos cuando esté cerca de tu ubicación.')
  async mostrarEstadoPedido(context: IFlowContext) {
    console.log('📦 Estado del pedido consultado:', context.state.numeroPedido);
  }

  @MetaList(
    '💰 Selecciona el tipo de devolución:',
    [
      {
        title: '🔄 Tipos de devolución',
        rows: [
          { id: 'producto_defectuoso', title: '🔧 Producto defectuoso', description: 'El producto llegó dañado o con fallas' },
          { id: 'talla_incorrecta', title: '📏 Talla incorrecta', description: 'El producto no es de la talla esperada' },
          { id: 'no_satisfecho', title: '😞 No satisfecho', description: 'El producto no cumple expectativas' }
        ]
      }
    ],
    {
      id: 'devoluciones',
      header: '💰 Centro de Devoluciones',
      footer: 'Política de devolución: 30 días',
      button_text: 'Ver opciones'
    }
  )
  async devoluciones(context: IFlowContext) {
    console.log('💰 Opciones de devolución mostradas');
    
    const tipoDevolucion = context.message.body;
    context.state.tipoDevolucion = tipoDevolucion;
    
    return 'procesarDevolucion';
  }

  @Info('✅ Solicitud de devolución procesada\n\n📋 Tipo: {{tipoDevolucion}}\n🎫 Número de caso: #DEV789\n\n📧 Te enviaremos las instrucciones por email\n📦 Etiqueta de envío gratuita incluida\n\n⏰ Tiempo estimado de reembolso: 5-7 días hábiles')
  async procesarDevolucion(context: IFlowContext) {
    console.log('💰 Devolución procesada:', context.state.tipoDevolucion);
  }

  @MetaList(
    '📍 Nuestras ubicaciones:',
    [
      {
        title: '🏪 Tiendas Físicas',
        rows: [
          { id: 'tienda_centro', title: '🏢 Centro Comercial Plaza', description: 'Av. Principal 123, Local 45' },
          { id: 'tienda_norte', title: '🏬 Mall Norte', description: 'Calle Norte 456, Piso 2' },
          { id: 'tienda_sur', title: '🏪 Centro Sur', description: 'Av. Sur 789, Local 12' }
        ]
      },
      {
        title: '📦 Centros de Distribución',
        rows: [
          { id: 'bodega_principal', title: '📦 Bodega Principal', description: 'Zona Industrial, Sector A' },
          { id: 'punto_retiro', title: '📍 Punto de Retiro', description: 'Estación Metro Central' }
        ]
      }
    ],
    {
      id: 'mostrarUbicaciones',
      header: '📍 Ubicaciones y Horarios',
      footer: 'Horario: Lun-Sab 9AM-8PM, Dom 10AM-6PM',
      button_text: 'Ver ubicaciones'
    }
  )
  async mostrarUbicaciones(context: IFlowContext) {
    console.log('📍 Ubicaciones mostradas');
    
    const ubicacionSeleccionada = context.message.body;
    context.state.ubicacionSeleccionada = ubicacionSeleccionada;
    
    return 'detalleUbicacion';
  }

  @Info('📍 Detalles de {{ubicacionSeleccionada}}:\n\n🕒 Horarios:\n• Lunes a Viernes: 9:00 AM - 8:00 PM\n• Sábados: 9:00 AM - 8:00 PM\n• Domingos: 10:00 AM - 6:00 PM\n\n📞 Teléfono: +1234567890\n📧 Email: tienda@empresa.com\n🚗 Estacionamiento disponible\n♿ Acceso para personas con discapacidad')
  async detalleUbicacion(context: IFlowContext) {
    console.log('📍 Detalle de ubicación mostrado:', context.state.ubicacionSeleccionada);
  }
}

async function main() {
  // Verificar si estamos en modo demostración
  const isDemoMode = !process.env.META_ACCESS_TOKEN || 
                    process.env.META_ACCESS_TOKEN === 'tu_access_token_aqui';

  if (isDemoMode) {
    console.log('🎭 MODO DEMOSTRACIÓN - Ejemplo de Botones y Listas de Meta');
    console.log('📋 Para usar con credenciales reales:');
    console.log('   1. Configura las variables de entorno META_ACCESS_TOKEN, META_PHONE_NUMBER_ID');
    console.log('   2. Ejecuta nuevamente el ejemplo');
    console.log('\n🎯 Funcionalidades demostradas:');
    console.log('   🔘 Botones interactivos de Meta (reply, phone_number)');
    console.log('   📋 Listas interactivas con secciones y filas');
    console.log('   🛍️ Flujo de tienda online completo');
    console.log('   📞 Sistema de soporte con opciones');
    console.log('   💰 Gestión de devoluciones');
    console.log('   📍 Directorio de ubicaciones');
    console.log('\n✨ Características de los botones:');
    console.log('   • Hasta 3 botones por mensaje');
    console.log('   • Tipos: reply, url, phone_number');
    console.log('   • Header y footer opcionales');
    console.log('\n✨ Características de las listas:');
    console.log('   • Hasta 10 secciones');
    console.log('   • Hasta 10 filas por sección');
    console.log('   • Título y descripción por fila');
    console.log('   • Botón personalizable');
    return;
  }

  try {
    // Configuración del proveedor Meta
    const provider = new MetaProvider(
      process.env.META_ACCESS_TOKEN!,
      process.env.META_PHONE_NUMBER_ID!,
      process.env.META_VERIFY_TOKEN || 'waurik-verify-token'
    );

    // Inicializar Waurik
    const waurik = new Waurik(provider);

    // Registrar el flujo
    waurik.registerFlow(MetaButtonsFlow);

    // Inicializar el bot
    await waurik.initialize();

    console.log('🤖 Bot con botones y listas de Meta iniciado exitosamente');
    console.log('🌐 Webhook disponible en: http://localhost:3000/webhook');
    console.log('✅ Listo para recibir mensajes con botones interactivos');
    
  } catch (error) {
    console.error('❌ Error al inicializar el bot:', error);
    throw error;
  }
}

// Manejo de errores
main().catch(error => {
  console.error('❌ Error al inicializar el bot:', error);
  console.log('\n🔧 Verifica tu configuración:');
  console.log('   • META_ACCESS_TOKEN debe ser válido');
  console.log('   • META_PHONE_NUMBER_ID debe ser correcto');
  console.log('   • El webhook debe estar configurado en Meta Developer Console');
});