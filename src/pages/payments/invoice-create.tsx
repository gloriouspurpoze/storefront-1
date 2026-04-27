import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  MenuItem,
  Stack,
  IconButton,
  Alert,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Paper,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ReceiptLong as ReceiptLongIcon,
  Download as DownloadIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  Summarize as PreviewIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import {
  InvoicesService,
  type ManualInvoiceLineItem,
  type ManualInvoicePayload,
} from '../../services/api/invoices.service'
import { appToast } from '../../lib/appToast'
import { computeInvoiceFromLines, isInterStateForPreview } from './invoicePreviewData'
import { InvoicePreviewPanel } from './InvoicePreviewPanel'
import {
  PAYMENT_METHOD_CHOICES,
  type BackendPaymentMethod,
  paymentMethodLabel,
} from '../../lib/invoicePaymentMethod'

const OBJ_ID = /^[a-f0-9]{24}$/i

const SERVICE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'ac-repair', label: 'AC repair' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'subscription', label: 'Subscription / digital' },
]

const GOODS_CATEGORIES: { value: string; label: string }[] = [
  { value: 'product', label: 'General goods (HSN)' },
  { value: 'appliance', label: 'Appliances & parts' },
  { value: 'hardware', label: 'Tools & hardware' },
  { value: 'subscription', label: 'Subscription / digital' },
]

const INVOICE_TYPES: { value: ManualInvoicePayload['type']; label: string; hint: string }[] = [
  {
    value: 'service',
    label: 'Service (labour, visits)',
    hint: 'Repairs, installation, home services (SAC lines).',
  },
  {
    value: 'product',
    label: 'Product (goods, parts)',
    hint: 'Spares, materials, retail (HSN lines).',
  },
  { value: 'subscription', label: 'Subscription / recurring', hint: 'Recurring or digital add-ons.' },
]

const OFFLINE_GUEST = (process.env.REACT_APP_INVOICE_OFFLINE_GUEST_USER_ID || '').trim()
const COMPANY_STATE =
  (process.env.REACT_APP_INVOICE_COMPANY_STATE || '').trim() || 'Maharashtra'

const STEPS = ['Document & customer', 'Lines & charges', 'Preview & issue']

const emptyItem = (lineKind: ManualInvoiceLineItem['lineKind'] = 'service'): ManualInvoiceLineItem => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  lineKind,
  category: lineKind === 'product' ? 'product' : 'electrical',
})

function extractCreatedInvoiceId(res: { data?: unknown } | null | undefined): string | null {
  const d = res?.data as Record<string, unknown> | null | undefined
  if (!d) return null
  if (typeof d._id === 'string') return d._id
  const inv = d.invoice as { _id?: string } | undefined
  if (inv?._id) return inv._id
  return null
}

function maskId(id: string) {
  if (id.length <= 8) return id
  return `${id.slice(0, 6)}…${id.slice(-4)}`
}

export function InvoiceCreate() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)

  const [customerMode, setCustomerMode] = useState<'platform' | 'offline'>('offline')
  const [type, setType] = useState<ManualInvoicePayload['type']>('service')
  const [customerId, setCustomerId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [customerReference, setCustomerReference] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<BackendPaymentMethod>('cash')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState('0')
  const [items, setItems] = useState<ManualInvoiceLineItem[]>([emptyItem('service')])
  const [emailAfterCreate, setEmailAfterCreate] = useState(true)

  const [billingTo, setBillingTo] = useState({
    name: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstin: '',
  })

  const setBill = useCallback(
    (field: keyof typeof billingTo, value: string) => {
      setBillingTo((b) => ({ ...b, [field]: value }))
    },
    []
  )

  const defaultLineKind: ManualInvoiceLineItem['lineKind'] = useMemo(
    () => (type === 'product' ? 'product' : 'service'),
    [type]
  )

  const { lines, subtotal, totalTax, discount: discountN, grandTotal } = useMemo(
    () => computeInvoiceFromLines(items, discount),
    [items, discount]
  )

  const isInterState = isInterStateForPreview(billingTo.state, COMPANY_STATE)
  const documentTypeLabel = INVOICE_TYPES.find((t) => t.value === type)?.label ?? 'Invoice'

  const addItem = () => setItems((rows) => [...rows, emptyItem(defaultLineKind)])
  const removeItem = (index: number) => {
    setItems((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)))
  }

  const setItem = (index: number, field: keyof ManualInvoiceLineItem, value: string | number) => {
    setItems((rows) => {
      const next = [...rows]
      const row = { ...next[index], [field]: value } as ManualInvoiceLineItem
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(value) : row.quantity
        const p = field === 'unitPrice' ? Number(value) : row.unitPrice
        if (q < 0.001) row.quantity = 1
        if (p < 0) row.unitPrice = 0
      }
      if (field === 'lineKind') {
        const k = value as 'product' | 'service'
        row.lineKind = k
        row.category = k === 'product' ? 'product' : 'electrical'
      }
      next[index] = row
      return next
    })
  }

  const lineCategoriesFor = (kind: ManualInvoiceLineItem['lineKind']) =>
    kind === 'product' ? GOODS_CATEGORIES : SERVICE_CATEGORIES

  const validateStep0 = useCallback((): boolean => {
    if (customerMode === 'platform' && !OBJ_ID.test(customerId.trim())) {
      appToast('Enter a valid customer User ID, or use Walk-in / offline.', 'error')
      return false
    }
    if (!billingTo.name.trim() || !billingTo.phone.trim() || !billingTo.addressLine1.trim()) {
      appToast('Fill Bill to: name, phone, and address line 1.', 'error')
      return false
    }
    return true
  }, [billingTo, customerId, customerMode])

  const validateStep1 = useCallback((): boolean => {
    const clean = items.filter(
      (it) => it.description.trim() && it.quantity > 0 && it.unitPrice >= 0
    )
    if (clean.length === 0) {
      appToast('Add at least one line item.', 'error')
      return false
    }
    return true
  }, [items])

  const handleNext = () => {
    if (activeStep === 0) {
      if (!validateStep0()) return
    }
    if (activeStep === 1) {
      if (!validateStep1()) return
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0))
  }

  const billingAddressLines = useMemo(() => {
    const lines: string[] = [billingTo.addressLine1, billingTo.addressLine2]
      .map((s) => s.trim())
      .filter(Boolean)
    lines.push(`${billingTo.city.trim()}, ${billingTo.state.trim()} – ${billingTo.pincode.trim()}`)
    return lines
  }, [billingTo])

  const doSubmit = async () => {
    if (!validateStep0() || !validateStep1()) return
    if (customerMode === 'platform' && !OBJ_ID.test(customerId.trim())) {
      appToast('Valid customer ID required.', 'error')
      return
    }

    const cleanItems = items.filter(
      (it) => it.description.trim() && it.quantity > 0 && it.unitPrice >= 0
    )
    if (cleanItems.length === 0) {
      appToast('Add at least one line item.', 'error')
      return
    }

    const payload: ManualInvoicePayload = {
      type,
      isOfflineCustomer: customerMode === 'offline',
      customerReference: customerReference.trim() || undefined,
      billingTo: {
        name: billingTo.name.trim(),
        phone: billingTo.phone.trim(),
        email: billingTo.email.trim() || undefined,
        addressLine1: billingTo.addressLine1.trim(),
        addressLine2: billingTo.addressLine2.trim() || undefined,
        city: billingTo.city.trim(),
        state: billingTo.state.trim(),
        pincode: billingTo.pincode.trim(),
        gstin: billingTo.gstin.trim() || undefined,
      },
      items: cleanItems.map((it) => ({
        description: it.description.trim(),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        category: it.category,
        lineKind: it.lineKind,
      })),
      discount: discountN,
      notes: notes.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
    }

    if (customerMode === 'platform') {
      payload.customerId = customerId.trim()
    } else if (OFFLINE_GUEST && OBJ_ID.test(OFFLINE_GUEST)) {
      payload.customerId = OFFLINE_GUEST
    }
    if (bookingId.trim() && OBJ_ID.test(bookingId.trim())) {
      payload.bookingId = bookingId.trim()
    }
    if (orderId.trim() && OBJ_ID.test(orderId.trim())) {
      payload.orderId = orderId.trim()
    }

    setSubmitting(true)
    try {
      const res = await InvoicesService.generateInvoiceManual(payload)
      if (res?.success) {
        const id = extractCreatedInvoiceId(res)
        if (id) setCreatedInvoiceId(id)
        if (emailAfterCreate && billingTo.email.trim() && id) {
          try {
            await InvoicesService.emailInvoiceToCustomer(id)
            appToast('Invoice created and emailed.', 'success')
          } catch {
            appToast('Created — email failed. Download from the next step or the list.', 'error')
          }
        } else {
          appToast('Invoice created. PDF is on the server.', 'success')
        }
        if (id) {
          setSuccessOpen(true)
        } else {
          navigate('/invoices')
        }
      }
    } catch (err: unknown) {
      appToast(err instanceof Error ? err.message : 'Failed to create invoice', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async () => {
    if (!createdInvoiceId) return
    const r = await InvoicesService.downloadInvoicePDF(createdInvoiceId)
    if (r && 'success' in r && r.success) {
      appToast('Download started', 'success')
    } else {
      appToast('Download failed — use the Invoices list.', 'error')
    }
  }

  const doneSuccess = () => {
    setSuccessOpen(false)
    navigate('/invoices')
  }

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (activeStep < 2) return
        void doSubmit()
      }}
      sx={{
        minHeight: '100vh',
        bgcolor: (t) => (t.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
        pb: 4,
      }}
    >
      <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
        <PageHeader
          title="Create tax invoice"
          subtitle="GST-compliant manual billing — services &amp; products, app users or walk-in customers. Aligned with fixer-backend /api/invoices/generate and PDFService."
          icon={<ReceiptLongIcon fontSize="large" />}
          action={
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/invoices')}
              variant="outlined"
            >
              Invoices
            </Button>
          }
        />

        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
        >
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  optional={
                    label === 'Preview & issue' ? (
                      <Typography variant="caption" color="text.secondary">
                        Review + issue
                      </Typography>
                    ) : undefined
                  }
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <Alert severity="info" icon={<PreviewIcon fontSize="inherit" />} sx={{ py: 1.5 }}>
              Walk-in: no User ID. Platform: link to Mongo <code>User._id</code>. Optional{' '}
              <code>REACT_APP_INVOICE_OFFLINE_GUEST_USER_ID</code> for backend systems that need a
              placeholder id.
            </Alert>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="primary" fontWeight={700}>
                  Document
                </Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Invoice class"
                      select
                      fullWidth
                      value={type}
                      onChange={(e) => {
                        const t = e.target.value as ManualInvoicePayload['type']
                        setType(t)
                        if (t === 'product') {
                          setItems((rows) =>
                            rows.length
                              ? rows.map((r) => ({
                                  ...r,
                                  lineKind: 'product' as const,
                                  category: 'product',
                                }))
                              : [emptyItem('product')]
                          )
                        } else {
                          setItems((rows) =>
                            rows.length
                              ? rows.map((r) => ({
                                  ...r,
                                  lineKind: 'service' as const,
                                  category: 'electrical',
                                }))
                              : [emptyItem('service')]
                          )
                        }
                      }}
                    >
                      {INVOICE_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {INVOICE_TYPES.find((x) => x.value === type)?.hint}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="primary" fontWeight={700}>
                  Customer
                </Typography>
                <ToggleButtonGroup
                  color="primary"
                  value={customerMode}
                  exclusive
                  onChange={(_, v) => v && setCustomerMode(v)}
                  sx={{ my: 2, display: 'flex', flexWrap: 'wrap' }}
                >
                  <ToggleButton value="offline">Walk-in / offline</ToggleButton>
                  <ToggleButton value="platform">Platform (User ID)</ToggleButton>
                </ToggleButtonGroup>
                <Grid container spacing={2}>
                  {customerMode === 'platform' ? (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Customer user ID (MongoDB)"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value.trim())}
                        placeholder="24 hex characters"
                        helperText="For CRM and portal"
                      />
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="success" variant="outlined" sx={{ py: 0.5 }}>
                        {OFFLINE_GUEST
                          ? 'Backend linkage will use the configured guest user id.'
                          : 'Backend may require REACT_APP_INVOICE_OFFLINE_GUEST_USER_ID in .env.'}
                      </Alert>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your reference (LPO, work order, ticket)"
                      value={customerReference}
                      onChange={(e) => setCustomerReference(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="primary" fontWeight={700}>
                  Bill to — place of supply
                </Typography>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Legal / billing name"
                      value={billingTo.name}
                      onChange={(e) => setBill('name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Phone"
                      value={billingTo.phone}
                      onChange={(e) => setBill('phone', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="email"
                      label="Email (for sending PDF)"
                      value={billingTo.email}
                      onChange={(e) => setBill('email', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer GSTIN (B2B)"
                      value={billingTo.gstin}
                      onChange={(e) => setBill('gstin', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Address line 1"
                      value={billingTo.addressLine1}
                      onChange={(e) => setBill('addressLine1', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address line 2"
                      value={billingTo.addressLine2}
                      onChange={(e) => setBill('addressLine2', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="City" value={billingTo.city} onChange={(e) => setBill('city', e.target.value)} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      required
                      label="State (place of supply)"
                      value={billingTo.state}
                      onChange={(e) => setBill('state', e.target.value)}
                      helperText={`Your company is configured in preview as: ${COMPANY_STATE}`}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Pincode" value={billingTo.pincode} onChange={(e) => setBill('pincode', e.target.value)} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={2.5}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
                  <div>
                    <Typography variant="h6" fontWeight={600}>
                      Line items
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ex‑GST unit rates. GST is computed per line (18%) like fixer-backend InvoiceService; invoice discount
                      is applied to the final total.
                    </Typography>
                  </div>
                  <Button type="button" startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small">
                    Add line
                  </Button>
                </Box>
                <Stack spacing={2}>
                  {items.map((row, index) => {
                    const kind = row.lineKind || defaultLineKind
                    const catOptions = lineCategoriesFor(kind)
                    return (
                      <Box key={index}>
                        <Grid container spacing={1} alignItems="flex-start">
                          <Grid item xs={12} md={3}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Description"
                              value={row.description}
                              onChange={(e) => setItem(index, 'description', e.target.value)}
                            />
                          </Grid>
                          <Grid item xs={4} md={2}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Qty"
                              inputProps={{ min: 0.001, step: 0.01 }}
                              value={row.quantity}
                              onChange={(e) => setItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </Grid>
                          <Grid item xs={4} md={2}>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              label="Unit (₹ ex‑GST)"
                              inputProps={{ min: 0, step: 0.01 }}
                              value={row.unitPrice}
                              onChange={(e) => setItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </Grid>
                          <Grid item xs={4} md={2}>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              label="Type"
                              value={kind}
                              onChange={(e) => setItem(index, 'lineKind', e.target.value as 'product' | 'service')}
                            >
                              <MenuItem value="service">Service (SAC)</MenuItem>
                              <MenuItem value="product">Goods (HSN)</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <TextField
                              fullWidth
                              size="small"
                              select
                              label="Category"
                              value={row.category || (kind === 'product' ? 'product' : 'electrical')}
                              onChange={(e) => setItem(index, 'category', e.target.value)}
                            >
                              {catOptions.map((c) => (
                                <MenuItem key={c.value} value={c.value}>
                                  {c.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={6} md={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                            <IconButton
                              type="button"
                              size="small"
                              aria-label="Remove line"
                              onClick={() => removeItem(index)}
                              disabled={items.length <= 1}
                            >
                              <RemoveIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                        {index < items.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography fontWeight={600} gutterBottom>
                      Links
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Service booking (optional)"
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value.trim())}
                        placeholder="24-char id"
                        helperText="Tie to a home-service booking"
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Store order (optional)"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value.trim())}
                        placeholder="24-char id"
                        helperText="Tie to an e-commerce order"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography fontWeight={600} gutterBottom>
                      Collection &amp; terms
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Payment method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as BackendPaymentMethod)}
                      helperText="Must match server enum (avoids 500 on save)"
                      sx={{ mb: 2 }}
                    >
                      {PAYMENT_METHOD_CHOICES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Invoice discount (₹) — after tax, per server"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      label="Notes (PDF)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      sx={{ mt: 2 }}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={emailAfterCreate}
                          onChange={(e) => setEmailAfterCreate(e.target.checked)}
                        />
                      }
                      label="Email client after create"
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6} sx={{ ml: { md: 'auto' } }}>
                <Card sx={{ bgcolor: (t) => (t.palette.mode === 'dark' ? 'grey.900' : 'primary.50') }}>
                  <CardContent>
                    <Typography fontWeight={700} gutterBottom color="primary">
                      Live summary (matches backend)
                    </Typography>
                    <Stack spacing={0.5}>
                      <Line label="Taxable (lines)" v={subtotal} />
                      <Line label="GST 18% (lines)" v={totalTax} />
                      <Line label="Less discount" v={-discountN} muted />
                      <Divider />
                      <Line label="Net payable" v={grandTotal} bold />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        )}

        {activeStep === 2 && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Check customer name, state (place of supply), amounts, and payment mode. Issuing will call{' '}
              <code>POST /api/invoices/generate</code> (admin) and then PDF generation, same as online flows.
            </Alert>
            <InvoicePreviewPanel
              documentTypeLabel={documentTypeLabel}
              customerMode={customerMode}
              customerReference={customerReference || undefined}
              platformCustomerIdMasked={customerMode === 'platform' ? maskId(customerId) : undefined}
              billingName={billingTo.name}
              billingAddressLines={billingAddressLines}
              billingPhone={billingTo.phone}
              billingEmail={billingTo.email || undefined}
              billingGstin={billingTo.gstin || undefined}
              lineRows={lines}
              subtotal={subtotal}
              totalTax={totalTax}
              discount={discountN}
              grandTotal={grandTotal}
              isInterState={isInterState}
              placeOfSupply={billingTo.state}
              paymentMethod={paymentMethodLabel(paymentMethod)}
              notes={notes}
              companyStateLabel={COMPANY_STATE}
            />
          </Box>
        )}

        <Paper
          elevation={2}
          sx={{
            p: 2,
            mt: 3,
            position: 'sticky',
            bottom: 16,
            zIndex: 3,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Button type="button" onClick={handleBack} disabled={activeStep === 0} startIcon={<BackIcon />}>
            Back
          </Button>
          {activeStep < 2 && (
            <Button type="button" variant="contained" onClick={handleNext} endIcon={<NextIcon />}>
              {activeStep === 0 ? 'Continue' : 'Review preview'}
            </Button>
          )}
          {activeStep === 2 && (
            <Button type="submit" variant="contained" size="large" disabled={submitting} endIcon={<ReceiptLongIcon />}>
              {submitting ? 'Issuing…' : 'Issue invoice'}
            </Button>
          )}
        </Paper>
      </Box>

      <Dialog open={successOpen} onClose={doneSuccess} fullWidth maxWidth="sm">
        <DialogTitle>Invoice issued</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            PDF is on the server. You can also download a copy for walk-in handover.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 2, pb: 2 }}>
          <Button onClick={doneSuccess} color="inherit">
            List
          </Button>
          {createdInvoiceId && (
            <Button startIcon={<DownloadIcon />} variant="contained" onClick={handleDownload}>
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

function Line({ label, v, bold, muted }: { label: string; v: number; bold?: boolean; muted?: boolean }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color={muted ? 'text.secondary' : 'text.primary'} fontWeight={bold ? 700 : 500}>
        {label}
      </Typography>
      <Typography variant="body2" color={bold ? 'primary' : 'text.primary'} fontWeight={bold ? 800 : 500} sx={{ fontFeatureSettings: '"tnum"' }}>
        ₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Typography>
    </Box>
  )
}
