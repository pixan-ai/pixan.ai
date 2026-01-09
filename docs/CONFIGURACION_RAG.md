# 🚀 Guía de Configuración - Sistema RAG para WhatsApp Bot

## 📋 Pasos de Configuración

### 1. Crear Base de Datos Vectorial en Upstash

1. Ve a [Upstash Console](https://console.upstash.com/)
2. Inicia sesión con tu cuenta
3. Click en **"Vector"** en el menú lateral
4. Click en **"Create Index"**
5. Configuración recomendada:
   - **Name**: `pixan-wa-rag`
   - **Region**: Selecciona el más cercano (US East o EU West)
   - **Dimensions**: `768` (para Gemini text-embedding-004)
   - **Similarity Metric**: `COSINE`
   - **Embedding Model**: Selecciona **"Custom"** (usaremos Gemini)

6. Click en **"Create Index"**

7. Una vez creado, ve a la pestaña **"Details"** y copia:
   - `UPSTASH_VECTOR_REST_URL`
   - `UPSTASH_VECTOR_REST_TOKEN`

### 2. Configurar Variables de Entorno en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/pixan-team/pixan-ai/settings/environment-variables)
2. Agrega estas **2 nuevas variables**:

```bash
# Upstash Vector Database
UPSTASH_VECTOR_REST_URL=https://your-index-url.upstash.io
UPSTASH_VECTOR_REST_TOKEN=your_token_here
```

3. Asegúrate de seleccionar **todos los entornos** (Production, Preview, Development)
4. Click en **"Save"**

### 3. Verificar que todo esté configurado

Revisa que tengas **TODAS** estas variables de entorno en Vercel:

#### Variables Existentes (WhatsApp Bot):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `GEMINI_API_KEY`
- `AI_GATEWAY_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_EMAIL`
- `UPSTASH_API_KEY`
- `UPSTASH_DATABASE_ID`

#### Variables Nuevas (RAG):
- `UPSTASH_VECTOR_REST_URL` ← NUEVA
- `UPSTASH_VECTOR_REST_TOKEN` ← NUEVA

---

## 🎯 Cómo Usar el Portal RAG

### Subir Documentos

1. Ve a [pixan.ai/WA](https://pixan.ai/WA)
2. Click en la pestaña **"Documentos RAG"**
3. Haz click en **"Seleccionar archivo"**
4. Elige un archivo (PDF, DOCX, TXT, MD, CSV)
5. Selecciona una **categoría**:
   - General
   - Productos
   - Políticas
   - Ventas
   - FAQ
6. El sistema automáticamente:
   - Extrae el texto del documento
   - Lo divide en chunks de 1000 caracteres
   - Genera embeddings con Gemini
   - Los guarda en Upstash Vector

### Buscar en Documentos

1. En la misma pestaña, usa el buscador
2. Escribe tu pregunta o búsqueda
3. El sistema encuentra los fragmentos más relevantes
4. Muestra resultados con score de similitud

### Eliminar Documentos

1. En la lista de documentos
2. Click en el ícono de basura (🗑️)
3. Confirma la eliminación
4. Todos los chunks del documento se eliminan automáticamente

---

## 🔄 Integrar RAG en el Bot de WhatsApp

Para que el bot use los documentos automáticamente al responder, necesitas actualizar el webhook.

### Modificar `pages/api/wa/webhook.js`:

```javascript
import { queryDocuments } from '@/lib/wa/rag/vector';

// Dentro de tu función principal, ANTES de llamar al modelo:

async function handleMessage(messageText, userId) {
  // 1. Buscar información relevante en tus documentos
  let ragContext = '';
  try {
    const results = await queryDocuments(messageText, 3); // Top 3 resultados
    
    if (results && results.length > 0) {
      ragContext = '\\n\\n--- INFORMACIÓN DE LA EMPRESA ---\\n';
      results.forEach((doc, i) => {
        ragContext += `${i+1}. ${doc.metadata.text}\\n\\n`;
      });
      ragContext += '--- FIN INFORMACIÓN ---\\n';
    }
  } catch (error) {
    console.error('[RAG] Error querying:', error);
  }

  // 2. Obtener memoria del usuario
  const memoria = await obtenerMemoria(userId);
  
  // 3. Construir system prompt CON RAG
  const systemPrompt = `Eres un asistente de ventas de Pixan.
  
${ragContext}

Usa la información proporcionada arriba para responder.
Si no encuentras información relevante en los documentos, usa tu conocimiento general.

Historial:
${memoria}`;

  // 4. Llamar al modelo
  const response = await callGemini(systemPrompt, messageText);
  
  return response;
}
```

---

## 📊 Costos y Límites

### Upstash Vector - Free Tier:
- ✅ 10,000 vectores GRATIS
- ✅ 10,000 queries/día GRATIS
- 💰 $0.40 por 100K queries adicionales

### Gemini Embeddings:
- ✅ GRATIS (incluido en 1,500 requests/día)
- Cada embedding = 1 request

### Ejemplo Real:
- 50 documentos x 5 chunks promedio = **250 vectores**
- 100 consultas de usuarios/día = **100 queries**
- **Total: $0/mes** (dentro del free tier) ✅

---

## 🐛 Troubleshooting

### Error: "Upstash Vector credentials not configured"
**Solución:** Verifica que las variables `UPSTASH_VECTOR_REST_URL` y `UPSTASH_VECTOR_REST_TOKEN` estén configuradas en Vercel.

### Error: "Failed to generate embedding"
**Solución:** Verifica que `GEMINI_API_KEY` esté configurado correctamente.

### El documento no se procesa
**Causas comunes:**
- Archivo mayor a 10MB
- Formato no soportado
- Documento vacío o corrupto

### No encuentra resultados al buscar
**Soluciones:**
- Asegúrate de haber subido documentos
- Prueba con búsquedas más generales
- Verifica la categoría seleccionada

---

## 📚 Próximos Pasos Recomendados

1. **Subir documentos iniciales:**
   - Catálogo de productos
   - Políticas de la empresa
   - FAQs comunes

2. **Probar búsquedas:**
   - Verificar que encuentra información correcta
   - Ajustar categorías si es necesario

3. **Integrar en WhatsApp:**
   - Modificar webhook como se indica arriba
   - Probar con mensajes reales

4. **Monitorear uso:**
   - Revisar estadísticas en Upstash Console
   - Verificar que no excedas límites gratuitos

---

## 🎉 ¡Listo!

Tu sistema RAG está completamente configurado. Los usuarios de WhatsApp podrán:
- ✅ Hacer preguntas sobre tus productos
- ✅ Consultar políticas
- ✅ Obtener respuestas basadas en TUS documentos
- ✅ Todo de forma automática con embeddings

**¿Dudas?** Revisa los logs en el dashboard `pixan.ai/WA` → Logs Técnicos
