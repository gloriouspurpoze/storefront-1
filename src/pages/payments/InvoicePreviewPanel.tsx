import React from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Divider,
  Chip,
  Stack,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { PictureAsPdf as PdfIcon, Verified as VerifiedIcon } from '@mui/icons-material'
import type { LineComputed } from './invoicePreviewData'
import type { InvoiceBranding } from '../../lib/invoiceBranding'

const ru = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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
  const theme = useTheme()
  const cgst = isInterState ? 0 : totalTax / 2
  const sgst = isInterState ? 0 : totalTax / 2
  const igst = isInterState ? totalTax : 0
  const isNonGstDoc = previewVariant === 'non_gst'

  const primary = branding?.primaryColor ?? theme.palette.primary.main
  const accent = branding?.accentColor ?? theme.palette.primary.dark
  const docTitle =
    (isNonGstDoc ? undefined : branding?.documentTitle?.trim()) ||
    (isNonGstDoc ? 'BILL OF SUPPLY' : 'TAX INVOICE')

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        border: '1px solid',
        borderColor: branding ? alpha(primary, 0.35) : 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        maxWidth: 900,
        mx: 'auto',
        color: 'text.primary',
        boxShadow: theme.shadows[mode === 'proforma' ? 2 : 3],
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {branding?.showLogo && branding.logoDataUrl && (
            <Box
              component="img"
              src={branding.logoDataUrl}
              alt=""
              sx={{
                maxHeight: 56,
                maxWidth: 180,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          )}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '0.04em', color: primary }}>
              {docTitle}
            </Typography>
            {branding?.tagline ? (
              <Typography variant="caption" color="text.secondary" display="block">
                {branding.tagline}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block">
                {mode === 'proforma' ? 'Preview — for review before issue' : 'Original for recipient'}
              </Typography>
            )}
          </Box>
        </Stack>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Chip
            size="small"
            icon={<VerifiedIcon sx={{ '&&': { fontSize: 16 } }} />}
            label={documentTypeLabel}
            variant="outlined"
            sx={{
              borderColor: alpha(primary, 0.55),
              color: primary,
              '& .MuiChip-icon': { color: primary },
            }}
          />
          <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
            <PdfIcon sx={{ fontSize: 18 }} />
            <Typography variant="caption">Number & date are assigned on issue</Typography>
          </Stack>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Place of supply: {placeOfSupply}
        {isNonGstDoc
          ? ' · No GST breakdown on this document'
          : ` · ${isInterState ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}`}
        {companyStateLabel && ` · Seller state: ${companyStateLabel}`}
      </Typography>

      <GridTwoCol
        leftTitle="Bill to (customer)"
        rightTitle="From (supplier)"
        left={
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" fontWeight={700}>
              {billingName || '—'}
            </Typography>
            {billingAddressLines.map((l, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                {l}
              </Typography>
            ))}
            <Typography variant="body2">Ph: {billingPhone}</Typography>
            {billingEmail && (
              <Typography variant="body2" color="text.secondary">
                {billingEmail}
              </Typography>
            )}
            {billingGstin && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                GSTIN: <strong>{billingGstin}</strong> {customerMode === 'platform' ? '(B2B / registered)' : ''}
              </Typography>
            )}
            <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ pt: 0.5 }} useFlexGap>
              <Chip
                size="small"
                label={customerMode === 'offline' ? 'Walk-in / offline' : 'Platform customer'}
                variant="outlined"
              />
              {customerReference && <Chip size="small" label={`Ref: ${customerReference}`} />}
              {platformCustomerIdMasked && <Chip size="small" label={`User: ${platformCustomerIdMasked}`} />}
            </Stack>
          </Stack>
        }
        right={
          branding ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(primary, theme.palette.mode === 'dark' ? 0.12 : 0.06),
                border: `1px solid ${alpha(primary, 0.25)}`,
              }}
            >
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: primary }}>
                {branding.companyDisplayName}
              </Typography>
              {branding.companyLegalName && branding.companyLegalName !== branding.companyDisplayName && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {branding.companyLegalName}
                </Typography>
              )}
              {(branding.supplierAddressLines.length > 0
                ? branding.supplierAddressLines
                : ['Add registered address in Invoice appearance']
              ).map((l, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  {l}
                </Typography>
              ))}
              {branding.supplierPhone && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Ph: {branding.supplierPhone}
                </Typography>
              )}
              {branding.supplierEmail && (
                <Typography variant="body2" color="text.secondary">
                  {branding.supplierEmail}
                </Typography>
              )}
              {branding.supplierWebsite && (
                <Typography variant="body2" color="text.secondary">
                  {branding.supplierWebsite}
                </Typography>
              )}
              {branding.supplierGstin && (
                <Typography variant="body2" sx={{ mt: 0.75 }}>
                  GSTIN: <strong>{branding.supplierGstin}</strong>
                </Typography>
              )}
              {branding.supplierPan && (
                <Typography variant="body2" color="text.secondary">
                  PAN: {branding.supplierPan}
                </Typography>
              )}
              {branding.bankDetails?.trim() && (
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {branding.bankDetails.trim()}
                </Typography>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: (t) => (t.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                {companyHint}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invoices you issue use the same PDF engine as online orders and service bookings
                (fixer-backend <code style={{ fontSize: '0.8em' }}>PDFService</code> / company config). Customize logo
                & colours in <strong>Invoices → Invoice appearance</strong>.
              </Typography>
            </Box>
          )
        }
      />

      <TableContainer sx={{ my: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table
          size="small"
          sx={{
            '& th': {
              fontWeight: 700,
              bgcolor: branding ? alpha(primary, 0.1) : 'action.hover',
              color: branding ? primary : undefined,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="5%">#</TableCell>
              <TableCell>Description</TableCell>
              {!isNonGstDoc && (
                <TableCell width="10%" align="right">
                  HSN/SAC
                </TableCell>
              )}
              <TableCell width="8%" align="right">
                Qty
              </TableCell>
              <TableCell width="10%" align="right">
                Rate (₹)
              </TableCell>
              {!isNonGstDoc && (
                <TableCell width="11%" align="right">
                  Taxable
                </TableCell>
              )}
              {!isNonGstDoc && (
                <TableCell width="10%" align="right">
                  GST
                </TableCell>
              )}
              <TableCell width="12%" align="right">
                Amount (₹)
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lineRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={isNonGstDoc ? 5 : 8} align="center">
                  <Typography color="text.secondary" variant="body2" py={2}>
                    No line items
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {lineRows.map((r, i) => (
              <TableRow key={i} hover>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  {r.description}
                  {r.lineKind && (
                    <Typography component="span" variant="caption" color="text.secondary" display="block">
                      {r.lineKind === 'product' ? 'Goods' : 'Service'}
                    </Typography>
                  )}
                </TableCell>
                {!isNonGstDoc && (
                  <TableCell align="right" sx={{ fontFeatureSettings: '"tnum"' }}>
                    {r.hsnSac}
                  </TableCell>
                )}
                <TableCell align="right">{r.quantity}</TableCell>
                <TableCell align="right">{ru(r.unitPrice)}</TableCell>
                {!isNonGstDoc && <TableCell align="right">{ru(r.taxable)}</TableCell>}
                {!isNonGstDoc && <TableCell align="right">{ru(r.taxAmount)}</TableCell>}
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {ru(r.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1} alignItems="flex-end" sx={{ maxWidth: 400, ml: 'auto' }}>
        <Row
          label={isNonGstDoc ? 'Subtotal (line amounts)' : 'Subtotal (taxable value)'}
          value={ru(subtotal)}
        />
        {!isNonGstDoc && (
          <>
            <Row label="Total GST @ 18%" value={ru(totalTax)} bold={false} muted />
            {!isInterState && totalTax > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ pl: 1, alignSelf: 'flex-start' }}>
                CGST {ru(cgst)} + SGST {ru(sgst)}
              </Typography>
            )}
            {isInterState && totalTax > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                IGST {ru(igst)}
              </Typography>
            )}
          </>
        )}
        {discount > 0 && <Row label="Less: discount / adjustment" value={`−${ru(discount)}`} />}
        <Divider sx={{ width: '100%', my: 0.5 }} />
        <Row
          label={isNonGstDoc ? 'Total payable (INR)' : 'Net payable (INR)'}
          value={ru(grandTotal)}
          large
          accentColor={accent}
        />
      </Stack>

      {(paymentMethod || notes) && (
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {paymentMethod && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Payment / mode:</strong> {paymentMethod}
            </Typography>
          )}
          {notes && (
            <Typography variant="body2" color="text.secondary">
              <strong>Remarks:</strong> {notes}
            </Typography>
          )}
        </Box>
      )}

      {branding?.footerNote?.trim() && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center', whiteSpace: 'pre-wrap' }}>
          {branding.footerNote.trim()}
        </Typography>
      )}
      {!branding?.footerNote?.trim() && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
          {isNonGstDoc
            ? 'Bill-of-supply preview: no GST components; discount applied to total as on server.'
            : 'Amounts follow server calculation: per-line 18% GST, then discount applied to grand total.'}
        </Typography>
      )}
    </Paper>
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
    <Stack direction="row" justifyContent="space-between" width="100%" alignItems="baseline" spacing={2}>
      <Typography variant={large ? 'subtitle1' : 'body2'} color={muted ? 'text.secondary' : 'text.primary'} fontWeight={bold === false ? 400 : 600}>
        {label}
      </Typography>
      <Typography
        variant={large ? 'h6' : 'body2'}
        fontWeight={700}
        sx={{
          fontFeatureSettings: '"tnum"',
          color: accentColor ?? 'primary.main',
        }}
      >
        ₹{value}
      </Typography>
    </Stack>
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
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 2,
        alignItems: 'start',
        mb: 0,
      }}
    >
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {leftTitle}
        </Typography>
        <Box sx={{ mt: 0.5 }}>{left}</Box>
      </Box>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {rightTitle}
        </Typography>
        <Box sx={{ mt: 0.5 }}>{right}</Box>
      </Box>
    </Box>
  )
}
