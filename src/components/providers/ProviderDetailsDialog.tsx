import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Avatar,
  Rating,
  Divider,
  Paper,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Star as StarIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material'
import type { ServiceProvider } from '../../types'

interface ProviderDetailsDialogProps {
  open: boolean
  onClose: () => void
  provider: ServiceProvider | null
}

export function ProviderDetailsDialog({ open, onClose, provider }: ProviderDetailsDialogProps) {
  if (!provider) return null

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <VerifiedIcon />
      case 'pending':
        return <PendingIcon />
      case 'rejected':
        return <RejectedIcon />
      default:
        return null
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
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1,
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="600">
              {provider.business_name || 'Unnamed Business'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {provider.user?.firstName} {provider.user?.lastName}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Status and Rating */}
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                icon={getStatusIcon(provider.verification_status)}
                label={provider.verification_status?.charAt(0).toUpperCase() + provider.verification_status?.slice(1) || 'Unknown'}
                color={getStatusColor(provider.verification_status) as any}
                sx={{ fontWeight: 500 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={provider.rating || 0} readOnly precision={0.1} />
                <Typography variant="body2" color="text.secondary">
                  ({provider.total_reviews || 0} reviews)
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Contact Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon color="action" />
                <Typography variant="body2" fontWeight="500">
                  Email
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {provider.user?.email || 'N/A'}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PhoneIcon color="action" />
                <Typography variant="body2" fontWeight="500">
                  Phone
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {provider.user?.phone || 'N/A'}
              </Typography>
            </Paper>
          </Grid>

          {/* Business Information */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Business Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WorkIcon color="action" />
                <Typography variant="body2" fontWeight="500">
                  Business License
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {(provider as any).business_license || (provider as any).businessLicense || 'Not provided'}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon color="action" />
                <Typography variant="body2" fontWeight="500">
                  Experience
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {(provider as any).years_experience || (provider as any).yearsExperience || 0} years
              </Typography>
            </Paper>
          </Grid>

          {/* Services Offered */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Services Offered
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(provider as any).services_offered?.map((service: any, index: number) => (
                <Chip
                  key={index}
                  label={service}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              )) || (provider as any).servicesOffered?.map?.((service: any, index: number) => (
                <Chip
                  key={index}
                  label={service}
                  color="primary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              )) || (
                <Typography variant="body2" color="text.secondary">
                  No services listed
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Service Areas */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Service Areas
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(provider as any).service_areas?.map((area: any, index: number) => (
                <Chip
                  key={index}
                  label={area}
                  color="secondary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              )) || (provider as any).serviceAreas?.map?.((area: any, index: number) => (
                <Chip
                  key={index}
                  label={area}
                  color="secondary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              )) || (
                <Typography variant="body2" color="text.secondary">
                  No service areas listed
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Bio */}
          {(provider as any).bio && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
                  About
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {(provider as any).bio}
                  </Typography>
                </Paper>
              </Grid>
            </>
          )}

          {/* Timestamps */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 2 }}>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="500" gutterBottom>
                Created
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date((provider as any).created_at || (provider as any).createdAt || Date.now()).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="500" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date((provider as any).updated_at || (provider as any).updatedAt || Date.now()).toLocaleDateString()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        bgcolor: 'grey.50',
        borderTop: 1,
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{ borderRadius: 2 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
