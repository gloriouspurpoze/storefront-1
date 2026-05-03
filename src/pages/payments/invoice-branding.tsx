import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  RestartAlt as ResetIcon,
  Save as SaveIcon,
  Palette as PaletteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { appToast } from '../../lib/appToast'
import {
  type InvoiceBranding,
  fileToLogoDataUrl,
  loadInvoiceBranding,
  saveInvoiceBranding,
  DEFAULT_INVOICE_BRANDING,
} from '../../lib/invoiceBranding'
import { InvoicePreviewPanel } from './InvoicePreviewPanel'
import { computeInvoiceFromLines, isInterStateForPreview } from './invoicePreviewData'
import type { ManualInvoiceLineItem } from '../../services/api/invoices.service'

const COMPANY_STATE = (process.env.REACT_APP_INVOICE_COMPANY_STATE || '').trim() || 'Maharashtra'

const SAMPLE_ITEMS: ManualInvoiceLineItem[] = [
  {
    description: 'Site visit & labour (sample)',
    quantity: 2,
    unitPrice: 1850,
    lineKind: 'service',
    category: 'electrical',
  },
  {
    description: 'Materials / consumables',
    quantity: 1,
    unitPrice: 640,
    lineKind: 'product',
    category: 'hardware',
  },
]

function parseAddressBlock(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 8)
}

export function InvoiceBrandingPage() {
  const [draft, setDraft] = useState<InvoiceBranding>(() => loadInvoiceBranding())
  const [addressText, setAddressText] = useState(() => loadInvoiceBranding().supplierAddressLines.join('\n'))

  const previewComputed = useMemo(() => computeInvoiceFromLines(SAMPLE_ITEMS, 150), [])
  const sampleBilling = useMemo(
    () => ({
      name: 'Sample Customer Pvt Ltd',
      lines: ['402 Blue Tower', 'BKC', 'Mumbai'],
      phone: '+91 98765 43210',
      email: 'accounts@example.com',
      gstin: '27AAAAA0000A1Z5',
      state: 'Maharashtra',
    }),
    []
  )

  const isInter = isInterStateForPreview(sampleBilling.state, COMPANY_STATE)

  const patch = (p: Partial<InvoiceBranding>) => setDraft((d) => ({ ...d, ...p }))

  const handleSave = () => {
    const next: InvoiceBranding = {
      ...draft,
      supplierAddressLines: parseAddressBlock(addressText),
    }
    saveInvoiceBranding(next)
    setDraft(loadInvoiceBranding())
    appToast('Invoice appearance saved. Previews use these settings on this device.', 'success')
  }

  const handleReset = () => {
    saveInvoiceBranding(DEFAULT_INVOICE_BRANDING)
    const d = loadInvoiceBranding()
    setDraft(d)
    setAddressText(d.supplierAddressLines.join('\n'))
    appToast('Reset to defaults', 'info')
  }

  const onLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const dataUrl = await fileToLogoDataUrl(f)
      patch({ logoDataUrl: dataUrl })
      appToast('Logo updated', 'success')
    } catch (err: unknown) {
      appToast(err instanceof Error ? err.message : 'Could not load logo', 'error')
    }
  }

  const brandingForPreview: InvoiceBranding = {
    ...draft,
    supplierAddressLines: parseAddressBlock(addressText),
  }

  return (
    <Box sx={{ pb: 4 }}>
      <PageHeader
        title="Invoice appearance"
        subtitle="Logo, brand colours, and supplier details shown on the in-app invoice preview. PDFs from the server still use backend company config unless your API is extended to accept this profile."
        icon={<PaletteIcon sx={{ fontSize: 36 }} />}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={Link} to="/invoices" variant="outlined" startIcon={<BackIcon />}>
              Invoices
            </Button>
            <Button component={Link} to="/invoices/create" variant="outlined">
              Create invoice
            </Button>
          </Stack>
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Settings are stored in this browser (<strong>localStorage</strong>). For multi-admin teams, mirror the same values in
        Settings → General or add an API field later. Exported PDFs typically require matching fields in fixer-backend{' '}
        <code>PDFService</code> / company model.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={5}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography fontWeight={700} gutterBottom>
                  Logo
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.showLogo}
                        onChange={(_, v) => patch({ showLogo: v })}
                      />
                    }
                    label="Show logo on preview"
                  />
                  <Button variant="outlined" component="label">
                    Upload logo (PNG / JPG / SVG)
                    <input type="file" accept="image/*" hidden onChange={onLogoFile} />
                  </Button>
                  {draft.logoDataUrl && (
                    <Button color="inherit" size="small" onClick={() => patch({ logoDataUrl: null })}>
                      Remove logo
                    </Button>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Max ~450 KB. Wide logos work best (≤180×56 px display).
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography fontWeight={700} gutterBottom>
                  Colours
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  <TextField
                    label="Primary"
                    type="color"
                    value={draft.primaryColor}
                    onChange={(e) => patch({ primaryColor: e.target.value })}
                    sx={{ width: 120 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Accent (totals)"
                    type="color"
                    value={draft.accentColor}
                    onChange={(e) => patch({ accentColor: e.target.value })}
                    sx={{ width: 120 }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <TextField
                  fullWidth
                  size="small"
                  label="Primary (hex)"
                  value={draft.primaryColor}
                  onChange={(e) => patch({ primaryColor: e.target.value })}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Accent (hex)"
                  value={draft.accentColor}
                  onChange={(e) => patch({ accentColor: e.target.value })}
                />
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography fontWeight={700} gutterBottom>
                  Document & company
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Document title"
                    value={draft.documentTitle}
                    onChange={(e) => patch({ documentTitle: e.target.value })}
                    helperText="e.g. TAX INVOICE, PROFORMA INVOICE"
                  />
                  <TextField
                    label="Display name"
                    value={draft.companyDisplayName}
                    onChange={(e) => patch({ companyDisplayName: e.target.value })}
                  />
                  <TextField
                    label="Legal name (optional)"
                    value={draft.companyLegalName}
                    onChange={(e) => patch({ companyLegalName: e.target.value })}
                  />
                  <TextField
                    label="Tagline (optional)"
                    value={draft.tagline}
                    onChange={(e) => patch({ tagline: e.target.value })}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography fontWeight={700} gutterBottom>
                  Supplier block (Bill from)
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Address"
                    multiline
                    minRows={4}
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    helperText="One line per row — printed under company name"
                  />
                  <TextField
                    label="Phone"
                    value={draft.supplierPhone}
                    onChange={(e) => patch({ supplierPhone: e.target.value })}
                  />
                  <TextField
                    label="Email"
                    value={draft.supplierEmail}
                    onChange={(e) => patch({ supplierEmail: e.target.value })}
                  />
                  <TextField
                    label="Website"
                    value={draft.supplierWebsite}
                    onChange={(e) => patch({ supplierWebsite: e.target.value })}
                  />
                  <TextField
                    label="GSTIN"
                    value={draft.supplierGstin}
                    onChange={(e) => patch({ supplierGstin: e.target.value })}
                  />
                  <TextField
                    label="PAN (optional)"
                    value={draft.supplierPan}
                    onChange={(e) => patch({ supplierPan: e.target.value })}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography fontWeight={700} gutterBottom>
                  Footer & banking
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Footer note"
                    multiline
                    minRows={3}
                    value={draft.footerNote}
                    onChange={(e) => patch({ footerNote: e.target.value })}
                  />
                  <TextField
                    label="Bank / UPI details (optional)"
                    multiline
                    minRows={3}
                    value={draft.bankDetails}
                    onChange={(e) => patch({ bankDetails: e.target.value })}
                    helperText="Shown in supplier panel — IBAN, IFSC, UPI ID, etc."
                  />
                </Stack>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                Save appearance
              </Button>
              <Button color="inherit" startIcon={<ResetIcon />} onClick={handleReset}>
                Reset defaults
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Live preview (sample customer & lines)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <InvoicePreviewPanel
            branding={brandingForPreview}
            documentTypeLabel="Service & goods"
            customerMode="platform"
            customerReference="PO-2026-0142"
            billingName={sampleBilling.name}
            billingAddressLines={sampleBilling.lines}
            billingPhone={sampleBilling.phone}
            billingEmail={sampleBilling.email}
            billingGstin={sampleBilling.gstin}
            lineRows={previewComputed.lines}
            subtotal={previewComputed.subtotal}
            totalTax={previewComputed.totalTax}
            discount={previewComputed.discount}
            grandTotal={previewComputed.grandTotal}
            isInterState={isInter}
            placeOfSupply={sampleBilling.state}
            paymentMethod="UPI / Bank transfer"
            notes="Sample remarks — GST 18% per line."
            companyStateLabel={COMPANY_STATE}
            mode="proforma"
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default InvoiceBrandingPage
