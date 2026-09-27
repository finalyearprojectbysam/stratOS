'use client'

// Professional multi-page PDF export for STRATOS reports (real vector PDF via jsPDF).
import { jsPDF } from 'jspdf'

const BLUE = [59, 130, 246]
const VIOLET = [139, 92, 246]
const DARK = [15, 23, 42]
const MUTED = [100, 116, 139]
const LIGHT = [226, 232, 240]

export function generateReportPDF(report, content) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const M = 48
  let y = 0

  const ensure = (need = 60) => { if (y + need > H - 56) { footer(); doc.addPage(); y = M } }
  const footer = () => {
    const page = doc.internal.getNumberOfPages()
    doc.setFontSize(8); doc.setTextColor(...MUTED)
    doc.text('STRATOS — AI Marketing Intelligence', M, H - 30)
    doc.text(`Page ${page}`, W - M, H - 30, { align: 'right' })
  }

  // ---- Cover header band ----
  doc.setFillColor(...DARK); doc.rect(0, 0, W, 132, 'F')
  doc.setFillColor(...BLUE); doc.rect(0, 130, W, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(26)
  doc.text('STRATOS', M, 58)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...LIGHT)
  doc.text('AI Marketing Intelligence Platform', M, 76)
  doc.setFontSize(9); doc.setTextColor(180, 190, 210)
  doc.text((report?.report_type || 'final').toUpperCase() + ' REPORT', W - M, 40, { align: 'right' })
  doc.setFontSize(8)
  doc.text('Generated ' + new Date(report?.created_at || Date.now()).toLocaleDateString(), W - M, 56, { align: 'right' })
  y = 168

  doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
  doc.text(report?.title || 'Final AI Strategy Report', M, y); y += 22
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...MUTED)
  doc.text('Client: ' + (report?.client_name || 'Client'), M, y); y += 26

  // ---- score row ----
  const cards = [['Digital Health', (content.score || 72) + '/100'], ['Market Opportunity', content.opportunity || 'High'], ['Priority Actions', String((content.actions || []).length || 8)]]
  const cw = (W - M * 2 - 24) / 3
  cards.forEach((c, i) => {
    const x = M + i * (cw + 12)
    doc.setFillColor(245, 247, 250); doc.roundedRect(x, y, cw, 56, 6, 6, 'F')
    doc.setTextColor(...(i === 1 ? VIOLET : BLUE)); doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
    doc.text(String(c[1]), x + 12, y + 30)
    doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(c[0], x + 12, y + 46)
  })
  y += 80

  const section = (title) => {
    ensure(60)
    doc.setFillColor(...BLUE); doc.rect(M, y - 10, 4, 16, 'F')
    doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
    doc.text(title, M + 12, y + 3); y += 20
  }
  const para = (text) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 70, 90)
    const lines = doc.splitTextToSize(text, W - M * 2)
    lines.forEach((ln) => { ensure(16); doc.text(ln, M, y); y += 14 })
    y += 8
  }
  const bullets = (items = []) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(60, 70, 90)
    items.forEach((it) => {
      const lines = doc.splitTextToSize(it, W - M * 2 - 16)
      ensure(16)
      doc.setTextColor(...BLUE); doc.text('\u2022', M, y)
      doc.setTextColor(60, 70, 90)
      lines.forEach((ln, idx) => { if (idx) ensure(14); doc.text(ln, M + 14, y); y += 14 })
    })
    y += 8
  }

  section('Executive Summary'); para(content.summary || '')
  section('Business Intelligence'); bullets([...(content.strengths || []).map((s) => 'Strength: ' + s), ...(content.weaknesses || []).map((s) => 'Weakness: ' + s)])
  section('Competitor Analysis'); bullets((content.competitors || []).map((c) => `${c.name} — strength: ${c.strength}; gap: ${c.gap}`))
  section('SEO Audit'); bullets((content.seo || []).map((s) => `${s.label}: ${s.value}%`))
  section('Analytics'); bullets(content.analytics || [])
  section('Marketing Strategy'); bullets(content.marketing || [])
  section('Ads Strategy'); bullets(content.ads || [])
  section('Campaign Plan'); bullets((content.campaign || []).map((c) => `${c.week}: ${c.focus}`))
  section('Opportunities'); bullets(content.opportunities || [])
  section('Risks'); bullets((content.risks || []).map((r) => `${r.risk} (impact: ${r.impact}) — ${r.mitigation}`))
  section('Project / Execution Plan'); bullets(content.execution || [])
  section('Next Actions'); bullets(content.actions || [])

  footer()
  const safe = (report?.client_name || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`stratos-${safe}-report.pdf`)
}

// Knowledge Base document → PDF fallback export. Produces a clean, branded
// single/multi-page PDF from a document's metadata + text content so employees
// always have something downloadable even when the original file isn't stored.
export function generateDocumentPDF(docItem, textContent = '') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight(); const M = 48
  let y = 0
  const footer = () => { const p = doc.internal.getNumberOfPages(); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text('STRATOS — Knowledge Base', M, H - 28); doc.text(`Page ${p}`, W - M, H - 28, { align: 'right' }) }
  // header band
  doc.setFillColor(...DARK); doc.rect(0, 0, W, 118, 'F'); doc.setFillColor(...VIOLET); doc.rect(0, 116, W, 3, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text('STRATOS', M, 46)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...LIGHT); doc.text('Knowledge Base Document', M, 66)
  doc.setFontSize(8); doc.setTextColor(180, 190, 210); doc.text('Generated ' + new Date().toLocaleString(), W - M, 46, { align: 'right' })
  if (docItem?.category) doc.text(String(docItem.category), W - M, 62, { align: 'right' })
  y = 150
  // title
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(18)
  doc.splitTextToSize(String(docItem?.title || 'Document'), W - M * 2).forEach((l) => { doc.text(l, M, y); y += 22 })
  y += 4
  if (docItem?.description) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...MUTED)
    doc.splitTextToSize(String(docItem.description), W - M * 2).forEach((l) => { doc.text(l, M, y); y += 16 })
  }
  y += 8; doc.setDrawColor(220, 225, 232); doc.line(M, y, W - M, y); y += 22
  const body = String(textContent || docItem?.description || 'No preview content available for this document.').trim()
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(40, 48, 66)
  doc.splitTextToSize(body, W - M * 2).forEach((l) => {
    if (y > H - 60) { footer(); doc.addPage(); y = M }
    doc.text(l, M, y); y += 15
  })
  footer()
  const safe = String(docItem?.title || 'document').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  doc.save(`stratos-${safe}.pdf`)
}

// Activity Log PDF export (respects the currently selected filters).
export function generateActivityPDF(rows, meta = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight(); const M = 40
  let y = 0
  const footer = () => { const p = doc.internal.getNumberOfPages(); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text('STRATOS — Activity Log', M, H - 24); doc.text(`Page ${p}`, W - M, H - 24, { align: 'right' }) }
  doc.setFillColor(...DARK); doc.rect(0, 0, W, 104, 'F'); doc.setFillColor(...BLUE); doc.rect(0, 102, W, 3, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text('STRATOS', M, 44)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...LIGHT); doc.text('Activity Log', M, 62)
  doc.setFontSize(8); doc.setTextColor(180, 190, 210)
  if (meta.agency) doc.text(meta.agency, W - M, 34, { align: 'right' })
  doc.text('Generated ' + new Date().toLocaleString(), W - M, 50, { align: 'right' })
  y = 128
  doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(13)
  doc.text(meta.title || 'Activity Log', M, y); y += 16
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
  const sub = [meta.staff, meta.dateLabel, meta.timeLabel].filter(Boolean).join('  ·  ')
  if (sub) { doc.text(sub, M, y); y += 18 } else { y += 4 }
  // table header
  const cols = [M, M + 120, M + 200, M + 330, W - M - 90]
  doc.setFillColor(240, 243, 247); doc.rect(M, y - 10, W - M * 2, 20, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK)
  doc.text('User', cols[0] + 4, y + 3); doc.text('Role', cols[1] + 4, y + 3); doc.text('Action', cols[2] + 4, y + 3); doc.text('Resource', cols[3] + 4, y + 3); doc.text('Time', cols[4] + 4, y + 3)
  y += 22
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  rows.forEach((r) => {
    if (y > H - 50) { footer(); doc.addPage(); y = M }
    doc.setTextColor(30, 41, 59); doc.text(String(r.user_name || '').slice(0, 20), cols[0] + 4, y)
    doc.setTextColor(...MUTED); doc.text(String(r.role || ''), cols[1] + 4, y)
    doc.setTextColor(30, 41, 59); doc.text(String(r.action || '').slice(0, 22), cols[2] + 4, y)
    doc.setTextColor(...MUTED); doc.text(String(r.resource || '').slice(0, 24), cols[3] + 4, y)
    doc.setTextColor(120, 130, 150); doc.setFontSize(7); doc.text(new Date(r.created_at).toLocaleString(), cols[4] + 4, y); doc.setFontSize(8)
    y += 16; doc.setDrawColor(235, 238, 242); doc.line(M, y - 10, W - M, y - 10)
  })
  footer()
  doc.save('stratos-activity-log.pdf')
}
