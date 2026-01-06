/**
 * Update Booking Status Modal
 * Modal component for admin to update booking status with notifications
 * 
 * Features:
 * - Update booking status with status-specific options
 * - Add notes for the status change
 * - Option to notify customer and provider
 * - Beautiful UX with status colors and icons
 */

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
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'

type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface UpdateBookingStatusModalProps {
  open: boolean
  onClose: () => void
  bookingId: string
  currentStatus: BookingStatus
  onUpdate: (
    status: BookingStatus,
    options: {
      notes?: string
      notifyCustomer: boolean
      notifyProvider: boolean
    }
  ) => Promise<void>
}

const statusConfig: Record<
  BookingStatus,
  {
    label: string
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
    icon: React.ReactNode
    description: string
  }
> = {
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: <ScheduleIcon />,
    description: 'Booking is waiting for provider assignment',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'primary',
    icon: <CheckCircleIcon />,
    description: 'Booking is confirmed and scheduled',
  },
  in_progress: {
    label: 'In Progress',
    color: 'secondary',
    icon: <PlayArrowIcon />,
    description: 'Service is currently being performed',
  },
  completed: {
    label: 'Completed',
    color: 'success',
    icon: <CheckCircleIcon />,
    description: 'Service has been completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'error',
    icon: <CancelIcon />,
    description: 'Booking has been cancelled',
  },
}

export function UpdateBookingStatusModal({
  open,
  onClose,
  bookingId,
  currentStatus,
  onUpdate,
}: UpdateBookingStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(currentStatus)
  const [notes, setNotes] = useState('')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [notifyProvider, setNotifyProvider] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setError('Please select a different status')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onUpdate(selectedStatus, {
        notes: notes || undefined,
        notifyCustomer,
        notifyProvider,
      })

      // Reset and close
      setNotes('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to update booking status')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setNotes('')
      setError(null)
      onClose()
    }
  }

  // Get available status transitions
  const getAvailableStatuses = (): BookingStatus[] => {
    const statuses: BookingStatus[] = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
    
    // Remove current status from options
    return statuses.filter(status => status !== currentStatus)
  }

  const availableStatuses = getAvailableStatuses()

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight={600}>
          Update Booking Status
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Change the status of this booking
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Current Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Current Status
          </Typography>
          <Chip
            icon={statusConfig[currentStatus].icon as React.ReactElement}
            label={statusConfig[currentStatus].label}
            color={statusConfig[currentStatus].color}
            size="medium"
          />
        </Box>

        {/* New Status Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>New Status</InputLabel>
          <Select
            value={selectedStatus}
            label="New Status"
            onChange={(e) => setSelectedStatus(e.target.value as BookingStatus)}
          >
            {availableStatuses.map((status) => (
              <MenuItem key={status} value={status}>
                <Box display="flex" alignItems="center" gap={1}>
                  {statusConfig[status].icon}
                  <Typography>{statusConfig[status].label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Description */}
        {selectedStatus && (
          <Box
            sx={{
              p: 2,
              mb: 3,
              bgcolor: `${statusConfig[selectedStatus].color}.50`,
              borderRadius: 1,
              border: '1px solid',
              borderColor: `${statusConfig[selectedStatus].color}.200`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {statusConfig[selectedStatus].description}
            </Typography>
          </Box>
        )}

        {/* Notes */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes (Optional)"
          placeholder="Add any notes about this status change..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Notification Options */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Notification Options
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                color="primary"
              />
            }
            label="Notify customer about status change"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={notifyProvider}
                onChange={(e) => setNotifyProvider(e.target.checked)}
                color="primary"
              />
            }
            label="Notify provider about status change"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleUpdate}
          disabled={selectedStatus === currentStatus || loading}
          variant="contained"
          color={statusConfig[selectedStatus]?.color || 'primary'}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

