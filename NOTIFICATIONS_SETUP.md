# 📧 Sistema de Notificaciones por Email - Configuración

Este sistema envía una notificación por email a **aaaprosperi@gmail.com** cada vez que alguien visita cualquier página de pixan.ai.

## 🚀 Configuración Rápida

### 1. Crear cuenta en Resend (Gratis)

1. Ve a [https://resend.com/signup](https://resend.com/signup)
2. Crea una cuenta gratuita
3. Verifica tu email

### 2. Obtener API Key

1. Una vez logueado, ve a [https://resend.com/api-keys](https://resend.com/api-keys)
2. Click en **"Create API Key"**
3. Dale un nombre (ejemplo: "pixan.ai notifications")
4. Copia la API key (empieza con `re_`)

### 3. Configurar el Dominio (Importante)

Por defecto, Resend solo permite enviar emails desde dominios verificados. Tienes 2 opciones:

#### Opción A: Usar el dominio de prueba (Más rápido pero limitado)
- Resend te da un dominio de prueba automáticamente
- Solo puedes enviar a tu propio email verificado
- **Perfecto para este caso** ya que solo enviamos a aaaprosperi@gmail.com

#### Opción B: Verificar tu propio dominio (Recomendado para producción)
1. Ve a [https://resend.com/domains](https://resend.com/domains)
2. Click en **"Add Domain"**
3. Ingresa `pixan.ai`
4. Copia los registros DNS que te muestran
5. Ve a tu proveedor de DNS (Vercel, Cloudflare, etc.)
6. Agrega los registros DNS:
   - **MX record**
   - **TXT record** (para SPF)
   - **CNAME record** (para DKIM)
7. Espera la verificación (puede tomar hasta 48 horas, pero usualmente es instantáneo)

### 4. Configurar Variables de Entorno

#### En desarrollo local:
Crea o edita el archivo `.env.local`:
```bash
RESEND_API_KEY=re_tu_api_key_aqui
```

#### En Vercel:
1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Settings → Environment Variables
3. Agrega:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_tu_api_key_aqui`
   - **Environment:** Production, Preview, Development (selecciona todos)
4. Click en **Save**
5. Redeploy el proyecto

### 5. Verificar el Email de Origen

Si usas tu propio dominio, edita el archivo `pages/api/track-visit.js`:

```javascript
from: 'Pixan.ai Notifications <notifications@pixan.ai>',
```

Si usas el dominio de prueba de Resend, cámbialo a:

```javascript
from: 'onboarding@resend.dev',
```

## 📊 Cómo Funciona

### Rastreo Automático
- El sistema rastrea **todas las páginas** automáticamente
- Se activa en cada carga de página y cambio de ruta
- **No afecta la velocidad** del sitio (se ejecuta en background)

### Información que Recibe el Email
Cada notificación incluye:
- 📄 **Página visitada** (ej: `/`, `/perrito`, `/genAI`)
- 🕐 **Fecha y hora** (zona horaria de México)
- 🌐 **Dirección IP** del visitante
- 🔗 **Referrer** (de dónde viene el visitante)
- 💻 **User Agent** (navegador y dispositivo)

### Modo Desarrollo
- En desarrollo local (`npm run dev`), las notificaciones **NO se envían**
- Solo se hace un `console.log` para no saturar tu email
- Solo funciona en **producción** (Vercel)

## 🎨 Personalización

### Cambiar el Email Destino
Edita `pages/api/track-visit.js`, línea 40:
```javascript
to: ['aaaprosperi@gmail.com'], // Cambia este email
```

Puedes agregar múltiples destinatarios:
```javascript
to: ['aaaprosperi@gmail.com', 'otro@email.com'],
```

### Cambiar el Asunto del Email
Edita `pages/api/track-visit.js`, línea 41:
```javascript
subject: `🔔 Nueva visita en pixan.ai: ${page}`,
```

### Deshabilitar para Ciertas Páginas
Edita `pages/_app.js`, dentro de la función `trackPageVisit`:
```javascript
// Ignorar páginas específicas
if (page.includes('/api/') || page.includes('/admin')) {
  return
}
```

## 🔧 Troubleshooting

### "Email not sent" en los logs
1. Verifica que `RESEND_API_KEY` esté configurada correctamente
2. Asegúrate de haber verificado tu dominio en Resend
3. Revisa los logs de Resend: [https://resend.com/logs](https://resend.com/logs)

### Los emails van a spam
1. Verifica que los registros DNS estén configurados correctamente
2. Agrega `pixan.ai` a la lista de remitentes seguros
3. Espera unos días para que mejore la reputación del dominio

### No llegan notificaciones en producción
1. Verifica que la variable de entorno esté en Vercel
2. Redeploy el proyecto después de agregar la variable
3. Revisa los logs de Vercel: `vercel logs`

## 📈 Límites del Plan Gratuito

**Resend - Plan Gratuito:**
- ✅ 3,000 emails por mes
- ✅ 100 emails por día
- ✅ Todas las funcionalidades

Si pixan.ai recibe más de 100 visitas por día, considera:
- Agregar throttling (solo 1 email cada X minutos)
- Usar un plan pago de Resend ($20/mes para 50,000 emails)
- Implementar analytics en lugar de emails

## 🔐 Seguridad

- ✅ La API Key nunca se expone al cliente
- ✅ Solo funciona en el servidor (API routes de Next.js)
- ✅ Los errores fallan silenciosamente (no afectan al usuario)
- ✅ Solo se rastrea en producción (no en desarrollo)

## 📚 Recursos

- [Documentación de Resend](https://resend.com/docs)
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Verificación de Dominio](https://resend.com/docs/dashboard/domains/introduction)

---

**¿Necesitas ayuda?** Revisa los logs de Resend o contacta su soporte en [support@resend.com](mailto:support@resend.com)
