import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendWelcomeEmailParams {
  email: string
  nome_completo: string
  senha_temporaria: string
  siteUrl?: string
}

export async function sendWelcomeEmail({
  email,
  nome_completo,
  senha_temporaria,
  siteUrl = 'http://localhost:3000',
}: SendWelcomeEmailParams) {
  try {
    const nomePartes = nome_completo.split(' ')
    const primeiroNome = nomePartes[0]

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .credentials {
      background-color: #f3f4f6;
      border-left: 4px solid #2563eb;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .credentials-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 8px;
      display: block;
    }
    .credentials-value {
      font-size: 14px;
      color: #1f2937;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .credentials-item {
      margin-bottom: 15px;
    }
    .credentials-item:last-child {
      margin-bottom: 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      font-size: 16px;
      margin-top: 20px;
      transition: background-color 0.3s;
    }
    .cta-button:hover {
      background-color: #1e40af;
    }
    .warning {
      background-color: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 15px;
      margin-top: 25px;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .divider {
      border-top: 1px solid #e5e7eb;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bem-vindo ao Sistema de Gestão Contábil! 🎉</h1>
    </div>

    <div class="content">
      <p class="greeting">Olá ${primeiroNome},</p>

      <p>Sua conta foi criada com sucesso no <strong>Sistema de Gestão Contábil</strong>. Estamos felizes em tê-lo(a) conosco!</p>

      <p>Para acessar o sistema, use as credenciais abaixo:</p>

      <div class="credentials">
        <div class="credentials-item">
          <span class="credentials-label">Email</span>
          <span class="credentials-value">${email}</span>
        </div>
        <div class="credentials-item">
          <span class="credentials-label">Senha Temporária</span>
          <span class="credentials-value">${senha_temporaria}</span>
        </div>
      </div>

      <p style="text-align: center;">
        <a href="${siteUrl}/auth" class="cta-button">Acessar o Sistema</a>
      </p>

      <div class="warning">
        <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Por segurança, altere sua senha na primeira vez que acessar o sistema. Nunca compartilhe suas credenciais com terceiros.
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6b7280;">
        Se tiver dúvidas ou precisar de suporte, entre em contato com o administrador do sistema.
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Sistema de Gestão Contábil. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
    `

    const { data, error } = await resend.emails.send({
      from: 'Sistema Contábil <onboarding@resend.dev>',
      to: email,
      subject: `Bem-vindo ao Sistema de Gestão Contábil, ${primeiroNome}! 👋`,
      html: htmlContent,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return { success: false, error: error.message }
    }

    console.log('Email enviado com sucesso:', data)
    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error('Erro geral ao enviar email:', error)
    return { success: false, error: error.message }
  }
}
