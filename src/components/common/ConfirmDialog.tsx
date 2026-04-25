import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  severity?: 'error' | 'warning' | 'info'
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
  loading = false,
  severity = 'info',
}: ConfirmDialogProps) {
  const getConfirmVariant = () => {
    if (confirmColor === 'error' || severity === 'error') return 'destructive' as const
    if (confirmColor === 'secondary') return 'secondary' as const
    return 'default' as const
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen && !loading) onCancel()
      }}
    >
      <DialogContent className="max-w-sm sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={getConfirmVariant()}
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
