// lib/email/smtp.ts
// Google SMTP Transporter singleton

interface TransporterOptions {
  host: string
  port: number
  secure: boolean
  auth?: {
    user: string
    pass: string
  }
}

let nodemailerModule: typeof import('nodemailer') | null = null

async function loadNodemailer() {
  if (!nodemailerModule) {
    try {
      nodemailerModule = await import('nodemailer')
    } catch {
      console.warn('[SMTP] nodemailer package not yet installed or failed to import.')
      return null
    }
  }
  return nodemailerModule
}

export async function getEmailTransporter() {
  const nodemailer = await loadNodemailer()
  if (!nodemailer) return null

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    return null
  }

  const options: TransporterOptions = {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  }

  return nodemailer.createTransport(options as unknown as Parameters<typeof nodemailer.createTransport>[0])
}
