import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Minus,
  Receipt,
  Download,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import {
  InvoicesService,
  type InvoicePdfTemplateId,
  type ManualInvoiceLineItem,
  type ManualInvoicePayload,
} from '../../services/api/invoices.service'
import { appToast } from '../../lib/appToast'
import {
  computeInvoiceFromLines,
  DEFAULT_GST_RATE,
  GST_RATE_CHOICES,
  isInterStateForPreview,
} from './invoicePreviewData'
import { InvoicePreviewPanel } from './InvoicePreviewPanel'
import { useInvoiceBranding } from '../../hooks/useInvoiceBranding'
import {
  PAYMENT_METHOD_CHOICES,
  type BackendPaymentMethod,
  paymentMethodLabel,
} from '../../lib/invoicePaymentMethod'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import { Separator } from '../../components/ui/separator'
import { HStack, VStack } from '../../components/ui/spacing'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

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

const PDF_TEMPLATES_CUSTOMER: { value: InvoicePdfTemplateId; label: string; hint: string }[] = [
  {
    value: 'customer_gst',
    label: 'Customer — Tax invoice (GST)',
    hint: 'HSN/SAC, taxable value, CGST/SGST or IGST — standard B2B/B2C GST layout.',
  },
  {
    value: 'customer_non_gst',
    label: 'Customer — Bill of supply / receipt (no GST)',
    hint: 'Single amounts, no tax breakdown — exempt/nil-rated/composite or gross receipt.',
  },
]

const PDF_TEMPLATES_VENDOR: { value: InvoicePdfTemplateId; label: string; hint: string }[] = [
  {
    value: 'vendor_non_gst',
    label: 'Vendor — Payout statement',
    hint: 'Partner settlement summary (default vendor layout).',
  },
  {
    value: 'vendor_gst',
    label: 'Vendor — Settlement (GST details)',
    hint: 'Same settlement with platform & recipient GSTIN banner for records.',
  },
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
  {
    value: 'provider_payout',
    label: 'Vendor / provider payout',
    hint: 'Settlement PDF to partner (uses vendor template set below).',
  },
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
  const [searchParams] = useSearchParams()
  const { branding: invoiceBranding } = useInvoiceBranding()
  const [activeStep, setActiveStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null)

  const [customerMode, setCustomerMode] = useState<'platform' | 'offline'>('offline')
  const [type, setType] = useState<ManualInvoicePayload['type']>('service')
  // GST is OPT-IN per request — admin must explicitly tick "Apply GST". Default off
  // so we never silently add tax to a walk-in receipt.
  const [applyGst, setApplyGst] = useState(false)
  const [gstRate, setGstRate] = useState<number>(DEFAULT_GST_RATE)
  const [pdfTemplate, setPdfTemplate] = useState<InvoicePdfTemplateId>('customer_non_gst')
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

  // Frontend treats "Apply GST" as the source of truth for tax math and the
  // chosen PDF template. Vendor payouts handle their own template enum below.
  const applyGstPreview = applyGst

  const { lines, subtotal, totalTax, discount: discountN, grandTotal, effectiveGstRate } = useMemo(
    () => computeInvoiceFromLines(items, discount, { applyGst: applyGstPreview, gstRate }),
    [items, discount, applyGstPreview, gstRate]
  )

  // Whenever the admin toggles GST, keep the PDF template in sync for the
  // customer flow so the issued PDF matches the preview.
  useEffect(() => {
    if (type === 'provider_payout') return
    setPdfTemplate(applyGst ? 'customer_gst' : 'customer_non_gst')
  }, [applyGst, type])

  useEffect(() => {
    if (type === 'provider_payout') {
      setPdfTemplate((t) => (t === 'vendor_gst' || t === 'vendor_non_gst' ? t : 'vendor_non_gst'))
    }
  }, [type])

  /** Deep-link from AMC contract detail: ?customerId=&amcContract= */
  useEffect(() => {
    const cid = searchParams.get('customerId')?.trim()
    const amc = searchParams.get('amcContract')?.trim()
    if (cid && OBJ_ID.test(cid)) {
      setCustomerMode('platform')
      setCustomerId(cid)
    }
    if (amc) {
      setCustomerReference((prev) => (prev.trim() ? prev : `AMC ${amc}`))
      setItems((rows) => {
        if (rows.length !== 1) return rows
        const only = rows[0]
        if (only.description.trim()) return rows
        return [{ ...only, description: `Annual maintenance contract (${amc})` }]
      })
    }
  }, [searchParams])

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
    const lineList: string[] = [billingTo.addressLine1, billingTo.addressLine2]
      .map((s) => s.trim())
      .filter(Boolean)
    lineList.push(`${billingTo.city.trim()}, ${billingTo.state.trim()} – ${billingTo.pincode.trim()}`)
    return lineList
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
      pdfTemplate,
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

  const templateOpts = type === 'provider_payout' ? PDF_TEMPLATES_VENDOR : PDF_TEMPLATES_CUSTOMER

  return (
    <form
      className="min-h-screen bg-muted/30 pb-8 dark:bg-zinc-950"
      onSubmit={(e) => {
        e.preventDefault()
        if (activeStep < 2) return
        void doSubmit()
      }}
    >
      <div className="mx-auto max-w-[1000px] p-4 sm:p-6">
        <PageHeader
          title="Create tax invoice"
          subtitle="GST-compliant manual billing — services &amp; products, app users or walk-in customers. Aligned with fixer-backend /api/invoices/generate and PDFService."
          icon={<Receipt className="h-8 w-8" />}
          action={
            <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Invoices
            </Button>
          }
        />

        <Card className="mb-4 border-border">
          <CardContent className="pt-6">
            <ol className="flex flex-wrap items-start justify-center gap-4 md:gap-8">
              {STEPS.map((label, i) => (
                <li key={label} className="flex max-w-[140px] flex-col items-center gap-1 text-center">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                      i === activeStep && 'bg-primary text-primary-foreground',
                      i < activeStep && 'bg-primary/25 text-primary',
                      i > activeStep && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {label === 'Preview & issue' && (
                    <span className="text-[10px] text-muted-foreground">Review + issue</span>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {activeStep === 0 && (
          <VStack className="gap-6">
            <div
              className="flex gap-3 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm dark:border-sky-900 dark:bg-sky-950/40"
              role="status"
            >
              <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 dark:text-sky-200" />
              <p>
                Walk-in: no User ID. Platform: link to Mongo <code className="rounded bg-white/60 px-1 dark:bg-black/30">User._id</code>.
                Optional{' '}
                <code className="rounded bg-white/60 px-1 dark:bg-black/30">REACT_APP_INVOICE_OFFLINE_GUEST_USER_ID</code> for
                backend systems that need a placeholder id.
              </p>
            </div>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="text-xs font-bold uppercase text-primary">Document</p>
                <div className="grid gap-4 md:grid-cols-1">
                  <div className="space-y-2 md:max-w-xl">
                    <Label htmlFor="inv-class">Invoice class</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => {
                        const t = v as ManualInvoicePayload['type']
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
                      <SelectTrigger id="inv-class">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVOICE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">{INVOICE_TYPES.find((x) => x.value === type)?.hint}</p>
                  </div>
                  <div className="space-y-2 md:max-w-xl">
                    <Label htmlFor="pdf-template">PDF template</Label>
                    <Select
                      value={pdfTemplate}
                      onValueChange={(v) => {
                        const next = v as InvoicePdfTemplateId
                        setPdfTemplate(next)
                        if (next === 'customer_gst') setApplyGst(true)
                        if (next === 'customer_non_gst') setApplyGst(false)
                      }}
                    >
                      <SelectTrigger id="pdf-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateOpts.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {templateOpts.find((x) => x.value === pdfTemplate)?.hint}
                    </p>
                    {type !== 'provider_payout' && (
                      <p className="text-[11px] text-muted-foreground">
                        Tip: enable <strong>Apply GST</strong> in step 2 to switch to the Tax-invoice
                        template — or pick it here directly.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="text-xs font-bold uppercase text-primary">Customer</p>
                <div className="inline-flex rounded-md border border-border bg-background p-1">
                  <Button
                    type="button"
                    variant={customerMode === 'offline' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-sm"
                    onClick={() => setCustomerMode('offline')}
                  >
                    Walk-in / offline
                  </Button>
                  <Button
                    type="button"
                    variant={customerMode === 'platform' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-sm"
                    onClick={() => setCustomerMode('platform')}
                  >
                    Platform (User ID)
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {customerMode === 'platform' ? (
                    <div className="space-y-2 md:col-span-1">
                      <Label htmlFor="cust-id">Customer user ID (MongoDB)</Label>
                      <Input
                        id="cust-id"
                        required
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value.trim())}
                        placeholder="24 hex characters"
                      />
                      <p className="text-xs text-muted-foreground">For CRM and portal</p>
                    </div>
                  ) : (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50/80 p-3 text-sm md:col-span-2 dark:border-emerald-900 dark:bg-emerald-950/30">
                      {OFFLINE_GUEST
                        ? 'Backend linkage will use the configured guest user id.'
                        : 'Backend may require REACT_APP_INVOICE_OFFLINE_GUEST_USER_ID in .env.'}
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="cust-ref">Your reference (LPO, work order, ticket)</Label>
                    <Input
                      id="cust-ref"
                      value={customerReference}
                      onChange={(e) => setCustomerReference(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-4 pt-6">
                <p className="text-xs font-bold uppercase text-primary">Bill to — place of supply</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="bill-name">Legal / billing name</Label>
                    <Input id="bill-name" required value={billingTo.name} onChange={(e) => setBill('name', e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="bill-phone">Phone</Label>
                    <Input id="bill-phone" required value={billingTo.phone} onChange={(e) => setBill('phone', e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="bill-email">Email (for sending PDF)</Label>
                    <Input
                      id="bill-email"
                      type="email"
                      value={billingTo.email}
                      onChange={(e) => setBill('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-1">
                    <Label htmlFor="bill-gstin">Customer GSTIN (B2B)</Label>
                    <Input id="bill-gstin" value={billingTo.gstin} onChange={(e) => setBill('gstin', e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="addr1">Address line 1</Label>
                    <Input
                      id="addr1"
                      required
                      value={billingTo.addressLine1}
                      onChange={(e) => setBill('addressLine1', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="addr2">Address line 2</Label>
                    <Input id="addr2" value={billingTo.addressLine2} onChange={(e) => setBill('addressLine2', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={billingTo.city} onChange={(e) => setBill('city', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State (place of supply)</Label>
                    <Input id="state" required value={billingTo.state} onChange={(e) => setBill('state', e.target.value)} />
                    <p className="text-xs text-muted-foreground">Your company is configured in preview as: {COMPANY_STATE}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin">Pincode</Label>
                    <Input id="pin" value={billingTo.pincode} onChange={(e) => setBill('pincode', e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </VStack>
        )}

        {activeStep === 1 && (
          <VStack className="gap-6">
            <Card>
              <CardContent className="pt-6">
                <HStack className="mb-4 flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Line items</h3>
                    <p className="text-sm text-muted-foreground">
                      Ex‑GST unit rates. GST is computed per line (18%) like fixer-backend InvoiceService; invoice discount is
                      applied to the final total.
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add line
                  </Button>
                </HStack>
                <VStack className="gap-4">
                  {items.map((row, index) => {
                    const kind = row.lineKind || defaultLineKind
                    const catOptions = lineCategoriesFor(kind)
                    return (
                      <div key={index}>
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-12 md:col-span-3">
                            <Label className="text-xs" htmlFor={`desc-${index}`}>
                              Description
                            </Label>
                            <Input
                              id={`desc-${index}`}
                              className="mt-1"
                              value={row.description}
                              onChange={(e) => setItem(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <Label className="text-xs" htmlFor={`qty-${index}`}>
                              Qty
                            </Label>
                            <Input
                              id={`qty-${index}`}
                              className="mt-1"
                              type="number"
                              min={0.001}
                              step={0.01}
                              value={row.quantity}
                              onChange={(e) => setItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <Label className="text-xs" htmlFor={`unit-${index}`}>
                              Unit (₹ ex‑GST)
                            </Label>
                            <Input
                              id={`unit-${index}`}
                              className="mt-1"
                              type="number"
                              min={0}
                              step={0.01}
                              value={row.unitPrice}
                              onChange={(e) => setItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-4 md:col-span-2">
                            <Label className="text-xs" htmlFor={`lk-${index}`}>
                              Type
                            </Label>
                            <Select
                              value={kind}
                              onValueChange={(v) => setItem(index, 'lineKind', v as 'product' | 'service')}
                            >
                              <SelectTrigger id={`lk-${index}`} className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="service">Service (SAC)</SelectItem>
                                <SelectItem value="product">Goods (HSN)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-6 md:col-span-2">
                            <Label className="text-xs" htmlFor={`cat-${index}`}>
                              Category
                            </Label>
                            <Select
                              value={row.category || (kind === 'product' ? 'product' : 'electrical')}
                              onValueChange={(v) => setItem(index, 'category', v)}
                            >
                              <SelectTrigger id={`cat-${index}`} className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {catOptions.map((c) => (
                                  <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-6 flex items-end justify-center md:col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              aria-label="Remove line"
                              onClick={() => removeItem(index)}
                              disabled={items.length <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {index < items.length - 1 && <Separator className="mt-4" />}
                      </div>
                    )
                  })}
                </VStack>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <p className="font-semibold">Links</p>
                  <div className="space-y-2">
                    <Label htmlFor="booking">Service booking (optional)</Label>
                    <Input
                      id="booking"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value.trim())}
                      placeholder="24-char id"
                    />
                    <p className="text-xs text-muted-foreground">Tie to a home-service booking</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Store order (optional)</Label>
                    <Input id="order" value={orderId} onChange={(e) => setOrderId(e.target.value.trim())} placeholder="24-char id" />
                    <p className="text-xs text-muted-foreground">Tie to an e-commerce order</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <p className="font-semibold">Tax, collection &amp; terms</p>

                  {type !== 'provider_payout' && (
                    <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="apply-gst"
                          checked={applyGst}
                          onCheckedChange={(c) => setApplyGst(c === true)}
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="apply-gst" className="text-sm font-semibold">
                            Apply GST on this invoice
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Off by default — tick only when the supplier is GST-registered for this
                            transaction. Toggling also switches the PDF template between Tax invoice
                            and Bill of supply.
                          </p>
                        </div>
                      </div>
                      {applyGst && (
                        <div className="ml-7 space-y-1">
                          <Label htmlFor="gst-rate" className="text-xs">
                            GST rate
                          </Label>
                          <Select
                            value={String(gstRate)}
                            onValueChange={(v) => setGstRate(Number(v))}
                          >
                            <SelectTrigger id="gst-rate" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {GST_RATE_CHOICES.map((c) => (
                                <SelectItem key={c.value} value={String(c.value)}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {gstRate !== DEFAULT_GST_RATE && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-300">
                              Backend default is {DEFAULT_GST_RATE}%. Confirm InvoiceService config
                              if you choose a different slab.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="pay-method">Payment method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as BackendPaymentMethod)}
                    >
                      <SelectTrigger id="pay-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_CHOICES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Must match server enum (avoids 500 on save)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disc">Invoice discount (₹) — after tax, per server</Label>
                    <Input
                      id="disc"
                      type="number"
                      min={0}
                      step={0.01}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (PDF)</Label>
                    <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="email-after"
                      checked={emailAfterCreate}
                      onCheckedChange={(c) => setEmailAfterCreate(c === true)}
                    />
                    <Label htmlFor="email-after" className="text-sm font-normal">
                      Email client after create
                    </Label>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5 md:col-span-2">
                <CardContent className="space-y-2 pt-6">
                  <p className="font-bold text-primary">Live summary</p>
                  <Line label={applyGstPreview ? 'Taxable (lines)' : 'Line amounts'} v={subtotal} />
                  {applyGstPreview ? (
                    <Line label={`GST ${effectiveGstRate}% (lines)`} v={totalTax} />
                  ) : (
                    <Line label="GST" v={0} muted />
                  )}
                  <Line label="Less discount" v={-discountN} muted />
                  <Separator />
                  <Line label={applyGstPreview ? 'Net payable' : 'Total payable'} v={grandTotal} bold />
                  <p className="pt-1 text-[11px] text-muted-foreground">
                    {applyGstPreview
                      ? 'GST will appear on the issued PDF (Tax invoice).'
                      : 'No GST applied — Bill of supply / receipt PDF will be issued.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </VStack>
        )}

        {activeStep === 2 && (
          <div>
            <div
              className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/30"
              role="status"
            >
              Check customer name, state (place of supply), amounts, and payment mode. Issuing will call{' '}
              <code className="rounded bg-white/60 px-1 dark:bg-black/30">POST /api/invoices/generate</code> (admin) and then PDF
              generation, same as online flows. Logo and colours follow{' '}
              <Link to="/invoices/branding" className="font-semibold underline">
                Invoice appearance
              </Link>{' '}
              for this preview.
            </div>
            {type === 'provider_payout' && (
              <div
                className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/40"
                role="status"
              >
                Vendor / payout: the grid below is a <strong>customer-style</strong> line preview only. The issued PDF uses the{' '}
                <strong>vendor settlement</strong> layout from your PDF template selection (GST banner or standard payout
                statement).
              </div>
            )}
            <InvoicePreviewPanel
              branding={invoiceBranding}
              previewVariant={type === 'provider_payout' ? 'gst' : applyGstPreview ? 'gst' : 'non_gst'}
              gstRate={effectiveGstRate}
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
          </div>
        )}

        <Card className="sticky bottom-4 z-10 mt-6 shadow-md">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
            <Button type="button" variant="outline" onClick={handleBack} disabled={activeStep === 0}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {activeStep < 2 && (
              <Button type="button" onClick={handleNext}>
                {activeStep === 0 ? 'Continue' : 'Review preview'}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {activeStep === 2 && (
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Issuing…' : 'Issue invoice'}
                <Receipt className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={successOpen} onOpenChange={(open) => { if (!open) doneSuccess() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice issued</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">PDF is on the server. You can also download a copy for walk-in handover.</p>
          <DialogFooter className="flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={doneSuccess}>
              List
            </Button>
            {createdInvoiceId && (
              <Button type="button" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}

function Line({ label, v, bold, muted }: { label: string; v: number; bold?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={cn(
          'text-sm',
          muted ? 'text-muted-foreground' : 'text-foreground',
          bold ? 'font-bold' : 'font-medium'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'tabular-nums text-sm font-semibold',
          bold ? 'text-lg font-bold text-primary' : 'text-foreground'
        )}
      >
        ₹{v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
  )
}
