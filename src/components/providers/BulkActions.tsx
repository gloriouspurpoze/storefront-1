import React, { useState } from 'react'
import { X, UserCheck, Ban, Download, Trash2, Loader2, CheckCircle, MoreVertical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { ProvidersService } from '../../services/api/providers.service'

interface BulkActionsProps {
  selectedIds: string[]
  onSuccess?: () => void
  onClearSelection?: () => void
}

export function BulkActions({ selectedIds, onSuccess, onClearSelection }: BulkActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'verify' | 'block' | 'delete' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleAction = (type: 'verify' | 'block' | 'delete' | 'export') => {
    if (type === 'export') {
      void handleExport()
    } else {
      setDialogType(type)
      setDialogOpen(true)
    }
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
          for (const id of selectedIds) {
            await ProvidersService.deleteProvider(id)
          }
          break
      }

      onSuccess?.()
      onClearSelection?.()
      setDialogOpen(false)
      setConfirmed(false)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to perform bulk action')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setLoading(true)
      const response = await ProvidersService.exportProviders()

      if (response.data) {
        const blob = new Blob([response.data as BlobPart], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `providers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }
    } catch (err: unknown) {
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
          icon: <UserCheck className="h-6 w-6 text-emerald-600" />,
          message: `Are you sure you want to verify ${selectedIds.length} provider(s)?`,
          confirmText: 'Verify Providers',
          confirmClass: 'bg-emerald-600 hover:bg-emerald-600/90' as const,
          description: 'Verified providers will be able to accept bookings and appear in searches.',
        }
      case 'block':
        return {
          title: 'Bulk Block Providers',
          icon: <Ban className="h-6 w-6 text-amber-600" />,
          message: `Are you sure you want to block ${selectedIds.length} provider(s)?`,
          confirmText: 'Block Providers',
          confirmClass: 'bg-amber-600 hover:bg-amber-600/90' as const,
          description: 'Blocked providers will not be able to receive new service requests.',
        }
      case 'delete':
        return {
          title: 'Bulk Delete Providers',
          icon: <Trash2 className="h-6 w-6 text-destructive" />,
          message: `Are you sure you want to permanently delete ${selectedIds.length} provider(s)?`,
          confirmText: 'Delete Providers',
          confirmClass: '' as const,
          description: 'This action cannot be undone. All provider data will be permanently removed.',
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
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default" className="gap-1 font-medium pl-2 pr-1">
          {selectedIds.length} selected
          <button
            type="button"
            className="ml-1 rounded p-0.5 hover:bg-primary-foreground/20"
            onClick={onClearSelection}
            aria-label="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" className="gap-1">
              Bulk Actions
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[220px]">
            <DropdownMenuItem onClick={() => handleAction('verify')}>
              <UserCheck className="mr-2 h-4 w-4 text-emerald-600" />
              Verify Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('block')}>
              <Ban className="mr-2 h-4 w-4 text-amber-600" />
              Block Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('export')}>
              <Download className="mr-2 h-4 w-4 text-sky-600" />
              Export Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAction('delete')}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) handleCloseDialog()
        }}
      >
        {dialogConfig && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialogConfig.icon}
                {dialogConfig.title}
              </DialogTitle>
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

              <div
                className={
                  dialogType === 'delete'
                    ? 'rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm'
                    : 'rounded-md border border-border bg-muted/50 p-3 text-sm'
                }
              >
                <p className="font-medium">{dialogConfig.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{dialogConfig.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="bulk-confirm"
                  checked={confirmed}
                  onCheckedChange={(c) => setConfirmed(c === true)}
                  disabled={loading}
                />
                <Label htmlFor="bulk-confirm" className="text-sm font-normal leading-snug">
                  I understand and want to proceed with this action
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={dialogType === 'delete' ? 'destructive' : 'default'}
                className={dialogType && dialogType !== 'delete' ? dialogConfig.confirmClass : undefined}
                onClick={() => void handleConfirm()}
                disabled={loading || !confirmed}
              >
                {loading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-1 h-4 w-4" />
                )}
                {loading ? 'Processing...' : dialogConfig.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
