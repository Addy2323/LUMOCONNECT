import { NextRequest, NextResponse } from 'next/server'
import { checkAdminSession } from '@/lib/admin-session'
import { internationalService } from '@/modules/international/service'

export async function GET(request: NextRequest) {
  const denied = await checkAdminSession(request)
  if (denied) return denied

  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv' // 'csv' or 'pdf'
    const id = searchParams.get('id') // Single submission ID if exporting dossier

    const submissions = await internationalService.listSubmissions()

    if (id) {
      const sub = await internationalService.getSubmissionById(id)
      if (!sub) {
        return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
      }

      if (format === 'html' || format === 'pdf') {
        const communications = await internationalService.getCommunications(sub.id)
        
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LUMO International Dossier - ${sub.reference}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px; }
    .brand { font-size: 24px; font-weight: 900; color: #ea580c; text-transform: uppercase; letter-spacing: 1px; }
    .ref-badge { background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5; padding: 4px 12px; border-radius: 6px; font-weight: bold; font-family: monospace; font-size: 14px; }
    .title { font-size: 20px; font-weight: 800; margin-bottom: 5px; color: #0f172a; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 25px; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 15px; border-radius: 8px; }
    .box-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .box-val { font-size: 14px; font-weight: 700; color: #0f172a; }
    .desc-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
    .timeline { margin-top: 15px; }
    .timeline-item { background: #fff; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; font-size: 12px; }
    .timeline-header { font-weight: 700; color: #334155; display: flex; justify-content: space-between; margin-bottom: 4px; }
    .footer { margin-top: 40px; padding-top: 15px; border-t: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: right;">
    <button onclick="window.print()" style="background: #ea580c; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">LUMO International Desk</div>
      <div style="font-size: 12px; color: #64748b;">Official Opportunity Verification Dossier</div>
    </div>
    <div class="ref-badge">${sub.reference}</div>
  </div>

  <div class="title">${sub.title}</div>
  <div class="meta">Category: ${sub.category.replace(/_/g, ' ')} &bull; Submitted: ${new Date(sub.createdAt).toLocaleString()} &bull; Status: <strong>${sub.status.replace(/_/g, ' ')}</strong></div>

  <div class="section-title">Submitter Profile & Contact</div>
  <div class="grid">
    <div class="box">
      <div class="box-label">Full Name & Entity</div>
      <div class="box-val">${sub.fullName} (${sub.organization || sub.submitterType})</div>
    </div>
    <div class="box">
      <div class="box-label">Location / Origin</div>
      <div class="box-val">${sub.countryName} ${sub.city ? `(${sub.city})` : ''}</div>
    </div>
    <div class="box">
      <div class="box-label">WhatsApp Contact</div>
      <div class="box-val">${sub.whatsapp}</div>
    </div>
    <div class="box">
      <div class="box-label">Email Address</div>
      <div class="box-val">${sub.email}</div>
    </div>
  </div>

  <div class="section-title">Commercial & Financial Metrics</div>
  <div class="grid">
    <div class="box">
      <div class="box-label">Declared Commercial Value</div>
      <div class="box-val" style="color: #ea580c;">${sub.currency} ${sub.declaredValue.toLocaleString()}</div>
    </div>
    <div class="box">
      <div class="box-label">Intent Type</div>
      <div class="box-val">${sub.intent}</div>
    </div>
  </div>

  <div class="section-title">Full Opportunity Description</div>
  <div class="desc-box">${sub.description}</div>

  ${sub.whatNeededFromLumo ? `
    <div class="section-title">What is Needed From LUMO Intermediary Desk</div>
    <div class="desc-box">${sub.whatNeededFromLumo}</div>
  ` : ''}

  ${sub.documents && sub.documents.length > 0 ? `
    <div class="section-title">Attached Files & Documents (${sub.documents.length})</div>
    <ul>
      ${sub.documents.map((doc) => `<li><a href="${doc}" target="_blank">${doc}</a></li>`).join('')}
    </ul>
  ` : ''}

  <div class="section-title">Verification & Audit Log (${communications.length})</div>
  <div class="timeline">
    ${communications.map((c) => `
      <div class="timeline-item">
        <div class="timeline-header">
          <span>${c.subject} &bull; ${c.actorName}</span>
          <span>${new Date(c.createdAt).toLocaleString()}</span>
        </div>
        <div>${c.messageBody}</div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    Generated by LUMO International Operations Portal &bull; ${new Date().toISOString()} &bull; Strictly Confidential
  </div>
</body>
</html>
        `

        return new NextResponse(htmlContent, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        })
      }
    }

    // Default: Return CSV of all international submissions
    const headers = [
      'Reference',
      'Submitted At',
      'Status',
      'Submitter Name',
      'Organization',
      'Submitter Type',
      'Country',
      'City',
      'Category',
      'Intent',
      'Title',
      'Declared Value',
      'Currency',
      'Email',
      'WhatsApp',
      'Preferred Contact',
      'Website',
      'Description',
    ]

    const csvRows = [
      headers.join(','),
      ...submissions.map((s) =>
        [
          `"${s.reference}"`,
          `"${new Date(s.createdAt).toISOString()}"`,
          `"${s.status}"`,
          `"${s.fullName.replace(/"/g, '""')}"`,
          `"${(s.organization || '').replace(/"/g, '""')}"`,
          `"${s.submitterType}"`,
          `"${s.countryName}"`,
          `"${s.city || ''}"`,
          `"${s.category}"`,
          `"${s.intent}"`,
          `"${s.title.replace(/"/g, '""')}"`,
          s.declaredValue,
          `"${s.currency}"`,
          `"${s.email}"`,
          `"${s.whatsapp}"`,
          `"${s.preferredContact}"`,
          `"${s.website || ''}"`,
          `"${s.description.replace(/\n/g, ' ').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ]

    const csvString = csvRows.join('\n')

    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="LUMO_International_Submissions_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error: any) {
    console.error('Export international submissions error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export international submissions' },
      { status: 500 }
    )
  }
}
