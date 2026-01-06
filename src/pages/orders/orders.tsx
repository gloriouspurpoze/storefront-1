/**
 * Orders Page - Connected to Real API
 * Manages product orders with complete functionality
 * 
 * @author Senior Engineering Team
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Menu,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import { OrdersService, type Order, type OrdersQuery, type OrderStatus } from '../../services/api/orders.service'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'

const statusColors: Record<OrderStatus, any> = {
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
  refunded: 'default',
}

const statusIcons: Record<OrderStatus, any> = {
  pending: ShoppingCartIcon,
  confirmed: CheckCircleIcon,
  processing: ShippingIcon,
  shipped: ShippingIcon,
  delivered: CheckCircleIcon,
  cancelled: CancelIcon,
  refunded: CancelIcon,
}

export function Orders() {
  // State management
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      const query: OrdersQuery = {
        page,
        limit: 20,
      }

      if (selectedStatus !== 'all') {
        query.status = selectedStatus as OrderStatus
      }

      const response = await OrdersService.getOrders(query)
      
      if (response.success && response.data) {
        setOrders(response.data.orders || [])
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1)
        }
      } else {
        throw new Error(response.error || 'Failed to fetch orders')
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch orders when component mounts or filters change
  useEffect(() => {
    fetchOrders()
  }, [page, selectedStatus])

  // Filter orders locally by search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      order.orderNumber?.toLowerCase().includes(searchLower) ||
      order.notes?.toLowerCase().includes(searchLower) ||
      order.customer?.firstName?.toLowerCase().includes(searchLower) ||
      order.customer?.lastName?.toLowerCase().includes(searchLower)
    )
  })

  // Calculate stats from current orders
  const orderStats = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget)
    setSelectedOrder(order)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedOrder(null)
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      setLoading(true)
      await OrdersService.cancelOrder(orderId, 'Cancelled by admin')
      setSnackbar({ open: true, message: 'Order cancelled successfully', severity: 'success' })
      fetchOrders()
      handleMenuClose()
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to cancel order', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setPage(1) // Reset to first page when filter changes
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const StatCard = ({ title, value, color = 'primary' }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: `${color}.main`,
            }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const OrderCard = ({ order }: { order: Order }) => {
    const StatusIcon = statusIcons[order.status]
    const statusColor = statusColors[order.status]

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Order {order.orderNumber}
                </Typography>
                <Chip
                  icon={<StatusIcon />}
                  label={order.status.replace('_', ' ')}
                  size="small"
                  color={statusColor}
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip
                  label={order.paymentStatus}
                  size="small"
                  variant="outlined"
                  color={order.paymentStatus === 'paid' ? 'success' : 'default'}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {order.items.length} item(s) • {order.paymentMethod || 'No payment method'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
              >
                View
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                disabled={order.status === 'delivered' || order.status === 'cancelled'}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, order)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingCartIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(order.totalAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total amount
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShippingIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {order.trackingNumber || 'No tracking'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tracking number
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Shipping to
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(order.createdAt)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Order date
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {order.customer?.firstName ? getInitials(`${order.customer.firstName} ${order.customer.lastName}`) : 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {order.customer?.firstName && order.customer?.lastName
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : `Customer #${order.userId}`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {order.customer?.email || 'No email'}
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1}>
              {order.couponCode && (
                <Chip
                  label={`Coupon: ${order.couponCode}`}
                  size="small"
                  variant="outlined"
                  color="success"
                />
              )}
              {order.discountAmount > 0 && (
                <Chip
                  label={`Saved ${formatCurrency(order.discountAmount)}`}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>

          {order.items.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Items:
              </Typography>
              <Stack spacing={0.5}>
                {order.items.slice(0, 3).map((item, idx) => (
                  <Typography key={idx} variant="body2" color="text.secondary">
                    {item.quantity}x {item.name} - {formatCurrency(item.total)}
                  </Typography>
                ))}
                {order.items.length > 3 && (
                  <Typography variant="body2" color="text.secondary">
                    +{order.items.length - 3} more items
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track product orders
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<FilterIcon />}>
            Export
          </Button>
          <Button variant="contained" startIcon={<ShoppingCartIcon />}>
            New Order
          </Button>
        </Stack>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={2.4}>
          <StatCard title="Pending" value={orderStats.pending} color="warning" />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard title="Processing" value={orderStats.processing} color="info" />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard title="Shipped" value={orderStats.shipped} color="primary" />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard title="Delivered" value={orderStats.delivered} color="success" />
        </Grid>
        <Grid item xs={6} sm={2.4}>
          <StatCard title="Cancelled" value={orderStats.cancelled} color="error" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by order number, customer, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
                sx={{ height: 56 }}
              >
                More Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress size={48} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Loading orders...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we fetch your orders
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <>
          {filteredOrders.length > 0 ? (
            <Stack spacing={2}>
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </Stack>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No orders found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm || selectedStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Orders will appear here when customers make purchases.'}
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Order Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Order
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedOrder) {
              handleCancelOrder(selectedOrder.id)
            }
          }} 
          sx={{ color: 'error.main' }}
          disabled={selectedOrder?.status === 'delivered' || selectedOrder?.status === 'cancelled'}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Cancel Order
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
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
