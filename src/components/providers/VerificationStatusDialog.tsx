import React, { useState } from 'react'
import { CheckCircle, Clock, Ban, ShieldCheck, Loader2 } from 'lucide-react'
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
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { ProvidersService, UpdateVerificationStatusData } from '../../services/api/providers.service'
import type { ServiceProvider } from '../../types'
import { cn } from '../../lib/utils'

interface VerificationStatusDialogProps {
  open: boolean
  onClose: () => void
  provider: ServiceProvider | null
  onSuccess?: () => void
}

const VERIFICATION_STATUSES: {
  value: 'pending' | 'verified' | 'rejected'
  label: string
  tone: 'warning' | 'success' | 'destructive'
  Icon: typeof Clock
  description: string
}[] = [
  {
    value: 'pending',
    label: 'Pending Verification',
    tone: 'warning',
    Icon: Clock,
    description: 'Provider is awaiting verification review',
  },
  {
    value: 'verified',
    label: 'Verified',
    tone: 'success',
    Icon: CheckCircle,
    description: 'Provider has been verified and can accept bookings',
  },
  {
    value: 'rejected',
    label: 'Rejected',
    tone: 'destructive',
    Icon: Ban,
    description: 'Provider verification has been rejected',
  },
]

export function VerificationStatusDialog({
  open,
  onClose,
  provider,
  onSuccess,
}: VerificationStatusDialogProps) {
  const [status, setStatus] = useState<'pending' | 'verified' | 'rejected'>('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    if (provider) {
      setStatus(provider.verification_status)
      setRejectionReason('')
      setError(null)
    }
  }, [provider])

  const handleSubmit = async () => {
    if (!provider) return

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

      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to update verification status')
    } finally {
      setLoading(false)
    }
  }

  const selectedStatus = VERIFICATION_STATUSES.find((s) => s.value === status)

  if (!provider) return null

  const p = provider as ServiceProvider & { business_name?: string; businessName?: string }
  const businessName = p.business_name || p.businessName || 'Unnamed Business'

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !loading) onClose()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Update Verification Status
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm text-muted-foreground">Provider</p>
            <p className="text-lg font-semibold">{businessName}</p>
            <Badge
              className={cn(
                'mt-2 capitalize',
                provider.verification_status === 'verified' && 'bg-storm-deep',
                provider.verification_status === 'pending' && 'bg-bloom-coral',
                provider.verification_status === 'rejected' && 'bg-destructive',
              )}
            >
              {provider.verification_status}
            </Badge>
          </div>

          {error && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Verification Status</Label>
            <Select value={status} onValueChange={(v) => {
              setStatus(v as 'pending' | 'verified' | 'rejected')
              setError(null)
            }} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {VERIFICATION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="flex items-center gap-2">
                      <s.Icon className="h-4 w-4 shrink-0" />
                      {s.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStatus && (
            <div
              className={cn(
                'rounded-md border p-3 text-sm',
                selectedStatus.tone === 'success' && 'border-storm-deep/40 bg-storm-deep/10',
                selectedStatus.tone === 'warning' && 'border-bloom-coral/40 bg-bloom-coral/10',
                selectedStatus.tone === 'destructive' && 'border-destructive/40 bg-destructive/10',
              )}
            >
              <p className="font-medium">{selectedStatus.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{selectedStatus.description}</p>
            </div>
          )}

          {status === 'rejected' && (
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                className="mt-1.5"
                rows={4}
                placeholder="Provide a detailed reason for rejection..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                aria-invalid={!!error && status === 'rejected' && !rejectionReason.trim()}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This reason will be communicated to the provider
              </p>
            </div>
          )}

          {status === 'verified' && (
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
              <p>Verifying this provider will allow them to:</p>
              <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                <li>Accept new service requests</li>
                <li>Receive customer bookings</li>
                <li>Appear in verified provider listings</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || (status === 'rejected' && !rejectionReason.trim())}
          >
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
