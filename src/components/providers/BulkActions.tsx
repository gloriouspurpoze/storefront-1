import React, { useState } from 'react'
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  VerifiedUser as VerifyIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { ProvidersService } from '../../services/api/providers.service'

interface BulkActionsProps {
  selectedIds: string[]
  onSuccess?: () => void
  onClearSelection?: () => void
}

export function BulkActions({ selectedIds, onSuccess, onClearSelection }: BulkActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'verify' | 'block' | 'delete' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleAction = (type: 'verify' | 'block' | 'delete' | 'export') => {
    if (type === 'export') {
      handleExport()
    } else {
      setDialogType(type)
      setDialogOpen(true)
    }
    handleClose()
  }

  const handleConfirm = async () => {
    if (!dialogType || !confirmed) return

    try {
      setLoading(true)
      setError(null)

      switch (dialogType) {
        case 'verify':
          await ProvidersService.bulkVerifyProviders(selectedIds)
          break
        case 'block':
          await ProvidersService.bulkUpdateProviders(selectedIds, {
            is_active: false,
          })
          break
        case 'delete':
          // Note: Bulk delete might not be in the API yet
          // For now, delete one by one
          for (const id of selectedIds) {
            await ProvidersService.deleteProvider(id)
          }
          break
      }

      // Success
      if (onSuccess) onSuccess()
      if (onClearSelection) onClearSelection()
      setDialogOpen(false)
      setConfirmed(false)
    } catch (err: any) {
      setError(err.message || 'Failed to perform bulk action')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await ProvidersService.exportProviders()
      
      // If the API returns CSV data, download it
      if (response.data) {
        const blob = new Blob([response.data as any], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `providers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error('Export failed:', err)
      setError('Export functionality is not available')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseDialog = () => {
    if (!loading) {
      setDialogOpen(false)
      setConfirmed(false)
      setError(null)
    }
  }

  const getDialogConfig = () => {
    switch (dialogType) {
      case 'verify':
        return {
          title: 'Bulk Verify Providers',
          icon: <VerifyIcon color="success" />,
          message: `Are you sure you want to verify ${selectedIds.length} provider(s)?`,
          confirmText: 'Verify Providers',
          confirmColor: 'success' as const,
          description: 'Verified providers will be able to accept bookings and appear in searches.',
        }
      case 'block':
        return {
          title: 'Bulk Block Providers',
          icon: <BlockIcon color="warning" />,
          message: `Are you sure you want to block ${selectedIds.length} provider(s)?`,
          confirmText: 'Block Providers',
          confirmColor: 'warning' as const,
          description: 'Blocked providers will not be able to receive new service requests.',
        }
      case 'delete':
        return {
          title: 'Bulk Delete Providers',
          icon: <DeleteIcon color="error" />,
          message: `Are you sure you want to permanently delete ${selectedIds.length} provider(s)?`,
          confirmText: 'Delete Providers',
          confirmColor: 'error' as const,
          description: '⚠️ This action cannot be undone. All provider data will be permanently removed.',
        }
      default:
        return null
    }
  }

  const dialogConfig = getDialogConfig()

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          label={`${selectedIds.length} selected`}
          color="primary"
          onDelete={onClearSelection}
          sx={{ fontWeight: 500 }}
        />
        <Button
          variant="contained"
          endIcon={<MoreIcon />}
          onClick={handleClick}
          sx={{ borderRadius: 2 }}
        >
          Bulk Actions
        </Button>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 220 },
        }}
      >
        <MenuItem onClick={() => handleAction('verify')}>
          <VerifyIcon sx={{ mr: 1 }} fontSize="small" color="success" />
          Verify Selected
        </MenuItem>
        <MenuItem onClick={() => handleAction('block')}>
          <BlockIcon sx={{ mr: 1 }} fontSize="small" color="warning" />
          Block Selected
        </MenuItem>
        <MenuItem onClick={() => handleAction('export')}>
          <DownloadIcon sx={{ mr: 1 }} fontSize="small" color="info" />
          Export Selected
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Selected
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        {dialogConfig && (
          <>
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
                {dialogConfig.icon}
                <Typography variant="h6" fontWeight="600">
                  {dialogConfig.title}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseDialog} size="small" disabled={loading}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <Alert
                severity={dialogType === 'delete' ? 'error' : 'info'}
                sx={{ mb: 3, borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight="500" gutterBottom>
                  {dialogConfig.message}
                </Typography>
                <Typography variant="caption">{dialogConfig.description}</Typography>
              </Alert>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                    disabled={loading}
                  />
                }
                label={
                  <Typography variant="body2">
                    I understand and want to proceed with this action
                  </Typography>
                }
              />
            </DialogContent>

            <DialogActions
              sx={{
                p: 3,
                bgcolor: 'grey.50',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Button onClick={handleCloseDialog} disabled={loading} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                variant="contained"
                color={dialogConfig.confirmColor}
                disabled={loading || !confirmed}
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <CheckIcon />
                }
                sx={{ borderRadius: 2, minWidth: 160 }}
              >
                {loading ? 'Processing...' : dialogConfig.confirmText}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  )
}

