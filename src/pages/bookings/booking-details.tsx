/**
 * ============================================================================
 * BOOKING DETAILS PAGE - MODERN & USER-FRIENDLY DESIGN
 * ============================================================================
 * Beautiful, intuitive booking view for administrators
 * 
 * @author CTO Team
 * @date November 7, 2025
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip,
  alpha,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Delete,
  Phone,
  Email,
  LocationOn,
  CalendarToday,
  AccessTime,
  AttachMoney,
  CheckCircle,
  Cancel,
  Navigation,
  AssignmentInd,
  Star,
  Verified,
  Home,
  Schedule,
  PlayArrow,
  AccountBalanceWallet,
  TrendingUp,
  Info,
  Payment,
  Person,
  Business,
  Receipt,
  History,
  MoreVert,
} from '@mui/icons-material'
import { AssignProfessionalDialog } from '../../components/bookings/AssignProfessionalDialog'
import { BookingsService } from '../../services/api/bookings.service'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { PaymentsService } from '../../services/api/payments.service'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'

interface BookingDetails {
  _id: string
  bookingId: string
  customer: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    totalBookings: number
  }
  service: {
    _id: string
    name: string
    category: string
    duration: number
  }
  address: {
    street: string
    area: string
    city: string
    state: string
    pincode: string
    landmark?: string
  }
  provider?: {
    _id: string
    businessName: string
    email: string
    phone: string
  }
  professional?: {
    _id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    rating: number
    categories: string[]
  }
  scheduledDate: string
  scheduledTime: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  totalAmount: number
  baseAmount: number
  taxAmount: number
  discountAmount: number
  paymentStatus: 'pending' | 'paid' | 'completed' | 'refunded'
  paymentMethod?: string
  notes?: string
  customerNotes?: string
  activity: Array<{
    action: string
    user: string
    timestamp: string
    details?: string
  }>
  createdAt: string
  updatedAt: string
}

const statusConfig = {
  pending: { 
    color: '#FF9800', 
    bg: '#FFF3E0', 
    label: 'Pending',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
  },
  confirmed: { 
    color: '#2196F3', 
    bg: '#E3F2FD', 
    label: 'Confirmed',
    gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
  },
  in_progress: { 
    color: '#9C27B0', 
    bg: '#F3E5F5', 
    label: 'In Progress',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)'
  },
  completed: { 
    color: '#4CAF50', 
    bg: '#E8F5E9', 
    label: 'Completed',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
  },
  cancelled: { 
    color: '#F44336', 
    bg: '#FFEBEE', 
    label: 'Cancelled',
    gradient: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)'
  },
}

export function BookingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const authState = useAppSelector((state) => state.auth)
  const user = authState?.user ?? null
  const userType = (user as any)?.userType || user?.userType
  const isAdmin = userType === 'admin' || userType === 'super_admin'
  const isProfessional = userType === 'professional'
  
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignProfessionalOpen, setAssignProfessionalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [actionDialog, setActionDialog] = useState(false)
  const [action, setAction] = useState<'accept' | 'start' | 'complete' | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [earningsDialog, setEarningsDialog] = useState(false)
  const [earningsInfo, setEarningsInfo] = useState<{
    bookingAmount: number
    platformCommission: number
    professionalEarnings: number
  } | null>(null)
  const [paymentReceivedDialog, setPaymentReceivedDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  // Check if current professional is assigned to this booking
  const isAssignedProfessional = booking && isProfessional && booking.professional && (
    booking.professional._id === user?.id || 
    booking.professional._id === (user as any)?._id ||
    (booking as any).professionalId === user?.id ||
    (booking as any).professionalId === (user as any)?._id
  )

  useEffect(() => {
    loadBooking()
  }, [id])

  const loadBooking = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await BookingsService.getBookingDetails(id)
      console.log('📦 Raw API Response:', response)
      
      if (response.success && response.data) {
        const apiBooking = response.data.booking || response.data
        console.log('📦 API Booking Data:', apiBooking)
        
        const transformed: BookingDetails = {
          _id: apiBooking._id || apiBooking.id,
          bookingId: apiBooking.bookingId || `BKG-${String(apiBooking._id).slice(-8).toUpperCase()}`,
          
          // Customer data - handle both formats
          customer: {
            _id: apiBooking.customer?.id || apiBooking.customer?._id || apiBooking.customerId || 'unknown',
            firstName: apiBooking.customer?.firstName || apiBooking.address?.firstName || 'Unknown',
            lastName: apiBooking.customer?.lastName || apiBooking.address?.lastName || 'Customer',
            email: apiBooking.customer?.email || 'N/A',
            phone: apiBooking.customer?.phone || apiBooking.address?.phone || 'N/A',
            totalBookings: apiBooking.customer?.totalBookings || 0,
          },
          
          // Service data - handle services array
          service: apiBooking.services && apiBooking.services.length > 0 ? {
            _id: apiBooking.services[0].serviceId || apiBooking.services[0].serviceDetails?.id || 'unknown',
            name: apiBooking.services[0].serviceName || apiBooking.services[0].serviceDetails?.name || 'Service',
            category: apiBooking.services[0].serviceDetails?.category || apiBooking.service?.category || 'General',
            duration: apiBooking.service?.duration || 60,
          } : (apiBooking.service ? {
            _id: apiBooking.service.id || apiBooking.service._id || 'unknown',
            name: apiBooking.service.name || 'Service',
            category: apiBooking.service.category || 'General',
            duration: apiBooking.service.duration || 60,
          } : {
            _id: 'unknown',
            name: 'Service',
            category: 'General',
            duration: 60,
          }),
          
          // Address data
          address: apiBooking.address ? {
            street: apiBooking.address.address || apiBooking.address.street || 'N/A',
            area: apiBooking.address.area || '',
            city: apiBooking.address.city || 'N/A',
            state: apiBooking.address.state || 'N/A',
            pincode: apiBooking.address.zipCode || apiBooking.address.pincode || 'N/A',
            landmark: apiBooking.address.landmark,
          } : {
            street: 'N/A',
            area: 'N/A',
            city: 'N/A',
            state: 'N/A',
            pincode: 'N/A',
          },
          
          // Provider data
          provider: apiBooking.provider || apiBooking.providerId ? {
            _id: apiBooking.provider?._id || apiBooking.provider?.id || apiBooking.providerId?._id || apiBooking.providerId || 'unknown',
            businessName: apiBooking.provider?.businessName || 'N/A',
            email: apiBooking.provider?.businessEmail || apiBooking.provider?.email || 'N/A',
            phone: apiBooking.provider?.businessPhone || apiBooking.provider?.phone || 'N/A',
          } : undefined,
          
          // Professional data - handle all possible field names and formats
          professional: undefined, // Will be set below if professional data exists
          
          // Dates and times
          scheduledDate: apiBooking.scheduledDate ? 
            new Date(apiBooking.scheduledDate).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'N/A',
          scheduledTime: apiBooking.scheduledTime || 'N/A',
          
          // Status and payment
          status: apiBooking.status || 'pending',
          totalAmount: apiBooking.totalAmount || apiBooking.total_amount || 0,
          baseAmount: apiBooking.baseAmount || apiBooking.totalAmount || apiBooking.total_amount || 0,
          taxAmount: apiBooking.taxAmount || 0,
          discountAmount: apiBooking.discountAmount || 0,
          paymentStatus: apiBooking.paymentStatus || apiBooking.payment_status || 'pending',
          paymentMethod: apiBooking.paymentMethod || apiBooking.payment_method || 'N/A',
          
          // Notes
          notes: apiBooking.notes || '',
          customerNotes: apiBooking.customerNotes || apiBooking.notes || '',
          
          // Activity
          activity: apiBooking.activity || [],
          
          // Timestamps
          createdAt: apiBooking.createdAt || apiBooking.created_at || new Date().toISOString(),
          updatedAt: apiBooking.updatedAt || apiBooking.updated_at || new Date().toISOString(),
        }
        
        console.log('✅ Transformed Booking:', transformed)
        setBooking(transformed)
        
        // Handle professional data - fetch if it's just an ID, or use if it's already populated
        const professionalData = apiBooking.professionalId || apiBooking.professional_id || apiBooking.professional;
        
        if (professionalData) {
          if (typeof professionalData === 'string') {
            // It's just an ID, fetch the professional details
            try {
              console.log('🔍 Fetching professional details for ID:', professionalData)
              const professionalResponse = await ProfessionalsService.getProfessional(professionalData)
              if (professionalResponse.success && professionalResponse.data) {
                const profData = professionalResponse.data
                const professionalDetails = {
                  _id: profData._id || profData.id || professionalData,
                  firstName: profData.firstName || profData.user?.firstName || 'N/A',
                  lastName: profData.lastName || profData.user?.lastName || '',
                  email: profData.email || profData.user?.email || 'N/A',
                  phone: profData.phoneNumber || profData.phone || profData.user?.phone || 'N/A',
                  rating: profData.averageRating || profData.rating || 0,
                  categories: profData.categories || profData.services?.map((s: any) => s.name || s) || [],
                }
                console.log('✅ Professional details fetched:', professionalDetails)
                setBooking(prev => prev ? { ...prev, professional: professionalDetails } : prev)
              }
            } catch (profErr: any) {
              console.warn('⚠️ Failed to fetch professional details:', profErr.message)
              // Don't fail the whole page load if professional fetch fails
            }
          } else {
            // It's already a populated object, use it directly
            const professionalDetails = {
              _id: professionalData._id || professionalData.id || 'unknown',
              firstName: professionalData.firstName || (professionalData as any).user?.firstName || 'N/A',
              lastName: professionalData.lastName || (professionalData as any).user?.lastName || '',
              email: professionalData.email || (professionalData as any).user?.email || 'N/A',
              phone: professionalData.phoneNumber || professionalData.phone || (professionalData as any).user?.phone || 'N/A',
              rating: (professionalData as any).averageRating || professionalData.rating || 0,
              categories: professionalData.categories || professionalData.services?.map((s: any) => s.name || s) || [],
            }
            console.log('✅ Using populated professional data:', professionalDetails)
            setBooking(prev => prev ? { ...prev, professional: professionalDetails } : prev)
          }
        }
      } else {
        throw new Error(response.message || 'Failed to load booking')
      }
    } catch (err: any) {
      console.error('❌ Error loading booking:', err)
      setError(err.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = () => {
    if (booking) {
      const query = `${booking.address.street}, ${booking.address.area}, ${booking.address.city}, ${booking.address.state}`
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
    }
  }

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setSnackbar({ open: true, message: 'Please provide a cancellation reason', severity: 'error' })
      return
    }
    
    try {
      if (id) {
        const response = await BookingsService.cancelBooking(id, cancelReason)
        if (response.success) {
          setSnackbar({ open: true, message: 'Booking cancelled successfully', severity: 'success' })
          setCancelDialogOpen(false)
          setTimeout(() => loadBooking(), 1000)
        } else {
          throw new Error(response.message || 'Failed to cancel booking')
        }
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to cancel booking', severity: 'error' })
    }
  }

  const handleDeleteBooking = async () => {
    try {
      if (id) {
        const response = await BookingsService.deleteBooking(id)
        if (response.success) {
          setSnackbar({ open: true, message: 'Booking deleted successfully', severity: 'success' })
          setDeleteDialogOpen(false)
          setTimeout(() => navigate('/bookings'), 1500)
        } else {
          throw new Error(response.message || 'Failed to delete booking')
        }
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete booking', severity: 'error' })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Professional actions
  const handleProfessionalAction = async () => {
    if (!booking || !action || !id) return

    try {
      let response
      
      switch (action) {
        case 'accept':
          // Accept booking - try professional endpoint first, fallback to regular endpoint
          try {
            response = await BookingsService.updateProfessionalBookingStatus(id, {
              status: 'scheduled' as any, // Type assertion needed as backend accepts 'confirmed'
              notes: actionNotes || undefined,
            })
          } catch (err: any) {
            // Fallback to regular endpoint if professional endpoint doesn't exist
            if (err.response?.status === 404) {
              response = await BookingsService.updateBookingStatus(id, {
                status: 'scheduled' as any,
                notes: actionNotes || undefined,
              })
            } else {
              throw err
            }
          }
          break
          
        case 'start':
          // Start work - use dedicated start method that tries multiple endpoints
          response = await BookingsService.startBooking(id, actionNotes || undefined)
          break
          
        case 'complete':
          // Step 1: Check payment method and status
          const paymentCompleted = booking.paymentStatus === 'paid' || 
                                   booking.paymentStatus === 'completed' ||
                                   booking.paymentStatus === 'customer_paid' ||
                                   booking.paymentStatus === 'verified'
          
          const isCashPayment = (() => {
            const method = booking.paymentMethod?.toLowerCase() || ''
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
              const paymentsResponse = await PaymentsService.getPaymentsByBooking(id)
              
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
          response = await BookingsService.completeBooking(id, actionNotes || undefined, {
            notifyAdmin: true, // ✅ Notify admin when service is completed
            notifyCustomer: true, // Notify customer
          })
          
          // Step 3: Calculate and show earnings (for professionals)
          if (response.success && isProfessional && booking) {
            // Calculate earnings (assuming 10% platform commission)
            // Note: Backend should return actual commission rate, but we'll use 10% as default
            const platformCommissionRate = 0.10 // 10% commission
            const bookingAmount = booking.totalAmount || 0
            const platformCommission = bookingAmount * platformCommissionRate
            const professionalEarnings = bookingAmount - platformCommission
            
            setEarningsInfo({
              bookingAmount,
              platformCommission,
              professionalEarnings,
            })
            setEarningsDialog(true)
            
            // Show success message
            dispatch(addToast({
              message: 'Booking completed! Admin has been notified. Your earnings have been added to your wallet.',
              severity: 'success'
            }))
            
            console.log('✅ Booking completed successfully')
            console.log('📧 Admin notification sent by backend')
            console.log('💰 Earnings calculated:', { bookingAmount, platformCommission, professionalEarnings })
          }
          break
          
        default:
          throw new Error('Invalid action')
      }
      
      if (response.success) {
        setSnackbar({ 
          open: true, 
          message: action === 'accept' ? 'Booking accepted successfully!' 
            : action === 'start' ? 'Work started successfully!' 
            : 'Booking completed successfully!', 
          severity: 'success' 
        })
        await loadBooking()
        setActionDialog(false)
        setAction(null)
        setActionNotes('')
      } else {
        throw new Error(response.message || 'Failed to update booking')
      }
    } catch (error: any) {
      console.error('Action failed:', error)
      setSnackbar({ open: true, message: error.message || 'Failed to update booking', severity: 'error' })
      setActionDialog(false)
      setAction(null)
      setActionNotes('')
    }
  }

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" mt={3} color="text.secondary">
          Loading booking details...
        </Typography>
      </Box>
    )
  }

  if (error || !booking) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Booking not found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/bookings')}>
          Back to Bookings
        </Button>
      </Box>
    )
  }

  const config = statusConfig[booking.status]
console.log("detailssss",booking)
  return (
    <Box sx={{ 
      p: { xs: 2, md: 4 },
      bgcolor: '#f5f7fa',
      minHeight: '100vh',
    }}>
      {/* Premium Header Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 50%, ${config.color}cc 100%)`,
          borderRadius: 4,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
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
        <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2.5, md: 4 } }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box display="flex" alignItems="center" gap={3}>
              <Tooltip title="Back to Bookings">
                <IconButton 
                  onClick={() => navigate('/bookings')}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.25)', 
                    color: 'white',
                    width: 48,
                    height: 48,
                    backdropFilter: 'blur(10px)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.35)',
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <ArrowBack />
                </IconButton>
              </Tooltip>
              <Box>
                <Typography 
                  variant="h4" 
                  fontWeight="800"
                  sx={{ 
                    color: 'white',
                    mb: 0.5,
                    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    fontSize: { xs: '1.75rem', md: '2rem' }
                  }}
                >
                  {booking.bookingId}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.95)',
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  {booking.service.name}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={config.label}
              sx={{
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: 13, md: 15 },
                px: 2.5,
                py: 1,
                height: 'auto',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Premium Action Buttons Section */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1.5}>
          {isAdmin ? (
            // Admin buttons
            <>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => navigate(`/bookings/${id}/edit`)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Edit Booking
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AssignmentInd />}
                onClick={() => setAssignProfessionalOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
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
                {booking.professional ? 'Reassign' : 'Assign'} Professional
              </Button>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<Cancel />}
                onClick={() => setCancelDialogOpen(true)}
                disabled={booking.status === 'cancelled' || booking.status === 'completed'}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
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
                Cancel Booking
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => setDeleteDialogOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
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
                Delete
              </Button>
            </>
          ) : isProfessional ? (
            // Professional buttons - only show if this booking is assigned to them
            isAssignedProfessional ? (
              <>
                {booking.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => {
                        setAction('accept')
                        setActionDialog(true)
                      }}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
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
                      Accept Booking
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => setCancelDialogOpen(true)}
                      sx={{ 
                        borderRadius: 2,
                        px: 3,
                        py: 1.2,
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
                    onClick={() => {
                      setAction('start')
                      setActionDialog(true)
                    }}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.2,
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
                    onClick={() => {
                      setAction('complete')
                      setActionDialog(true)
                    }}
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      py: 1.2,
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
                  
                  const shouldShowButton = isCompleted && (isPayAfterService || isCash) && paymentNotPaid && isAssignedProfessional
                  
                  // Disable button if payment is already marked as received
                  const isPaymentReceived = !paymentNotPaid
                  
                  // Debug log for all completed bookings when professional
                  if (isCompleted && isProfessional) {
                    console.log('🔍 Payment Button Debug (Details Page):', {
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
                      shouldShowButton,
                      isProfessional,
                      isAssignedProfessional
                    })
                  }
                  
                  return shouldShowButton ? (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Payment />}
                      onClick={() => {
                        setPaymentAmount(booking.totalAmount.toString())
                        setPaymentReceivedDialog(true)
                      }}
                      disabled={isPaymentReceived}
                      sx={{ borderRadius: 2 }}
                    >
                      {isPaymentReceived ? 'Payment Already Received' : 'Mark Payment Received'}
                    </Button>
                  ) : isCompleted && (isPayAfterService || isCash) && isPaymentReceived ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="Payment Received"
                      color="success"
                      sx={{ borderRadius: 2 }}
                    />
                  ) : null
                })()}
                {(() => {
                  const statusLower = booking.status?.toLowerCase() || ''
                  const isCompleted = statusLower === 'completed'
                  const paymentMethodLower = booking.paymentMethod?.toLowerCase() || ''
                  const isPayAfterService = paymentMethodLower.includes('pay_after') || 
                                           paymentMethodLower.includes('pay after') ||
                                           paymentMethodLower === 'pay_later' ||
                                           paymentMethodLower.includes('pay_later') ||
                                           paymentMethodLower.includes('pay later')
                  const isCash = paymentMethodLower === 'cash' || 
                                paymentMethodLower === 'cash_on_delivery' ||
                                paymentMethodLower.includes('cash')
                  const paymentStatusLower = booking.paymentStatus?.toLowerCase() || ''
                  const paymentNotPaid = paymentStatusLower !== 'paid' && paymentStatusLower !== 'completed' && paymentStatusLower !== 'success'
                  const shouldShowPaymentButton = isCompleted && (isPayAfterService || isCash) && paymentNotPaid && isAssignedProfessional
                  
                  return (isCompleted || booking.status === 'cancelled') && !shouldShowPaymentButton ? (
                    <Typography variant="body2" color="text.secondary">
                      {isCompleted ? 'This booking has been completed.' : 'This booking has been cancelled.'}
                    </Typography>
                  ) : null
                })()}
              </>
            ) : (
              <Alert severity="info">
                This booking is not assigned to you.
              </Alert>
            )
          ) : null}
        </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Premium Customer Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: 28,
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  {booking.customer.firstName[0]}{booking.customer.lastName[0]}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                    <Typography variant="h5" fontWeight="700" color="text.primary">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </Typography>
                    <Verified sx={{ fontSize: 20, color: 'success.main' }} />
                  </Box>
                  <Chip
                    icon={<Person />}
                    label={`${booking.customer.totalBookings} Previous Bookings`}
                    size="small"
                    sx={{
                      bgcolor: alpha('#4CAF50', 0.1),
                      color: 'success.dark',
                      fontWeight: 600,
                      height: 24,
                    }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2} 
                    p={2} 
                    bgcolor={alpha('#2196F3', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#2196F3', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#2196F3', 0.12),
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
                      <Phone sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight="600" sx={{ mt: 0.5 }}>
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
                    bgcolor={alpha('#2196F3', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#2196F3', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#2196F3', 0.12),
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
                      <Email sx={{ fontSize: 22 }} />
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" fontWeight="600" noWrap sx={{ mt: 0.5 }}>
                        {booking.customer.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Premium Service Details Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
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
                  <Schedule sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  Service Details
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box mb={3}>
                <Typography variant="h5" color="primary.main" fontWeight="700" gutterBottom>
                  {booking.service.name}
                </Typography>
                <Chip 
                  label={booking.service.category} 
                  size="medium" 
                  sx={{ 
                    bgcolor: alpha('#2196F3', 0.1),
                    color: 'primary.dark',
                    fontWeight: 600,
                    height: 28,
                    px: 1,
                  }} 
                />
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={4}>
                  <Box 
                    p={2.5}
                    bgcolor={alpha('#FF9800', 0.08)}
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#FF9800', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#FF9800', 0.12),
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <CalendarToday sx={{ color: '#FF9800', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Date
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="700" color="text.primary">
                      {booking.scheduledDate}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    p={2.5}
                    bgcolor={alpha('#9C27B0', 0.08)}
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#9C27B0', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#9C27B0', 0.12),
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <AccessTime sx={{ color: '#9C27B0', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Time
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="700" color="text.primary">
                      {booking.scheduledTime}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box 
                    p={2.5}
                    bgcolor={alpha('#4CAF50', 0.08)}
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#4CAF50', 0.2),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha('#4CAF50', 0.12),
                        transform: 'scale(1.02)',
                      }
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                      <Schedule sx={{ color: '#4CAF50', fontSize: 24 }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Duration
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="700" color="text.primary">
                      {booking.service.duration} min
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Premium Address Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LocationOn sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Service Location
                  </Typography>
                </Box>
                <Button
                  startIcon={<Navigation />}
                  onClick={handleNavigate}
                  variant="contained"
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
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box 
                display="flex" 
                gap={3}
                p={2.5}
                bgcolor={alpha('#F44336', 0.05)}
                borderRadius={2.5}
                sx={{
                  border: '1px solid',
                  borderColor: alpha('#F44336', 0.15),
                }}
              >
                <LocationOn sx={{ color: 'error.main', fontSize: 40, flexShrink: 0 }} />
                <Box flex={1}>
                  <Typography variant="body1" fontWeight="700" color="text.primary" mb={1}>
                    {booking.address.street}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    {booking.address.area}, {booking.address.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {booking.address.state} - {booking.address.pincode}
                  </Typography>
                  {booking.address.landmark && (
                    <Box 
                      mt={1.5}
                      p={1.5}
                      bgcolor={alpha('#FF9800', 0.1)}
                      borderRadius={1.5}
                      display="inline-flex"
                      alignItems="center"
                      gap={1}
                    >
                      <LocationOn sx={{ fontSize: 16, color: '#FF9800' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight="600">
                        Landmark: {booking.address.landmark}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Premium Notes Card */}
          {(booking.notes || booking.customerNotes) && (
            <Card 
              sx={{ 
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                  transform: 'translateY(-2px)',
                }
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
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
                    <Info sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Notes & Instructions
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                {booking.notes && (
                  <Box 
                    mb={2.5} 
                    p={2.5} 
                    bgcolor={alpha('#2196F3', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#2196F3', 0.2),
                      borderLeft: '4px solid',
                      borderLeftColor: 'primary.main',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Info sx={{ fontSize: 18, color: 'primary.main' }} />
                      <Typography variant="subtitle2" color="primary.main" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Service Notes
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>
                      {booking.notes}
                    </Typography>
                  </Box>
                )}
                {booking.customerNotes && (
                  <Box 
                    p={2.5} 
                    bgcolor={alpha('#FF9800', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#FF9800', 0.2),
                      borderLeft: '4px solid',
                      borderLeftColor: '#FF9800',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person sx={{ fontSize: 18, color: '#FF9800' }} />
                      <Typography variant="subtitle2" color="#FF9800" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Customer Instructions
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>
                      {booking.customerNotes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activity Timeline */}
          {booking.activity && booking.activity.length > 0 && (
            <Card 
              sx={{ 
                mt: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: '#9C27B0',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <History sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="h6" fontWeight="700" color="text.primary">
                    Activity Timeline
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Stack spacing={2}>
                  {booking.activity.map((activity, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: 'relative',
                        pl: 4,
                        pb: index < booking.activity.length - 1 ? 2 : 0,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 7,
                          top: 8,
                          bottom: index < booking.activity.length - 1 ? -16 : 0,
                          width: 2,
                          bgcolor: alpha('#9C27B0', 0.2),
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          left: 4,
                          top: 4,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#9C27B0',
                          border: '2px solid white',
                          boxShadow: '0 0 0 2px rgba(156, 39, 176, 0.2)',
                        }
                      }}
                    >
                      <Box
                        p={2}
                        bgcolor={alpha('#9C27B0', 0.05)}
                        borderRadius={2}
                        sx={{
                          border: '1px solid',
                          borderColor: alpha('#9C27B0', 0.15),
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight="700" color="text.primary" mb={0.5}>
                          {activity.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </Typography>
                        {activity.details && (
                          <Typography variant="body2" color="text.secondary" mt={1} sx={{ fontStyle: 'italic' }}>
                            {activity.details}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Premium Professional Assignment Card */}
          <Card 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
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
                  <AssignmentInd sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  Assigned Professional
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              {booking.professional ? (
                <Box>
                  <Box display="flex" alignItems="center" gap={2.5} mb={3}>
                    <Avatar 
                      sx={{ 
                        width: 72, 
                        height: 72,
                        bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: 28,
                        fontWeight: 700,
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      }}
                    >
                      {booking.professional.firstName[0]}{booking.professional.lastName[0]}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="700" color="text.primary" mb={0.5}>
                        {booking.professional.firstName} {booking.professional.lastName}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Star sx={{ fontSize: 20, color: '#FFA726' }} />
                        <Typography variant="body1" fontWeight="700" color="text.primary">
                          {booking.professional.rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" ml={0.5}>
                          Rating
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={2} 
                    mb={2.5} 
                    p={2} 
                    bgcolor={alpha('#2196F3', 0.08)} 
                    borderRadius={2.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#2196F3', 0.2),
                    }}
                  >
                    <Phone sx={{ fontSize: 22, color: 'primary.main' }} />
                    <Typography variant="body1" fontWeight="600">
                      {booking.professional.phone}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                    Specializations
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {booking.professional.categories.map(cat => (
                      <Chip 
                        key={cat} 
                        label={cat} 
                        size="small"
                        sx={{
                          bgcolor: alpha('#2196F3', 0.1),
                          color: 'primary.dark',
                          fontWeight: 600,
                          height: 28,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Alert 
                  severity="info"
                  sx={{
                    borderRadius: 2,
                    bgcolor: alpha('#2196F3', 0.05),
                  }}
                >
                  No professional assigned yet
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Premium Payment Card */}
          <Card 
            sx={{ 
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: 3.5 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={3}>
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
                <Typography variant="h6" fontWeight="700" color="text.primary">
                  Payment Details
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Stack spacing={2.5}>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1.5}
                  bgcolor={alpha('#2196F3', 0.05)}
                  borderRadius={1.5}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    Base Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="700" color="text.primary">
                    ₹{booking.baseAmount}
                  </Typography>
                </Box>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={1.5}
                  bgcolor={alpha('#2196F3', 0.05)}
                  borderRadius={1.5}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    Tax & Fees
                  </Typography>
                  <Typography variant="body1" fontWeight="700" color="text.primary">
                    ₹{booking.taxAmount}
                  </Typography>
                </Box>
                {booking.discountAmount > 0 && (
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    p={1.5}
                    bgcolor={alpha('#4CAF50', 0.1)}
                    borderRadius={1.5}
                    sx={{
                      border: '1px solid',
                      borderColor: alpha('#4CAF50', 0.2),
                    }}
                  >
                    <Typography variant="body2" color="success.main" fontWeight="700">
                      Discount
                    </Typography>
                    <Typography variant="body1" color="success.main" fontWeight="700">
                      -₹{booking.discountAmount}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={2.5}
                  bgcolor={alpha('#4CAF50', 0.1)}
                  borderRadius={2.5}
                  sx={{
                    border: '2px solid',
                    borderColor: '#4CAF50',
                  }}
                >
                  <Typography variant="h6" fontWeight="800" color="text.primary">
                    Total Amount
                  </Typography>
                  <Typography variant="h4" fontWeight="800" color="success.main">
                    ₹{booking.totalAmount}
                  </Typography>
                </Box>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  p={2}
                  bgcolor={alpha('#FF9800', 0.05)}
                  borderRadius={2}
                >
                  <Typography variant="body2" color="text.secondary" fontWeight="600">
                    Payment Status
                  </Typography>
                  <Chip
                    label={booking.paymentStatus}
                    size="medium"
                    color={booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed' ? 'success' : 'warning'}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'capitalize',
                    }}
                  />
                </Box>
                {booking.paymentMethod && (
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems="center"
                    p={2}
                    bgcolor={alpha('#9C27B0', 0.05)}
                    borderRadius={2}
                  >
                    <Typography variant="body2" color="text.secondary" fontWeight="600">
                      Payment Method
                    </Typography>
                    <Chip
                      label={booking.paymentMethod}
                      size="small"
                      sx={{
                        bgcolor: alpha('#9C27B0', 0.1),
                        color: '#9C27B0',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

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
            
            if (isCompleted && isPaymentReceived && isProfessional) {
              return (
                <Card sx={{ borderRadius: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CheckCircle color="success" />
                      <Typography variant="h6" fontWeight="600" color="success.dark">
                        Payment Review
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Payment Status
                          </Typography>
                          <Chip
                            label="Payment Received"
                            color="success"
                            icon={<CheckCircle />}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Payment Method
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ textTransform: 'capitalize', mt: 0.5 }}>
                            {booking.paymentMethod || 'Cash'}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Amount Received
                          </Typography>
                          <Typography variant="h6" fontWeight="700" color="success.main">
                            ₹{booking.totalAmount}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Payment Date
                          </Typography>
                          <Typography variant="body1" fontWeight="500" sx={{ mt: 0.5 }}>
                            {booking.completedDate 
                              ? new Date(booking.completedDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : new Date().toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )
            }
            return null
          })()}
        </Grid>
      </Grid>

      {/* Dialogs */}
      <AssignProfessionalDialog
        open={assignProfessionalOpen}
        onClose={() => setAssignProfessionalOpen(false)}
        bookingId={id || ''}
        onAssigned={() => {
          loadBooking()
          setAssignProfessionalOpen(false)
        }}
      />

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to cancel this booking?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button variant="contained" color="error" onClick={handleCancelBooking}>
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Booking</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body2">
            Are you sure you want to permanently delete this booking?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteBooking}>
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Professional Action Dialog */}
      {isProfessional && (
        <Dialog open={actionDialog} onClose={() => {
          setActionDialog(false)
          setAction(null)
          setActionNotes('')
        }} maxWidth="sm" fullWidth>
          <DialogTitle>
            {action === 'accept' && 'Accept Booking'}
            {action === 'start' && 'Start Work'}
            {action === 'complete' && 'Complete Booking'}
          </DialogTitle>
          <DialogContent>
            {booking && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Service:</strong> {booking.service.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Customer:</strong> {booking.customer.firstName} {booking.customer.lastName}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Amount:</strong> ₹{booking.totalAmount}
                </Typography>
                
                {action === 'complete' && (
                  <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Payment Status:</strong> {(booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed')
                        ? '✅ Payment Completed' 
                        : (() => {
                            const method = booking.paymentMethod?.toLowerCase() || ''
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
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  sx={{ mt: 2 }}
                  placeholder={action === 'complete' ? 'Add completion notes...' : 'Add any notes...'}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setActionDialog(false)
              setAction(null)
              setActionNotes('')
            }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleProfessionalAction}
              color={action === 'complete' ? 'success' : 'primary'}
              disabled={action === 'complete' && !(() => {
                const method = booking.paymentMethod?.toLowerCase() || ''
                const isCashOrPayLater = method === 'cash' || 
                                        method === 'pay_after_service' ||
                                        method === 'pay_later' ||
                                        method.includes('pay_later') ||
                                        method.includes('pay after') ||
                                        method.includes('cash')
                return booking.paymentStatus === 'paid' || 
                       booking.paymentStatus === 'completed' || 
                       isCashOrPayLater
              })()}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Earnings Dialog - Shows after completion */}
      {isProfessional && earningsInfo && (
        <Dialog 
          open={earningsDialog} 
          onClose={() => {
            setEarningsDialog(false)
            setEarningsInfo(null)
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <AccountBalanceWallet color="success" />
              <Typography variant="h6">Booking Completed!</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="600">
                Service completed successfully! Admin has been notified.
              </Typography>
            </Alert>
            
            <Typography variant="h6" gutterBottom color="primary.main">
              Your Earnings Breakdown
            </Typography>
            
            <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
              <CardContent>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">Booking Amount</Typography>
                    <Typography variant="h6" fontWeight="600">₹{earningsInfo.bookingAmount}</Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">Platform Commission (10%)</Typography>
                    <Typography variant="body1" color="error.main">-₹{earningsInfo.platformCommission.toFixed(2)}</Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center" pt={1}>
                    <Typography variant="h6" fontWeight="700">Your Earnings</Typography>
                    <Typography variant="h5" fontWeight="700" color="success.main">
                      ₹{earningsInfo.professionalEarnings.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            
            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                Your earnings will be added to your wallet and available for withdrawal after admin verification.
                You can view your earnings in the Earnings & Wallet section.
              </Typography>
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setEarningsDialog(false)
                setEarningsInfo(null)
                navigate('/professional/earnings')
              }}
              variant="outlined"
            >
              View Earnings
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setEarningsDialog(false)
                setEarningsInfo(null)
              }}
            >
              Done
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Payment Received Dialog - For pay after service */}
      {isProfessional && paymentReceivedDialog && booking && (
        <Dialog 
          open={paymentReceivedDialog} 
          onClose={() => {
            setPaymentReceivedDialog(false)
            setPaymentAmount('')
            setPaymentNotes('')
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Payment color="success" />
              <Typography variant="h6">Mark Payment Received</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Confirm that you have received payment from the customer. This will update the payment status and notify both the customer and admin.
              </Typography>
            </Alert>

            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Booking Amount
              </Typography>
              <Typography variant="h5" fontWeight="600" color="primary.main">
                ₹{booking.totalAmount}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Amount Received"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              sx={{ mb: 2 }}
              helperText="Enter the amount you received from the customer"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Payment Notes (Optional)"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add any notes about the payment (e.g., payment method, transaction reference, etc.)"
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setPaymentReceivedDialog(false)
                setPaymentAmount('')
                setPaymentNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                try {
                  const amount = parseFloat(paymentAmount) || booking.totalAmount
                  
                  const response = await PaymentsService.markPaymentReceived(booking._id, {
                    amount,
                    paymentMethod: booking.paymentMethod || 'cash',
                    notes: paymentNotes || undefined,
                    notifyCustomer: true,
                    notifyAdmin: true,
                  })

                  if (response.success) {
                    dispatch(addToast({
                      message: 'Payment marked as received! Customer and admin have been notified.',
                      severity: 'success'
                    }))
                    setSnackbar({
                      open: true,
                      message: 'Payment marked as received successfully!',
                      severity: 'success'
                    })
                    setPaymentReceivedDialog(false)
                    setPaymentAmount('')
                    setPaymentNotes('')
                    await loadBooking() // Reload booking to show updated payment status
                  } else {
                    throw new Error(response.message || 'Failed to mark payment as received')
                  }
                } catch (error: any) {
                  console.error('Failed to mark payment as received:', error)
                  setSnackbar({
                    open: true,
                    message: error.message || 'Failed to mark payment as received',
                    severity: 'error'
                  })
                }
              }}
              disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Confirm Payment Received
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
