import React, { useState } from 'react'
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
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

      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to delete provider')
    } finally {
      setLoading(false)
    }
  }

  if (!provider) return null

  const p = provider as ServiceProvider & {
    business_name?: string
    businessName?: string
    services_offered?: unknown[]
    servicesOffered?: unknown[]
  }
  const businessName = p.business_name || p.businessName || 'Unnamed Business'
  const nServices = (p.services_offered?.length || p.servicesOffered?.length) ?? 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !loading) onClose()
      }}
    >
      <DialogContent className="max-w-md gap-0 p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="flex items-center gap-2 text-left text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Provider
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6 pt-4">
          <div
            className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
            role="alert"
          >
            <p className="font-semibold text-destructive">Warning: This action cannot be undone!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Deleting this provider will permanently remove all their data, including profile
              information, service listings, and history.
            </p>
          </div>

          {error && (
            <div
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Provider to delete</p>
            <p className="text-lg font-semibold">{businessName}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <Badge
                variant={
                  provider.verification_status === 'verified'
                    ? 'default'
                    : provider.verification_status === 'pending'
                      ? 'secondary'
                      : 'destructive'
                }
                className="capitalize"
              >
                {provider.verification_status}
              </Badge>
              {nServices > 0 && (
                <Badge variant="outline">
                  {nServices} services
                </Badge>
              )}
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium">This will delete:</p>
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
              <li>Provider profile and business information</li>
              <li>All service offerings and areas</li>
              <li>Verification status and documents</li>
              <li>Historical data and statistics</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
            <Input
              id="delete-confirm"
              className="mt-1.5"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value)
                setError(null)
              }}
              disabled={loading}
              aria-invalid={!!error && confirmText !== 'DELETE'}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/30 p-4 sm:justify-end sm:space-x-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={loading || confirmText !== 'DELETE'}
          >
            {loading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-4 w-4" />
            )}
            {loading ? 'Deleting...' : 'Delete Provider'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
