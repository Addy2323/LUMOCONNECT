/**
 * LUMO Enterprise Financial Exporter
 * Generates styled, colored PDF and Excel documents for financial reports and records.
 */

export interface ReportColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'currency' | 'number' | 'date' | 'badge'
  width?: number
}

export interface ReportData {
  title: string
  subtitle?: string
  organization?: string
  period?: string
  generatedAt?: string
  currency?: string
  summaryKpis?: { label: string; value: string; color?: string }[]
  columns: ReportColumn[]
  rows: Record<string, any>[]
  totals?: Record<string, any>
  notes?: string[]
}

/**
 * Generates and triggers download of a styled, colored Microsoft Excel compatible XML Spreadsheet.
 * Supports custom background colors, borders, font weights, and column widths.
 */
export function exportFinancialReportToExcel(data: ReportData, filename?: string): void {
  const safeFilename = (filename || data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')) + '.xls'
  const generatedDate = data.generatedAt || new Date().toLocaleDateString('en-GB')

  // Build XML Spreadsheet 2003
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${data.title}</Title>
  <Author>LUMO Platform Administration</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#1E293B"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <!-- Brand Header Style -->
  <Style ss:ID="ReportTitle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="ReportSubtitle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="10" ss:Color="#94A3B8"/>
   <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <!-- KPI Header -->
  <Style ss:ID="KpiCard">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FF6A00"/>
   <Interior ss:Color="#FFF7ED" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#FED7AA"/>
   </Borders>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <!-- Table Header -->
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#FF6A00" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#C2410C"/>
   </Borders>
  </Style>
  <!-- Zebra Rows -->
  <Style ss:ID="RowEven">
   <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="RowOdd">
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <!-- Alignments & Formats -->
  <Style ss:ID="TextLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="TextCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CurrencyCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="TotalsRow">
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Size="11" ss:Color="#0F172A"/>
   <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#F59E0B"/>
    <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#F59E0B"/>
   </Borders>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Financial Report">
  <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="20">`

  // Define column widths
  data.columns.forEach((col) => {
    const width = col.width || (col.type === 'currency' ? 140 : 120)
    xml += `\n   <Column ss:Width="${width}"/>`
  })

  // Header Title Row
  xml += `
   <Row ss:Height="30">
    <Cell ss:MergeAcross="${data.columns.length - 1}" ss:StyleID="ReportTitle">
     <Data ss:Type="String">  LUMO DEALS - ${data.title.toUpperCase()}</Data>
    </Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="${data.columns.length - 1}" ss:StyleID="ReportSubtitle">
     <Data ss:Type="String">  Reporting Period: ${data.period || 'Fiscal Period 2026'} | Generated: ${generatedDate} | Authoritative Financial Document</Data>
    </Cell>
   </Row>
   <Row ss:Height="8"><Cell/></Row>`

  // KPI Summary Row (if provided)
  if (data.summaryKpis && data.summaryKpis.length > 0) {
    xml += `\n   <Row ss:Height="24">`
    data.summaryKpis.forEach((kpi) => {
      xml += `\n    <Cell ss:StyleID="KpiCard"><Data ss:Type="String">${kpi.label}: ${kpi.value}</Data></Cell>`
    })
    xml += `\n   </Row>\n   <Row ss:Height="8"><Cell/></Row>`
  }

  // Column Headers Row
  xml += `\n   <Row ss:Height="26">`
  data.columns.forEach((col) => {
    xml += `\n    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${col.label}</Data></Cell>`
  })
  xml += `\n   </Row>`

  // Data Rows
  data.rows.forEach((row, idx) => {
    const rowStyle = idx % 2 === 0 ? 'RowEven' : 'RowOdd'
    xml += `\n   <Row ss:Height="22" ss:StyleID="${rowStyle}">`
    data.columns.forEach((col) => {
      const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : ''
      const isNum = col.type === 'currency' || col.type === 'number'
      const cellStyle = col.type === 'currency' ? 'CurrencyCell' : col.align === 'center' ? 'TextCenter' : 'TextLeft'
      xml += `\n    <Cell ss:StyleID="${cellStyle}"><Data ss:Type="String">${escapeXml(val)}</Data></Cell>`
    })
    xml += `\n   </Row>`
  })

  // Totals Row (if provided)
  if (data.totals) {
    xml += `\n   <Row ss:Height="26" ss:StyleID="TotalsRow">`
    data.columns.forEach((col, idx) => {
      if (idx === 0) {
        xml += `\n    <Cell ss:StyleID="TotalsRow"><Data ss:Type="String">TOTAL SUMMARY</Data></Cell>`
      } else {
        const totalVal = data.totals![col.key] !== undefined ? String(data.totals![col.key]) : ''
        xml += `\n    <Cell ss:StyleID="TotalsRow"><Data ss:Type="String">${escapeXml(totalVal)}</Data></Cell>`
      }
    })
    xml += `\n   </Row>`
  }

  // Notes / Footer
  if (data.notes && data.notes.length > 0) {
    xml += `\n   <Row ss:Height="10"><Cell/></Row>`
    data.notes.forEach((note) => {
      xml += `\n   <Row><Cell ss:MergeAcross="${data.columns.length - 1}"><Data ss:Type="String">Notice: ${escapeXml(note)}</Data></Cell></Row>`
    })
  }

  xml += `
  </Table>
 </Worksheet>
</Workbook>`

  // Download Trigger
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generates an executive colored printable HTML document and opens print dialog for high-res PDF export.
 */
export function exportFinancialReportToPdf(data: ReportData): void {
  const generatedDate = data.generatedAt || new Date().toLocaleDateString('en-GB')

  const printWindow = window.open('', '_blank', 'width=1100,height=850')
  if (!printWindow) {
    alert('Please allow popups to generate and view the PDF report.')
    return
  }

  const kpisHtml = data.summaryKpis && data.summaryKpis.length > 0
    ? `
      <div class="kpi-grid">
        ${data.summaryKpis.map((kpi) => `
          <div class="kpi-box">
            <div class="kpi-label">${escapeHtml(kpi.label)}</div>
            <div class="kpi-val" style="color: ${kpi.color || '#FF6A00'};">${escapeHtml(kpi.value)}</div>
          </div>
        `).join('')}
      </div>
    `
    : ''

  const tableHeaders = data.columns.map((c) => `
    <th style="text-align: ${c.align || (c.type === 'currency' ? 'right' : 'left')}; width: ${c.width ? c.width + 'px' : 'auto'};">
      ${escapeHtml(c.label)}
    </th>
  `).join('')

  const tableRows = data.rows.map((row, idx) => `
    <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
      ${data.columns.map((c) => {
        const val = row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '-'
        return `
          <td style="text-align: ${c.align || (c.type === 'currency' ? 'right' : 'left')}; font-family: ${c.type === 'currency' ? 'monospace' : 'inherit'}; font-weight: ${c.type === 'currency' ? 'bold' : 'normal'};">
            ${c.type === 'badge' ? `<span class="badge">${escapeHtml(val)}</span>` : escapeHtml(val)}
          </td>
        `
      }).join('')}
    </tr>
  `).join('')

  const totalsRow = data.totals
    ? `
      <tr class="totals-row">
        ${data.columns.map((c, idx) => {
          if (idx === 0) return `<td><strong>TOTAL SUMMARY</strong></td>`
          const val = data.totals![c.key] !== undefined ? String(data.totals![c.key]) : ''
          return `<td style="text-align: ${c.align || 'right'}; font-family: monospace; font-weight: bold;">${escapeHtml(val)}</td>`
        }).join('')}
      </tr>
    `
    : ''

  const notesHtml = data.notes && data.notes.length > 0
    ? `
      <div class="notes-box">
        <strong>Statutory Compliance & Notes:</strong>
        <ul>
          ${data.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}
        </ul>
      </div>
    `
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(data.title)} - LUMO Financial Report</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #fff;
      color: #0F172A;
      margin: 0;
      padding: 24px;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #FF6A00;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #FF6A00, #EA580C);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 900;
      box-shadow: 0 4px 12px rgba(255, 106, 0, 0.2);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748B;
      margin: 2px 0 0 0;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-ref {
      font-family: monospace;
      font-weight: bold;
      font-size: 13px;
      color: #FF6A00;
    }
    .doc-date {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }
    .report-banner {
      background: #0F172A;
      color: white;
      padding: 14px 20px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .report-title-text {
      font-size: 17px;
      font-weight: 800;
      margin: 0;
    }
    .report-period-text {
      font-size: 11px;
      color: #CBD5E1;
      margin-top: 2px;
    }
    .stamp-badge {
      background: #10B981;
      color: white;
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-box {
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 900;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #FF6A00;
      color: white;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      padding: 8px 12px;
      border: 1px solid #EA580C;
    }
    td {
      padding: 7px 12px;
      border: 1px solid #E2E8F0;
      font-size: 11px;
    }
    tr.even td {
      background: #F8FAFC;
    }
    tr.odd td {
      background: #FFFFFF;
    }
    tr.totals-row td {
      background: #FEF3C7;
      color: #92400E;
      border-top: 2px solid #F59E0B;
      border-bottom: 3px double #F59E0B;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 9px;
      font-weight: 800;
      background: #E0E7FF;
      color: #3730A3;
    }
    .notes-box {
      background: #F1F5F9;
      border-left: 4px solid #3B82F6;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 11px;
      color: #334155;
      margin-top: 16px;
    }
    .notes-box ul {
      margin: 4px 0 0 16px;
      padding: 0;
    }
    .footer-sign {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #E2E8F0;
      font-size: 10px;
      color: #64748B;
    }
    .sign-col {
      width: 200px;
      text-align: center;
    }
    .sign-line {
      border-bottom: 1px solid #94A3B8;
      height: 36px;
      margin-bottom: 4px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-group">
      <div class="logo-box">L</div>
      <div>
        <h1 class="brand-title">LUMO DEALS PLATFORM</h1>
        <p class="brand-sub">Commercial Marketplace & Multi-Party Financial Settlement Desk</p>
      </div>
    </div>
    <div class="doc-meta">
      <div class="doc-ref">DOC-REF: ${Math.floor(100000 + Math.random() * 900000)}</div>
      <div class="doc-date">Generated: ${escapeHtml(generatedDate)}</div>
      <div class="doc-date">TRA Compliance: Standard Enforced</div>
    </div>
  </div>

  <div class="report-banner">
    <div>
      <div class="report-title-text">${escapeHtml(data.title)}</div>
      <div class="report-period-text">Reporting Period: ${escapeHtml(data.period || 'Fiscal Period 2026')} | Currency: ${escapeHtml(data.currency || 'TZS (Tanzanian Shilling)')}</div>
    </div>
    <div class="stamp-badge">Official Audit Record</div>
  </div>

  ${kpisHtml}

  <table>
    <thead>
      <tr>${tableHeaders}</tr>
    </thead>
    <tbody>
      ${tableRows}
      ${totalsRow}
    </tbody>
  </table>

  ${notesHtml}

  <div class="footer-sign">
    <div class="sign-col">
      <div class="sign-line"></div>
      <div>Prepared By: Finance Officer</div>
    </div>
    <div class="sign-col">
      <div class="sign-line"></div>
      <div>Audited By: Compliance Desk</div>
    </div>
    <div class="sign-col">
      <div class="sign-line"></div>
      <div>Authorized: Managing Director</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>`

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
