import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  CloudUpload,
  ImageIcon,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  ZoomIn,
} from 'lucide-react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { cn } from '../../lib/utils'
import UploadService from '../../services/api/upload.service'

export interface ImageFile {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
  file?: File
  publicId?: string
  fromLibrary?: boolean
}

export interface ImageUploadFieldProps {
  label: string
  value: ImageFile[]
  onChange: (images: ImageFile[]) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  maxFiles?: number
  maxSize?: number
  acceptedTypes?: string[]
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  showPreview?: boolean
  allowReorder?: boolean
  allowPrimary?: boolean
  folder?: string
  allowFromCloudinary?: boolean
}

const StatusIcon = ({ status }: { status?: ImageUploadFieldProps['status'] }) => {
  if (!status) return null
  const cls = 'h-4 w-4 shrink-0'
  switch (status) {
    case 'success':
      return <CheckCircle2 className={cn(cls, 'text-green-600')} aria-hidden />
    case 'error':
      return <AlertCircle className={cn(cls, 'text-destructive')} aria-hidden />
    case 'warning':
      return <AlertTriangle className={cn(cls, 'text-amber-600')} aria-hidden />
    case 'info':
      return <Info className={cn(cls, 'text-muted-foreground')} aria-hidden />
    default:
      return null
  }
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value = [],
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  maxFiles = 10,
  maxSize = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  tooltip,
  status,
  showPreview = true,
  allowPrimary: _allowPrimary = true,
  folder = 'homeservice',
  allowFromCloudinary = true,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [cloudinaryOpen, setCloudinaryOpen] = useState(false)
  const [cloudinaryImages, setCloudinaryImages] = useState<Array<{ url: string; publicId: string }>>([])
  const [cloudinaryLoading, setCloudinaryLoading] = useState(false)
  const [cloudinaryError, setCloudinaryError] = useState<string | null>(null)
  const [deletingPublicId, setDeletingPublicId] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return
      setIsUploading(true)
      setUploadError(null)
      setUploadProgress(0)
      try {
        const uploaded: ImageFile[] = []
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i]
          setUploadProgress(Math.round(((i + 0.5) / acceptedFiles.length) * 100))
          const uploadResult = await UploadService.uploadImage(file, folder)
          uploaded.push({
            id: Math.random().toString(36).slice(2, 11),
            url: uploadResult.url,
            alt: file.name,
            isPrimary: value.length === 0 && i === 0,
            order: value.length + i,
            publicId: uploadResult.publicId,
          })
          setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
        }
        onChange([...value, ...uploaded])
        setUploadProgress(0)
      } catch (e: any) {
        console.error('Upload error:', e)
        setUploadError(e?.message || 'Failed to upload images')
      } finally {
        setIsUploading(false)
      }
    },
    [value, onChange, disabled, folder],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce<Record<string, string[]>>((acc, t) => {
      acc[t] = []
      return acc
    }, {}),
    maxFiles: maxFiles - value.length,
    maxSize: maxSize * 1024 * 1024,
    disabled,
  })

  const removeImage = async (imageId: string) => {
    const img = value.find((i) => i.id === imageId)
    if (img?.publicId && !img.fromLibrary) {
      try {
        setIsDeleting(imageId)
        await UploadService.deleteImage(img.publicId)
      } catch {
        setUploadError('Failed to delete image from cloud storage')
        setIsDeleting(null)
        return
      } finally {
        setIsDeleting(null)
      }
    }
    const next = value.filter((i) => i.id !== imageId)
    if (img?.isPrimary && next.length > 0) {
      next[0] = { ...next[0], isPrimary: true }
    }
    onChange(next)
  }

  const openCloudinary = useCallback(async () => {
    setCloudinaryOpen(true)
    setCloudinaryError(null)
    setCloudinaryLoading(true)
    try {
      const images = await UploadService.listImages(folder, 50)
      setCloudinaryImages(
        images.map((im) => ({ url: im.url, publicId: im.publicId })),
      )
    } catch (e: any) {
      setCloudinaryError(e?.message || 'Failed to load images')
      setCloudinaryImages([])
    } finally {
      setCloudinaryLoading(false)
    }
  }, [folder])

  const addFromCloudinary = (item: { url: string; publicId: string }) => {
    if (value.length >= maxFiles) return
    const newImage: ImageFile = {
      id: Math.random().toString(36).slice(2, 11),
      url: item.url,
      alt: item.publicId.split('/').pop() || 'Image',
      isPrimary: value.length === 0,
      order: value.length,
      publicId: item.publicId,
      fromLibrary: true,
    }
    onChange([...value, newImage])
  }

  const deleteFromCloudinary = async (publicId: string) => {
    setDeletingPublicId(publicId)
    setCloudinaryError(null)
    try {
      await UploadService.deleteImage(publicId)
      setCloudinaryImages((prev) => prev.filter((i) => i.publicId !== publicId))
      const hadPrimary = value.some(
        (i) => i.publicId === publicId && i.isPrimary,
      )
      const next = value
        .filter((i) => i.publicId !== publicId)
        .map((i, index) => ({
          ...i,
          order: index,
          isPrimary: hadPrimary && index === 0 ? true : i.isPrimary,
        }))
      onChange(next)
    } catch (e: any) {
      setCloudinaryError(e?.message || 'Failed to delete image')
    } finally {
      setDeletingPublicId(null)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-1">
        <Label
          className={cn('text-sm font-semibold', error && 'text-destructive')}
        >
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {tooltip && (
          <span title={tooltip} className="inline-flex cursor-default text-muted-foreground">
            <Info className="h-4 w-4" />
          </span>
        )}
        <StatusIcon status={status} />
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition-colors',
          isDragActive && 'border-primary bg-muted/50',
          error && 'border-destructive',
          !isDragActive && !error && 'border-muted-foreground/25',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <input {...getInputProps()} />
        <CloudUpload className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
        <p className="text-base font-medium">
          {isDragActive ? 'Drop images here' : 'Upload Images'}
        </p>
        <p className="mb-1 text-sm text-muted-foreground">
          Drag and drop images here, or click to select files
        </p>
        <p className="text-xs text-muted-foreground">
          {acceptedTypes
            .map((t) => t.split('/')[1]?.toUpperCase())
            .filter(Boolean)
            .join(', ')}{' '}
          up to {maxSize}MB each
        </p>
        {maxFiles > 1 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Maximum {maxFiles} files ({value.length}/{maxFiles} uploaded)
          </p>
        )}
      </div>

      {allowFromCloudinary && value.length < maxFiles && (
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full sm:w-auto"
          onClick={openCloudinary}
          disabled={disabled}
          leftIcon={<ImageIcon className="h-4 w-4" />}
        >
          Choose from Cloudinary
        </Button>
      )}

      {(uploadProgress > 0 || isUploading) && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Uploading to Cloudinary... {uploadProgress}%
          </p>
        </div>
      )}

      {uploadError && (
        <div
          className="mt-3 flex items-center justify-between gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive"
          role="alert"
        >
          <span className="min-w-0 flex-1">{uploadError}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setUploadError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {error && !uploadError && (
        <div
          className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {helperText && !error && (
        <p className="mt-2 text-sm text-muted-foreground">{helperText}</p>
      )}

      {value.length > 0 && showPreview && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium">Uploaded Images ({value.length})</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {value.map((image) => (
              <Card
                key={image.id}
                className="relative overflow-hidden p-0"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-[120px] w-full cursor-pointer object-cover"
                  onClick={() => setPreviewImage(image.url)}
                />
                {image.isPrimary && _allowPrimary && (
                  <Badge
                    className="absolute left-2 top-2"
                    variant="default"
                  >
                    Primary
                  </Badge>
                )}
                <div className="absolute right-1 top-1 flex gap-0.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 hover:bg-white"
                    onClick={() => setPreviewImage(image.url)}
                    title="Preview"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 text-destructive hover:bg-white"
                    onClick={() => void removeImage(image.id)}
                    disabled={isDeleting === image.id}
                    title="Remove"
                  >
                    {isDeleting === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[70vh] w-full object-contain"
            />
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cloudinaryOpen} onOpenChange={setCloudinaryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose from Cloudinary</DialogTitle>
          </DialogHeader>
          {cloudinaryLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {!cloudinaryLoading && cloudinaryError && (
            <div
              className="flex items-center justify-between gap-2 rounded-md border border-destructive/50 p-2 text-sm text-destructive"
              role="alert"
            >
              {cloudinaryError}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCloudinaryError(null)}
              >
                Dismiss
              </Button>
            </div>
          )}
          {!cloudinaryLoading && !cloudinaryError && cloudinaryImages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No images found in this folder. Upload some first.
            </p>
          )}
          {!cloudinaryLoading && !cloudinaryError && cloudinaryImages.length > 0 && (
            <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3">
              {cloudinaryImages.map((im) => (
                <Card key={im.publicId} className="overflow-hidden p-0">
                  <div className="relative h-[120px]">
                    {deletingPublicId === im.publicId && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                    <img
                      src={im.url}
                      alt={im.publicId}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="flex items-center gap-0.5 p-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => addFromCloudinary(im)}
                      disabled={value.length >= maxFiles || deletingPublicId !== null}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => void deleteFromCloudinary(im.publicId)}
                      disabled={deletingPublicId !== null}
                      title="Delete from Cloudinary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCloudinaryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ImageUploadField
