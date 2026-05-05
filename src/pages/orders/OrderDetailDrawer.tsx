import React, { useCallback, useEffect, useState } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Divider,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PaymentsIcon from '@mui/icons-material/Payments'
import {
  OrdersService,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from '../../services/api/orders.service'
import { formatCurrency, formatDate } from '../../lib/utils'
import { appToast } from '../../lib/appToast'

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
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="body2">—</Typography>
      </Box>
    )
  }
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="body2">
        {a.firstName} {a.lastName}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {a.address}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {a.city}, {a.state} {a.zipCode}, {a.country}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {a.phone}
      </Typography>
    </Box>
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
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('')
  const [nextPayment, setNextPayment] = useState<PaymentStatus | ''>('')
  const [statusNote, setStatusNote] = useState('')
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

  const saveTracking = async () => {
    if (!order || !canEdit) return
    setActing(true)
    try {
      const res = await OrdersService.updateOrder(order.id, { trackingNumber: trackingDraft.trim() || undefined })
      if (res.success && res.data) {
        setOrder(res.data)
        appToast('Tracking updated', 'success')
        onUpdated()
      } else appToast('Update failed', 'error')
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Update failed', 'error')
    } finally {
      setActing(false)
    }
  }

  const applyStatus = async () => {
    if (!order || !nextStatus || !canEdit) return
    setActing(true)
    try {
      const res = await OrdersService.updateOrderStatus(order.id, {
        status: nextStatus,
        notes: statusNote.trim() || undefined,
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
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520, md: 640 } } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700}>
            Order detail
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <IconButton aria-label="Refresh" onClick={() => void load()} disabled={!orderId || loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton aria-label="Close" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Box>

        <Box sx={{ p: 2, overflowY: 'auto', pb: 4 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && order && (
            <Stack spacing={2}>
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  {order.orderNumber}
                </Typography>
                <Chip size="small" label={order.status} color="primary" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                <Chip
                  size="small"
                  label={order.paymentStatus}
                  color={order.paymentStatus === 'paid' ? 'success' : 'default'}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {order.customer
                      ? `${order.customer.firstName} ${order.customer.lastName}`
                      : `User ${order.userId}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer?.email || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer?.phone || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Placed / updated
                  </Typography>
                  <Typography variant="body2">{formatDate(order.createdAt)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updated {formatDate(order.updatedAt)}
                  </Typography>
                  {order.estimatedDeliveryAt && (
                    <Typography variant="body2" color="text.secondary">
                      Est. delivery {formatDate(order.estimatedDeliveryAt)}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Items subtotal
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatCurrency(order.items.reduce((s, i) => s + i.total, 0))}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Shipping / tax
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(order.shippingAmount)} / {formatCurrency(order.taxAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {formatCurrency(order.totalAmount)}
                  </Typography>
                  {order.discountAmount > 0 && (
                    <Typography variant="caption" color="success.main">
                      Discount {formatCurrency(order.discountAmount)}
                      {order.couponCode ? ` (${order.couponCode})` : ''}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700}>
                Line items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Line</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={`${item.productId}-${idx}`}>
                      <TableCell>
                        <Typography variant="body2">{item.name}</Typography>
                        {item.product?.category && (
                          <Typography variant="caption" color="text.secondary">
                            {[item.product.category, item.product.subcategory].filter(Boolean).join(' · ')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {addressBlock('Ship to', order.shippingAddress)}
                </Grid>
                <Grid item xs={12} md={6}>
                  {addressBlock('Bill to', order.billingAddress || order.shippingAddress)}
                </Grid>
              </Grid>

              <Typography variant="subtitle2" fontWeight={700}>
                Payment & logistics
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <PaymentsIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {order.paymentMethod || '—'} {order.paymentId ? `· ${order.paymentId}` : ''}
                </Typography>
                <Typography variant="body2">
                  <LocalShippingIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  Tracking: {order.trackingNumber || '—'}
                </Typography>
                {order.shippedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Shipped {formatDate(order.shippedAt)}
                  </Typography>
                )}
                {order.deliveredAt && (
                  <Typography variant="caption" color="text.secondary">
                    Delivered {formatDate(order.deliveredAt)}
                  </Typography>
                )}
              </Stack>

              {order.notes && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {order.notes}
                  </Typography>
                </Box>
              )}

              {canEdit && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Operations
                  </Typography>

                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-end' }}>
                      <TextField
                        label="Tracking number"
                        fullWidth
                        size="small"
                        value={trackingDraft}
                        onChange={(e) => setTrackingDraft(e.target.value)}
                        disabled={order.status === 'cancelled' || order.status === 'refunded'}
                      />
                      <Button variant="contained" onClick={() => void saveTracking()} disabled={acting}>
                        Save tracking
                      </Button>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-end' }}>
                      <FormControl size="small" sx={{ minWidth: 180 }} disabled={allowedStatuses.length === 0}>
                        <InputLabel>Next fulfillment step</InputLabel>
                        <Select
                          label="Next fulfillment step"
                          value={nextStatus}
                          onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                        >
                          <MenuItem value="">
                            <em>Select…</em>
                          </MenuItem>
                          {allowedStatuses.map((s) => (
                            <MenuItem key={s} value={s}>
                              {s}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="Internal note (optional)"
                        size="small"
                        sx={{ flex: 1 }}
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                      />
                      <Button variant="outlined" onClick={() => void applyStatus()} disabled={acting || !nextStatus}>
                        Apply status
                      </Button>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-end' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }} disabled={allowedPayments.length === 0}>
                        <InputLabel>Payment status</InputLabel>
                        <Select
                          label="Payment status"
                          value={nextPayment}
                          onChange={(e) => setNextPayment(e.target.value as PaymentStatus)}
                        >
                          <MenuItem value="">
                            <em>Select…</em>
                          </MenuItem>
                          {allowedPayments.map((p) => (
                            <MenuItem key={p} value={p}>
                              {p}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Button variant="outlined" onClick={() => void applyPayment()} disabled={acting || !nextPayment}>
                        Update payment
                      </Button>
                    </Stack>

                    <Button
                      color="error"
                      variant="outlined"
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
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </Box>
      </Drawer>

      <Dialog open={cancelOpen} onClose={() => !acting && setCancelOpen(false)}>
        <DialogTitle>Cancel this order?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Stock will be restored. Only allowed before shipped/delivered.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)} disabled={acting}>
            Back
          </Button>
          <Button color="error" variant="contained" onClick={() => void confirmCancel()} disabled={acting}>
            Confirm cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
