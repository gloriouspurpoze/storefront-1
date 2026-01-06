import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  IconButton,
  Stack,
  Card,
  CardContent,
  Rating,
} from '@mui/material'
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Work as WorkIcon,
  VerifiedUser as VerifiedIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material'
import { formatDate } from '../../lib/utils'

interface ServiceProvider {
  id: string
  userId: string
  businessName: string
  businessLicense?: string
  servicesOffered: string[]
  serviceAreas: string[]
  verificationStatus: 'pending' | 'verified' | 'rejected'
  rating: number
  totalReviews: number
  yearsExperience: number
  bio?: string
  user?: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  createdAt: string
  updatedAt?: string
}

interface ServiceDetailsDialogProps {
  open: boolean
  onClose: () => void
  service: ServiceProvider | null
  onEdit?: () => void
}

export const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({
  open,
  onClose,
  service,
  onEdit,
}) => {
  if (!service) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success'
      case 'pending':
        return 'warning'
      case 'rejected':
        return 'error'
      default:
        return 'default'
    }
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Service Provider Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Business Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {service.businessName}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip
              icon={<VerifiedIcon />}
              label={service.verificationStatus}
              color={getStatusColor(service.verificationStatus) as any}
              sx={{ textTransform: 'capitalize' }}
            />
            {service.businessLicense && (
              <Chip
                label={`License: ${service.businessLicense}`}
                variant="outlined"
              />
            )}
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Rating value={service.rating} readOnly precision={0.1} />
            <Typography variant="body2" color="text.secondary">
              {service.rating.toFixed(1)} ({service.totalReviews} reviews)
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Services Offered */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WorkIcon color="primary" />
            Services Offered
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {service.servicesOffered.map((serv) => (
              <Chip
                key={serv}
                label={serv}
                color="primary"
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Service Areas */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" />
            Service Areas
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {service.serviceAreas.map((area) => (
              <Chip
                key={area}
                label={area}
                color="secondary"
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Business Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Business Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WorkIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Years of Experience
                      </Typography>
                      <Typography variant="h6">
                        {service.yearsExperience} years
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <StarIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Total Reviews
                      </Typography>
                      <Typography variant="h6">
                        {service.totalReviews}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Bio/Description */}
        {service.bio && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                About
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {service.bio}
              </Typography>
            </Box>
          </>
        )}

        {/* Provider Information */}
        {service.user && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Provider Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <PersonIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Provider Name
                          </Typography>
                          <Typography variant="body1">
                            {service.user.firstName} {service.user.lastName}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <EmailIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {service.user.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PhoneIcon color="primary" />
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            {service.user.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Timestamps */}
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body2">
                {formatDate(service.createdAt)}
              </Typography>
            </Grid>
            {service.updatedAt && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {formatDate(service.updatedAt)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {onEdit && (
          <Button onClick={onEdit} variant="contained">
            Edit Service
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

