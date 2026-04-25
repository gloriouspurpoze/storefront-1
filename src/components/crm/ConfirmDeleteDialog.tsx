import React from 'react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  loading?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) return
        if (!loading) onClose()
      }}
    >
      <DialogContent
        className="max-w-xs"
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
        aria-describedby="confirm-delete-description"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="confirm-delete-description">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => {
              void onConfirm()
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
