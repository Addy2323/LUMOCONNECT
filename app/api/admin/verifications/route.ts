import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'ALL'

    const vCases = await db.verificationCase.findMany({
      where: {
        ...(statusFilter !== 'ALL' ? { status: statusFilter as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        organization: true,
        documents: {
          include: {
            fileAsset: true,
          },
        },
      },
    })

    const formattedVerifications = vCases.map((vc) => ({
      id: vc.id,
      organizationId: vc.organizationId,
      businessName:
        vc.organization?.legalName ||
        vc.organization?.tradingName ||
        vc.user?.name ||
        'Business',
      tradingName:
        vc.organization?.tradingName || vc.organization?.legalName || '',
      registrationNumber: vc.organization?.registrationNumber || 'Pending',
      tinNumber: vc.organization?.tin || 'Pending',
      contactPerson: vc.user?.name || 'Representative',
      email: vc.user?.email || '—',
      phone: vc.user?.phone || '—',
      category: 'Renewable Energy & Trade',
      industry: 'Renewable Energy & Commercial Trade',
      status: (vc.status === 'IN_REVIEW' ? 'PENDING' : vc.status) as 'PENDING' | 'APPROVED' | 'REJECTED',
      submittedAt: vc.createdAt.toISOString().slice(0, 10),
      documents: vc.documents.map((d) => ({
        id: d.id,
        type: d.documentType as any,
        name: d.fileAsset.fileName,
        fileName: d.fileAsset.fileName,
        fileSize: '1.2 MB',
        fileUrl: '#',
        status: (vc.status === 'IN_REVIEW' ? 'PENDING' : vc.status) as 'PENDING' | 'APPROVED' | 'REJECTED',
        uploadedAt: d.createdAt.toISOString().slice(0, 10),
      })),
    }))

    return NextResponse.json({ verifications: formattedVerifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
