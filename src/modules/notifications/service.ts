import { providers } from '@/lib/providers'

export interface InAppNotification {
  id: string
  userId: string
  title: string
  message: string
  linkUrl?: string
  isRead: boolean
  createdAt: Date
}

const notificationsStore: InAppNotification[] = []

export function getNotificationsForUser(userId: string): InAppNotification[] {
  return notificationsStore.filter((n) => n.userId === userId)
}

export async function sendNotification({
  userId,
  title,
  message,
  phone,
  email,
  linkUrl,
}: {
  userId: string
  title: string
  message: string
  phone?: string
  email?: string
  linkUrl?: string
}): Promise<InAppNotification> {
  const notif: InAppNotification = {
    id: `notif_${Date.now()}`,
    userId,
    title,
    message,
    linkUrl,
    isRead: false,
    createdAt: new Date(),
  }

  notificationsStore.unshift(notif)

  if (phone) {
    await providers.sms.sendSms({ recipientPhone: phone, messageText: `[LUMO] ${title}: ${message}` })
  }
  if (email) {
    await providers.email.sendEmail({ to: email, subject: `[LUMO] ${title}`, htmlBody: `<p>${message}</p>` })
  }

  return notif
}
