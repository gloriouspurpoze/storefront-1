/**
 * Tenant-facing invoice appearance for on-screen preview (and optional future API sync).
 * Persisted locally until backend stores company invoice profile.
 */

export type InvoiceBranding = {
  /** Base64 data URL or https URL */
  logoDataUrl: string | null
  showLogo: boolean
  primaryColor: string
  accentColor: string
  /** Main headline e.g. TAX INVOICE */
  documentTitle: string
  companyDisplayName: string
  companyLegalName: string
  tagline: string
  supplierAddressLines: string[]
  supplierPhone: string
  supplierEmail: string
  supplierWebsite: string
  supplierGstin: string
  supplierPan: string
  /** Shown under totals — payment terms, thank you, statutory notes */
  footerNote: string
  /** Optional bank / UPI block */
  bankDetails: string
}

const STORAGE_KEY = 'fixer-admin-invoice-branding-v2'

export const DEFAULT_INVOICE_BRANDING: InvoiceBranding = {
  logoDataUrl: null,
  showLogo: true,
  primaryColor: '#1565c0',
  accentColor: '#0d47a1',
  documentTitle: 'TAX INVOICE',
  companyDisplayName: 'Your company',
  companyLegalName: '',
  tagline: '',
  supplierAddressLines: ['Registered office address', 'City, State — PIN'],
  supplierPhone: '',
  supplierEmail: '',
  supplierWebsite: '',
  supplierGstin: '',
  supplierPan: '',
  footerNote:
    'This is a computer-generated document. For queries contact accounts with invoice number.',
  bankDetails: '',
}

function isHexColor(s: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim())
}

function sanitizeBranding(raw: Partial<InvoiceBranding> | null | undefined): InvoiceBranding {
  const d = DEFAULT_INVOICE_BRANDING
  if (!raw || typeof raw !== 'object') return { ...d }

  const linesFromRaw = Array.isArray(raw.supplierAddressLines)
    ? raw.supplierAddressLines.map((l) => String(l).trim()).filter(Boolean).slice(0, 8)
    : null

  let logo = typeof raw.logoDataUrl === 'string' ? raw.logoDataUrl.trim() : null
  if (logo === '') logo = null
  if (logo && logo.startsWith('data:') && logo.length > 600_000) logo = null

  return {
    logoDataUrl: logo,
    showLogo: raw.showLogo !== false,
    primaryColor: isHexColor(String(raw.primaryColor || '')) ? String(raw.primaryColor).trim() : d.primaryColor,
    accentColor: isHexColor(String(raw.accentColor || '')) ? String(raw.accentColor).trim() : d.accentColor,
    documentTitle: String(raw.documentTitle || d.documentTitle).slice(0, 80) || d.documentTitle,
    companyDisplayName: String(raw.companyDisplayName || d.companyDisplayName).slice(0, 120) || d.companyDisplayName,
    companyLegalName: String(raw.companyLegalName ?? '').slice(0, 200),
    tagline: String(raw.tagline ?? '').slice(0, 160),
    supplierAddressLines: linesFromRaw !== null ? linesFromRaw : [...d.supplierAddressLines],
    supplierPhone: String(raw.supplierPhone ?? '').slice(0, 40),
    supplierEmail: String(raw.supplierEmail ?? '').slice(0, 120),
    supplierWebsite: String(raw.supplierWebsite ?? '').slice(0, 200),
    supplierGstin: String(raw.supplierGstin ?? '').slice(0, 20).toUpperCase(),
    supplierPan: String(raw.supplierPan ?? '').slice(0, 12).toUpperCase(),
    footerNote: String(raw.footerNote ?? d.footerNote).slice(0, 2000),
    bankDetails: String(raw.bankDetails ?? '').slice(0, 2000),
  }
}

export function loadInvoiceBranding(): InvoiceBranding {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return { ...DEFAULT_INVOICE_BRANDING }
    const j = JSON.parse(raw) as Partial<InvoiceBranding>
    return sanitizeBranding(j)
  } catch {
    return { ...DEFAULT_INVOICE_BRANDING }
  }
}

export function saveInvoiceBranding(b: InvoiceBranding): void {
  try {
    const clean = sanitizeBranding(b)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  } catch {
    /* quota or private mode */
  }
}

export const MAX_LOGO_BYTES = 450 * 1024

export async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (PNG, JPG, or SVG).')
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error(`Logo must be under ${Math.round(MAX_LOGO_BYTES / 1024)} KB for browser storage.`)
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = typeof r.result === 'string' ? r.result : ''
      if (!s.startsWith('data:')) {
        reject(new Error('Could not read file'))
        return
      }
      resolve(s)
    }
    r.onerror = () => reject(new Error('Read failed'))
    r.readAsDataURL(file)
  })
}
