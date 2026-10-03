// lib/email/send.ts
import { getEmailTransporter } from './smtp'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = await getEmailTransporter()
    
    // Clean and normalize SMTP_USER / SMTP_FROM
    const rawUser = (process.env.SMTP_USER || '').trim().replace(/^["']|["']$/g, '')
    const rawFrom = (process.env.SMTP_FROM || '').trim().replace(/^["']|["']$/g, '')
    const senderEmail = rawUser || rawFrom || 'info.nexgenu01@gmail.com'
    
    // Always format with friendly sender name: "NexGenU Workforce" <info.nexgenu01@gmail.com>
    const fromAddress = `"NexGenU Workforce" <${senderEmail}>`

    const plainText = text || stripHtmlToText(html)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      'https://nexgenu-os.vercel.app'
    const settingsUrl = `${appUrl}/settings/notifications`

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
      replyTo: senderEmail,
      subject,
      text: plainText,
      html,
      headers: {
        'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        'X-Auto-Response-Suppress': 'All',
        'Auto-Submitted': 'auto-generated',
        'List-Unsubscribe': `<${settingsUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
      },
    })

    console.log(`[SMTP Sent Successfully] To: ${to} | Subject: "${subject}"`)
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email'
    console.error('[SMTP Send Error]:', message)
    return { success: false, error: message }
  }
}
