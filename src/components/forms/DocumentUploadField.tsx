import React, { useCallback, useState } from 'react'
import {
  Box,
  Typography,
  Card,
  Button,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  CircularProgress,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as FileIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import { useDropzone } from 'react-dropzone'
import UploadService from '../../services/api/upload.service'

export interface DocumentFile {
  id: string
  url: string
  name: string
  size: number
  type: string
  publicId?: string  // Cloudinary public ID for deletion
}

export interface DocumentUploadFieldProps {
  label: string
  value: DocumentFile[]
  onChange: (documents: DocumentFile[]) => void
  maxFiles?: number
  maxSize?: number  // in MB
  helperText?: string
  error?: string
  required?: boolean
  disabled?: boolean
  acceptedTypes?: string[]
  folder?: string
}

export const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  value,
  onChange,
  maxFiles = 5,
  maxSize = 10,  // 10MB default
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      const uploadedDocuments: DocumentFile[] = []
      
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        setUploadProgress(Math.round(((i + 0.5) / acceptedFiles.length) * 100))
        
        // Upload to Cloudinary
        const uploadResult = await UploadService.uploadImage(file, folder)
        
        uploadedDocuments.push({
          id: Math.random().toString(36).substr(2, 9),
          url: uploadResult.url,
          name: file.name,
          size: file.size,
          type: file.type,
          publicId: uploadResult.publicId,
        })
        
        setUploadProgress(Math.round(((i + 1) / acceptedFiles.length) * 100))
      }

      onChange([...value, ...uploadedDocuments])
      setUploadProgress(0)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error.message || 'Failed to upload documents')
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
    maxSize: maxSize * 1024 * 1024,
    disabled: disabled || isUploading,
  })

  const removeDocument = async (docId: string) => {
    const docToRemove = value.find(doc => doc.id === docId)
    
    // If document has publicId, delete from Cloudinary
    if (docToRemove?.publicId) {
      try {
        setIsDeleting(docId)
        await UploadService.deleteImage(docToRemove.publicId)
        console.log('Document deleted from Cloudinary:', docToRemove.publicId)
      } catch (error) {
        console.error('Failed to delete document from Cloudinary:', error)
        setUploadError('Failed to delete document from cloud storage')
        setIsDeleting(null)
        return
      } finally {
        setIsDeleting(null)
      }
    }
    
    // Remove from local state
    const newDocuments = value.filter(doc => doc.id !== docId)
    onChange(newDocuments)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('image')) return '🖼️'
    return '📎'
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
          opacity: disabled ? 0.6 : 1,
          '&:hover': {
            borderColor: disabled ? 'grey.300' : 'primary.main',
            backgroundColor: disabled ? 'transparent' : 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" sx={{ mb: 1 }}>
          {isDragActive ? 'Drop files here' : 'Drag & drop documents here, or click to select'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Accepted: PDF, DOC, DOCX, JPG, PNG (Max {maxSize}MB per file)
        </Typography>
        {value.length >= maxFiles && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
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

      {/* Document List */}
      {value.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Uploaded Documents ({value.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {value.map((doc) => (
              <Card key={doc.id} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: 24 }}>
                    {getFileIcon(doc.type)}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(doc.size)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        component="a"
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={() => removeDocument(doc.id)}
                        disabled={isDeleting === doc.id}
                        color="error"
                      >
                        {isDeleting === doc.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default DocumentUploadField

