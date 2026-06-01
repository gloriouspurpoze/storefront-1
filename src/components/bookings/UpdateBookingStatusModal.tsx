/**
 * Update Booking Status Modal
 * Modal component for admin to update booking status with notifications
 */

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
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
import { useEngagementStatus } from '../../hooks/useEngagementStatus'
import { toApiBookingStatus } from '../../lib/engagementStatusAliases'

interface UpdateBookingStatusModalProps {
  open: boolean
  onClose: () => void
  bookingId: string
  currentStatus: string
  onUpdate: (
    status: string,
    options: {
      notes?: string
      notifyCustomer: boolean
      notifyProvider: boolean
    },
  ) => Promise<void>
}

export function UpdateBookingStatusModal({
  open,
  onClose,
  bookingId: _bookingId,
  currentStatus,
  onUpdate,
}: UpdateBookingStatusModalProps) {
  void _bookingId
  const { verticalKey, entityLabel, selectableStatuses, uiFor } = useEngagementStatus()

  const availableStatuses = React.useMemo(
    () => selectableStatuses(currentStatus),
    [currentStatus, selectableStatuses],
  )

  const [selectedStatus, setSelectedStatus] = useState<string>(
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

  const currentUi = uiFor(currentStatus)
  const selectedUi = selectedStatus ? uiFor(selectedStatus) : null

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setError('Please select a different status')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await onUpdate(toApiBookingStatus(verticalKey, selectedStatus), {
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
          <DialogTitle>Update {entityLabel} status</DialogTitle>
          <p className="text-sm text-muted-foreground">Change the status of this {entityLabel.toLowerCase()}</p>
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
            <p className="mb-1.5 text-sm text-muted-foreground">Current status</p>
            <Badge variant="outline" className="gap-1">
              {React.createElement(currentUi.Icon, { className: 'h-3.5 w-3.5' })}
              {currentUi.label}
            </Badge>
          </div>

          <div className="space-y-2">
            <Label>New status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => {
                  const s = uiFor(status)
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

          {selectedUi && (
            <div
              className={cn(
                'rounded-md border p-3 text-sm text-muted-foreground',
                selectedUi.boxClass,
              )}
            >
              {selectedUi.description}
            </div>
          )}

          <div>
            <Label htmlFor="status-notes">Notes (optional)</Label>
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
            <p className="mb-2 text-sm font-medium">Notification options</p>
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
            {loading ? 'Updating...' : 'Update status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
