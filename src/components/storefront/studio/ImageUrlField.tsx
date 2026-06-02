import React, { useRef, useState } from 'react'
import { Button, Input, Label } from '../../ui'
import { ImagePlus, Loader2, X } from 'lucide-react'
import UploadService from '../../../services/api/upload.service'
import { appToast } from '../../../lib/appToast'

const toastError = (msg: string) => appToast(msg, 'error')
const toastSuccess = (msg: string) => appToast(msg, 'success')

/**
 * Composite field: text input for a URL with an inline upload button.
 * On upload, posts to the Cloudinary-backed `/upload/image` endpoint and
 * writes the returned URL into the field.
 */
export function ImageUrlField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  folder = 'storefront',
}: {
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  hint?: string
  folder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toastError('Please pick an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toastError('Image too large (max 5MB)')
      return
    }
    setUploading(true)
    try {
      const res = await UploadService.uploadImage(file, folder)
      if (res.url) {
        onChange(res.url)
        toastSuccess('Image uploaded')
      }
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <Label className="mb-1 block text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? 'https://…'}
          className="flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} title="Clear">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {value && (
        <div className="mt-2">
          <img
            src={value}
            alt={label}
            className="h-16 w-auto rounded border border-border object-contain bg-muted/30"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
