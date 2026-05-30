/**
 * InvoicePreviewPanel — A4-style invoice preview used by the create flow and the
 * branding editor.
 *
 * Goals (post-redesign):
 *   1. Industry-grade layout — paper-like surface, accent header band, clear
 *      "Bill to / From" cards, neat ruled item grid, prominent grand-total card.
 *   2. Print-friendly — light background (`bg-white`) regardless of the app's
 *      light/dark theme; the dialog wrapper keeps the surrounding chrome dark
 *      where the user wants it, but the invoice itself always looks like paper.
 *   3. Tax block fully driven by props — `previewVariant` and `gstRate` decide
 *      whether GST appears, never auto-derived.
 */

import React from 'react'
import { BadgeCheck, FileText, Mail, MapPin, Phone, ReceiptText } from 'lucide-react'
import type { LineComputed } from './invoicePreviewData'
import type { InvoiceBranding } from '../../lib/invoiceBranding'
import { cn } from '../../lib/utils'
import { Badge } from '../../components/ui/badge'

const ru = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Hex #RRGGBB → rgba() — used for tinted backgrounds from branding colours. */
function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return `rgba(15,23,42,${a})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

export type InvoicePreviewPanelProps = {
  documentTypeLabel: string
  customerMode: 'platform' | 'offline'
  customerReference?: string
  platformCustomerIdMasked?: string
  billingName: string
  billingAddressLines: string[]
  billingPhone: string
  billingEmail?: string
  billingGstin?: string
  lineRows: LineComputed[]
  subtotal: number
  totalTax: number
  discount: number
  grandTotal: number
  isInterState: boolean
  placeOfSupply: string
  paymentMethod?: string
  notes?: string
  companyStateLabel: string
  companyHint?: string
  /** "Pro forma — matches server PDF layout" — UI hint only. */
  mode?: 'proforma' | 'final'
  /** Custom logo, colours, supplier block — from Invoice branding settings */
  branding?: InvoiceBranding | null
  /** GST tax invoice vs bill-of-supply style preview */
  previewVariant?: 'gst' | 'non_gst'
  /** Effective GST rate to display (default 18, ignored when previewVariant is 'non_gst'). */
  gstRate?: number
}

/**
 * A4-width style tax invoice preview (read-only) — similar to a printed GST invoice layout.
 */
export function InvoicePreviewPanel({
  documentTypeLabel,
  customerMode,
  customerReference,
  platformCustomerIdMasked,
  billingName,
  billingAddressLines,
  billingPhone,
  billingEmail,
  billingGstin,
  lineRows,
  subtotal,
  totalTax,
  discount,
  grandTotal,
  isInterState,
  placeOfSupply,
  paymentMethod,
  notes,
  companyStateLabel,
  companyHint = 'Legal name, full address & company GSTIN appear on the official PDF (server / company settings).',
  mode = 'proforma',
  branding,
  previewVariant = 'gst',
  gstRate = 18,
}: InvoicePreviewPanelProps) {
  const isNonGstDoc = previewVariant === 'non_gst'
  const cgst = isInterState ? 0 : totalTax / 2
  const sgst = isInterState ? 0 : totalTax / 2
  const igst = isInterState ? totalTax : 0

  // DESIGN.md fallback (ink) when no tenant branding hex is configured.
  const DEFAULT_BRAND_INK = '#1a1a1a'
  const primaryRaw = branding?.primaryColor?.trim() || DEFAULT_BRAND_INK
  const accentRaw = branding?.accentColor?.trim() || primaryRaw
  const primaryIsHex = primaryRaw.startsWith('#')
  const accentIsHex = accentRaw.startsWith('#')
  const primary = primaryIsHex ? primaryRaw : DEFAULT_BRAND_INK
  const accent = accentIsHex ? accentRaw : primary

  const accentBand = hexAlpha(primary, 1)
  const softBg = hexAlpha(primary, 0.04)
  const softBorder = hexAlpha(primary, 0.16)
  const tableHeaderBg = hexAlpha(primary, 0.06)

  const docTitle =
    (isNonGstDoc ? undefined : branding?.documentTitle?.trim()) ||
    (isNonGstDoc ? 'BILL OF SUPPLY' : 'TAX INVOICE')

  const taxStripText = isNonGstDoc
    ? 'No GST applied on this document'
    : isInterState
      ? `Inter-state · IGST ${gstRate}%`
      : `Intra-state · CGST ${gstRate / 2}% + SGST ${gstRate / 2}%`

  return (
    <div className="mx-auto max-w-[860px]">
      {/* Paper card — fixed light surface so the preview reads like a printed invoice */}
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border border-fog bg-white text-ink shadow-md',
          mode === 'final' && 'shadow-lg',
        )}
      >
        {/* Accent band */}
        <div className="h-1.5 w-full" style={{ backgroundColor: accentBand }} aria-hidden />

        <div className="p-5 sm:p-7 md:p-9">
          {/* Header: logo / title (left) — meta (right) */}
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-wrap items-start gap-4">
              {branding?.showLogo && branding.logoDataUrl ? (
                <img
                  src={branding.logoDataUrl}
                  alt=""
                  className="h-12 w-auto max-w-[180px] object-contain"
                />
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: primary }}
                  aria-hidden
                >
                  <ReceiptText className="h-6 w-6" />
                </div>
              )}
              <div>
                <h1
                  className="text-2xl font-bold uppercase tracking-[0.18em] sm:text-[1.7rem]"
                  style={{ color: primary }}
                >
                  {docTitle}
                </h1>
                <p className="mt-1 text-xs text-graphite">
                  {branding?.tagline ||
                    (mode === 'proforma' ? 'Preview — for review before issue' : 'Original for recipient')}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-steel bg-white font-medium text-charcoal"
              >
                <BadgeCheck className="h-3.5 w-3.5" style={{ color: accent }} />
                {documentTypeLabel}
              </Badge>
              <div className="rounded-md border border-fog bg-cloud px-3 py-2 text-right text-xs text-graphite">
                <p>
                  <span className="font-semibold text-charcoal">Invoice #</span> assigned on issue
                </p>
                <p>
                  <span className="font-semibold text-charcoal">Date</span> assigned on issue
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-graphite">
                  <FileText className="h-3 w-3" />
                  PDF rendered by server (PDFService)
                </p>
              </div>
            </div>
          </header>

          {/* Place of supply strip */}
          <div
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-[11px]"
            style={{ backgroundColor: softBg, borderColor: softBorder, color: primary }}
          >
            <span>
              <strong>Place of supply:</strong> {placeOfSupply || '—'}
            </span>
            <span className="text-steel">·</span>
            <span>{taxStripText}</span>
            {companyStateLabel && (
              <>
                <span className="text-steel">·</span>
                <span>
                  <strong>Seller state:</strong> {companyStateLabel}
                </span>
              </>
            )}
          </div>

          {/* Parties */}
          <section className="mt-6 grid gap-5 md:grid-cols-2">
            <PartyCard
              eyebrow="Bill to"
              accent={accent}
              borderColor={softBorder}
            >
              <p className="text-base font-semibold text-ink">{billingName || '—'}</p>
              {billingAddressLines.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {billingAddressLines.map((l, i) => (
                    <p key={i} className="flex items-start gap-1.5 text-sm text-graphite">
                      {i === 0 && <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-steel" />}
                      <span className={i === 0 ? '' : 'ml-[18px]'}>{l}</span>
                    </p>
                  ))}
                </div>
              )}
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-charcoal">
                <Phone className="h-3.5 w-3.5 text-steel" />
                {billingPhone || '—'}
              </p>
              {billingEmail && (
                <p className="flex items-center gap-1.5 text-sm text-graphite">
                  <Mail className="h-3.5 w-3.5 text-steel" />
                  {billingEmail}
                </p>
              )}
              {billingGstin && (
                <p className="mt-2 text-sm text-charcoal">
                  <span className="font-medium text-graphite">GSTIN:</span>{' '}
                  <strong className="font-mono">{billingGstin}</strong>{' '}
                  {customerMode === 'platform' && (
                    <span className="text-xs text-graphite">(B2B / registered)</span>
                  )}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge
                  variant="outline"
                  className="border-steel bg-white text-[11px] text-graphite"
                >
                  {customerMode === 'offline' ? 'Walk-in / offline' : 'Platform customer'}
                </Badge>
                {customerReference && (
                  <Badge variant="secondary" className="text-[11px]">
                    Ref: {customerReference}
                  </Badge>
                )}
                {platformCustomerIdMasked && (
                  <Badge variant="secondary" className="text-[11px]">
                    User: {platformCustomerIdMasked}
                  </Badge>
                )}
              </div>
            </PartyCard>

            <PartyCard
              eyebrow="From (supplier)"
              accent={accent}
              borderColor={softBorder}
              tintBackground={softBg}
            >
              {branding ? (
                <>
                  <p className="text-base font-semibold" style={{ color: primary }}>
                    {branding.companyDisplayName}
                  </p>
                  {branding.companyLegalName &&
                    branding.companyLegalName !== branding.companyDisplayName && (
                      <p className="mt-0.5 text-xs text-graphite">{branding.companyLegalName}</p>
                    )}
                  <div className="mt-1 space-y-0.5">
                    {(branding.supplierAddressLines.length > 0
                      ? branding.supplierAddressLines
                      : ['Add registered address in Invoice appearance']
                    ).map((l, i) => (
                      <p key={i} className="text-sm text-graphite">
                        {l}
                      </p>
                    ))}
                  </div>
                  {branding.supplierPhone && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-charcoal">
                      <Phone className="h-3.5 w-3.5 text-steel" />
                      {branding.supplierPhone}
                    </p>
                  )}
                  {branding.supplierEmail && (
                    <p className="flex items-center gap-1.5 text-sm text-graphite">
                      <Mail className="h-3.5 w-3.5 text-steel" />
                      {branding.supplierEmail}
                    </p>
                  )}
                  {branding.supplierWebsite && (
                    <p className="text-sm text-graphite">{branding.supplierWebsite}</p>
                  )}
                  {branding.supplierGstin && (
                    <p className="mt-2 text-sm text-charcoal">
                      <span className="font-medium text-graphite">GSTIN:</span>{' '}
                      <strong className="font-mono">{branding.supplierGstin}</strong>
                    </p>
                  )}
                  {branding.supplierPan && (
                    <p className="text-sm text-graphite">
                      <span className="font-medium text-graphite">PAN:</span>{' '}
                      <span className="font-mono">{branding.supplierPan}</span>
                    </p>
                  )}
                  {branding.bankDetails?.trim() && (
                    <pre className="mt-2 whitespace-pre-wrap rounded-md border border-fog bg-white p-2 font-sans text-xs text-graphite">
                      {branding.bankDetails.trim()}
                    </pre>
                  )}
                </>
              ) : (
                <div className="rounded-md border border-dashed border-steel bg-cloud p-3">
                  <p className="text-xs text-graphite">{companyHint}</p>
                  <p className="mt-1 text-xs text-graphite">
                    Customize logo &amp; colours in <strong>Invoices → Invoice appearance</strong>.
                  </p>
                </div>
              )}
            </PartyCard>
          </section>

          {/* Line items */}
          <section className="mt-6 overflow-hidden rounded-md border border-fog">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-wider"
                  style={{ backgroundColor: tableHeaderBg, color: primary }}
                >
                  <th className="w-[5%] px-3 py-2.5 text-left font-semibold">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold">Description</th>
                  {!isNonGstDoc && (
                    <th className="w-[10%] px-3 py-2.5 text-right font-semibold">HSN/SAC</th>
                  )}
                  <th className="w-[8%] px-3 py-2.5 text-right font-semibold">Qty</th>
                  <th className="w-[10%] px-3 py-2.5 text-right font-semibold">Rate (₹)</th>
                  {!isNonGstDoc && (
                    <th className="w-[11%] px-3 py-2.5 text-right font-semibold">Taxable</th>
                  )}
                  {!isNonGstDoc && (
                    <th className="w-[10%] px-3 py-2.5 text-right font-semibold">GST</th>
                  )}
                  <th className="w-[12%] px-3 py-2.5 text-right font-semibold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {lineRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={isNonGstDoc ? 5 : 8}
                      className="px-3 py-8 text-center text-sm text-steel"
                    >
                      No line items
                    </td>
                  </tr>
                )}
                {lineRows.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2.5 text-graphite">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-ink">{r.description}</p>
                      {r.lineKind && (
                        <p className="mt-0.5 text-[11px] text-graphite">
                          {r.lineKind === 'product' ? 'Goods' : 'Service'}
                          {r.category ? ` · ${r.category}` : ''}
                        </p>
                      )}
                    </td>
                    {!isNonGstDoc && (
                      <td className="px-3 py-2.5 text-right font-mono text-charcoal tabular-nums">
                        {r.hsnSac}
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right tabular-nums text-charcoal">
                      {r.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-charcoal">
                      {ru(r.unitPrice)}
                    </td>
                    {!isNonGstDoc && (
                      <td className="px-3 py-2.5 text-right tabular-nums text-charcoal">
                        {ru(r.taxable)}
                      </td>
                    )}
                    {!isNonGstDoc && (
                      <td className="px-3 py-2.5 text-right tabular-nums text-charcoal">
                        {ru(r.taxAmount)}
                      </td>
                    )}
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                      {ru(r.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Totals + Notes */}
          <section className="mt-6 grid gap-6 md:grid-cols-5">
            <div className="space-y-4 md:col-span-3">
              {paymentMethod && (
                <div className="rounded-md border border-fog bg-cloud px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-graphite">
                    Payment
                  </p>
                  <p className="mt-0.5 text-ink-soft">{paymentMethod}</p>
                </div>
              )}
              {notes && (
                <div className="rounded-md border border-fog px-3 py-2 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-graphite">
                    Notes / remarks
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-charcoal">{notes}</p>
                </div>
              )}
              <div className="rounded-md border border-dashed border-fog p-3 text-[11px] text-graphite">
                <p className="font-semibold text-graphite">Terms</p>
                <p>
                  This is a {mode === 'proforma' ? 'preview' : 'computer-generated invoice'}.
                  {isNonGstDoc
                    ? ' No tax has been charged on this document.'
                    : ' Tax is computed per line and totalled below.'}
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <div
                className="overflow-hidden rounded-md border"
                style={{ borderColor: softBorder, backgroundColor: softBg }}
              >
                <dl className="space-y-1 px-4 py-3">
                  <SummaryRow
                    label={isNonGstDoc ? 'Subtotal (line amounts)' : 'Subtotal (taxable value)'}
                    value={ru(subtotal)}
                  />
                  {!isNonGstDoc && (
                    <>
                      <SummaryRow
                        label={`GST @ ${gstRate}%`}
                        value={ru(totalTax)}
                        muted
                      />
                      {!isInterState && totalTax > 0 && (
                        <div className="pl-1 text-[11px] text-graphite">
                          CGST {ru(cgst)} · SGST {ru(sgst)}
                        </div>
                      )}
                      {isInterState && totalTax > 0 && (
                        <div className="pl-1 text-[11px] text-graphite">IGST {ru(igst)}</div>
                      )}
                    </>
                  )}
                  {discount > 0 && (
                    <SummaryRow label="Less: discount / adjustment" value={`−₹${ru(discount)}`} muted />
                  )}
                </dl>
                <div
                  className="flex items-baseline justify-between px-4 py-3 text-white"
                  style={{ backgroundColor: accent }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {isNonGstDoc ? 'Total payable' : 'Net payable'}
                  </span>
                  <span className="text-xl font-bold tabular-nums">₹{ru(grandTotal)}</span>
                </div>
              </div>
              <p className="mt-1 text-right text-[10px] text-steel">
                All amounts in INR. Errors &amp; omissions excepted.
              </p>
            </div>
          </section>

          {/* Footer note */}
          <footer className="mt-6 border-t border-fog pt-4 text-center text-[11px] text-graphite">
            {branding?.footerNote?.trim() ? (
              <p className="whitespace-pre-wrap">{branding.footerNote.trim()}</p>
            ) : (
              <p>
                {isNonGstDoc
                  ? 'Bill-of-supply preview: no GST components; discount applied to total as on server.'
                  : 'Amounts follow server calculation: per-line GST, then discount applied to grand total.'}
              </p>
            )}
          </footer>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function PartyCard({
  eyebrow,
  accent,
  borderColor,
  tintBackground,
  children,
}: {
  eyebrow: string
  accent: string
  borderColor: string
  tintBackground?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-md border p-4"
      style={{
        borderColor,
        backgroundColor: tintBackground ?? '#ffffff',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="block h-1 w-6 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-graphite">
          {eyebrow}
        </p>
      </div>
      <div className="text-ink-soft">{children}</div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={cn('text-sm', muted ? 'text-graphite' : 'font-medium text-charcoal')}>
        {label}
      </dt>
      <dd className={cn('text-sm tabular-nums', muted ? 'text-graphite' : 'font-semibold text-ink')}>
        {value.startsWith('−') || value.startsWith('₹') ? value : `₹${value}`}
      </dd>
    </div>
  )
}
