import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  TextField,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { ProvidersService } from '../../services/api/providers.service'
import type { ServiceProvider } from '../../types'

interface DeleteProviderDialogProps {
  open: boolean
  onClose: () => void
  provider: ServiceProvider | null
  onSuccess?: () => void
}

export function DeleteProviderDialog({
  open,
  onClose,
  provider,
  onSuccess,
}: DeleteProviderDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setConfirmText('')
      setError(null)
    }
  }, [open])

  const handleDelete = async () => {
    if (!provider) return

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await ProvidersService.deleteProvider(provider.id)

      // Success
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to delete provider')
    } finally {
      setLoading(false)
    }
  }

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
          <WarningIcon color="error" />
          <Typography variant="h6" fontWeight="600">
            Delete Provider
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2" fontWeight="600" gutterBottom>
            ⚠️ Warning: This action cannot be undone!
          </Typography>
          <Typography variant="caption">
            Deleting this provider will permanently remove all their data, including profile
            information, service listings, and history.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Provider to delete
          </Typography>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            {(provider as any).business_name || (provider as any).businessName || 'Unnamed Business'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={provider.verification_status}
              size="small"
              color={
                provider.verification_status === 'verified'
                  ? 'success'
                  : provider.verification_status === 'pending'
                  ? 'warning'
                  : 'error'
              }
              sx={{ textTransform: 'capitalize' }}
            />
            {((provider as any).services_offered || (provider as any).servicesOffered) &&
              ((provider as any).services_offered?.length || (provider as any).servicesOffered?.length) > 0 && (
              <Chip
                label={`${((provider as any).services_offered?.length || (provider as any).servicesOffered?.length) ?? 0} services`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" fontWeight="500" gutterBottom>
            This will delete:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
            <li>
              <Typography variant="caption" color="text.secondary">
                Provider profile and business information
              </Typography>
            </li>
            <li>
              <Typography variant="caption" color="text.secondary">
                All service offerings and areas
              </Typography>
            </li>
            <li>
              <Typography variant="caption" color="text.secondary">
                Verification status and documents
              </Typography>
            </li>
            <li>
              <Typography variant="caption" color="text.secondary">
                Historical data and statistics
              </Typography>
            </li>
          </Box>
        </Box>

        <Box>
          <Typography variant="body2" fontWeight="500" gutterBottom>
            Type <strong>DELETE</strong> to confirm
          </Typography>
          <TextField
            fullWidth
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => {
              setConfirmText(e.target.value)
              setError(null)
            }}
            disabled={loading}
            error={!!error && confirmText !== 'DELETE'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
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
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading || confirmText !== 'DELETE'}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          sx={{ borderRadius: 2, minWidth: 140 }}
        >
          {loading ? 'Deleting...' : 'Delete Provider'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

