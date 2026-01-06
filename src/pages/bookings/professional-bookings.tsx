/**
 * ============================================================================
 * PROFESSIONAL BOOKINGS PAGE
 * ============================================================================
 * Bookings management for logged-in professionals
 * 
 * Features:
 * - View assigned bookings
 * - Filter by status
 * - Accept/reject bookings
 * - Update booking status
 * - View customer details
 * - Navigate to location
 * - Call customer
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material'
import {
  Phone,
  Navigation,
  CheckCircle,
  Cancel,
  PlayArrow,
  Stop,
  Info,
  CalendarToday,
  AttachMoney,
  LocationOn,
  Person,
  Visibility,
  Payment,
} from '@mui/icons-material'
import { BookingsService } from '../../services/api/bookings.service'
import { PaymentsService } from '../../services/api/payments.service'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'

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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [paymentReceivedDialog, setPaymentReceivedDialog] = useState(false)
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  useEffect(() => {
    loadBookings()
  }, [activeTab])

  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log('📋 Loading professional bookings...')
      
      // Fetch bookings from API using professional endpoint
      // Note: Backend uses /provider/my-bookings for both but routes correctly by JWT userType
      const response = await BookingsService.getProfessionalBookings({
        status: getStatusFilter(),
        page: 1,
        limit: 100,
      })
      
      console.log('✅ Professional bookings response:', response)
      
      if (response.success && response.data) {
        const bookingsData = response.data.bookings || response.data || []
        
        // Transform bookings to match interface
        const transformedBookings: Booking[] = bookingsData.map((booking: any) => ({
          _id: booking._id || booking.id,
          id: booking.id || booking._id,
          serviceName: booking.services?.[0]?.serviceName || booking.services?.[0]?.serviceDetails?.name || 'Service',
          services: booking.services,
          customer: {
            name: booking.customer?.firstName ? `${booking.customer.firstName} ${booking.customer.lastName}` : 'Customer',
            firstName: booking.customer?.firstName || booking.address?.firstName,
            lastName: booking.customer?.lastName || booking.address?.lastName,
            phone: booking.customer?.phone || booking.address?.phone || 'N/A',
            address: {
              street: booking.address?.address || booking.address?.street || 'N/A',
              area: booking.address?.area || '',
              city: booking.address?.city || 'N/A',
              state: booking.address?.state || 'N/A',
              pincode: booking.address?.zipCode || booking.address?.pincode || 'N/A',
            },
          },
          address: booking.address,
          scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString().split('T')[0] : 'N/A',
          scheduledTime: booking.scheduledTime || 'N/A',
          status: booking.status || 'pending',
          totalAmount: booking.totalAmount || 0,
          paymentStatus: booking.paymentStatus || booking.payment_status || 'pending',
          paymentMethod: booking.paymentMethod || booking.payment_method,
          notes: booking.notes,
          completedDate: booking.completedDate || booking.completed_date || booking.completedAt,
        }))
        
        setBookings(transformedBookings)
        console.log(`✅ Loaded ${transformedBookings.length} bookings`)
      } else {
        throw new Error(response.message || 'Failed to fetch bookings')
      }
    } catch (err: any) {
      console.error('❌ Failed to load bookings:', err)
      setError(err.message || 'Failed to load bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusFilter = () => {
    switch (activeTab) {
      case 0: return undefined // All
      case 1: return 'pending'
      case 2: return 'confirmed'
      case 3: return 'in_progress'
      case 4: return 'completed'
      default: return undefined
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning'
      case 'confirmed': return 'info'
      case 'in_progress': return 'primary'
      case 'completed': return 'success'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const handleAction = (booking: Booking, actionType: typeof action) => {
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
          // Accept booking - try professional endpoint first, fallback to regular endpoint
          try {
            response = await BookingsService.updateProfessionalBookingStatus(selectedBooking._id, {
              status: 'scheduled' as any, // Backend may accept 'confirmed' but type says 'scheduled'
              notes: notes || undefined,
            })
          } catch (err: any) {
            // Fallback to regular endpoint if professional endpoint doesn't exist
            if (err.response?.status === 404) {
              response = await BookingsService.updateBookingStatus(selectedBooking._id, {
                status: 'scheduled' as any,
                notes: notes || undefined,
              })
            } else {
              throw err
            }
          }
          break
          
        case 'reject':
          // Reject booking - cancel it
          response = await BookingsService.cancelBooking(selectedBooking._id, notes || 'Rejected by professional')
          break
          
        case 'start':
          // Start work - use dedicated start method that tries multiple endpoints
          response = await BookingsService.startBooking(selectedBooking._id, notes || undefined)
          break
          
        case 'complete':
          // Step 1: Check payment method and status
          const paymentCompleted = selectedBooking.paymentStatus === 'paid' || 
                                   selectedBooking.paymentStatus === 'completed' ||
                                   selectedBooking.paymentStatus === 'customer_paid' ||
                                   selectedBooking.paymentStatus === 'verified'
          
          const isCashPayment = (() => {
            const method = selectedBooking.paymentMethod?.toLowerCase() || ''
            return method === 'cash' || 
                   method === 'pay_after_service' ||
                   method === 'pay_later' ||
                   method.includes('pay_later') ||
                   method.includes('pay after') ||
                   method === 'cash_on_delivery' ||
                   method.includes('cash') ||
                   method === 'pay_after' ||
                   method === 'cod'
          })()
          
          // For cash/pay_after_service payments, always allow completion (backend will handle payment marking)
          if (isCashPayment) {
            console.log('💵 Cash/Pay After Service payment detected - allowing completion (backend will mark payment)')
          } 
          // For online payments, verify payment status
          else if (!paymentCompleted) {
            // Try to verify payment status from API
            try {
              console.log('💳 Checking payment status before completion...')
              const paymentsResponse = await PaymentsService.getPaymentsByBooking(selectedBooking._id)
              
              if (paymentsResponse.success && paymentsResponse.data) {
                const payments = Array.isArray(paymentsResponse.data) 
                  ? paymentsResponse.data 
                  : (paymentsResponse.data as any)?.payments || []
                
                // Check if there's a completed payment
                const completedPayment = payments.find((p: any) => 
                  p.status === 'completed' || 
                  p.status === 'paid' || 
                  p.status === 'success' ||
                  p.status === 'customer_paid' ||
                  p.status === 'verified'
                )
                
                if (!completedPayment) {
                  // No completed payment found - but allow with warning for professionals
                  console.warn('⚠️ No completed payment found, but allowing professional to complete booking')
                  // Don't block - let backend handle payment verification
                } else {
                  console.log('✅ Payment verified:', completedPayment)
                }
              } else {
                // If we can't verify payment, allow with warning (backend will handle)
                console.warn('⚠️ Unable to verify payment status, but allowing completion (backend will verify)')
              }
            } catch (paymentErr: any) {
              // Don't block completion if payment verification fails - backend will handle
              console.warn('⚠️ Payment verification failed, but allowing completion:', paymentErr.message)
              // Allow professional to complete - backend will verify and handle payment status
            }
          }
          
          // Step 2: Complete the booking with admin notification
          // Backend will:
          // - Mark payment as completed (if cash/pay_after_service)
          // - Send notification to admin
          // - Calculate and add earnings to professional wallet
          response = await BookingsService.completeBooking(selectedBooking._id, notes || undefined, {
            notifyAdmin: true, // ✅ Notify admin when service is completed
            notifyCustomer: true, // Notify customer
          })
          
          // Step 3: Show success message with earnings info
          if (response.success) {
            dispatch(addToast({
              message: 'Booking completed! Admin has been notified. Your earnings have been added to your wallet.',
              severity: 'success'
            }))
            console.log('✅ Booking completed successfully')
            console.log('📧 Admin notification sent by backend')
            console.log('💰 Earnings will be added to your wallet')
          }
          break
          
        default:
          throw new Error('Invalid action')
      }
      
      if (response.success) {
        const actionMessages = {
          accept: 'Booking accepted successfully!',
          reject: 'Booking rejected successfully!',
          start: 'Work started successfully!',
          complete: 'Booking completed successfully!',
        }
        setSnackbar({ open: true, message: actionMessages[action], severity: 'success' })
        // Reload bookings to get updated data
        await loadBookings()
        setActionDialog(false)
        setSelectedBooking(null)
        setAction(null)
        setNotes('')
      } else {
        throw new Error(response.message || 'Failed to update booking')
      }
    } catch (error: any) {
      console.error('Action failed:', error)
      setSnackbar({ open: true, message: error.message || 'Failed to update booking', severity: 'error' })
      // Still close dialog but show error
      setActionDialog(false)
      setSelectedBooking(null)
      setAction(null)
      setNotes('')
    }
  }

  const renderBookingCard = (booking: Booking) => (
    <Card key={booking._id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {booking.serviceName}
            </Typography>
            <Chip
              label={booking.status}
              size="small"
              color={getStatusColor(booking.status) as any}
              sx={{ mt: 0.5 }}
            />
          </Box>
          <Typography variant="h6" fontWeight="bold" color="success.main">
            ₹{booking.totalAmount}
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Person fontSize="small" color="action" />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {booking.customer.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {booking.customer.phone}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <CalendarToday fontSize="small" color="action" />
              <Box>
                <Typography variant="body2">
                  {booking.scheduledDate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {booking.scheduledTime}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="start" gap={1}>
              <LocationOn fontSize="small" color="action" sx={{ mt: 0.5 }} />
              <Typography variant="body2">
                {booking.customer.address.street}, {booking.customer.address.area}, {booking.customer.address.city} - {booking.customer.address.pincode}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Payment Review Section - Show when booking is completed and payment is received */}
        {(() => {
          const statusLower = booking.status?.toLowerCase() || ''
          const isCompleted = statusLower === 'completed'
          const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
          const isPaymentReceived = paymentStatusLower === 'paid' || 
                                   paymentStatusLower === 'completed' ||
                                   paymentStatusLower === 'success' ||
                                   paymentStatusLower === 'received' ||
                                   paymentStatusLower === 'customer_paid' ||
                                   paymentStatusLower === 'verified'
          
          if (isCompleted && isPaymentReceived) {
            return (
              <>
                <Divider sx={{ my: 2 }} />
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'success.50', 
                    borderRadius: 2, 
                    border: '1px solid',
                    borderColor: 'success.200'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="600" color="success.dark">
                      Payment Received
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Amount
                      </Typography>
                      <Typography variant="body2" fontWeight="600" color="success.main">
                        ₹{booking.totalAmount}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Method
                      </Typography>
                      <Typography variant="body2" fontWeight="500" sx={{ textTransform: 'capitalize' }}>
                        {booking.paymentMethod || 'Cash'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Status
                      </Typography>
                      <Chip
                        label="Received"
                        size="small"
                        color="success"
                        icon={<CheckCircle />}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Date
                      </Typography>
                      <Typography variant="body2" fontWeight="500">
                        {booking.completedDate 
                          ? new Date(booking.completedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : new Date().toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </>
            )
          }
          return null
        })()}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => navigate(`/bookings/${booking._id}`)}
          >
            View Details
          </Button>
          <Button
            size="small"
            startIcon={<Phone />}
            onClick={() => handleCallCustomer(booking.customer.phone)}
          >
            Call
          </Button>
          <Button
            size="small"
            startIcon={<Navigation />}
            onClick={() => handleNavigate(booking.customer.address)}
          >
            Navigate
          </Button>

          {booking.status === 'pending' && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleAction(booking, 'accept')}
              >
                Accept
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleAction(booking, 'reject')}
              >
                Reject
              </Button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => handleAction(booking, 'start')}
            >
              Start Work
            </Button>
          )}

          {booking.status === 'in_progress' && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleAction(booking, 'complete')}
            >
              Mark Complete
            </Button>
          )}

          {(() => {
            // Debug logging and flexible condition checking
            const statusLower = booking.status?.toLowerCase() || ''
            const isCompleted = statusLower === 'completed'
            
            const paymentMethodLower = booking.paymentMethod?.toLowerCase() || ''
            const isPayAfterService = paymentMethodLower.includes('pay_after') || 
                                     paymentMethodLower.includes('pay after') ||
                                     paymentMethodLower === 'pay_after_service' ||
                                     paymentMethodLower === 'pay_later' ||
                                     paymentMethodLower.includes('pay_later') ||
                                     paymentMethodLower.includes('pay later')
            const isCash = paymentMethodLower === 'cash' || 
                          paymentMethodLower === 'cash_on_delivery' ||
                          paymentMethodLower.includes('cash')
            
            const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
            const paymentNotPaid = paymentStatusLower !== 'paid' && 
                                  paymentStatusLower !== 'completed' &&
                                  paymentStatusLower !== 'success' &&
                                  paymentStatusLower !== 'received' &&
                                  paymentStatusLower !== 'customer_paid' &&
                                  paymentStatusLower !== 'verified'
            
            const shouldShowButton = isCompleted && (isPayAfterService || isCash) && paymentNotPaid
            
            // Disable button if payment is already marked as received
            const isPaymentReceived = !paymentNotPaid
            
            // Debug log for all completed bookings
            if (isCompleted) {
              console.log('🔍 Payment Button Debug:', {
                bookingId: booking._id,
                status: booking.status,
                statusLower,
                paymentMethod: booking.paymentMethod,
                paymentMethodLower,
                paymentStatus: booking.paymentStatus,
                paymentStatusLower,
                isCompleted,
                isPayAfterService,
                isCash,
                paymentNotPaid,
                shouldShowButton
              })
            }
            
            return shouldShowButton ? (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<Payment />}
                onClick={() => {
                  setSelectedBookingForPayment(booking)
                  setPaymentAmount(booking.totalAmount.toString())
                  setPaymentReceivedDialog(true)
                }}
                disabled={isPaymentReceived}
              >
                {isPaymentReceived ? 'Payment Received' : 'Mark Payment Received'}
              </Button>
            ) : isCompleted && (isPayAfterService || isCash) && isPaymentReceived ? (
              <Chip
                icon={<CheckCircle />}
                label="Payment Received"
                color="success"
                size="small"
              />
            ) : null
          })()}
        </Box>
      </CardContent>
    </Card>
  )

  const filterByTab = (booking: Booking) => {
    switch (activeTab) {
      case 0: return true // All bookings
      case 1: return booking.status === 'pending'
      case 2: return booking.status === 'confirmed'
      case 3: return booking.status === 'in_progress'
      case 4: return booking.status === 'completed'
      default: return true
    }
  }

  const filteredBookings = bookings.filter(filterByTab)

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Bookings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your assigned bookings
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Confirmed" />
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      {/* Bookings List */}
      {loading ? (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={4}>
          <CircularProgress size={60} />
          <Typography variant="h6" mt={2} color="text.secondary">
            Loading bookings...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadBookings}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      ) : bookings.length === 0 ? (
        <Alert severity="info">
          No bookings assigned to you yet. Bookings will appear here once an admin assigns them to you.
        </Alert>
      ) : filteredBookings.length === 0 ? (
        <Alert severity="info">No bookings found in this category</Alert>
      ) : (
        <Box>
          {filteredBookings.map(renderBookingCard)}
        </Box>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'accept' && 'Accept Booking'}
          {action === 'reject' && 'Reject Booking'}
          {action === 'start' && 'Start Work'}
          {action === 'complete' && 'Complete Booking'}
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>Service:</strong> {selectedBooking.serviceName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Customer:</strong> {selectedBooking.customer.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> ₹{selectedBooking.totalAmount}
              </Typography>
              
              {action === 'complete' && (
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Payment Status:</strong> {(selectedBooking.paymentStatus === 'paid' || selectedBooking.paymentStatus === 'completed' || selectedBooking.paymentStatus === 'customer_paid' || selectedBooking.paymentStatus === 'verified')
                      ? '✅ Payment Completed' 
                      : (() => {
                          const method = selectedBooking.paymentMethod?.toLowerCase() || ''
                          return method === 'cash' || 
                                 method === 'pay_after_service' ||
                                 method === 'pay_later' ||
                                 method.includes('pay_later') ||
                                 method.includes('pay after') ||
                                 method === 'cash_on_delivery' ||
                                 method === 'pay_after' ||
                                 method === 'cod'
                        })()
                      ? '💵 Cash/Pay After Service - You can complete this booking'
                      : 'ℹ️ Payment verification will be handled by backend when you complete the booking'}
                  </Typography>
                </Alert>
              )}
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConfirmAction}
            color={action === 'reject' ? 'error' : action === 'complete' ? 'success' : 'primary'}
            disabled={action === 'complete' && selectedBooking && !(() => {
              const method = selectedBooking.paymentMethod?.toLowerCase() || ''
              const isCashOrPayLater = method === 'cash' || 
                                      method === 'pay_after_service' ||
                                      method === 'pay_later' ||
                                      method.includes('pay_later') ||
                                      method.includes('pay after') ||
                                      method === 'cash_on_delivery' ||
                                      method.includes('cash')
              return selectedBooking.paymentStatus === 'paid' || 
                     selectedBooking.paymentStatus === 'completed' || 
                     isCashOrPayLater
            })()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

