/**
 * Client-side CSV and printable receipt helpers (no backend required).
 */

export function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Each inner array is one CSV row (first row may be column headers). */
export function downloadCsv(filename: string, rows: unknown[][]): void {
  const lines = rows.map((row) => row.map(escapeCsvCell).join(','))
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function openPrintableHtml(title: string, bodyHtml: string): void {
  const w = window.open('', '_blank', 'width=720,height=900')
  if (!w) return
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>
  <style>body{font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto;color:#111}
  h1{font-size:1.25rem} table{width:100%;border-collapse:collapse;margin-top:16px} td{padding:6px 0;border-bottom:1px solid #eee}
  .muted{color:#666;font-size:0.875rem}</style></head><body>${bodyHtml}</body></html>`)
  w.document.close()
  w.focus()
  w.print()
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
