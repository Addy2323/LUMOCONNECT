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

const notificationsStore: InAppNotification[] = [
  {
    id: 'notif_1',
    userId: 'partner_alex',
    title: 'Commission Approved',
    message: 'MobiPay referral #MP-2048 was verified. +TZS 25,000 added to payable balance.',
    linkUrl: '/partner',
    isRead: false,
    createdAt: new Date('2026-08-24T09:42:00Z'),
  },
  {
    id: 'notif_2',
    userId: 'partner_alex',
    title: 'Deal Deliverable Approved',
    message: 'SafariBox Serengeti accepted your photo asset deliverable #del_1.',
    linkUrl: '/dealroom/dr_safaribox_alex',
    isRead: false,
    createdAt: new Date('2026-08-23T15:00:00Z'),
  },
]

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
