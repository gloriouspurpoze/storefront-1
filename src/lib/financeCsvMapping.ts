/** Parse common bank export date cells (ISO, DD/MM/YYYY, MM/DD/YYYY heuristics). */
export function parseBankDate(s: string): Date | null {
  const t = s.trim()
  if (!t) return null
  const iso = new Date(t)
  if (!Number.isNaN(iso.getTime())) return iso
  const m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
  if (m) {
    const a = +m[1]
    const b = +m[2]
    const y = m[3].length === 2 ? +m[3] + 2000 : +m[3]
    const d1 = new Date(y, b - 1, a)
    if (!Number.isNaN(d1.getTime()) && d1.getMonth() === b - 1) return d1
    const d2 = new Date(y, a - 1, b)
    if (!Number.isNaN(d2.getTime()) && d2.getMonth() === a - 1) return d2
  }
  return null
}

export function parseMoneyCell(s: string): number {
  const cleaned = s.replace(/[₹$,\s]/g, '').replace(/[^\d.-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? Math.abs(n) : 0
}
