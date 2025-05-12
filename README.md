# Waurik

Waurik es una librería para crear chatbots de WhatsApp usando decoradores en TypeScript. Es fácil de usar, escalable y el código es muy entendible para que cualquier desarrollador pueda contribuir en ella.

## Características

- Soporte para múltiples proveedores (Baileys, WhatsApp Business API)
- Sistema de flujos basado en decoradores
- Manejo de estado para cada conversación
- Soporte para archivos (imágenes, documentos, etc.)
- Integración con APIs REST
- Manejo de eventos
- Funciones personalizadas

## Instalación

```bash
npm install waurik
```

## Uso básico

```typescript
import { Waurik, BaileysProvider, Flow, Step } from 'waurik';

@Flow('saludo')
class SaludoFlow {
  @Step('¡Hola! ¿Cómo estás?')
  async saludar(context: any) {
    return context.message.body;
  }

  @Step('Me alegro de que estés {saludar}. ¿En qué puedo ayudarte?')
  async preguntar(context: any) {
    return null;
  }
}

async function main() {
  const provider = new BaileysProvider();
  const waurik = new Waurik(provider);

  waurik.registerFlow(SaludoFlow);
  await waurik.initialize();
}

main().catch(console.error);
```

## Decoradores

### @Flow
Inicia un nuevo flujo y define la palabra clave para activarlo.

```typescript
@Flow('registro')
class RegistroFlow {
  // ...
}
```

### @Step
Define un paso en el flujo que envía un mensaje y espera la respuesta del usuario.

```typescript
@Step('Por favor, ingresa tu nombre:')
async nombre(context: any) {
  return context.message.body;
}
```

### @Func
Define una función que puede realizar operaciones personalizadas.

```typescript
@Func()
async validarEdad(context: any) {
  if (context.state.edad < 18) {
    return false;
  }
  return true;
}
```

### @Event
Maneja eventos específicos del proveedor.

```typescript
@Event('message')
async onMessage(context: any) {
  // Manejar el evento
}
```

### @Files
Maneja la recepción de archivos.

```typescript
@Files('./uploads')
async documento(context: any) {
  return context.state.documento;
}
```

### @Api
Realiza llamadas a APIs REST.

```typescript
@Api('POST', 'https://api.example.com/registro')
async guardarRegistro(context: any) {
  return context.state.data;
}
```

## Proveedores

### BaileysProvider
Proveedor gratuito basado en Baileys.

```typescript
const provider = new BaileysProvider();
```

### MetaProvider
Proveedor oficial de WhatsApp Business API.

```typescript
const provider = new MetaProvider(
  'tu-access-token',
  'tu-phone-number-id',
  'tu-verify-token'
);
```

### CustomProvider
Proveedor personalizado de ejemplo.

```typescript
const provider = new CustomProvider({
  // Tu configuración personalizada
});
```

## Contribuir

¡Las contribuciones son bienvenidas! Aquí te explicamos cómo puedes contribuir al proyecto:

### Requisitos previos

- Node.js (versión 16 o superior)
- npm o yarn
- Git

### Configuración del entorno de desarrollo

1. Haz un fork del repositorio
2. Clona tu fork:
```bash
git clone https://github.com/tu-usuario/waurik.git
cd waurik
```

3. Instala las dependencias:
```bash
npm install
```

4. Construye el proyecto:
```bash
npm run build
```

### Estructura del proyecto

```
waurik/
├── src/                    # Código fuente
│   ├── core/              # Núcleo de la librería
│   ├── decorators/        # Implementación de decoradores
│   ├── providers/         # Proveedores de WhatsApp
│   └── types/             # Definiciones de tipos
├── examples/              # Ejemplos de uso
├── tests/                 # Tests unitarios y de integración
└── dist/                  # Código compilado (generado)
```

### Guía de desarrollo

1. **Crear una nueva rama**:
```bash
git checkout -b feature/nueva-caracteristica
```

2. **Desarrollo**:
   - Sigue las convenciones de código existentes
   - Escribe tests para nuevas funcionalidades
   - Actualiza la documentación según sea necesario

3. **Tests**:
```bash
npm test
```

4. **Linting**:
```bash
npm run lint
```

5. **Commit**:
   - Usa mensajes de commit descriptivos
   - Sigue el formato: `tipo(alcance): descripción`
   - Ejemplo: `feat(provider): add new WhatsApp provider`

6. **Pull Request**:
   - Actualiza la documentación
   - Incluye ejemplos de uso
   - Describe los cambios y su propósito
   - Asegúrate que todos los tests pasen

### Convenciones de código

- Usa TypeScript para todo el código nuevo
- Sigue el estilo de código existente
- Documenta las funciones y clases públicas
- Escribe tests unitarios para nueva funcionalidad
- Mantén la compatibilidad con versiones anteriores

### Proceso de revisión

1. Todos los PRs serán revisados por los mantenedores
2. Los cambios deben pasar todos los tests
3. La documentación debe estar actualizada
4. El código debe seguir las convenciones establecidas

### Reportar bugs

Si encuentras un bug, por favor:
1. Revisa si ya existe un issue reportado
2. Crea un nuevo issue con:
   - Descripción del problema
   - Pasos para reproducir
   - Comportamiento esperado
   - Versión de la librería
   - Entorno (Node.js, npm, etc.)

### Sugerencias de mejora

Las sugerencias son bienvenidas. Por favor:
1. Describe la mejora propuesta
2. Explica por qué sería útil
3. Incluye ejemplos de uso si es posible

## Licencia

MIT 