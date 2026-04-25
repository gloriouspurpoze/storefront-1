/**
 * Update Booking Status Modal
 * Modal component for admin to update booking status with notifications
 */

import React, { useState } from 'react'
import { Calendar, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

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
    },
  ) => Promise<void>
}

const statusConfig: Record<
  BookingStatus,
  {
    label: string
    Icon: typeof Calendar
    description: string
    boxClass: string
  }
> = {
  pending: {
    label: 'Pending',
    Icon: Calendar,
    description: 'Booking is waiting for provider assignment',
    boxClass: 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30',
  },
  confirmed: {
    label: 'Confirmed',
    Icon: CheckCircle,
    description: 'Booking is confirmed and scheduled',
    boxClass: 'border-primary/30 bg-primary/5',
  },
  in_progress: {
    label: 'In Progress',
    Icon: Play,
    description: 'Service is currently being performed',
    boxClass: 'border-violet-200 bg-violet-50 dark:border-violet-900/40 dark:bg-violet-950/30',
  },
  completed: {
    label: 'Completed',
    Icon: CheckCircle,
    description: 'Service has been completed',
    boxClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/30',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: XCircle,
    description: 'Booking has been cancelled',
    boxClass: 'border-destructive/30 bg-destructive/5',
  },
}

export function UpdateBookingStatusModal({
  open,
  onClose,
  bookingId: _bookingId,
  currentStatus,
  onUpdate,
}: UpdateBookingStatusModalProps) {
  void _bookingId
  const availableStatuses = React.useMemo(
    () =>
      (['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as BookingStatus[]).filter(
        (s) => s !== currentStatus,
      ),
    [currentStatus],
  )
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(
    () => availableStatuses[0] ?? currentStatus,
  )

  React.useEffect(() => {
    if (open && availableStatuses.length) {
      setSelectedStatus(availableStatuses[0])
    }
  }, [open, currentStatus, availableStatuses])
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

      setNotes('')
      onClose()
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to update booking status')
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

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Booking Status</DialogTitle>
          <p className="text-sm text-muted-foreground">Change the status of this booking</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <p className="mb-1.5 text-sm text-muted-foreground">Current Status</p>
            <Badge variant="outline" className="gap-1">
              {React.createElement(statusConfig[currentStatus].Icon, { className: 'h-3.5 w-3.5' })}
              {statusConfig[currentStatus].label}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>New Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => setSelectedStatus(v as BookingStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => {
                  const s = statusConfig[status]
                  return (
                    <SelectItem key={status} value={status}>
                      <span className="flex items-center gap-2">
                        <s.Icon className="h-4 w-4" />
                        {s.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus && (
            <div
              className={cn('rounded-md border p-3 text-sm text-muted-foreground', statusConfig[selectedStatus].boxClass)}
            >
              {statusConfig[selectedStatus].description}
            </div>
          )}

          <div>
            <Label htmlFor="status-notes">Notes (Optional)</Label>
            <Textarea
              id="status-notes"
              className="mt-1.5"
              rows={3}
              placeholder="Add any notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Notification Options</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notify-cust"
                  checked={notifyCustomer}
                  onCheckedChange={(c) => setNotifyCustomer(c === true)}
                />
                <Label htmlFor="notify-cust" className="font-normal">
                  Notify customer about status change
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notify-prov"
                  checked={notifyProvider}
                  onCheckedChange={(c) => setNotifyProvider(c === true)}
                />
                <Label htmlFor="notify-prov" className="font-normal">
                  Notify provider about status change
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleUpdate()}
            disabled={selectedStatus === currentStatus || loading}
          >
            {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
