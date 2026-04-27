import React from 'react'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Divider, Chip, Stack, useTheme } from '@mui/material'
import { PictureAsPdf as PdfIcon, Verified as VerifiedIcon } from '@mui/icons-material'
import type { LineComputed } from './invoicePreviewData'

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
}: InvoicePreviewPanelProps) {
  const theme = useTheme()
  const cgst = isInterState ? 0 : totalTax / 2
  const sgst = isInterState ? 0 : totalTax / 2
  const igst = isInterState ? totalTax : 0

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        maxWidth: 900,
        mx: 'auto',
        color: 'text.primary',
        boxShadow: theme.shadows[mode === 'proforma' ? 2 : 3],
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, letterSpacing: '0.04em', color: 'primary.main' }}
          >
            TAX INVOICE
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {mode === 'proforma' ? 'Preview — for review before issue' : 'Original for recipient'}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Chip size="small" icon={<VerifiedIcon sx={{ '&&': { fontSize: 16 } }} />} label={documentTypeLabel} color="primary" variant="outlined" />
          <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
            <PdfIcon sx={{ fontSize: 18 }} />
            <Typography variant="caption">Number & date are assigned on issue</Typography>
          </Stack>
        </Stack>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Place of supply: {placeOfSupply} · {isInterState ? 'Inter-state (IGST)' : 'Intra-state (CGST + SGST)'}
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
              (fixer-backend <code style={{ fontSize: '0.8em' }}>PDFService</code> / company config).
            </Typography>
          </Box>
        }
      />

      <TableContainer sx={{ my: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Table size="small" sx={{ '& th': { fontWeight: 700, bgcolor: 'action.hover' } }}>
          <TableHead>
            <TableRow>
              <TableCell width="5%">#</TableCell>
              <TableCell>Description</TableCell>
              <TableCell width="10%" align="right">
                HSN/SAC
              </TableCell>
              <TableCell width="8%" align="right">
                Qty
              </TableCell>
              <TableCell width="10%" align="right">
                Rate (₹)
              </TableCell>
              <TableCell width="11%" align="right">
                Taxable
              </TableCell>
              <TableCell width="10%" align="right">
                GST
              </TableCell>
              <TableCell width="12%" align="right">
                Total
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lineRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
                <TableCell align="right" sx={{ fontFeatureSettings: '"tnum"' }}>
                  {r.hsnSac}
                </TableCell>
                <TableCell align="right">{r.quantity}</TableCell>
                <TableCell align="right">{ru(r.unitPrice)}</TableCell>
                <TableCell align="right">{ru(r.taxable)}</TableCell>
                <TableCell align="right">{ru(r.taxAmount)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {ru(r.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={1} alignItems="flex-end" sx={{ maxWidth: 400, ml: 'auto' }}>
        <Row label="Subtotal (taxable value)" value={ru(subtotal)} />
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
        {discount > 0 && <Row label="Less: discount / adjustment" value={`−${ru(discount)}`} />}
        <Divider sx={{ width: '100%', my: 0.5 }} />
        <Row label="Net payable (INR)" value={ru(grandTotal)} large />
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

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
        Amounts follow server calculation: per-line 18% GST, then discount applied to grand total. For queries, see
        fixer-backend InvoiceService.
      </Typography>
    </Paper>
  )
}

function Row({ label, value, large, muted, bold }: { label: string; value: string; large?: boolean; muted?: boolean; bold?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" width="100%" alignItems="baseline" spacing={2}>
      <Typography variant={large ? 'subtitle1' : 'body2'} color={muted ? 'text.secondary' : 'text.primary'} fontWeight={bold === false ? 400 : 600}>
        {label}
      </Typography>
      <Typography
        variant={large ? 'h6' : 'body2'}
        fontWeight={700}
        color="primary.main"
        sx={{ fontFeatureSettings: '"tnum"' }}
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
