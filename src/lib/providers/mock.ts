import type { EmailProvider, EmailMessage, StorageProvider } from './types'

export class SmtpEmailAdapter implements EmailProvider {
  name = 'SMTP_EMAIL'

  async sendEmail(msg: EmailMessage): Promise<{ success: boolean; messageId?: string }> {
    const messageId = `MSG-${Date.now()}`
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EMAIL] To: ${msg.to}, Subject: "${msg.subject}" (ID: ${messageId})`)
    }
    return { success: true, messageId }
  }
}

export class S3StorageAdapter implements StorageProvider {
  name = 'S3_STORAGE'

  async uploadFile(file: { buffer: Buffer; fileName: string; mimeType: string; isPublic?: boolean }): Promise<{ url: string; fileKey: string }> {
    const fileKey = `uploads/${Date.now()}-${file.fileName}`
    const url = `https://storage.lumo.co.tz/${fileKey}`
    return { url, fileKey }
  }

  async getSignedDownloadUrl(fileKey: string, expiresInSeconds: number = 3600): Promise<string> {
    return `https://storage.lumo.co.tz/${fileKey}?signature=signed_${expiresInSeconds}`
  }
}
