import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Stack,
  IconButton,
  Card,
  CardContent,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Close as CloseIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { ServiceRequest } from '../../services/api/services.service'

interface ServiceRequestDetailsDialogProps {
  open: boolean
  service: ServiceRequest | null
  onClose: () => void
  onEdit?: (service: ServiceRequest) => void
}

export function ServiceRequestDetailsDialog({
  open,
  service,
  onClose,
  onEdit,
}: ServiceRequestDetailsDialogProps) {
  if (!service) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'info'
      case 'assigned':
        return 'warning'
      case 'in_progress':
        return 'primary'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return 'success'
      case 'medium':
        return 'warning'
      case 'high':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatCurrency = (value: string) => {
    return `$${parseFloat(value).toFixed(2)}`
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Service Request Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Header with Status and Urgency */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={service.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(service.status) as any}
              />
              <Chip
                label={`${service.urgency.toUpperCase()} URGENCY`}
                color={getUrgencyColor(service.urgency) as any}
                size="small"
              />
              <Chip
                label={service.service_type
                  .split('_')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
                variant="outlined"
                size="small"
              />
            </Stack>
          </Grid>

          {/* Title and Description */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              {service.title}
            </Typography>
            <Typography variant="body1" color="textSecondary" paragraph>
              {service.description}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Location Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocationIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Location</Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  {service.location.address}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {service.location.city}, {service.location.state} {service.location.zip_code}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Budget Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Budget Range</Typography>
                </Box>
                <Typography variant="h5" color="primary">
                  {formatCurrency(service.budget_min)} - {formatCurrency(service.budget_max)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Preferred Date */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Preferred Date</Typography>
                </Box>
                <Typography variant="body1">
                  {service.preferred_date
                    ? new Date(service.preferred_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Customer Information (if available) */}
          {service.customer && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <PersonIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">Customer Information</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          Name
                        </Typography>
                        <Typography variant="body1">
                          {service.customer.firstName} {service.customer.lastName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center">
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{service.customer.email}</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center">
                          <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{service.customer.phone}</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Images */}
          {service.images && service.images.length > 0 && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <ImageIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Images</Typography>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {service.images.map((image, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={image}
                      alt={`Service ${index + 1}`}
                      sx={{
                        width: 150,
                        height: 150,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </>
          )}

          {/* Timestamps */}
          <Grid item xs={12}>
            <Divider />
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" color="textSecondary">
                  Created At
                </Typography>
                <Typography variant="body2">{formatDate(service.created_at)}</Typography>
              </Grid>
              {service.updated_at && service.updated_at !== service.created_at && (
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">{formatDate(service.updated_at)}</Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(service)
              onClose()
            }}
            variant="contained"
          >
            Edit Request
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

