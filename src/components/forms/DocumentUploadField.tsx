import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudUpload, Download, Loader2, Trash2 } from 'lucide-react'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'
import UploadService from '../../services/api/upload.service'

export interface DocumentFile {
  id: string
  url: string
  name: string
  size: number
  type: string
  publicId?: string
}

export interface DocumentUploadFieldProps {
  label: string
  value: DocumentFile[]
  onChange: (documents: DocumentFile[]) => void
  maxFiles?: number
  maxSize?: number
  helperText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  acceptedTypes?: string[]
  folder?: string
}

const fileEmoji = (type: string) => {
  if (type.includes('pdf')) return '📄'
  if (type.includes('word')) return '📝'
  if (type.includes('image')) return '🖼️'
  return '📎'
}

export const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  value,
  onChange,
  maxFiles = 5,
  maxSize = 10,
  helperText,
  error,
  required = false,
  disabled = false,
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg',
  ],
  folder = 'documents',
}) => {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return
      setIsUploading(true)
      setUploadError(null)
      setUploadProgress(0)
      try {
        const uploaded: DocumentFile[] = []
        for (let i = 0; i < acceptedFiles.length; i++) {
          const file = acceptedFiles[i]
          setUploadProgress(Math.round(((i + 0.5) / acceptedFiles.length) * 100))
          const uploadResult = await UploadService.uploadImage(file, folder)
          uploaded.push({
            id: Math.random().toString(36).slice(2, 11),
            url: uploadResult.url,
            name: file.name,
            size: file.size,
            type: file.type,
            publicId: uploadResult.publicId,
          })
          setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
        }
        onChange([...value, ...uploaded])
        setUploadProgress(0)
      } catch (e: any) {
        console.error('Upload error:', e)
        setUploadError(e?.message || 'Failed to upload documents')
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
    disabled: disabled || isUploading,
  })

  const removeDocument = async (docId: string) => {
    const docToRemove = value.find((d) => d.id === docId)
    if (docToRemove?.publicId) {
      try {
        setIsDeleting(docId)
        await UploadService.deleteImage(docToRemove.publicId)
      } catch {
        setUploadError('Failed to delete document from cloud storage')
        setIsDeleting(null)
        return
      } finally {
        setIsDeleting(null)
      }
    }
    onChange(value.filter((d) => d.id !== docId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        <CloudUpload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          {isDragActive
            ? 'Drop files here'
            : 'Drag & drop documents here, or click to select'}
        </p>
        <p className="text-xs text-muted-foreground">
          Accepted: PDF, DOC, DOCX, JPG, PNG (Max {maxSize}MB per file)
        </p>
        {value.length >= maxFiles && (
          <p className="mt-2 text-xs text-destructive">
            Maximum {maxFiles} files ({value.length}/{maxFiles} uploaded)
          </p>
        )}
      </div>

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

      {value.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium">Uploaded Documents ({value.length})</p>
          <div className="flex flex-col gap-2">
            {value.map((doc) => (
              <Card key={doc.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{fileEmoji(doc.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => void removeDocument(doc.id)}
                      disabled={isDeleting === doc.id}
                      title="Remove"
                    >
                      {isDeleting === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentUploadField
