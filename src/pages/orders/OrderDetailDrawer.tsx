import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  HStack,
  VStack,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
} from '../../components/ui'
import { X, RefreshCw, Truck, CreditCard, Loader2, ExternalLink } from 'lucide-react'
import {
  OrdersService,
  type Order,
  type OrderStatus,
  type OrderCarrier,
  type PaymentStatus,
} from '../../services/api/orders.service'
import { formatCurrency, formatDate } from '../../lib/utils'
import { appToast } from '../../lib/appToast'
import { DeliveryStepper } from '../../components/orders/DeliveryStepper'
import {
  ORDER_CARRIER_OPTIONS,
  carrierLabel,
  resolveTrackingUrl,
} from '../../lib/carrierTracking'

const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
}

const PAYMENT_FLOW: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: ['pending', 'paid'],
  refunded: [],
}

function addressBlock(title: string, a?: Order['shippingAddress']) {
  if (!a) {
    return (
      <div>
        <p className="text-xs font-semibold text-muted-foreground">{title}</p>
        <p className="text-sm">—</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <p className="text-sm">
        {a.firstName} {a.lastName}
      </p>
      <p className="text-sm text-muted-foreground">{a.address}</p>
      <p className="text-sm text-muted-foreground">
        {a.city}, {a.state} {a.zipCode}, {a.country}
      </p>
      <p className="text-sm text-muted-foreground">{a.phone}</p>
    </div>
  )
}

export interface OrderDetailDrawerProps {
  open: boolean
  orderId: string | null
  onClose: () => void
  onUpdated: () => void
  canEdit: boolean
}

export function OrderDetailDrawer({ open, orderId, onClose, onUpdated, canEdit }: OrderDetailDrawerProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [trackingDraft, setTrackingDraft] = useState('')
  const [carrierDraft, setCarrierDraft] = useState<OrderCarrier | ''>('')
  const [trackingUrlDraft, setTrackingUrlDraft] = useState('')
  const [deliveryNotesDraft, setDeliveryNotesDraft] = useState('')
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('')
  const [nextPayment, setNextPayment] = useState<PaymentStatus | ''>('')
  const [statusNote, setStatusNote] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await OrdersService.getOrder(orderId)
      if (res.success && res.data) {
        setOrder(res.data)
        setTrackingDraft(res.data.trackingNumber || '')
        setCarrierDraft(res.data.carrier || '')
        setTrackingUrlDraft(res.data.trackingUrl || '')
        setDeliveryNotesDraft(res.data.deliveryNotes || '')
        setNextStatus('')
        setNextPayment('')
        setStatusNote('')
      } else {
        setOrder(null)
        appToast('Could not load order', 'error')
      }
    } catch {
      setOrder(null)
      appToast('Could not load order', 'error')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (open && orderId) void load()
    if (!open) {
      setOrder(null)
      setCancelOpen(false)
      setCancelReason('')
    }
  }, [open, orderId, load])

  const allowedStatuses = order ? ORDER_FLOW[order.status] : []
  const allowedPayments = order ? PAYMENT_FLOW[order.paymentStatus] : []

  const saveDeliveryDetails = async () => {
    if (!order || !canEdit) return
    setActing(true)
    try {
      const res = await OrdersService.updateOrder(order.id, {
        trackingNumber: trackingDraft.trim() || undefined,
        carrier: carrierDraft || undefined,
        trackingUrl: trackingUrlDraft.trim() || undefined,
        deliveryNotes: deliveryNotesDraft.trim() || undefined,
      })
      if (res.success && res.data) {
        setOrder(res.data)
        setCarrierDraft(res.data.carrier || '')
        setTrackingUrlDraft(res.data.trackingUrl || '')
        appToast('Delivery details saved', 'success')
        onUpdated()
      } else appToast('Update failed', 'error')
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Update failed', 'error')
    } finally {
      setActing(false)
    }
  }

  const trackingLink =
    order &&
    resolveTrackingUrl({
      carrier: carrierDraft || order.carrier,
      trackingNumber: trackingDraft || order.trackingNumber,
      trackingUrl: trackingUrlDraft || order.trackingUrl,
    })

  const applyStatus = async () => {
    if (!order || !nextStatus || !canEdit) return

    if (nextStatus === 'shipped') {
      const hasTracking =
        Boolean(trackingDraft.trim() || order.trackingNumber?.trim()) ||
        Boolean(trackingUrlDraft.trim() || order.trackingUrl?.trim())
      if (!hasTracking) {
        appToast('Add a tracking number or URL before marking shipped', 'error')
        return
      }
    }

    setActing(true)
    try {
      if (
        trackingDraft.trim() !== (order.trackingNumber || '') ||
        carrierDraft !== (order.carrier || '') ||
        trackingUrlDraft.trim() !== (order.trackingUrl || '') ||
        deliveryNotesDraft.trim() !== (order.deliveryNotes || '')
      ) {
        const saveRes = await OrdersService.updateOrder(order.id, {
          trackingNumber: trackingDraft.trim() || undefined,
          carrier: carrierDraft || undefined,
          trackingUrl: trackingUrlDraft.trim() || undefined,
          deliveryNotes: deliveryNotesDraft.trim() || undefined,
        })
        if (saveRes.success && saveRes.data) setOrder(saveRes.data)
      }

      const res = await OrdersService.updateOrderStatus(order.id, {
        status: nextStatus,
        notes: statusNote.trim() || undefined,
        notifyCustomer,
      })
      if (res.success && res.data) {
        setOrder(res.data)
        setNextStatus('')
        setStatusNote('')
        appToast('Fulfillment status updated', 'success')
        onUpdated()
      } else appToast('Status update failed', 'error')
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Status update failed', 'error')
    } finally {
      setActing(false)
    }
  }

  const applyPayment = async () => {
    if (!order || !nextPayment || !canEdit) return
    setActing(true)
    try {
      const res = await OrdersService.updateOrder(order.id, { paymentStatus: nextPayment })
      if (res.success && res.data) {
        setOrder(res.data)
        setNextPayment('')
        appToast('Payment status updated', 'success')
        onUpdated()
      } else appToast('Payment update failed', 'error')
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Payment update failed', 'error')
    } finally {
      setActing(false)
    }
  }

  const confirmCancel = async () => {
    if (!order || !canEdit) return
    setActing(true)
    try {
      const res = await OrdersService.cancelOrderAsAdmin(order.id, cancelReason.trim() || undefined)
      if (res.success && res.data) {
        setOrder(res.data)
        setCancelOpen(false)
        setCancelReason('')
        appToast('Order cancelled', 'success')
        onUpdated()
      } else appToast('Cancel failed', 'error')
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Cancel failed', 'error')
    } finally {
      setActing(false)
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
      >
        <SheetContent
          hideClose
          className="flex w-full flex-col overflow-hidden p-0 sm:max-w-lg md:max-w-2xl"
        >
          <SheetHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-border p-4 text-left">
            <SheetTitle>Order detail</SheetTitle>
            <HStack spacing={1}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Refresh"
                onClick={() => void load()}
                disabled={!orderId || loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </HStack>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-10">
            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && order && (
              <VStack spacing={4} className="w-full">
                <HStack spacing={2} className="flex-wrap items-center">
                  <h3 className="text-lg font-bold">{order.orderNumber}</h3>
                  <Badge variant="outline" className="capitalize">
                    {order.status}
                  </Badge>
                  <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'secondary'} className="capitalize">
                    {order.paymentStatus}
                  </Badge>
                </HStack>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-semibold">
                      {order.customer
                        ? `${order.customer.firstName} ${order.customer.lastName}`
                        : `User ${order.userId}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.customer?.email || '—'}</p>
                    <p className="text-sm text-muted-foreground">{order.customer?.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Placed / updated</p>
                    <p className="text-sm">{formatDate(order.createdAt)}</p>
                    <p className="text-sm text-muted-foreground">Updated {formatDate(order.updatedAt)}</p>
                    {order.estimatedDeliveryAt && (
                      <p className="text-sm text-muted-foreground">
                        Est. delivery {formatDate(order.estimatedDeliveryAt)}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="mb-2 font-semibold">Delivery progress</h4>
                  <DeliveryStepper status={order.status} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Items subtotal</p>
                    <p className="text-base font-semibold">
                      {formatCurrency(order.items.reduce((s, i) => s + i.total, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shipping / tax</p>
                    <p className="text-sm">
                      {formatCurrency(order.shippingAmount)} / {formatCurrency(order.taxAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{formatCurrency(order.totalAmount)}</p>
                    {order.discountAmount > 0 && (
                      <p className="text-xs text-storm-deep">
                        Discount {formatCurrency(order.discountAmount)}
                        {order.couponCode ? ` (${order.couponCode})` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <h4 className="font-semibold">Line items</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Line</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, idx) => (
                        <TableRow key={`${item.productId}-${idx}`}>
                          <TableCell>
                            <p className="text-sm">{item.name}</p>
                            {item.product?.category && (
                              <p className="text-xs text-muted-foreground">
                                {[item.product.category, item.product.subcategory].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {addressBlock('Ship to', order.shippingAddress)}
                  {addressBlock('Bill to', order.billingAddress || order.shippingAddress)}
                </div>

                <h4 className="font-semibold">Payment & delivery</h4>
                <VStack spacing={2}>
                  <p className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {order.paymentMethod || '—'} {order.paymentId ? `· ${order.paymentId}` : ''}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>
                      {order.trackingNumber
                        ? `${carrierLabel(order.carrier)} · ${order.trackingNumber}`
                        : 'No tracking yet'}
                    </span>
                    {trackingLink && (
                      <a
                        href={trackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open tracking
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </p>
                  {order.shippedAt && (
                    <p className="text-xs text-muted-foreground">Shipped {formatDate(order.shippedAt)}</p>
                  )}
                  {order.deliveredAt && (
                    <p className="text-xs text-muted-foreground">Delivered {formatDate(order.deliveredAt)}</p>
                  )}
                  {order.deliveryNotes && (
                    <p className="text-xs text-muted-foreground">Ops: {order.deliveryNotes}</p>
                  )}
                </VStack>

                {order.statusHistory && order.statusHistory.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold">Status history</h4>
                    <ul className="space-y-2 border-l-2 border-border pl-3">
                      {[...order.statusHistory]
                        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
                        .map((entry, idx) => (
                          <li key={`${entry.at}-${idx}`} className="text-sm">
                            <span className="font-medium capitalize">{entry.status}</span>
                            <span className="text-muted-foreground"> · {formatDate(entry.at)}</span>
                            {entry.note && (
                              <p className="text-xs text-muted-foreground">{entry.note}</p>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {order.notes && (
                  <div>
                    <h4 className="mb-1 font-semibold">Notes</h4>
                    <p className="whitespace-pre-wrap text-sm">{order.notes}</p>
                  </div>
                )}

                {canEdit && (
                  <>
                    <Separator />
                    <h4 className="font-semibold">Operations</h4>

                    <VStack spacing={4}>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="mb-1">Carrier</Label>
                          <Select
                            value={carrierDraft || undefined}
                            onValueChange={(v) => setCarrierDraft(v as OrderCarrier)}
                            disabled={order.status === 'cancelled' || order.status === 'refunded'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select carrier…" />
                            </SelectTrigger>
                            <SelectContent>
                              {ORDER_CARRIER_OPTIONS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1">Tracking number (AWB)</Label>
                          <Input
                            value={trackingDraft}
                            onChange={(e) => setTrackingDraft(e.target.value)}
                            disabled={order.status === 'cancelled' || order.status === 'refunded'}
                            placeholder="e.g. 1234567890"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="mb-1">Tracking URL (optional)</Label>
                          <Input
                            value={trackingUrlDraft}
                            onChange={(e) => setTrackingUrlDraft(e.target.value)}
                            disabled={order.status === 'cancelled' || order.status === 'refunded'}
                            placeholder="https://… or leave blank to auto-link from carrier"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Label className="mb-1">Delivery notes (internal)</Label>
                          <Input
                            value={deliveryNotesDraft}
                            onChange={(e) => setDeliveryNotesDraft(e.target.value)}
                            disabled={order.status === 'cancelled' || order.status === 'refunded'}
                            placeholder="Warehouse / dispatch notes"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" onClick={() => void saveDeliveryDetails()} disabled={acting}>
                          Save delivery details
                        </Button>
                        {trackingLink && (
                          <Button type="button" variant="outline" asChild>
                            <a href={trackingLink} target="_blank" rel="noopener noreferrer">
                              Open tracking
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="w-full sm:w-48">
                          <Label className="mb-1">Next fulfillment step</Label>
                          <Select
                            value={nextStatus || undefined}
                            onValueChange={(v) => setNextStatus(v as OrderStatus)}
                            disabled={allowedStatuses.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedStatuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="mb-1">Internal note (optional)</Label>
                          <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void applyStatus()}
                          disabled={acting || !nextStatus}
                        >
                          Apply status
                        </Button>
                      </div>

                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={notifyCustomer}
                          onCheckedChange={(v) => setNotifyCustomer(v === true)}
                        />
                        Notify customer by email (shipped / delivered)
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="w-full sm:w-52">
                          <Label className="mb-1">Payment status</Label>
                          <Select
                            value={nextPayment || undefined}
                            onValueChange={(v) => setNextPayment(v as PaymentStatus)}
                            disabled={allowedPayments.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedPayments.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void applyPayment()}
                          disabled={acting || !nextPayment}
                        >
                          Update payment
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        disabled={
                          acting ||
                          order.status === 'cancelled' ||
                          order.status === 'delivered' ||
                          order.status === 'shipped'
                        }
                        onClick={() => setCancelOpen(true)}
                      >
                        Cancel order (admin)
                      </Button>
                    </VStack>
                  </>
                )}
              </VStack>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={cancelOpen}
        onOpenChange={(o) => {
          if (!acting) setCancelOpen(o)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Stock will be restored. Only allowed before shipped/delivered.
          </p>
          <div>
            <Label htmlFor="cancel-reason" className="mb-1">
              Reason (optional)
            </Label>
            <Input
              id="cancel-reason"
              autoFocus
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)} disabled={acting}>
              Back
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmCancel()} disabled={acting}>
              Confirm cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
