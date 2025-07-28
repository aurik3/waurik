# Funcionalidad SaveAs para Decoradores

## Descripción

La nueva funcionalidad `saveAs` permite almacenar los datos de cada `@Step` en variables con nombres personalizados en lugar de usar el nombre del método. Esto facilita el manejo de datos y hace que el código sea más legible.

## Uso

### Sintaxis Básica

```typescript
@Step('Mensaje del paso', { saveAs: 'nombreVariable' })
async nombreMetodo(context: any) {
  const input = context.message.body.trim();
  return input; // Este valor se guardará en context.state.nombreVariable
}
```

### Ejemplo Completo

```typescript
@Flow('registro')
class RegistroFlow {
  
  @Step('Por favor, ingrese su nombre:', { saveAs: 'nombreCompleto' })
  async solicitarNombre(context: any) {
    const input = context.message.body.trim();
    return input;
  }
  
  @Step('Por favor, ingrese su apellido:', { saveAs: 'apellido' })
  async solicitarApellido(context: any) {
    const input = context.message.body.trim();
    return input;
  }
  
  @Step('Por favor, ingrese su edad:', { saveAs: 'edad' })
  async solicitarEdad(context: any) {
    const input = context.message.body.trim();
    const edad = parseInt(input);
    
    if (isNaN(edad) || edad < 0 || edad > 120) {
      await context.provider.sendMessage(
        context.message.from,
        'Por favor ingrese una edad válida (0-120)'
      );
      return; // No retornar nada para repetir el paso
    }
    
    return edad;
  }
  
  @Info('Gracias {{nombreCompleto}} {{apellido}}, su edad {{edad}} años ha sido registrada.')
  async confirmacion(context: any) {
    console.log('Datos registrados:', {
      nombre: context.state.nombreCompleto,
      apellido: context.state.apellido,
      edad: context.state.edad
    });
  }
}
```

## Características

### 1. Nombres Personalizados
- Usa `saveAs` para definir el nombre de la variable donde se guardará el dato
- Si no se especifica `saveAs`, se usa el nombre del método como antes

### 2. Interpolación de Variables
- Puedes usar las variables guardadas en mensajes usando `{{nombreVariable}}`
- Ejemplo: `'Hola {{nombreCompleto}}, tu edad es {{edad}} años'`

### 3. Acceso a Datos
- Los datos se almacenan en `context.state[nombreVariable]`
- Puedes acceder a ellos desde cualquier método del flujo

### 4. Compatibilidad
- Funciona con decoradores `@Step` e `@Info`
- Es completamente compatible con el código existente
- Si no usas `saveAs`, el comportamiento es el mismo de antes

## Ventajas

1. **Código más legible**: Los nombres de variables son más descriptivos
2. **Mejor organización**: Separas la lógica del método del nombre de la variable
3. **Reutilización**: Puedes usar el mismo nombre de variable en diferentes flujos
4. **Flexibilidad**: Puedes cambiar el nombre del método sin afectar las referencias

## Ejemplo de Migración

### Antes (sin saveAs)
```typescript
@Step('Ingrese su cédula:')
async cedula(context: any) {
  return context.message.body.trim();
}

@Info('Su cédula {{cedula}} fue registrada')
async confirmacion(context: any) {
  console.log(context.state.cedula);
}
```

### Después (con saveAs)
```typescript
@Step('Ingrese su cédula:', { saveAs: 'numeroCedula' })
async solicitarCedula(context: any) {
  return context.message.body.trim();
}

@Info('Su cédula {{numeroCedula}} fue registrada')
async mostrarConfirmacion(context: any) {
  console.log(context.state.numeroCedula);
}
```

## Notas Importantes

- El valor que se guarda es lo que retorna el método del `@Step`
- Si el método retorna `null` o `undefined`, el paso se repite
- Si no retornas nada, se guarda el texto original del mensaje (`message.body`)
- Las variables están disponibles inmediatamente después de ser guardadas