import { Waurik, BaileysProvider, Flow, AI, Step, Info } from '../src';
import { IFlowContext, IntentMapping } from '../src/types';

// Definir las intenciones disponibles
const intents: IntentMapping[] = [
  {
    intent: 'pago',
    keywords: ['pago', 'pagar', 'factura', 'cuenta', 'dinero', 'transferencia'],
    goTo: 'pago',
    description: 'El usuario quiere realizar un pago'
  },
  {
    intent: 'soporte',
    keywords: ['ayuda', 'soporte', 'problema', 'error', 'falla', 'no funciona'],
    goTo: 'soporte',
    description: 'El usuario necesita soporte técnico'
  },
  {
    intent: 'informacion',
    keywords: ['información', 'info', 'datos', 'detalles', 'consulta'],
    goTo: 'informacion',
    description: 'El usuario quiere información general'
  }
];

@Flow('*')
export class AIFlow {
  
  //@ts-ignore
  // @AI(
  //   '¡Hola! 👋 Bienvenido a nuestro asistente virtual.',
  //   '¿En qué puedo ayudarte hoy?',
  //   intents
  // )
  // async asistente(context: IFlowContext) {
  //   // Este método se ejecuta cuando se detecta una intención
  //   console.log('Asistente AI procesando:', context.message.body);
  // }

  // //@ts-ignore
  // @Step('Perfecto, te ayudo con tu pago. ¿Cuál es el monto que deseas pagar?', { id: 'pago', saveAs: 'montoPago' })
  // async procesarPago(context: IFlowContext) {
  //   const monto = parseFloat(context.message.body);
  //   if (isNaN(monto) || monto <= 0) {
  //     await context.provider.sendMessage(context.message.from, '❌ Por favor ingresa un monto válido.');
  //     return null; // Repetir el paso
  //   }
  //   return monto;
  // }

  // //@ts-ignore
  // @Step('Has ingresado ${{montoPago}}. ¿Confirmas el pago? (si/no)', { id: 'confirmar-pago' })
  // async confirmarPago(context: IFlowContext) {
  //   const respuesta = context.message.body.toLowerCase();
  //   if (respuesta === 'si' || respuesta === 'sí') {
  //     await context.provider.sendMessage(context.message.from, '✅ Pago procesado exitosamente por $' + context.state.montoPago);
  //     return 'confirmado';
  //   } else if (respuesta === 'no') {
  //     await context.provider.sendMessage(context.message.from, '❌ Pago cancelado.');
  //     return 'cancelado';
  //   } else {
  //     await context.provider.sendMessage(context.message.from, 'Por favor responde "si" o "no".');
  //     return null;
  //   }
  // }

  // //@ts-ignore
  // @Info('Estás en soporte técnico. Nuestro equipo te contactará pronto. 📞\n\nEscribe "menu" para volver al inicio.', { id: 'soporte' })
  // async soporte(context: IFlowContext) {
  //   console.log('Usuario solicitó soporte:', context.message.from);
  // }

  //@ts-ignore
  @Info('Aquí tienes información sobre nuestros servicios:\n\n• Pagos en línea\n• Soporte 24/7\n• Consultas generales\n\nEscribe "menu" para volver al inicio.', { id: 'informacion' })
  async informacion(context: IFlowContext) {
    console.log('Usuario solicitó información:', context.message.from);
  }
}

// Inicializar el bot
async function main() {
  const provider = new BaileysProvider({
    port: 4003
  });
  const waurik = new Waurik(provider);

  waurik.registerFlow(AIFlow);
  await waurik.initialize();
}

main().catch(console.error);

console.log('🤖 Bot AI iniciado. Esperando mensajes...');
console.log('Intenciones disponibles:');
intents.forEach(intent => {
  console.log(`- ${intent.intent}: ${intent.keywords.join(', ')}`);
});