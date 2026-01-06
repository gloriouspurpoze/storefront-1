import React, { useCallback, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  ZoomIn as ZoomInIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import UploadService from '../../services/api/upload.service'

export interface ImageFile {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  order: number
  file?: File
  publicId?: string  // Cloudinary public ID for deletion
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
  maxSize?: number // in MB
  acceptedTypes?: string[]
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  showPreview?: boolean
  allowReorder?: boolean
  allowPrimary?: boolean
  folder?: string // Cloudinary folder for uploads
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
  maxSize = 10, // 10MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  tooltip,
  status,
  showPreview = true,
  allowReorder = true,
  allowPrimary = true,
  folder = 'homeservice', // Default folder
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)  // Track which image is being deleted

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" fontSize="small" />
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />
      case 'warning':
        return <ErrorIcon color="warning" fontSize="small" />
      case 'info':
        return <InfoIcon color="info" fontSize="small" />
      default:
        return null
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      const uploadedImages: ImageFile[] = []
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setUploadProgress(Math.round(((i + 0.5) / acceptedFiles.length) * 100))
        
        // Upload to Cloudinary using folder from props
        const uploadResult = await UploadService.uploadImage(file, folder)
        
        uploadedImages.push({
          id: Math.random().toString(36).substr(2, 9),
          url: uploadResult.url,
          alt: file.name,
          isPrimary: value.length === 0 && i === 0,
          order: value.length + i,
          publicId: uploadResult.publicId,  // Store publicId for deletion
        })
        
        setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
      }

      onChange([...value, ...uploadedImages])
      setUploadProgress(0)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error.message || 'Failed to upload images')
    } finally {
      setIsUploading(false)
    }
  }, [value, onChange, disabled, folder])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - value.length,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    disabled,
  })

  const removeImage = async (imageId: string) => {
    const imageToRemove = value.find(img => img.id === imageId)
    
    // If image has publicId, delete from Cloudinary
    if (imageToRemove?.publicId) {
      try {
        setIsDeleting(imageId)
        await UploadService.deleteImage(imageToRemove.publicId)
        console.log('Image deleted from Cloudinary:', imageToRemove.publicId)
      } catch (error) {
        console.error('Failed to delete image from Cloudinary:', error)
        setUploadError('Failed to delete image from cloud storage')
        setIsDeleting(null)
        return  // Don't remove from UI if cloud deletion failed
      } finally {
        setIsDeleting(null)
      }
    }
    
    // Remove from local state
    const newImages = value.filter(img => img.id !== imageId)
    // If we removed the primary image, make the first remaining image primary
    if (imageToRemove?.isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true
    }
    onChange(newImages)
  }

  const setPrimaryImage = (imageId: string) => {
    if (!allowPrimary) return
    const newImages = value.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }))
    onChange(newImages)
  }

  const reorderImages = (fromIndex: number, toIndex: number) => {
    if (!allowReorder) return
    const newImages = [...value]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    // Update order numbers
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }))
    onChange(updatedImages)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: error ? 'error.main' : 'text.primary',
          }}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {getStatusIcon()}
      </Box>

      {/* Upload Area */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : error ? 'error.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          backgroundColor: isDragActive ? 'action.hover' : 'transparent',
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            backgroundColor: disabled ? 'transparent' : 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          {isDragActive ? 'Drop images here' : 'Upload Images'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Drag and drop images here, or click to select files
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxSize}MB each
        </Typography>
        {maxFiles > 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            Maximum {maxFiles} files ({value.length}/{maxFiles} uploaded)
          </Typography>
        )}
      </Box>

      {/* Upload Progress */}
      {(uploadProgress > 0 || isUploading) && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Uploading to Cloudinary... {uploadProgress}%
          </Typography>
        </Box>
      )}

      {/* Upload Error */}
      {uploadError && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
          {uploadError}
        </Alert>
      )}

      {/* Error Message */}
      {error && !uploadError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Image Gallery */}
      {value.length > 0 && showPreview && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Uploaded Images ({value.length})
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            {value.map((image, index) => (
              <Card key={image.id} sx={{ overflow: 'hidden', position: 'relative' }}>
                <Box
                  component="img"
                  src={image.url}
                  alt={image.alt}
                  sx={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => setPreviewImage(image.url)}
                />
                  
                  {/* Primary Badge */}
                  {image.isPrimary && allowPrimary && (
                    <Chip
                      label="Primary"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                      }}
                    />
                  )}
                  
                  {/* Action Buttons */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    display: 'flex', 
                    gap: 0.5 
                  }}>
                    <Tooltip title="Preview">
                      <IconButton
                        size="small"
                        onClick={() => setPreviewImage(image.url)}
                        sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                        }}
                      >
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={() => removeImage(image.id)}
                        disabled={isDeleting === image.id}
                        sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
                        }}
                      >
                        {isDeleting === image.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Image Preview</DialogTitle>
        <DialogContent>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Preview"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewImage(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ImageUploadField
