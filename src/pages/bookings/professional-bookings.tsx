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
  Stack,
  alpha,
  Badge,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
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
  Schedule,
  TrendingUp,
  AccessTime,
  Receipt,
  Star,
  CreditCard,
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
  const [completePaymentMethod, setCompletePaymentMethod] = useState<'cash' | 'online'>('cash')
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
        limit: 50, // Backend max is 100
      })
      
      console.log('✅ Professional bookings response:', response)
      
      if (response.success && response.data) {
        // Backend may return { bookings: [] }, { data: [] }, or array at data
        const raw = response.data as any
        const bookingsData = Array.isArray(raw)
          ? raw
          : raw?.bookings ?? raw?.data ?? (raw?.bookingsData ?? [])
        const list = Array.isArray(bookingsData) ? bookingsData : []

        // Transform to match interface (bookings assigned to this professional)
        const transformedBookings: Booking[] = list.map((booking: any) => ({
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
      } else if (response.success && !response.data) {
        // Success but no data = empty list
        setBookings([])
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
          const paymentCompleted = (selectedBooking as any).paymentStatus === 'paid' || 
                                   (selectedBooking as any).paymentStatus === 'completed' ||
                                   (selectedBooking as any).paymentStatus === 'customer_paid' ||
                                   (selectedBooking as any).paymentStatus === 'verified'
          
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
            notifyAdmin: true,
            notifyCustomer: true,
            paymentReceived: completePaymentMethod,
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
        const actionMessages: Record<string, string> = {
          accept: 'Booking accepted successfully!',
          reject: 'Booking rejected successfully!',
          start: (response as any).message || 'Work started. Customer and admin have been notified.',
          complete: 'Booking completed successfully!',
        }
        setSnackbar({ open: true, message: actionMessages[action] ?? (response as any).message ?? 'Done', severity: 'success' })
        // Reload bookings to get updated data
        await loadBookings()
        setActionDialog(false)
        setSelectedBooking(null)
        setAction(null)
        setNotes('')
        setCompletePaymentMethod('cash')
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
      setCompletePaymentMethod('cash')
    }
  }

  const renderBookingCard = (booking: Booking) => {
    const statusConfig = {
      pending: { color: '#FF9800', bg: alpha('#FF9800', 0.1), label: 'Pending' },
      confirmed: { color: '#2196F3', bg: alpha('#2196F3', 0.1), label: 'Confirmed' },
      in_progress: { color: '#9C27B0', bg: alpha('#9C27B0', 0.1), label: 'In Progress' },
      completed: { color: '#4CAF50', bg: alpha('#4CAF50', 0.1), label: 'Completed' },
      cancelled: { color: '#F44336', bg: alpha('#F44336', 0.1), label: 'Cancelled' },
    }
    const status = statusConfig[booking.status] || statusConfig.pending

    return (
    <Card 
      key={booking._id} 
      sx={{ 
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)',
        }
      }}
    >
      <Box
        sx={{
          height: 4,
          background: `linear-gradient(90deg, ${status.color} 0%, ${status.color}dd 100%)`,
        }}
      />
      <CardContent sx={{ p: 3.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={2} mb={1.5}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: status.bg,
                  color: status.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Schedule sx={{ fontSize: 24 }} />
              </Box>
              <Box flex={1}>
                <Typography variant="h5" fontWeight="700" color="text.primary" mb={0.5}>
                  {booking.serviceName}
                </Typography>
                <Chip
                  label={status.label}
                  size="small"
                  sx={{
                    bgcolor: status.bg,
                    color: status.color,
                    fontWeight: 700,
                    height: 28,
                    px: 1,
                  }}
                />
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: alpha('#4CAF50', 0.1),
              border: '2px solid',
              borderColor: '#4CAF50',
              textAlign: 'center',
              minWidth: 100,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Amount
            </Typography>
            <Typography variant="h5" fontWeight="800" color="success.main">
              ₹{booking.totalAmount}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              p={2}
              bgcolor={alpha('#2196F3', 0.05)}
              borderRadius={2.5}
              sx={{
                border: '1px solid',
                borderColor: alpha('#2196F3', 0.15),
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha('#2196F3', 0.08),
                  transform: 'translateX(4px)',
                }
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Person sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Customer
                </Typography>
                <Typography variant="body1" fontWeight="700" color="text.primary" sx={{ mt: 0.5 }}>
                  {booking.customer.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {booking.customer.phone}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box 
              display="flex" 
              alignItems="center" 
              gap={2} 
              p={2}
              bgcolor={alpha('#FF9800', 0.05)}
              borderRadius={2.5}
              sx={{
                border: '1px solid',
                borderColor: alpha('#FF9800', 0.15),
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: alpha('#FF9800', 0.08),
                  transform: 'translateX(4px)',
                }
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#FF9800',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarToday sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Scheduled
                </Typography>
                <Typography variant="body1" fontWeight="700" color="text.primary" sx={{ mt: 0.5 }}>
                  {booking.scheduledDate}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  <AccessTime sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                  {booking.scheduledTime}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box 
              display="flex" 
              alignItems="start" 
              gap={2}
              p={2}
              bgcolor={alpha('#F44336', 0.05)}
              borderRadius={2.5}
              sx={{
                border: '1px solid',
                borderColor: alpha('#F44336', 0.15),
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'error.main',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LocationOn sx={{ fontSize: 22 }} />
              </Box>
              <Box flex={1}>
                <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5, display: 'block' }}>
                  Service Location
                </Typography>
                <Typography variant="body1" fontWeight="600" color="text.primary">
                  {booking.customer.address.street}, {booking.customer.address.area}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {booking.customer.address.city}, {booking.customer.address.state} - {booking.customer.address.pincode}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Premium Payment Review Section */}
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
                <Divider sx={{ my: 3 }} />
                <Card 
                  sx={{ 
                    bgcolor: alpha('#4CAF50', 0.08),
                    border: '2px solid',
                    borderColor: '#4CAF50',
                    borderRadius: 3,
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: '#4CAF50',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Receipt sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography variant="h6" fontWeight="700" color="success.dark">
                        Payment Received
                      </Typography>
                    </Box>
                    <Grid container spacing={2.5}>
                      <Grid item xs={6}>
                        <Box
                          p={2}
                          bgcolor={alpha('#4CAF50', 0.1)}
                          borderRadius={2}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                            Amount
                          </Typography>
                          <Typography variant="h6" fontWeight="800" color="success.main">
                            ₹{booking.totalAmount}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          p={2}
                          bgcolor={alpha('#4CAF50', 0.1)}
                          borderRadius={2}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                            Method
                          </Typography>
                          <Typography variant="body1" fontWeight="700" sx={{ textTransform: 'capitalize' }}>
                            {booking.paymentMethod || 'Cash'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          p={2}
                          bgcolor={alpha('#4CAF50', 0.1)}
                          borderRadius={2}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                            Status
                          </Typography>
                          <Chip
                            label="Received"
                            size="small"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{
                              fontWeight: 700,
                              height: 28,
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box
                          p={2}
                          bgcolor={alpha('#4CAF50', 0.1)}
                          borderRadius={2}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.5 }}>
                            Date
                          </Typography>
                          <Typography variant="body1" fontWeight="700">
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
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )
          }
          return null
        })()}

        <Divider sx={{ my: 3 }} />

        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => navigate(`/bookings/${booking._id}`)}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            View Details
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<Phone />}
            onClick={() => handleCallCustomer(booking.customer.phone)}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Call Customer
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Navigation />}
            onClick={() => handleNavigate(booking.customer.address)}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Navigate
          </Button>

          {booking.status === 'pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleAction(booking, 'accept')}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Accept
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleAction(booking, 'reject')}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Reject
              </Button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => handleAction(booking, 'start')}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Start Work
            </Button>
          )}

          {booking.status === 'in_progress' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => handleAction(booking, 'complete')}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.2s ease',
              }}
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
                variant="contained"
                color="primary"
                startIcon={<Payment />}
                onClick={() => {
                  setSelectedBookingForPayment(booking)
                  setPaymentAmount(booking.totalAmount.toString())
                  setPaymentReceivedDialog(true)
                }}
                disabled={isPaymentReceived}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(33, 150, 243, 0.4)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isPaymentReceived ? 'Payment Received' : 'Mark Payment Received'}
              </Button>
            ) : isCompleted && (isPayAfterService || isCash) && isPaymentReceived ? (
              <Chip
                icon={<CheckCircle />}
                label="Payment Received"
                color="success"
                sx={{
                  fontWeight: 700,
                  height: 36,
                  px: 1.5,
                }}
              />
            ) : null
          })()}
        </Box>
      </CardContent>
    </Card>
    )
  }

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

  // Calculate stats
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    inProgress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalEarnings: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
  }

  return (
    <Box sx={{ 
      bgcolor: '#f5f7fa',
      minHeight: '100vh',
      p: { xs: 2, md: 4 },
    }}>
      {/* Premium Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          mb: 4,
          p: { xs: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography 
            variant="h3" 
            fontWeight="800" 
            sx={{ 
              color: 'white',
              mb: 1,
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: { xs: '1.75rem', md: '2.5rem' }
            }}
          >
            My Bookings
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255,255,255,0.95)',
              fontWeight: 500,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}
          >
            Manage your assigned bookings
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={3}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              }
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="800" color="primary.main">
                {stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Bookings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              }
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="800" color="#FF9800">
                {stats.pending}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              }
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="800" color="#2196F3">
                {stats.inProgress}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-4px)',
              }
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="800" color="#4CAF50">
                {stats.completed}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-4px)',
              }
            }}
          >
            <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="800" sx={{ color: 'white' }}>
                ₹{stats.totalEarnings.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Premium Tabs */}
      <Card 
        sx={{ 
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              minHeight: 64,
              '&.Mui-selected': {
                color: 'primary.main',
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            }
          }}
        >
          <Tab 
            label={
              <Badge badgeContent={stats.total} color="primary" max={99}>
                <Box sx={{ px: 1 }}>All</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.pending} color="warning" max={99}>
                <Box sx={{ px: 1 }}>Pending</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.confirmed} color="info" max={99}>
                <Box sx={{ px: 1 }}>Confirmed</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.inProgress} color="primary" max={99}>
                <Box sx={{ px: 1 }}>In Progress</Box>
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={stats.completed} color="success" max={99}>
                <Box sx={{ px: 1 }}>Completed</Box>
              </Badge>
            } 
          />
        </Tabs>
      </Card>

      {/* Bookings List */}
      {loading ? (
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <CardContent>
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={6}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" mt={3} color="text.secondary" fontWeight="600">
                Loading bookings...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : error ? (
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <CardContent>
            <Alert 
              severity="error" 
              action={
                <Button 
                  variant="contained"
                  color="error"
                  onClick={loadBookings}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 600,
                    textTransform: 'none',
                  }}
                >
                  Retry
                </Button>
              }
              sx={{
                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          </CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <CardContent>
            <Box textAlign="center" p={6}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: alpha('#2196F3', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Schedule sx={{ fontSize: 60, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" fontWeight="700" color="text.primary" mb={1}>
                No Bookings Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" mb={3}>
                No bookings assigned to you yet. Bookings will appear here once an admin assigns them to you.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : filteredBookings.length === 0 ? (
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <CardContent>
            <Alert 
              severity="info"
              sx={{
                borderRadius: 2,
              }}
            >
              No bookings found in this category
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {filteredBookings.map(renderBookingCard)}
        </Box>
      )}

      {/* Action Dialog */}
      <Dialog
        open={actionDialog}
        onClose={() => {
          setActionDialog(false)
          setCompletePaymentMethod('cash')
        }}
        maxWidth="sm"
        fullWidth
      >
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
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    How did the customer pay?
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant={completePaymentMethod === 'cash' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setCompletePaymentMethod('cash')}
                      startIcon={<AttachMoney />}
                    >
                      Cash
                    </Button>
                    <Button
                      variant={completePaymentMethod === 'online' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setCompletePaymentMethod('online')}
                      startIcon={<CreditCard />}
                    >
                      Online
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {completePaymentMethod === 'cash'
                      ? 'Payment will be marked as received on completion.'
                      : 'Payment status will remain as recorded.'}
                  </Typography>
                </Box>
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
            disabled={false}
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

