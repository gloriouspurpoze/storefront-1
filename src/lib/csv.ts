/** Minimal CSV / TSV row parser (handles double quotes and escaped ""). */
export function parseCsvRow(line: string, delim: ',' | '\t'): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (!inQuotes && ch === delim) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function detectDelimiter(headerLine: string): ',' | '\t' {
  const tabs = (headerLine.match(/\t/g) || []).length
  const commas = (headerLine.match(/,/g) || []).length
  return tabs > commas ? '\t' : ','
}

export function parseCsvText(text: string): { delimiter: ',' | '\t'; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { delimiter: ',', rows: [] }
  const delimiter = detectDelimiter(lines[0])
  const rows = lines.map((ln) => parseCsvRow(ln, delimiter))
  return { delimiter, rows }
}
