import React from 'react'
import { ImageIcon, X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

type AltDialogProps = {
  open: boolean
  pendingImageUrl: string | null
  altDraft: string
  onAltChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function CmsQuillAltTextDialog({
  open,
  pendingImageUrl,
  altDraft,
  onAltChange,
  onConfirm,
  onCancel,
}: AltDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-xl">
        <h3 className="text-base font-semibold">Image alt text (required)</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe what the image shows — used for accessibility and Google Image search.
        </p>
        {pendingImageUrl ? (
          <div className="mt-3 overflow-hidden rounded-md border border-border/60 bg-muted/30">
            <img src={pendingImageUrl} alt="" className="max-h-40 w-full object-contain" />
          </div>
        ) : null}
        <Input
          className="mt-3"
          value={altDraft}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="e.g. Technician checking AC gas pressure gauge"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            Insert image
          </Button>
        </div>
      </div>
    </div>
  )
}

type CloudinaryDialogProps = {
  open: boolean
  folder: string
  loading: boolean
  error: string | null
  images: Array<{ url: string; publicId: string }>
  onClose: () => void
  onPick: (url: string) => void
}

export function CmsQuillCloudinaryDialog({
  open,
  folder,
  loading,
  error,
  images,
  onClose,
  onPick,
}: CloudinaryDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h3 className="text-sm font-semibold">Insert from Cloudinary</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto p-4">
          {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading library…</p> : null}
          {error ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}
          {!loading && !error && images.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No images in `{folder}` yet — upload via the image button.
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {images.map((img) => (
              <button
                key={img.publicId}
                type="button"
                className="overflow-hidden rounded-md border border-border/60 transition hover:border-primary/50 hover:ring-2 hover:ring-primary/20"
                onClick={() => onPick(img.url)}
              >
                <img src={img.url} alt="" className="aspect-video w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
