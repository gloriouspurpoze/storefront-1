/**
 * ============================================================================
 * PROFESSIONAL BOOKINGS PAGE
 * ============================================================================
 * Bookings management for logged-in professionals
 *
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Play,
  Calendar,
  IndianRupee,
  Banknote,
  User,
  Eye,
  CreditCard,
  CalendarClock,
  Clock,
  Receipt,
  Navigation as NavigateIcon,
  Loader2,
} from 'lucide-react'
import { BookingsService } from '../../services/api/bookings.service'
import { PaymentsService } from '../../services/api/payments.service'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { Separator } from '../../components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { FixedMessage } from '../../components/common/FixedMessage'
import { cn } from '../../lib/utils'

interface Booking {
  _id: string
  id: string
  serviceName: string
  services?: Array<{
    serviceName: string
    serviceDetails?: {
      name: string
    }
  }>
  customer: {
    name?: string
    firstName?: string
    lastName?: string
    phone: string
    address: {
      street: string
      area: string
      city: string
      state: string
      pincode: string
    }
  }
  address?: {
    address: string
    city: string
    state: string
    zipCode: string
  }
  scheduledDate: string
  scheduledTime: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  totalAmount: number
  paymentStatus?: 'pending' | 'paid' | 'completed' | 'refunded'
  paymentMethod?: string
  notes?: string
  completedDate?: string
}

const STATUS_CARD: Record<
  string,
  {
    label: string
    topBar: string
    iconBox: string
    chip: string
  }
> = {
  pending: {
    label: 'Pending',
    topBar: 'from-bloom-coral to-bloom-coral',
    iconBox: 'bg-bloom-coral/15 text-bloom-coral',
    chip: 'bg-bloom-coral/15 text-bloom-coral',
  },
  confirmed: {
    label: 'Confirmed',
    topBar: 'from-primary to-primary',
    iconBox: 'bg-primary/15 text-primary',
    chip: 'bg-primary/15 text-primary',
  },
  in_progress: {
    label: 'In Progress',
    topBar: 'from-primary-deep to-primary-deep',
    iconBox: 'bg-primary-deep/15 text-primary-deep',
    chip: 'bg-primary-deep/15 text-primary-deep',
  },
  completed: {
    label: 'Completed',
    topBar: 'from-storm-deep to-storm-deep',
    iconBox: 'bg-storm-deep/15 text-storm-deep',
    chip: 'bg-storm-deep/15 text-storm-deep',
  },
  cancelled: {
    label: 'Cancelled',
    topBar: 'from-destructive to-destructive',
    iconBox: 'bg-destructive/15 text-destructive',
    chip: 'bg-destructive/15 text-destructive',
  },
}

export function ProfessionalBookings() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState(0)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [actionDialog, setActionDialog] = useState(false)
  const [action, setAction] = useState<'accept' | 'reject' | 'start' | 'complete' | null>(null)
  const [notes, setNotes] = useState('')
  const [completePaymentMethod, setCompletePaymentMethod] = useState<'cash' | 'online'>('cash')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [paymentReceivedDialog, setPaymentReceivedDialog] = useState(false)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 6000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  useEffect(() => {
    loadBookings()
  }, [activeTab])

  const getStatusFilter = () => {
    switch (activeTab) {
      case 0:
        return undefined
      case 1:
        return 'pending'
      case 2:
        return 'confirmed'
      case 3:
        return 'in_progress'
      case 4:
        return 'completed'
      default:
        return undefined
    }
  }

  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await BookingsService.getProfessionalBookings({
        status: getStatusFilter(),
        page: 1,
        limit: 50,
      })

      if (response.success && response.data) {
        const raw = response.data as unknown
        const bookingsData = Array.isArray(raw)
          ? raw
          : (raw as { bookings?: unknown; data?: unknown; bookingsData?: unknown }).bookings ??
            (raw as { data?: unknown }).data ??
            (raw as { bookingsData?: unknown }).bookingsData ??
            []
        const list = Array.isArray(bookingsData) ? bookingsData : []

        const transformedBookings: Booking[] = list.map((booking: Record<string, unknown>) => {
          const services = booking.services as Array<{
            serviceName?: string
            serviceDetails?: { name?: string }
          }> | undefined
          const address = booking.address as
            | {
                address?: string
                street?: string
                area?: string
                firstName?: string
                lastName?: string
                phone?: string
                city?: string
                state?: string
                zipCode?: string
                pincode?: string
              }
            | undefined
          const customer = booking.customer as
            | { firstName?: string; lastName?: string; phone?: string }
            | undefined
          return {
            _id: (booking._id as string) || (booking.id as string),
            id: (booking.id as string) || (booking._id as string),
            serviceName:
              services?.[0]?.serviceName || services?.[0]?.serviceDetails?.name || 'Service',
            services: booking.services as Booking['services'],
            customer: {
              name: customer?.firstName
                ? `${customer.firstName} ${customer.lastName ?? ''}`.trim()
                : 'Customer',
              firstName: customer?.firstName || address?.firstName,
              lastName: customer?.lastName || address?.lastName,
              phone: customer?.phone || address?.phone || 'N/A',
              address: {
                street: address?.address || address?.street || 'N/A',
                area: address?.area || '',
                city: address?.city || 'N/A',
                state: address?.state || 'N/A',
                pincode: address?.zipCode || address?.pincode || 'N/A',
              },
            },
            address: booking.address as Booking['address'],
            scheduledDate: booking.scheduledDate
              ? new Date(booking.scheduledDate as string).toISOString().split('T')[0]
              : 'N/A',
            scheduledTime: (booking.scheduledTime as string) || 'N/A',
            status: (booking.status as Booking['status']) || 'pending',
            totalAmount: (booking.totalAmount as number) || 0,
            paymentStatus: (booking.paymentStatus as Booking['paymentStatus']) ||
              (booking.payment_status as Booking['paymentStatus']) ||
              'pending',
            paymentMethod: (booking.paymentMethod as string) || (booking.payment_method as string),
            notes: booking.notes as string | undefined,
            completedDate: (booking.completedDate as string) ||
              (booking.completed_date as string) ||
              (booking.completedAt as string),
          }
        })

        setBookings(transformedBookings)
      } else if (response.success && !response.data) {
        setBookings([])
      } else {
        throw new Error(response.message || 'Failed to fetch bookings')
      }
    } catch (err: unknown) {
      console.error('Failed to load bookings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (booking: Booking, actionType: 'accept' | 'reject' | 'start' | 'complete') => {
    setSelectedBooking(booking)
    setAction(actionType)
    setActionDialog(true)
  }

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  const handleNavigate = (address: Booking['customer']['address']) => {
    const query = `${address.street}, ${address.area}, ${address.city}, ${address.state}`
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
  }

  const handleConfirmAction = async () => {
    if (!selectedBooking || !action) return

    try {
      let response

      switch (action) {
        case 'accept':
          try {
            response = await BookingsService.updateProfessionalBookingStatus(selectedBooking._id, {
              status: 'scheduled',
              notes: notes || undefined,
            })
          } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status
            if (status === 404) {
              response = await BookingsService.updateBookingStatus(selectedBooking._id, {
                status: 'scheduled',
                notes: notes || undefined,
              })
            } else {
              throw err
            }
          }
          break

        case 'reject':
          response = await BookingsService.cancelBooking(
            selectedBooking._id,
            notes || 'Rejected by professional',
          )
          break

        case 'start':
          response = await BookingsService.startBooking(selectedBooking._id, notes || undefined)
          break

        case 'complete': {
          const ps = (selectedBooking as { paymentStatus?: string }).paymentStatus
          const paymentCompleted =
            ps === 'paid' ||
            ps === 'completed' ||
            ps === 'customer_paid' ||
            ps === 'verified'

          const isCashPayment = (() => {
            const method = selectedBooking.paymentMethod?.toLowerCase() || ''
            return (
              method === 'cash' ||
              method === 'pay_after_service' ||
              method === 'pay_later' ||
              method.includes('pay_later') ||
              method.includes('pay after') ||
              method === 'cash_on_delivery' ||
              method.includes('cash') ||
              method === 'pay_after' ||
              method === 'cod'
            )
          })()

          if (isCashPayment) {
            /* cash flow — backend may mark payment */
          } else if (!paymentCompleted) {
            try {
              const paymentsResponse = await PaymentsService.getPaymentsByBooking(selectedBooking._id)
              if (paymentsResponse.success && paymentsResponse.data) {
                const payments = Array.isArray(paymentsResponse.data)
                  ? paymentsResponse.data
                  : (paymentsResponse.data as { payments?: unknown[] }).payments || []
                const completedPayment = (payments as { status?: string }[]).find(
                  (p) =>
                    p.status === 'completed' ||
                    p.status === 'paid' ||
                    p.status === 'success' ||
                    p.status === 'customer_paid' ||
                    p.status === 'verified',
                )
                if (!completedPayment) {
                  console.warn('No completed payment found; allowing completion (backend will verify).')
                }
              }
            } catch (paymentErr: unknown) {
              console.warn('Payment verification failed; allowing completion:', paymentErr)
            }
          }

          response = await BookingsService.completeBooking(selectedBooking._id, notes || undefined, {
            notifyAdmin: true,
            notifyCustomer: true,
            paymentReceived: completePaymentMethod,
          })

          if (response.success) {
            dispatch(
              addToast({
                message:
                  'Booking completed! Admin has been notified. Your earnings have been added to your wallet.',
                severity: 'success',
              }),
            )
          }
          break
        }
        default:
          throw new Error('Invalid action')
      }

      if (response && response.success) {
        const actionMessages: Record<string, string> = {
          accept: 'Booking accepted successfully!',
          reject: 'Booking rejected successfully!',
          start: (response as { message?: string }).message || 'Work started. Customer and admin have been notified.',
          complete: 'Booking completed successfully!',
        }
        setSnackbar({
          open: true,
          message:
            actionMessages[action] ?? (response as { message?: string }).message ?? 'Done',
          severity: 'success',
        })
        await loadBookings()
        setActionDialog(false)
        setSelectedBooking(null)
        setAction(null)
        setNotes('')
        setCompletePaymentMethod('cash')
      } else {
        throw new Error((response && (response as { message?: string }).message) || 'Failed to update booking')
      }
    } catch (err: unknown) {
      console.error('Action failed:', err)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update booking',
        severity: 'error',
      })
      setActionDialog(false)
      setSelectedBooking(null)
      setAction(null)
      setNotes('')
      setCompletePaymentMethod('cash')
    }
  }

  const closePaymentDialog = useCallback(() => {
    setPaymentReceivedDialog(false)
    setSelectedBookingForPayment(null)
    setPaymentAmount('')
    setPaymentNotes('')
  }, [])

  const handleMarkPaymentReceived = async () => {
    if (!selectedBookingForPayment) return
    setPaymentSubmitting(true)
    try {
      const amount = parseFloat(paymentAmount) || selectedBookingForPayment.totalAmount
      const response = await PaymentsService.markPaymentReceived(selectedBookingForPayment._id, {
        amount,
        paymentMethod: selectedBookingForPayment.paymentMethod || 'cash',
        notes: paymentNotes || undefined,
        notifyCustomer: true,
        notifyAdmin: true,
      })
      if (response.success) {
        dispatch(
          addToast({
            message: 'Payment marked as received! Customer and admin have been notified.',
            severity: 'success',
          }),
        )
        setSnackbar({ open: true, message: 'Payment marked as received successfully!', severity: 'success' })
        closePaymentDialog()
        await loadBookings()
      } else {
        throw new Error((response as { message?: string }).message || 'Failed to mark payment as received')
      }
    } catch (err: unknown) {
      console.error('Failed to mark payment as received:', err)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to mark payment as received',
        severity: 'error',
      })
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const renderBookingCard = (booking: Booking) => {
    const status = STATUS_CARD[booking.status] || STATUS_CARD.pending

    const isPaymentReceived = (() => {
      const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
      return (
        paymentStatusLower === 'paid' ||
        paymentStatusLower === 'completed' ||
        paymentStatusLower === 'success' ||
        paymentStatusLower === 'received' ||
        paymentStatusLower === 'customer_paid' ||
        paymentStatusLower === 'verified'
      )
    })()

    const showPaymentReceivedBlock =
      booking.status === 'completed' && isPaymentReceived

    return (
      <Card
        key={booking._id}
        className="group mb-6 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md transition-all hover:-translate-y-1 hover:shadow-lg"
      >
        <div className={cn('h-1 w-full bg-gradient-to-r', status.topBar)} />
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
                    status.iconBox,
                  )}
                >
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold tracking-tight text-foreground">{booking.serviceName}</h3>
                  <Badge className={cn('mt-1.5 font-semibold', status.chip)}>{status.label}</Badge>
                </div>
              </div>
            </div>
            <div className="shrink-0 rounded-xl border-2 border-storm-deep bg-storm-deep/10 px-4 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
              <p className="text-2xl font-extrabold text-storm-deep dark:text-storm-sea">
                ₹{booking.totalAmount}
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 transition-transform hover:translate-x-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</p>
                <p className="font-bold text-foreground">{booking.customer.name}</p>
                <p className="text-sm text-muted-foreground">{booking.customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-bloom-coral/20 bg-bloom-coral/5 p-4 transition-transform hover:translate-x-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bloom-coral text-white">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Scheduled</p>
                <p className="font-bold text-foreground">{booking.scheduledDate}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {booking.scheduledTime}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Service location
              </p>
              <p className="font-semibold text-foreground">
                {booking.customer.address.street}, {booking.customer.address.area}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {booking.customer.address.city}, {booking.customer.address.state} — {booking.customer.address.pincode}
              </p>
            </div>
          </div>

          {showPaymentReceivedBlock && (
            <>
              <Separator className="mb-6" />
              <Card className="border-2 border-storm-deep bg-storm-deep/10 shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-storm-deep text-white">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <h4 className="text-lg font-bold text-storm-deep dark:text-on-ink">Payment received</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-storm-deep/10 p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Amount</p>
                      <p className="text-lg font-extrabold text-storm-deep">₹{booking.totalAmount}</p>
                    </div>
                    <div className="rounded-lg bg-storm-deep/10 p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Method</p>
                      <p className="font-bold capitalize text-foreground">{booking.paymentMethod || 'Cash'}</p>
                    </div>
                    <div className="rounded-lg bg-storm-deep/10 p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Status</p>
                      <Badge className="mt-1 border-0 bg-storm-deep/20 font-semibold text-storm-deep">
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                        Received
                      </Badge>
                    </div>
                    <div className="rounded-lg bg-storm-deep/10 p-3">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Date</p>
                      <p className="font-bold text-foreground">
                        {booking.completedDate
                          ? new Date(booking.completedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : new Date().toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Separator className="my-6" />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => navigate(`/bookings/${booking._id}`)}
            >
              <Eye className="h-4 w-4" />
              View details
            </Button>
            <Button
              type="button"
              className="gap-1.5 bg-storm-deep hover:bg-storm-deep"
              onClick={() => handleCallCustomer(booking.customer.phone)}
            >
              <Phone className="h-4 w-4" />
              Call customer
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-1.5"
              onClick={() => handleNavigate(booking.customer.address)}
            >
              <NavigateIcon className="h-4 w-4" />
              Navigate
            </Button>

            {booking.status === 'pending' && (
              <>
                <Button
                  type="button"
                  className="gap-1.5 bg-storm-deep hover:bg-storm-deep"
                  onClick={() => handleAction(booking, 'accept')}
                >
                  <CheckCircle className="h-4 w-4" />
                  Accept
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => handleAction(booking, 'reject')}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </>
            )}

            {booking.status === 'confirmed' && (
              <Button
                type="button"
                className="gap-1.5"
                onClick={() => handleAction(booking, 'start')}
              >
                <Play className="h-4 w-4" />
                Start work
              </Button>
            )}

            {booking.status === 'in_progress' && (
              <Button
                type="button"
                className="gap-1.5 bg-storm-deep hover:bg-storm-deep"
                onClick={() => handleAction(booking, 'complete')}
              >
                <CheckCircle className="h-4 w-4" />
                Mark complete
              </Button>
            )}

            {(() => {
              const statusLower = booking.status?.toLowerCase() || ''
              const isCompleted = statusLower === 'completed'
              const paymentMethodLower = booking.paymentMethod?.toLowerCase() || ''
              const isPayAfterService =
                paymentMethodLower.includes('pay_after') ||
                paymentMethodLower.includes('pay after') ||
                paymentMethodLower === 'pay_after_service' ||
                paymentMethodLower === 'pay_later' ||
                paymentMethodLower.includes('pay_later') ||
                paymentMethodLower.includes('pay later')
              const isCash =
                paymentMethodLower === 'cash' ||
                paymentMethodLower === 'cash_on_delivery' ||
                paymentMethodLower.includes('cash')
              const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
              const paymentNotPaid =
                paymentStatusLower !== 'paid' &&
                paymentStatusLower !== 'completed' &&
                paymentStatusLower !== 'success' &&
                paymentStatusLower !== 'received' &&
                paymentStatusLower !== 'customer_paid' &&
                paymentStatusLower !== 'verified'
              const isPaymentDone = !paymentNotPaid
              const shouldShowButton = isCompleted && (isPayAfterService || isCash) && paymentNotPaid

              if (shouldShowButton) {
                return (
                  <Button
                    type="button"
                    className="gap-1.5"
                    onClick={() => {
                      setSelectedBookingForPayment(booking)
                      setPaymentAmount(booking.totalAmount.toString())
                      setPaymentReceivedDialog(true)
                    }}
                    disabled={isPaymentDone}
                  >
                    <IndianRupee className="h-4 w-4" />
                    {isPaymentDone ? 'Payment received' : 'Mark payment received'}
                  </Button>
                )
              }
              if (isCompleted && (isPayAfterService || isCash) && isPaymentDone) {
                return (
                  <Badge className="h-9 gap-1 border-0 bg-storm-deep/20 px-3 text-storm-deep">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Payment received
                  </Badge>
                )
              }
              return null
            })()}
          </div>
        </CardContent>
      </Card>
    )
  }

  const filterByTab = (booking: Booking) => {
    switch (activeTab) {
      case 0:
        return true
      case 1:
        return booking.status === 'pending'
      case 2:
        return booking.status === 'confirmed'
      case 3:
        return booking.status === 'in_progress'
      case 4:
        return booking.status === 'completed'
      default:
        return true
    }
  }

  const filteredBookings = bookings.filter(filterByTab)

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    inProgress: bookings.filter((b) => b.status === 'in_progress').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    totalEarnings: bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
  }

  const tabLabels: { id: number; label: string; count: number }[] = [
    { id: 0, label: 'All', count: stats.total },
    { id: 1, label: 'Pending', count: stats.pending },
    { id: 2, label: 'Confirmed', count: stats.confirmed },
    { id: 3, label: 'In progress', count: stats.inProgress },
    { id: 4, label: 'Completed', count: stats.completed },
  ]

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-deep p-6 shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm md:text-3xl">My bookings</h1>
          <p className="mt-1 text-sm font-medium text-white/90 md:text-base">Manage your assigned bookings</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, className: 'text-primary' },
          { label: 'Pending', value: stats.pending, className: 'text-bloom-coral' },
          { label: 'In progress', value: stats.inProgress, className: 'text-primary' },
          { label: 'Completed', value: stats.completed, className: 'text-storm-deep' },
        ].map((s) => (
          <Card
            key={s.label}
            className="border-border/60 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className="p-4 text-center">
              <p className={cn('text-2xl font-extrabold', s.className)}>{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="col-span-2 border-0 bg-gradient-to-br from-storm-deep to-storm-deep text-white shadow-md sm:col-span-1 lg:col-span-2">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold">₹{stats.totalEarnings.toLocaleString()}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/90">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-border/60 shadow-sm">
        <CardContent className="p-2">
          <div className="flex flex-wrap gap-2">
            {tabLabels.map((t) => (
              <Button
                key={t.id}
                type="button"
                variant={activeTab === t.id ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                <Badge variant="secondary" className="h-5 min-w-[1.25rem] px-1.5 text-xs font-semibold">
                  {t.count > 99 ? '99+' : t.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 font-semibold text-muted-foreground">Loading bookings…</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 shadow-sm">
          <CardContent className="p-4">
            <div
              className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
              role="alert"
            >
              {error}
              <Button type="button" size="sm" variant="destructive" onClick={() => void loadBookings()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
              <CalendarClock className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold">No bookings yet</h2>
            <p className="mt-2 text-muted-foreground">
              No bookings assigned to you yet. Bookings will appear here once an admin assigns them to you.
            </p>
          </CardContent>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary dark:text-primary-deep">
              No bookings found in this category
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>{filteredBookings.map(renderBookingCard)}</div>
      )}

      <Dialog
        open={actionDialog}
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog(false)
            setCompletePaymentMethod('cash')
          }
        }}
      >
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === 'accept' && 'Accept booking'}
              {action === 'reject' && 'Reject booking'}
              {action === 'start' && 'Start work'}
              {action === 'complete' && 'Complete booking'}
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Service:</span> {selectedBooking.serviceName}
              </p>
              <p>
                <span className="font-medium">Customer:</span> {selectedBooking.customer.name}
              </p>
              <p>
                <span className="font-medium">Amount:</span> ₹{selectedBooking.totalAmount}
              </p>
              {action === 'complete' && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-muted-foreground">How did the customer pay?</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={completePaymentMethod === 'cash' ? 'default' : 'outline'}
                      className="gap-1"
                      onClick={() => setCompletePaymentMethod('cash')}
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      Cash
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={completePaymentMethod === 'online' ? 'default' : 'outline'}
                      className="gap-1"
                      onClick={() => setCompletePaymentMethod('online')}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      Online
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completePaymentMethod === 'cash'
                      ? 'Payment will be marked as received on completion.'
                      : 'Payment status will remain as recorded.'}
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="action-notes" className="text-muted-foreground">
                  Notes (optional)
                </Label>
                <Textarea
                  id="action-notes"
                  className="mt-1.5"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setActionDialog(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className={cn(
                action === 'reject' && 'bg-destructive hover:bg-destructive/90',
                action === 'complete' && 'bg-storm-deep hover:bg-storm-deep',
              )}
              onClick={() => void handleConfirmAction()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentReceivedDialog}
        onOpenChange={(open) => {
          if (!open) closePaymentDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-storm-deep" />
              Mark payment received
            </DialogTitle>
          </DialogHeader>
          {selectedBookingForPayment && (
            <div className="space-y-4 text-sm">
              <div
                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-primary dark:text-primary-deep"
                role="status"
              >
                Confirm that you have received payment from the customer. This updates the payment status and
                notifies the customer and admin.
              </div>
              <div>
                <p className="text-muted-foreground">Booking amount</p>
                <p className="text-xl font-bold text-primary">₹{selectedBookingForPayment.totalAmount}</p>
              </div>
              <div>
                <Label htmlFor="amount-received">Amount received</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="amount-received"
                    type="number"
                    className="pl-7"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={String(selectedBookingForPayment.totalAmount)}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Enter the amount you received from the customer</p>
              </div>
              <div>
                <Label htmlFor="payment-notes">Payment notes (optional)</Label>
                <Textarea
                  id="payment-notes"
                  className="mt-1.5"
                  rows={3}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="E.g. payment method, UPI ref, etc."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closePaymentDialog} disabled={paymentSubmitting}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-storm-deep hover:bg-storm-deep"
              disabled={paymentSubmitting || !selectedBookingForPayment}
              onClick={() => void handleMarkPaymentReceived()}
            >
              {paymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {snackbar.open && (
        <FixedMessage variant={snackbar.severity === 'error' ? 'error' : 'default'}>
          {snackbar.message}
        </FixedMessage>
      )}
    </div>
  )
}
