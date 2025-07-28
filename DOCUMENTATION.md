# Documentación Técnica de Waurik

## Índice
1. [Arquitectura](#arquitectura)
2. [Creación de Decoradores](#creación-de-decoradores)
3. [Implementación de Proveedores](#implementación-de-proveedores)
4. [Sistema de Flujos](#sistema-de-flujos)
5. [Manejo de Estado](#manejo-de-estado)
6. [Mejores Prácticas](#mejores-prácticas)

## Arquitectura

Waurik está construida siguiendo una arquitectura modular y extensible. Los componentes principales son:

- **Core**: Núcleo de la aplicación que maneja la lógica principal
- **Decorators**: Sistema de decoradores para definir comportamientos
- **Providers**: Implementaciones de diferentes proveedores de WhatsApp
- **Types**: Definiciones de tipos TypeScript

### Diagrama de Componentes

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Decorators│────▶│     Core    │◀────│  Providers  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Types    │     │    Flows    │     │    State    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Creación de Decoradores

### Estructura Básica

Un decorador en Waurik debe seguir esta estructura básica:

```typescript
export function MiDecorador(...args: any[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // 1. Validación de argumentos
    if (!args || args.length === 0) {
      throw new Error('MiDecorador requiere argumentos');
    }

    // 2. Registro del decorador
    const metadata = {
      type: 'miDecorador',
      args: args,
      target: target.constructor.name,
      method: propertyKey
    };

    // 3. Almacenamiento de metadatos
    Reflect.defineMetadata('decorator:miDecorador', metadata, target, propertyKey);

    // 4. Modificación del descriptor (opcional)
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // Lógica pre-ejecución
      const result = await originalMethod.apply(this, args);
      // Lógica post-ejecución
      return result;
    };

    return descriptor;
  };
}
```

### Consideraciones Importantes

1. **Metadatos**:
   - Usa `reflect-metadata` para almacenar información del decorador
   - Define una estructura clara para los metadatos
   - Incluye información de tipo y validación

2. **Validación**:
   - Valida los argumentos del decorador
   - Verifica el contexto de uso (clase, método, etc.)
   - Maneja errores de forma descriptiva

3. **Tipado**:
   - Define interfaces para los argumentos
   - Usa tipos genéricos cuando sea necesario
   - Documenta los tipos con comentarios JSDoc

### Ejemplo Completo

```typescript
interface ValidationOptions {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export function Validate(options: ValidationOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const value = args[0];

      if (options.required && !value) {
        throw new Error(`${propertyKey} es requerido`);
      }

      if (options.min && value < options.min) {
        throw new Error(`${propertyKey} debe ser mayor que ${options.min}`);
      }

      if (options.max && value > options.max) {
        throw new Error(`${propertyKey} debe ser menor que ${options.max}`);
      }

      if (options.pattern && !options.pattern.test(value)) {
        throw new Error(`${propertyKey} no cumple con el patrón requerido`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
```

## Implementación de Proveedores

### Estructura Base

Un proveedor debe implementar la interfaz `IProvider`:

```typescript
interface IProvider {
  initialize(): Promise<void>;
  sendMessage(to: string, message: string): Promise<void>;
  onMessage(callback: (message: Message) => void): void;
  onEvent(event: string, callback: (data: any) => void): void;
}
```

### Implementación Básica

```typescript
export class MiProvider implements IProvider {
  private client: any;
  private messageHandlers: ((message: Message) => void)[] = [];
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();

  async initialize(): Promise<void> {
    // 1. Configuración inicial
    this.client = await this.setupClient();

    // 2. Configuración de listeners
    this.setupListeners();

    // 3. Conexión
    await this.connect();
  }

  async sendMessage(to: string, message: string): Promise<void> {
    // Implementación del envío de mensajes
    await this.client.sendMessage(to, message);
  }

  onMessage(callback: (message: Message) => void): void {
    this.messageHandlers.push(callback);
  }

  onEvent(event: string, callback: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(callback);
  }

  private async setupClient(): Promise<any> {
    // Implementación específica del cliente
  }

  private setupListeners(): void {
    // Configuración de listeners específicos
  }

  private async connect(): Promise<void> {
    // Lógica de conexión
  }
}
```

### Consideraciones para Proveedores

1. **Manejo de Errores**:
   - Implementa reintentos para operaciones fallidas
   - Maneja desconexiones y reconexiones
   - Proporciona mensajes de error descriptivos

2. **Eventos**:
   - Define una estructura clara para los eventos
   - Implementa un sistema de suscripción robusto
   - Maneja la limpieza de listeners

3. **Estado**:
   - Mantén un estado de conexión
   - Implementa mecanismos de recuperación
   - Proporciona métodos para verificar el estado

## Sistema de Flujos

### Estructura de un Flujo

```typescript
@Flow('miFlujo')
class MiFlujo {
  @Step('Mensaje inicial')
  async paso1(context: Context) {
    // Lógica del paso 1
    return context.message.body;
  }

  @Step('Siguiente paso')
  async paso2(context: Context) {
    // Lógica del paso 2
    return null;
  }
}
```

### Consideraciones para Flujos

1. **Estado**:
   - Usa el contexto para almacenar datos temporales
   - Limpia el estado cuando sea necesario
   - Valida los datos del estado

2. **Validación**:
   - Implementa validaciones en cada paso
   - Maneja errores de forma elegante
   - Proporciona mensajes claros al usuario

3. **Transiciones**:
   - Define claramente las transiciones entre pasos
   - Maneja casos de error y excepciones
   - Implementa lógica de recuperación

## Manejo de Estado

### Estructura del Estado

```typescript
interface State {
  currentStep: string;
  data: Record<string, any>;
  metadata: {
    startTime: Date;
    lastUpdate: Date;
    flow: string;
  };
}
```

### Mejores Prácticas

1. **Persistencia**:
   - Implementa mecanismos de persistencia
   - Maneja la serialización/deserialización
   - Considera el almacenamiento en base de datos

2. **Limpieza**:
   - Implementa TTL para estados antiguos
   - Limpia datos sensibles
   - Maneja la expiración de sesiones

3. **Seguridad**:
   - Encripta datos sensibles
   - Valida la integridad del estado
   - Implementa mecanismos de autenticación

## Mejores Prácticas

### Desarrollo

1. **Código**:
   - Sigue los principios SOLID
   - Escribe tests unitarios
   - Documenta el código con JSDoc

2. **Testing**:
   - Implementa tests de integración
   - Usa mocks para proveedores
   - Prueba casos de error

3. **Documentación**:
   - Documenta APIs públicas
   - Proporciona ejemplos de uso
   - Mantén la documentación actualizada

### Despliegue

1. **Configuración**:
   - Usa variables de entorno
   - Implementa logging
   - Configura monitoreo

2. **Mantenimiento**:
   - Implementa versionado semántico
   - Mantén un changelog
   - Actualiza dependencias regularmente

3. **Seguridad**:
   - Implementa rate limiting
   - Valida entradas
   - Maneja secretos de forma segura

## Decoradores Disponibles

#### @Menu
El decorador `@Menu` permite crear menús interactivos y manejar la navegación entre diferentes partes del flujo.

```typescript
interface MenuOption {
  option: string;   // Texto que se mostrará como opción
  goTo: string;     // ID del decorador al que se navegará
}

interface MenuMetadata {
  type: 'menu';
  message: string;
  options: MenuOption[];
}

export function Menu(message: string, options: MenuOption[]) {
  return function (target: any, propertyKey: string) {
    // Almacenar metadatos del menú
    Reflect.defineMetadata('decorator:menu', {
      type: 'menu',
      message,
      options
    }, target, propertyKey);
  };
}
```

#### @Info
El decorador `@Info` permite mostrar mensajes informativos sin esperar una respuesta del usuario.

```typescript
interface InfoOptions {
  backToMenu?: boolean;    // Permitir volver al menú principal
  menuCommand?: string;    // Comando para volver al menú (default: '0')
}

interface InfoMetadata {
  type: 'info';
  message: string;
  backToMenu?: boolean;
  menuCommand?: string;
}

export function Info(message: string, options: InfoOptions = {}) {
  return function (target: any, propertyKey: string) {
    // Almacenar metadatos del mensaje informativo
    Reflect.defineMetadata('decorator:info', {
      type: 'info',
      message,
      backToMenu: options.backToMenu,
      menuCommand: options.menuCommand || '0'
    }, target, propertyKey);
  };
}
```

### Manejo de Estado en Menús

El sistema mantiene el estado de la navegación usando las siguientes propiedades:

```typescript
interface MenuState extends IState {
  __flowKeyword?: string;    // Palabra clave del flujo actual
  __stepIndex?: number;      // Índice del paso actual
  __started?: boolean;       // Si el paso actual ya mostró su mensaje
  __currentId?: string;      // ID del decorador actual (usado en menús)
}
```

### Navegación y Retorno al Menú

Para implementar el retorno al menú:

1. Los decoradores @Step e @Info pueden configurarse con la opción `backToMenu`:
   ```typescript
   @Step('Mensaje...', { backToMenu: true, menuCommand: '0' })
   ```

2. El `FlowManager` detecta el comando de retorno y:
   - Busca el primer decorador @Menu en el flujo
   - Limpia el estado actual
   - Resetea el índice al menú
   - Muestra las opciones del menú

3. Los estados se preservan por chat usando el ID del remitente:
   ```typescript
   private states: Map<string, MenuState>
   ```