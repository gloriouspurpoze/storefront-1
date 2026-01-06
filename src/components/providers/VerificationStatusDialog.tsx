import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Cancel as RejectedIcon,
  VerifiedUser as VerifyIcon,
} from '@mui/icons-material'
import { ProvidersService, UpdateVerificationStatusData } from '../../services/api/providers.service'

interface VerificationStatusDialogProps {
  open: boolean
  onClose: () => void
  provider: {
    id: string
    business_name: string
    verification_status: 'pending' | 'verified' | 'rejected'
  } | null
  onSuccess?: () => void
}

const VERIFICATION_STATUSES = [
  {
    value: 'pending',
    label: 'Pending Verification',
    color: 'warning' as const,
    icon: <PendingIcon />,
    description: 'Provider is awaiting verification review'
  },
  {
    value: 'verified',
    label: 'Verified',
    color: 'success' as const,
    icon: <VerifiedIcon />,
    description: 'Provider has been verified and can accept bookings'
  },
  {
    value: 'rejected',
    label: 'Rejected',
    color: 'error' as const,
    icon: <RejectedIcon />,
    description: 'Provider verification has been rejected'
  },
]

export function VerificationStatusDialog({
  open,
  onClose,
  provider,
  onSuccess,
}: VerificationStatusDialogProps) {
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>(
    provider?.verification_status || 'pending'
  )
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when provider changes
  React.useEffect(() => {
    if (provider) {
      setStatus(provider.verification_status)
      setRejectionReason('')
      setError(null)
    }
  }, [provider])

  const handleSubmit = async () => {
    if (!provider) return

    // Validation
    if (status === 'rejected' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const data: UpdateVerificationStatusData = {
        verification_status: status,
        ...(status === 'rejected' && { rejection_reason: rejectionReason }),
      }

      await ProvidersService.updateVerificationStatus(provider.id, data)

      // Success
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update verification status')
    } finally {
      setLoading(false)
    }
  }

  const selectedStatus = VERIFICATION_STATUSES.find((s) => s.value === status)

  if (!provider) return null

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VerifyIcon color="primary" />
          <Typography variant="h6" fontWeight="600">
            Update Verification Status
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Provider
          </Typography>
          <Typography variant="h6" fontWeight="600">
            {provider.business_name}
          </Typography>
          <Chip
            label={provider.verification_status}
            size="small"
            color={
              VERIFICATION_STATUSES.find((s) => s.value === provider.verification_status)?.color
            }
            sx={{ mt: 1, textTransform: 'capitalize' }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Verification Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any)
                setError(null)
              }}
              label="Verification Status"
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {VERIFICATION_STATUSES.map((statusOption) => (
                <MenuItem key={statusOption.value} value={statusOption.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                    <Box sx={{ color: `${statusOption.color}.main` }}>{statusOption.icon}</Box>
                    <Box>
                      <Typography variant="body2" fontWeight="500">
                        {statusOption.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {statusOption.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedStatus && (
            <Alert
              severity={selectedStatus.color}
              icon={selectedStatus.icon}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="body2" fontWeight="500" gutterBottom>
                {selectedStatus.label}
              </Typography>
              <Typography variant="caption">{selectedStatus.description}</Typography>
            </Alert>
          )}

          {status === 'rejected' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Rejection Reason *"
              placeholder="Provide a detailed reason for rejection..."
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value)
                setError(null)
              }}
              disabled={loading}
              error={!!error && status === 'rejected' && !rejectionReason.trim()}
              helperText={
                status === 'rejected' && !rejectionReason.trim()
                  ? 'Rejection reason is required'
                  : 'This reason will be communicated to the provider'
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          )}

          {status === 'verified' && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                Verifying this provider will allow them to:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                <li>
                  <Typography variant="caption">Accept new service requests</Typography>
                </li>
                <li>
                  <Typography variant="caption">Receive customer bookings</Typography>
                </li>
                <li>
                  <Typography variant="caption">
                    Appear in verified provider listings
                  </Typography>
                </li>
              </Box>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          bgcolor: 'grey.50',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button onClick={onClose} disabled={loading} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || (status === 'rejected' && !rejectionReason.trim())}
          startIcon={
            loading ? <CircularProgress size={16} color="inherit" /> : selectedStatus?.icon
          }
          color={selectedStatus?.color}
          sx={{ borderRadius: 2, minWidth: 140 }}
        >
          {loading ? 'Updating...' : `Update Status`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

