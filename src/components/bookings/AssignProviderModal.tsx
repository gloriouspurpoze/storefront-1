/**
 * Assign Provider Modal
 * Modal component for admin to assign a provider to a booking
 * 
 * Features:
 * - Search and select provider
 * - View provider details
 * - Option to notify provider and customer
 * - Beautiful UX with loading states
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
} from '@mui/material'
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { ProvidersService } from '../../services/api/providers.service'

interface Provider {
  id: string
  businessName: string
  email: string
  phone: string
  rating?: number
  totalJobs?: number
  verificationStatus?: string
  avatar?: string
}

interface AssignProviderModalProps {
  open: boolean
  onClose: () => void
  bookingId: string
  onAssign: (providerId: string, options: { notifyProvider: boolean; notifyCustomer: boolean }) => Promise<void>
  availableProviders?: Provider[]
}

export function AssignProviderModal({
  open,
  onClose,
  bookingId,
  onAssign,
  availableProviders: propProviders,
}: AssignProviderModalProps) {
  const [providers, setProviders] = useState<Provider[]>(propProviders || [])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [notifyProvider, setNotifyProvider] = useState(true)
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetchingProviders, setFetchingProviders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch providers if not provided via props
  useEffect(() => {
    if (open && (!propProviders || propProviders.length === 0)) {
      fetchProviders()
    } else if (propProviders) {
      setProviders(propProviders)
    }
  }, [open, propProviders])

  const fetchProviders = async () => {
    try {
      setFetchingProviders(true)
      const response = await ProvidersService.getAvailableProviders({
        page: 1,
        limit: 100,
      })
      
      if (response.data?.serviceProviders || response.data?.providers) {
        const providersList = response.data?.serviceProviders || response.data?.providers || []
        
        // Transform to expected format
        const transformedProviders: Provider[] = providersList.map((p: any) => ({
          id: p.id,
          businessName: p.business_name || p.businessName || 'Unknown Business',
          email: p.user?.email || 'N/A',
          phone: p.user?.phone || 'N/A',
          rating: p.rating || 0,
          totalJobs: p.totalBookings || p.completed_bookings || 0,
          verificationStatus: p.verification_status || p.verificationStatus || 'pending',
          avatar: p.user?.avatar || p.avatar,
        }))
        
        setProviders(transformedProviders)
      }
    } catch (err: any) {
      console.error('Error fetching providers:', err)
      setError('Failed to load providers. Please try again.')
    } finally {
      setFetchingProviders(false)
    }
  }

  // Filter providers based on search
  const filteredProviders = providers.filter((provider) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      provider.businessName.toLowerCase().includes(searchLower) ||
      provider.email.toLowerCase().includes(searchLower) ||
      provider.phone.includes(searchTerm)
    )
  })

  const selectedProviderData = providers.find(
    (p) => p.id === selectedProvider
  )

  const handleAssign = async () => {
    if (!selectedProvider) {
      setError('Please select a provider')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await onAssign(selectedProvider, {
        notifyProvider,
        notifyCustomer,
      })

      // Reset and close
      setSelectedProvider('')
      setSearchTerm('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to assign provider')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedProvider('')
      setSearchTerm('')
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight={600}>
          Assign Provider to Booking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Select a provider to handle this booking
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search providers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Provider List */}
        {fetchingProviders ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography sx={{ mt: 2 }}>Loading providers...</Typography>
          </Box>
        ) : filteredProviders.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <Typography>
              {searchTerm ? 'No providers found matching your search' : 'No providers available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredProviders.map((provider) => (
              <ListItem
                key={provider.id}
                component="button"
                onClick={() => setSelectedProvider(provider.id)}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  border: '1px solid',
                  borderColor:
                    selectedProvider === provider.id
                      ? 'primary.main'
                      : 'divider',
                  bgcolor:
                    selectedProvider === provider.id
                      ? 'primary.50'
                      : 'transparent',
                  '&:hover': {
                    bgcolor:
                      selectedProvider === provider.id
                        ? 'primary.100'
                        : 'action.hover',
                  },
                  '&:focus': {
                    outline: 'none',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={provider.avatar} sx={{ bgcolor: 'primary.main' }}>
                    {provider.businessName.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle1" fontWeight={500}>
                        {provider.businessName}
                      </Typography>
                      {provider.verificationStatus === 'verified' && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Verified"
                          size="small"
                          color="success"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <EmailIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">{provider.email}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                        <PhoneIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption">{provider.phone}</Typography>
                      </Box>
                      {provider.rating && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.25}>
                          <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Typography variant="caption">
                            {provider.rating} ({provider.totalJobs || 0} jobs)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Selected Provider Info */}
        {selectedProviderData && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'primary.50',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200',
            }}
          >
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Selected Provider
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {selectedProviderData.businessName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedProviderData.email}
            </Typography>
          </Box>
        )}

        {/* Notification Options */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Notification Options
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyProvider}
                onChange={(e) => setNotifyProvider(e.target.checked)}
                color="primary"
              />
            }
            label="Notify provider about this assignment"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                color="primary"
              />
            }
            label="Notify customer about provider assignment"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          disabled={!selectedProvider || loading}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Assigning...' : 'Assign Provider'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

