import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon
} from '@mui/icons-material'
import { Order, OrderStatus } from '../../types'
import { StatusBadge } from '../common/StatusBadge'

interface OrderTableProps {
  orders: Order[]
  onViewOrder: (order: Order) => void
  onEditOrder: (order: Order) => void
  onDeleteOrder: (order: Order) => void
  onPrintOrder: (order: Order) => void
  loading?: boolean
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onPrintOrder,
  loading = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget)
    setSelectedOrder(order)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedOrder(null)
  }

  const handleAction = (action: (order: Order) => void) => {
    if (selectedOrder) {
      action(selectedOrder)
    }
    handleMenuClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const getCustomerTypeColor = (type: string) => {
    switch (type) {
      case 'Pro Customer':
        return theme.palette.success.main
      case 'VIP Customer':
        return theme.palette.warning.main
      default:
        return theme.palette.text.secondary
    }
  }

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {orders.map((order) => (
          <Paper key={order.id} sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={order.product.image}
                  alt={order.product.name}
                  sx={{ width: 40, height: 40 }}
                />
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {order.product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.product.type}
                  </Typography>
                </Box>
              </Box>
              <StatusBadge status={order.status} />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Order ID
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {order.order_id}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Amount
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {formatCurrency(order.amount)}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={order.customer.avatar}
                  alt={order.customer.name}
                  sx={{ width: 24, height: 24 }}
                />
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {order.customer.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ color: getCustomerTypeColor(order.customer.type) }}
                  >
                    {order.customer.type}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, order)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>
    )
  }

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
              <TableCell sx={{ fontWeight: 600 }}>Product Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Order Id</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={order.product.image}
                      alt={order.product.name}
                      sx={{ width: 48, height: 48 }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {order.product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.product.type}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={order.customer.avatar}
                      alt={order.customer.name}
                      sx={{ width: 40, height: 40 }}
                    />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={500}>
                        {order.customer.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ color: getCustomerTypeColor(order.customer.type) }}
                      >
                        {order.customer.type}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {order.order_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(order.order_date)}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {formatCurrency(order.amount)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.payment_method}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>

                <TableCell sx={{ textAlign: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, order)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleAction(onViewOrder)}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction(onEditOrder)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Order
        </MenuItem>
        <MenuItem onClick={() => handleAction(onPrintOrder)}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          Print Order
        </MenuItem>
        <MenuItem onClick={() => handleAction(onDeleteOrder)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Order
        </MenuItem>
      </Menu>
    </>
  )
}
