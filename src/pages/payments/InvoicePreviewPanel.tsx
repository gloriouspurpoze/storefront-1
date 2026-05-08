import React from 'react'
import { BadgeCheck, FileText } from 'lucide-react'
import type { LineComputed } from './invoicePreviewData'
import type { InvoiceBranding } from '../../lib/invoiceBranding'
import { cn } from '../../lib/utils'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

const ru = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Hex #RRGGBB → rgba() for borders/backgrounds from branding colours. */
function hexAlpha(hex: string, a: number): string {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6 || Number.isNaN(parseInt(h, 16))) return `rgba(0,0,0,${a})`
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
  /** e.g. “Pro forma — matches server PDF layout” */
  mode?: 'proforma' | 'final'
  /** Custom logo, colours, supplier block — from Invoice branding settings */
  branding?: InvoiceBranding | null
  /** GST tax invoice vs bill-of-supply style preview */
  previewVariant?: 'gst' | 'non_gst'
}

/**
 * A4-width style tax invoice preview (read-only) — similar to printed GST invoice layout.
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
}: InvoicePreviewPanelProps) {
  const cgst = isInterState ? 0 : totalTax / 2
  const sgst = isInterState ? 0 : totalTax / 2
  const igst = isInterState ? totalTax : 0
  const isNonGstDoc = previewVariant === 'non_gst'

  const primary = branding?.primaryColor ?? 'hsl(var(--primary))'
  const accent = branding?.accentColor ?? 'hsl(var(--primary))'
  const docTitle =
    (isNonGstDoc ? undefined : branding?.documentTitle?.trim()) ||
    (isNonGstDoc ? 'BILL OF SUPPLY' : 'TAX INVOICE')

  const primaryIsHex = primary.startsWith('#')
  const borderTint = branding && primaryIsHex ? hexAlpha(primary, 0.35) : undefined
  const chipBorder = branding && primaryIsHex ? hexAlpha(primary, 0.55) : undefined
  const supplierBg =
    branding && primaryIsHex ? hexAlpha(primary, 0.06) : 'rgba(0,0,0,0.04)'
  const supplierBorder = branding && primaryIsHex ? hexAlpha(primary, 0.25) : undefined
  const headerCellBg = branding && primaryIsHex ? hexAlpha(primary, 0.1) : undefined

  return (
    <div
      className={cn(
        'mx-auto max-w-[900px] rounded-md border bg-card p-4 text-foreground shadow-sm sm:p-6 md:p-8',
        mode === 'proforma' ? 'shadow-md' : 'shadow-lg'
      )}
      style={
        borderTint
          ? { borderColor: borderTint }
          : branding
            ? { borderColor: 'hsl(var(--border))' }
            : undefined
      }
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-start gap-4">
          {branding?.showLogo && branding.logoDataUrl && (
            <img
              src={branding.logoDataUrl}
              alt=""
              className="h-auto max-h-14 w-auto max-w-[180px] object-contain"
            />
          )}
          <div>
            <h2
              className="text-xl font-bold tracking-wide sm:text-2xl"
              style={branding && primaryIsHex ? { color: primary } : undefined}
            >
              {!branding || !primaryIsHex ? (
                <span className="text-primary">{docTitle}</span>
              ) : (
                docTitle
              )}
            </h2>
            {branding?.tagline ? (
              <p className="mt-0.5 block text-xs text-muted-foreground">{branding.tagline}</p>
            ) : (
              <p className="mt-0.5 block text-xs text-muted-foreground">
                {mode === 'proforma' ? 'Preview — for review before issue' : 'Original for recipient'}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <Badge
            variant="outline"
            className="gap-1 font-medium"
            style={
              chipBorder && primaryIsHex
                ? { borderColor: chipBorder, color: primary }
                : undefined
            }
          >
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0"
              style={primaryIsHex && branding ? { color: primary } : undefined}
            />
            {documentTypeLabel}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <FileText className="h-4 w-4 shrink-0 opacity-80" />
            <span className="text-xs">Number & date are assigned on issue</span>
          </div>
        </div>
      </div>

      <p className="mb-4 block text-xs text-muted-foreground">
        Place of supply: {placeOfSupply}
        {isNonGstDoc
          ? ' · No GST breakdown on this document'
          : ` · ${isInterState ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}`}
        {companyStateLabel && ` · Seller state: ${companyStateLabel}`}
      </p>

      <GridTwoCol
        leftTitle="Bill to (customer)"
        rightTitle="From (supplier)"
        left={
          <div className="space-y-1">
            <p className="text-base font-bold">{billingName || '—'}</p>
            {billingAddressLines.map((l, i) => (
              <p key={i} className="text-sm text-muted-foreground">
                {l}
              </p>
            ))}
            <p className="text-sm">Ph: {billingPhone}</p>
            {billingEmail && <p className="text-sm text-muted-foreground">{billingEmail}</p>}
            {billingGstin && (
              <p className="mt-1 text-sm">
                GSTIN: <strong>{billingGstin}</strong>{' '}
                {customerMode === 'platform' ? '(B2B / registered)' : ''}
              </p>
            )}
            <div className="flex flex-wrap gap-1 pt-1">
              <Badge variant="outline" className="text-xs">
                {customerMode === 'offline' ? 'Walk-in / offline' : 'Platform customer'}
              </Badge>
              {customerReference && (
                <Badge variant="secondary" className="text-xs">
                  Ref: {customerReference}
                </Badge>
              )}
              {platformCustomerIdMasked && (
                <Badge variant="secondary" className="text-xs">
                  User: {platformCustomerIdMasked}
                </Badge>
              )}
            </div>
          </div>
        }
        right={
          branding ? (
            <div
              className="rounded-md border p-4"
              style={{
                backgroundColor: supplierBg,
                borderColor: supplierBorder ?? 'hsl(var(--border))',
              }}
            >
              <p
                className="text-base font-bold"
                style={primaryIsHex ? { color: primary } : { color: 'hsl(var(--primary))' }}
              >
                {branding.companyDisplayName}
              </p>
              {branding.companyLegalName && branding.companyLegalName !== branding.companyDisplayName && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{branding.companyLegalName}</span>
              )}
              {(branding.supplierAddressLines.length > 0
                ? branding.supplierAddressLines
                : ['Add registered address in Invoice appearance']
              ).map((l, i) => (
                <p key={i} className="text-sm text-muted-foreground">
                  {l}
                </p>
              ))}
              {branding.supplierPhone && <p className="mt-1 text-sm">Ph: {branding.supplierPhone}</p>}
              {branding.supplierEmail && (
                <p className="text-sm text-muted-foreground">{branding.supplierEmail}</p>
              )}
              {branding.supplierWebsite && (
                <p className="text-sm text-muted-foreground">{branding.supplierWebsite}</p>
              )}
              {branding.supplierGstin && (
                <p className="mt-2 text-sm">
                  GSTIN: <strong>{branding.supplierGstin}</strong>
                </p>
              )}
              {branding.supplierPan && (
                <p className="text-sm text-muted-foreground">PAN: {branding.supplierPan}</p>
              )}
              {branding.bankDetails?.trim() && (
                <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border/80 bg-muted/40 p-2 font-sans text-xs">
                  {branding.bankDetails.trim()}
                </pre>
              )}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 dark:bg-muted/20">
              <p className="mb-1 block text-xs text-muted-foreground">{companyHint}</p>
              <p className="text-sm text-muted-foreground">
                Invoices you issue use the same PDF engine as online orders and service bookings (fixer-backend{' '}
                <code className="text-[0.8em]">PDFService</code> / company config). Customize logo & colours in{' '}
                <strong>Invoices → Invoice appearance</strong>.
              </p>
            </div>
          )
        }
      />

      <div className="my-4 overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow
              className={cn(
                'border-b hover:bg-transparent',
                !headerCellBg && 'bg-muted/50'
              )}
            >
              <TableHead
                className="h-10 w-[5%] px-2 py-2 text-xs font-bold"
                style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
              >
                #
              </TableHead>
              <TableHead
                className="h-10 px-2 py-2 text-xs font-bold"
                style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
              >
                Description
              </TableHead>
              {!isNonGstDoc && (
                <TableHead
                  className="h-10 w-[10%] px-2 py-2 text-right text-xs font-bold"
                  style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
                >
                  HSN/SAC
                </TableHead>
              )}
              <TableHead
                className="h-10 w-[8%] px-2 py-2 text-right text-xs font-bold"
                style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
              >
                Qty
              </TableHead>
              <TableHead
                className="h-10 w-[10%] px-2 py-2 text-right text-xs font-bold"
                style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
              >
                Rate (₹)
              </TableHead>
              {!isNonGstDoc && (
                <TableHead
                  className="h-10 w-[11%] px-2 py-2 text-right text-xs font-bold"
                  style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
                >
                  Taxable
                </TableHead>
              )}
              {!isNonGstDoc && (
                <TableHead
                  className="h-10 w-[10%] px-2 py-2 text-right text-xs font-bold"
                  style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
                >
                  GST
                </TableHead>
              )}
              <TableHead
                className="h-10 w-[12%] px-2 py-2 text-right text-xs font-bold"
                style={headerCellBg ? { backgroundColor: headerCellBg, color: primaryIsHex ? primary : undefined } : undefined}
              >
                Amount (₹)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={isNonGstDoc ? 5 : 8} className="py-8 text-center text-sm text-muted-foreground">
                  No line items
                </TableCell>
              </TableRow>
            )}
            {lineRows.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="px-2 py-2 text-sm">{i + 1}</TableCell>
                <TableCell className="px-2 py-2 text-sm">
                  {r.description}
                  {r.lineKind && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {r.lineKind === 'product' ? 'Goods' : 'Service'}
                    </span>
                  )}
                </TableCell>
                {!isNonGstDoc && (
                  <TableCell className="px-2 py-2 text-right text-sm tabular-nums">{r.hsnSac}</TableCell>
                )}
                <TableCell className="px-2 py-2 text-right text-sm">{r.quantity}</TableCell>
                <TableCell className="px-2 py-2 text-right text-sm tabular-nums">{ru(r.unitPrice)}</TableCell>
                {!isNonGstDoc && (
                  <TableCell className="px-2 py-2 text-right text-sm tabular-nums">{ru(r.taxable)}</TableCell>
                )}
                {!isNonGstDoc && (
                  <TableCell className="px-2 py-2 text-right text-sm tabular-nums">{ru(r.taxAmount)}</TableCell>
                )}
                <TableCell className="px-2 py-2 text-right text-sm font-semibold tabular-nums">{ru(r.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto flex max-w-[400px] flex-col items-end gap-1">
        <Row
          label={isNonGstDoc ? 'Subtotal (line amounts)' : 'Subtotal (taxable value)'}
          value={ru(subtotal)}
        />
        {!isNonGstDoc && (
          <>
            <Row label="Total GST @ 18%" value={ru(totalTax)} muted bold={false} />
            {!isInterState && totalTax > 0 && (
              <p className="self-start pl-1 text-xs text-muted-foreground">
                CGST {ru(cgst)} + SGST {ru(sgst)}
              </p>
            )}
            {isInterState && totalTax > 0 && (
              <p className="pl-1 text-xs text-muted-foreground">IGST {ru(igst)}</p>
            )}
          </>
        )}
        {discount > 0 && <Row label="Less: discount / adjustment" value={`−${ru(discount)}`} />}
        <Separator className="my-1 w-full" />
        <Row
          label={isNonGstDoc ? 'Total payable (INR)' : 'Net payable (INR)'}
          value={ru(grandTotal)}
          large
          accentColor={accent}
        />
      </div>

      {(paymentMethod || notes) && (
        <div className="mt-4 border-t border-border pt-4">
          {paymentMethod && (
            <p className="mb-2 text-sm">
              <strong>Payment / mode:</strong> {paymentMethod}
            </p>
          )}
          {notes && (
            <p className="text-sm text-muted-foreground">
              <strong>Remarks:</strong> {notes}
            </p>
          )}
        </div>
      )}

      {branding?.footerNote?.trim() && (
        <p className="mt-4 block whitespace-pre-wrap text-center text-xs text-muted-foreground">{branding.footerNote.trim()}</p>
      )}
      {!branding?.footerNote?.trim() && (
        <p className="mt-4 block text-center text-xs text-muted-foreground">
          {isNonGstDoc
            ? 'Bill-of-supply preview: no GST components; discount applied to total as on server.'
            : 'Amounts follow server calculation: per-line 18% GST, then discount applied to grand total.'}
        </p>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  large,
  muted,
  bold,
  accentColor,
}: {
  label: string
  value: string
  large?: boolean
  muted?: boolean
  bold?: boolean
  accentColor?: string
}) {
  return (
    <div className="flex w-full items-baseline justify-between gap-4">
      <span
        className={cn(
          large ? 'text-base font-semibold' : 'text-sm',
          muted ? 'text-muted-foreground' : 'text-foreground',
          bold === false ? 'font-normal' : 'font-semibold'
        )}
      >
        {label}
      </span>
      <span
        className={cn('tabular-nums font-bold', large ? 'text-lg' : 'text-sm')}
        style={{ color: accentColor ?? 'hsl(var(--primary))' }}
      >
        ₹{value}
      </span>
    </div>
  )
}

function GridTwoCol({
  leftTitle,
  rightTitle,
  left,
  right,
}: {
  leftTitle: string
  rightTitle: string
  left: React.ReactNode
  right: React.ReactNode
}) {
  return (
    <div className="mb-0 grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{leftTitle}</p>
        <div className="mt-1">{left}</div>
      </div>
      <div>
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{rightTitle}</p>
        <div className="mt-1">{right}</div>
      </div>
    </div>
  )
}
