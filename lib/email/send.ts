// lib/email/send.ts
import { getEmailTransporter } from './smtp'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await getEmailTransporter()
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@nexgenu.org'

    if (!transporter) {
      console.log(`[Email Simulation - SMTP Credentials Missing]
To: ${to}
Subject: ${subject}
From: ${fromAddress}
----------------------------------------`)
      return { success: true }
    }

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    })

    console.log(`[SMTP Sent Successfully] To: ${to} | Subject: "${subject}"`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    console.error('[SMTP Send Error]:', message)
    return { success: false, error: message }
  }
}
