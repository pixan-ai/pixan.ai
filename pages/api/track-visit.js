import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page, referrer, userAgent, timestamp } = req.body;

    // Get visitor's IP (works with Vercel)
    const ip = req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               'Unknown';

    // Format timestamp
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Send email notification
    const data = await resend.emails.send({
      from: 'Pixan.ai Notifications <notifications@pixan.ai>',
      to: ['aaaprosperi@gmail.com'],
      subject: `🔔 Nueva visita en pixan.ai: ${page}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #1d1d1d;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #2C5F7C 0%, #1a4459 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 20px;
              }
              .title {
                font-size: 24px;
                font-weight: 800;
                margin-bottom: 10px;
              }
              .subtitle {
                font-size: 18px;
                opacity: 0.9;
              }
              .info-box {
                background: white;
                color: #1d1d1d;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #16A085;
                margin-bottom: 15px;
              }
              .info-label {
                font-weight: 700;
                color: #2C5F7C;
                margin-bottom: 5px;
              }
              .info-value {
                color: #4A5568;
                word-break: break-all;
              }
              .footer {
                text-align: center;
                padding: 20px;
                color: #718096;
                font-size: 14px;
              }
              .highlight {
                background: #E8F4F8;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">🔔 Nueva Visita Detectada</div>
              <div class="subtitle">Alguien acaba de visitar tu sitio web</div>
            </div>

            <div class="info-box">
              <div class="info-label">📄 Página Visitada:</div>
              <div class="info-value"><span class="highlight">${page}</span></div>
            </div>

            <div class="info-box">
              <div class="info-label">🕐 Fecha y Hora:</div>
              <div class="info-value">${formattedDate}</div>
            </div>

            <div class="info-box">
              <div class="info-label">🌐 Dirección IP:</div>
              <div class="info-value">${ip}</div>
            </div>

            ${referrer ? `
            <div class="info-box">
              <div class="info-label">🔗 Procedencia:</div>
              <div class="info-value">${referrer}</div>
            </div>
            ` : ''}

            <div class="info-box">
              <div class="info-label">💻 Navegador/Dispositivo:</div>
              <div class="info-value">${userAgent || 'No disponible'}</div>
            </div>

            <div class="footer">
              <p><strong>pixan.ai</strong> - Sistema de Notificaciones</p>
              <p style="margin-top: 10px; font-size: 12px;">
                Esta notificación se envió automáticamente desde tu aplicación Next.js
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return res.status(200).json({
      success: true,
      messageId: data.id,
      page,
      timestamp: formattedDate
    });

  } catch (error) {
    console.error('Error sending email notification:', error);

    // Don't block the user experience if email fails
    return res.status(200).json({
      success: false,
      error: error.message,
      // Still return success to not affect user experience
      silentFail: true
    });
  }
}
