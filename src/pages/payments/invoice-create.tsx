import React, { useState, useCallback } from 'react'
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
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ReceiptLong as ReceiptLongIcon,
} from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { InvoicesService, type ManualInvoiceLineItem, type ManualInvoicePayload } from '../../services/api/invoices.service'
import { appToast } from '../../lib/appToast'

const OBJ_ID = /^[a-f0-9]{24}$/i

const HSN_CATEGORIES: { value: string; label: string }[] = [
  { value: 'ac-repair', label: 'AC repair' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'painting', label: 'Painting' },
  { value: 'subscription', label: 'Subscription / digital' },
  { value: 'product', label: 'Product' },
]

const INVOICE_TYPES: { value: ManualInvoicePayload['type']; label: string }[] = [
  { value: 'service', label: 'Service' },
  { value: 'product', label: 'Product' },
  { value: 'subscription', label: 'Subscription' },
]

const emptyItem = (): ManualInvoiceLineItem => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  category: 'electrical',
})

export function InvoiceCreate() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)

  const [type, setType] = useState<ManualInvoicePayload['type']>('service')
  const [customerId, setCustomerId] = useState('')
  const [bookingId, setBookingId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState('0')
  const [items, setItems] = useState<ManualInvoiceLineItem[]>([emptyItem()])

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

  const addItem = () => setItems((rows) => [...rows, emptyItem()])
  const removeItem = (index: number) => {
    setItems((rows) => (rows.length <= 1 ? rows : rows.filter((_, i) => i !== index)))
  }
  const setItem = (index: number, field: keyof ManualInvoiceLineItem, value: string | number) => {
    setItems((rows) => {
      const next = [...rows]
      const row = { ...next[index], [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        const q = field === 'quantity' ? Number(value) : row.quantity
        const p = field === 'unitPrice' ? Number(value) : row.unitPrice
        if (q < 0.001) row.quantity = 1
        if (p < 0) row.unitPrice = 0
      }
      next[index] = row
      return next
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!OBJ_ID.test(customerId.trim())) {
      appToast('Enter a valid Customer ID (24-character MongoDB ObjectId).', 'error')
      return
    }
    if (!billingTo.name.trim() || !billingTo.phone.trim() || !billingTo.addressLine1.trim()) {
      appToast('Name, phone, and address line 1 are required in Bill To.', 'error')
      return
    }
    const cleanItems = items.filter(
      (it) => it.description.trim() && it.quantity > 0 && it.unitPrice >= 0
    )
    if (cleanItems.length === 0) {
      appToast('Add at least one line item with a description and unit price.', 'error')
      return
    }

    const payload: ManualInvoicePayload = {
      type,
      customerId: customerId.trim(),
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
      })),
      discount: Math.max(0, parseFloat(discount) || 0),
      notes: notes.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
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
        appToast('Invoice created. PDF generated on server.', 'success')
        navigate('/invoices')
      }
    } catch (err: any) {
      appToast(err?.message || 'Failed to create invoice', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }} component="form" onSubmit={onSubmit}>
      <PageHeader
        title="Create manual invoice"
        subtitle="Flexible tax invoice: line items, Bill To, optional booking / order link. PDF is built by the server using the same template as customer invoices."
        icon={<ReceiptLongIcon fontSize="large" />}
        action={
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/invoices')}
            variant="outlined"
          >
            Back to list
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        Current backend behavior: manual invoices are stored as issued with the full amount recorded as
        paid (typical for admin adjustments after collection). For draft / open amounts, extend the
        API separately.
      </Alert>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Type &amp; links
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Invoice type"
                select
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value as ManualInvoicePayload['type'])}
              >
                {INVOICE_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Customer user ID (MongoDB)"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value.trim())}
                placeholder="e.g. 507f1f77bcf86cd799439011"
                helperText="User._id the invoice belongs to (for CRM / portal linkage)"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Payment method (optional)"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                placeholder="online, upi, card…"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Link to booking (optional)"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value.trim())}
                placeholder="24-char ObjectId"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Link to order (optional)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.trim())}
                placeholder="24-char ObjectId"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bill to (customer)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Name" value={billingTo.name} onChange={(e) => setBill('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Phone" value={billingTo.phone} onChange={(e) => setBill('phone', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="email" label="Email" value={billingTo.email} onChange={(e) => setBill('email', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GSTIN (B2B)"
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
              <TextField fullWidth label="State" value={billingTo.state} onChange={(e) => setBill('state', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Pincode" value={billingTo.pincode} onChange={(e) => setBill('pincode', e.target.value)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
            <Typography variant="h6">Line items (GST 18% applied per platform rules; HSN/SAC from category)</Typography>
            <Button type="button" startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small">
              Add line
            </Button>
          </Box>
          <Stack spacing={2}>
            {items.map((row, index) => (
              <Box key={index}>
                <Grid container spacing={1} alignItems="flex-start">
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      value={row.description}
                      onChange={(e) => setItem(index, 'description', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={4} sm={2}>
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
                  <Grid item xs={4} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Unit price (₹)"
                      inputProps={{ min: 0, step: 0.01 }}
                      value={row.unitPrice}
                      onChange={(e) => setItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      select
                      label="Category / HSN map"
                      value={row.category}
                      onChange={(e) => setItem(index, 'category', e.target.value)}
                    >
                      {HSN_CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
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
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Discount (₹)"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Notes (printed on PDF)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" size="large" disabled={submitting} sx={{ minWidth: 200 }}>
                {submitting ? 'Creating…' : 'Create invoice & PDF'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
