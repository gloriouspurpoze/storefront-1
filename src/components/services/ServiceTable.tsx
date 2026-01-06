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
  Rating,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon
} from '@mui/icons-material'

export interface Service {
  id: string
  name: string
  description: string
  category: {
    id: string
    name: string
    icon?: string
    color?: string
  }
  price: number
  duration: number
  isActive: boolean
  isFeatured: boolean
  provider?: {
    id: string
    name: string
    avatar?: string
    rating: number
  }
  rating: number
  reviewCount: number
  bookingsCount: number
  createdAt: string
  updatedAt?: string
}

interface ServiceTableProps {
  services: Service[]
  onViewService: (service: Service) => void
  onEditService: (service: Service) => void
  onDeleteService: (service: Service) => void
  onToggleActive: (service: Service) => void
  onDuplicateService: (service: Service) => void
  loading?: boolean
}

export const ServiceTable: React.FC<ServiceTableProps> = ({
  services,
  onViewService,
  onEditService,
  onDeleteService,
  onToggleActive,
  onDuplicateService,
  loading = false
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const [selectedService, setSelectedService] = React.useState<Service | null>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, service: Service) => {
    setAnchorEl(event.currentTarget)
    setSelectedService(service)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedService(null)
  }

  const handleAction = (action: (service: Service) => void) => {
    if (selectedService) {
      action(selectedService)
    }
    handleMenuClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      'Plumbing': '🔧',
      'Electrical': '⚡',
      'Cleaning': '🧹',
      'Security': '🔒',
      'Home Repair': '🔨',
      'Gardening': '🌱',
      'HVAC': '❄️',
      'Painting': '🎨',
      'Carpentry': '🪚',
      'Roofing': '🏠'
    }
    return iconMap[category] || '🛠️'
  }

  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {services.map((service) => (
          <Paper key={service.id} sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                <Avatar
                  sx={{ 
                    width: 48, 
                    height: 48,
                    bgcolor: service.category.color || theme.palette.primary.main,
                    fontSize: '1.5rem'
                  }}
                >
                  {getCategoryIcon(service.category.name)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {service.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {service.category.name}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => handleMenuOpen(e, service)}
              >
                <MoreVertIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Chip
                label={service.isActive ? 'Active' : 'Inactive'}
                color={service.isActive ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
              {service.isFeatured && (
                <Chip
                  label="Featured"
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {formatCurrency(service.price)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Duration
                </Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {service.duration}h
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Rating value={service.rating} size="small" readOnly precision={0.1} />
                <Typography variant="body2" color="text.secondary">
                  ({service.reviewCount})
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {service.bookingsCount} bookings
              </Typography>
            </Box>

            {service.provider && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Avatar
                  src={service.provider.avatar}
                  alt={service.provider.name}
                  sx={{ width: 24, height: 24 }}
                />
                <Typography variant="caption" color="text.secondary">
                  by {service.provider.name}
                </Typography>
              </Box>
            )}
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
              <TableCell sx={{ fontWeight: 600 }}>Service Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Bookings</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'center' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: service.category.color || theme.palette.primary.main,
                        fontSize: '1.25rem'
                      }}
                    >
                      {getCategoryIcon(service.category.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {service.name}
                      </Typography>
                      {service.provider && (
                        <Typography variant="caption" color="text.secondary">
                          by {service.provider.name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip
                    label={service.category.name}
                    size="small"
                    sx={{
                      bgcolor: service.category.color ? `${service.category.color}20` : undefined,
                      color: service.category.color || 'inherit',
                      fontWeight: 500
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600} color="primary.main">
                    {formatCurrency(service.price)}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {service.duration} hours
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Rating value={service.rating} size="small" readOnly precision={0.1} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {service.rating} ({service.reviewCount} reviews)
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {service.bookingsCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    total bookings
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Chip
                      label={service.isActive ? 'Active' : 'Inactive'}
                      color={service.isActive ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                    {service.isFeatured && (
                      <Chip
                        label="Featured"
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>

                <TableCell sx={{ textAlign: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, service)}
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
        <MenuItem onClick={() => handleAction(onViewService)}>
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem onClick={() => handleAction(onEditService)}>
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Service
        </MenuItem>
        <MenuItem onClick={() => handleAction(onToggleActive)}>
          {selectedService?.isActive ? (
            <ToggleOffIcon sx={{ mr: 1 }} fontSize="small" />
          ) : (
            <ToggleOnIcon sx={{ mr: 1 }} fontSize="small" />
          )}
          {selectedService?.isActive ? 'Deactivate' : 'Activate'}
        </MenuItem>
        <MenuItem onClick={() => handleAction(onDuplicateService)}>
          <CopyIcon sx={{ mr: 1 }} fontSize="small" />
          Duplicate Service
        </MenuItem>
        <MenuItem onClick={() => handleAction(onDeleteService)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Service
        </MenuItem>
      </Menu>
    </>
  )
}
