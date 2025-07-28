# 📱 Ejemplo de Waurik con Meta (WhatsApp Business API)

Este ejemplo muestra cómo usar la librería Waurik con el proveedor de Meta para crear un bot empresarial en WhatsApp Business API.

## 🚀 Configuración Inicial

### 1. Requisitos Previos

- Cuenta de Meta for Developers
- WhatsApp Business API configurada
- Aplicación de Facebook creada
- Número de teléfono verificado

### 2. Configuración en Meta Developer Console

1. **Crear una aplicación en Meta for Developers:**
   - Ve a [developers.facebook.com](https://developers.facebook.com)
   - Crea una nueva aplicación
   - Agrega el producto "WhatsApp Business API"

2. **Configurar WhatsApp Business API:**
   - Obtén tu `Access Token` temporal o permanente
   - Anota tu `Phone Number ID`
   - Configura el webhook

3. **Configuración del Webhook:**
   - URL del webhook: `https://tu-dominio.com/webhook`
   - Token de verificación: `waurik-verify-token` (o personalizado)
   - Eventos a suscribir: `messages`

### 3. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
META_ACCESS_TOKEN=tu_access_token_aqui
META_PHONE_NUMBER_ID=tu_phone_number_id_aqui
META_VERIFY_TOKEN=waurik-verify-token
```

## 🏗️ Estructura del Ejemplo

El ejemplo `meta-flow.ts` incluye:

### 📋 Menú Principal
- Información de productos
- Soporte técnico
- Contactar ventas
- Estado de pedido

### 🛠️ Flujo de Soporte Técnico
1. Solicita descripción del problema
2. Pide email de contacto
3. Crea ticket automáticamente vía API
4. Confirma la creación del ticket

### 💼 Flujo de Ventas
1. Consulta tipo de solución
2. Solicita número de teléfono
3. Registra el contacto para seguimiento

### 📦 Consulta de Pedidos
1. Solicita número de pedido
2. Consulta estado vía API
3. Muestra información del pedido

## 🎯 Características Destacadas

### Decoradores Utilizados

- **`@Flow('*')`**: Captura todos los mensajes
- **`@Menu`**: Crea menús interactivos
- **`@Step`**: Pasos secuenciales con validación
- **`@Info`**: Mensajes informativos con plantillas
- **`@Api`**: Integración con APIs externas

### Funcionalidades Avanzadas

- **Validación de datos**: Email y teléfono
- **Integración con APIs**: Creación de tickets y consulta de pedidos
- **Manejo de errores**: Callbacks de éxito y error
- **Plantillas dinámicas**: Interpolación de variables
- **Reintentos automáticos**: Para llamadas a APIs

## 🚀 Ejecución

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar el ejemplo
npx ts-node examples/meta-flow.ts
```

### Producción

```bash
# Compilar TypeScript
npm run build

# Ejecutar en producción
node dist/examples/meta-flow.js
```

## 🌐 Configuración del Webhook

### Desarrollo Local (usando ngrok)

```bash
# Instalar ngrok
npm install -g ngrok

# Exponer puerto local
ngrok http 3000

# Usar la URL de ngrok en Meta Developer Console
# Ejemplo: https://abc123.ngrok.io/webhook
```

### Producción

- Despliega tu aplicación en un servidor con HTTPS
- Configura el webhook con tu dominio real
- Asegúrate de que el puerto 3000 esté disponible

## 📝 Ejemplo de Conversación

```
Usuario: Hola
Bot: 🏢 ¡Bienvenido a nuestro servicio empresarial! ¿En qué podemos ayudarte?
     1 - Información de productos
     2 - Soporte técnico
     3 - Contactar ventas
     4 - Estado de pedido

Usuario: 2
Bot: 🛠️ Describe tu problema técnico para poder ayudarte mejor:

Usuario: Mi aplicación no se conecta a la base de datos
Bot: 📧 Por favor proporciona tu email para contactarte:

Usuario: usuario@empresa.com
Bot: ✅ ¡Ticket creado exitosamente!
     🎫 ID del ticket: 101
     📧 Email: usuario@empresa.com
     Nuestro equipo te contactará en las próximas 24 horas.
```

## 🔧 Solución de Problemas

### Error de Conexión
- Verifica que el `ACCESS_TOKEN` sea válido
- Confirma que el `PHONE_NUMBER_ID` sea correcto
- Asegúrate de que el webhook esté configurado correctamente

### Webhook No Funciona
- Verifica que la URL sea accesible desde internet
- Confirma que el token de verificación coincida
- Revisa los logs del servidor para errores

### Mensajes No Se Envían
- Verifica permisos de la aplicación en Meta
- Confirma que el número de teléfono esté verificado
- Revisa los límites de la API de WhatsApp Business

## 📚 Recursos Adicionales

- [Documentación de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com)
- [Guía de Webhooks](https://developers.facebook.com/docs/graph-api/webhooks)
- [Límites y Restricciones](https://developers.facebook.com/docs/whatsapp/api/rate-limits)

## 🤝 Soporte

Si tienes problemas con este ejemplo:

1. Revisa la configuración de variables de entorno
2. Verifica la configuración del webhook en Meta
3. Consulta los logs del servidor para errores específicos
4. Asegúrate de que todos los permisos estén configurados correctamente