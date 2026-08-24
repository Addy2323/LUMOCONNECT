export interface DisputeItem {
  id: string
  disputeNumber: string
  organizationId: string
  dealTitle: string
  partnerName: string
  title: string
  reason: string
  amountTZS: string
  status: 'OPENED' | 'UNDER_REVIEW' | 'RESOLVED_PARTNER_FAVOR' | 'RESOLVED_BUSINESS_FAVOR' | 'CLOSED'
  createdAt: Date
  messages: {
    sender: string
    text: string
    timestamp: Date
  }[]
}

const disputesStore: DisputeItem[] = [
  {
    id: 'disp_01',
    disputeNumber: 'LUMO-DISP-2026-08',
    organizationId: 'org_kijani',
    dealTitle: 'Kijani Solar Household Installations',
    partnerName: 'Alex Mushi',
    title: 'Customer installation completed but marked unverified',
    reason: 'Customer in Morogoro paid initial deposit and technician job card was signed on Aug 18th.',
    amountTZS: 'TZS 45,000',
    status: 'UNDER_REVIEW',
    createdAt: new Date('2026-08-21T10:00:00Z'),
    messages: [
      {
        sender: 'Alex Mushi (Partner)',
        text: 'Attached signed technician installation sheet #MOR-881.',
        timestamp: new Date('2026-08-21T10:05:00Z'),
      },
      {
        sender: 'LUMO Support Specialist',
        text: 'We are cross-referencing this with Kijani Solar field dispatch supervisor.',
        timestamp: new Date('2026-08-22T09:15:00Z'),
      },
    ],
  },
]

export function listDisputes(): DisputeItem[] {
  return disputesStore
}
