import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  Grid
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material'

interface OrderItem {
  id: string
  name: string
  image: string
  category: string
  quantity: number
  price: number
  total: number
}

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  avatar: string
  type: string
}

interface Payment {
  method: string
  status: string
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

interface Shipping {
  method: string
  address: string
  trackingNumber: string
  estimatedDelivery: string
}

interface TimelineItem {
  id: string
  title: string
  description: string
  completed: boolean
  active: boolean
  date?: string
  time?: string
}

interface OrderPreviewProps {
  order: {
    id: string
    orderNumber: string
    status: string
    createdAt: string
    updatedAt?: string
    items: OrderItem[]
    customer: Customer
    payment: Payment
    shipping: Shipping
    timeline: TimelineItem[]
  }
  onEdit: () => void
  onDelete: () => void
  onPrint: () => void
  onShare: () => void
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success'
    case 'accepted':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
    case 'cancelled':
      return 'error'
    default:
      return 'default'
  }
}

export const OrderPreview: React.FC<OrderPreviewProps> = ({
  order,
  onEdit,
  onDelete,
  onPrint,
  onShare
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Header Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Order #{order.orderNumber}
          </Typography>
          <Chip
            label={order.status}
            color={getStatusColor(order.status) as any}
            variant="filled"
            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={onEdit} color="primary" size="small">
            <EditIcon />
          </IconButton>
          <IconButton onClick={onPrint} color="primary" size="small">
            <PrintIcon />
          </IconButton>
          <IconButton onClick={onShare} color="primary" size="small">
            <ShareIcon />
          </IconButton>
          <IconButton onClick={onDelete} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Order Items */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Order Items
              </Typography>
              {order.items.map((item, index) => (
                <Box key={item.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                    <Avatar
                      src={item.image}
                      alt={item.name}
                      sx={{ width: 60, height: 60 }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Quantity: {item.quantity}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.total)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(item.price)} each
                      </Typography>
                    </Box>
                  </Box>
                  {index < order.items.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Order Timeline
              </Typography>
              <Stepper orientation="vertical" activeStep={order.timeline.filter(t => t.completed).length - 1}>
                {order.timeline.map((step, index) => (
                  <Step key={step.id} completed={step.completed} active={step.active}>
                    <StepLabel
                      icon={
                        step.completed ? (
                          <CheckCircleIcon color="success" />
                        ) : step.active ? (
                          <AccessTimeIcon color="primary" />
                        ) : (
                          <RadioButtonUncheckedIcon />
                        )
                      }
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {step.description}
                        </Typography>
                        {step.date && step.time && (
                          <Typography variant="caption" color="text.secondary">
                            {step.date} at {step.time}
                          </Typography>
                        )}
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Details Sidebar */}
        <Grid size={{ xs: 12, lg: 4 }}>
          {/* Customer Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Customer Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={order.customer.avatar}
                  alt={order.customer.name}
                  sx={{ width: 50, height: 50 }}
                />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {order.customer.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.customer.type}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Email:</strong> {order.customer.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {order.customer.phone}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {order.customer.address}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Payment Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Method:</strong> {order.payment.method}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {order.payment.status}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(order.payment.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Shipping:</Typography>
                  <Typography variant="body2">{formatCurrency(order.payment.shipping)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Tax:</Typography>
                  <Typography variant="body2">{formatCurrency(order.payment.tax)}</Typography>
                </Box>
                {order.payment.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2" color="success.main">
                      -{formatCurrency(order.payment.discount)}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total:</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {formatCurrency(order.payment.total)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Shipping Information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Shipping Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Method:</strong> {order.shipping.method}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {order.shipping.address}
                </Typography>
                <Typography variant="body2">
                  <strong>Tracking:</strong> {order.shipping.trackingNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Estimated Delivery:</strong> {order.shipping.estimatedDelivery}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Order Dates */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Order Dates
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2">
                  <strong>Order Date:</strong> {formatDate(order.createdAt)}
                </Typography>
                {order.updatedAt && (
                  <Typography variant="body2">
                    <strong>Last Updated:</strong> {formatDate(order.updatedAt)}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}