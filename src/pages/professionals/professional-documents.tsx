/**
 * ============================================================================
 * PROFESSIONAL DOCUMENTS & CERTIFICATIONS PAGE
 * ============================================================================
 * Complete document and certification management for professionals
 * 
 * Features:
 * - Upload certificates and documents
 * - View all documents
 * - Track expiry dates
 * - Download documents
 * - Delete documents
 * - Verification status
 * 
 * @author CTO Team
 * @date January 23, 2026
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import {
  Upload as UploadIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  CheckCircle as VerifiedIcon,
  CloudUpload,
} from '@mui/icons-material'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { useDropzone } from 'react-dropzone'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { UploadService } from '../../services/api/upload.service'
import { extractProfessionalFromGetResponse } from '../../lib/professionalAdmin'
import type { UpdateProfessionalData } from '../../types/professional.types'

interface Certification {
  _id: string
  name: string
  issuedBy: string
  issuedDate?: string
  expiryDate?: string
  certificateUrl?: string
  verificationStatus: 'pending' | 'verified' | 'rejected'
  uploadedAt: string
}

type ApiCert = NonNullable<UpdateProfessionalData['certifications']>[number]

function mapRawCertToUi(c: Record<string, unknown>, index: number): Certification {
  const id = c._id != null ? String(c._id) : `cert-${index}`
  const st = String(c.verificationStatus ?? 'pending')
  const verificationStatus: Certification['verificationStatus'] =
    st === 'approved' || st === 'verified'
      ? 'verified'
      : st === 'rejected'
        ? 'rejected'
        : 'pending'
  return {
    _id: id,
    name: String(c.name ?? ''),
    issuedBy: String(c.issuedBy ?? ''),
    issuedDate: c.issuedDate != null ? String(c.issuedDate) : undefined,
    expiryDate: c.expiryDate != null ? String(c.expiryDate) : undefined,
    certificateUrl: c.certificateUrl != null ? String(c.certificateUrl) : undefined,
    verificationStatus,
    uploadedAt: (c.uploadedAt != null ? String(c.uploadedAt) : '') || new Date().toISOString(),
  }
}

function rawCertToPutPayload(c: Record<string, unknown>): ApiCert {
  const st = String(c.verificationStatus ?? 'pending')
  const verificationStatus: 'pending' | 'approved' | 'rejected' =
    st === 'approved' || st === 'verified'
      ? 'approved'
      : st === 'rejected'
        ? 'rejected'
        : 'pending'
  const out: ApiCert = {
    name: String(c.name ?? ''),
    issuedBy: String(c.issuedBy ?? ''),
    verificationStatus,
  }
  if (c.issuedDate) {
    out.issuedDate = new Date(String(c.issuedDate)).toISOString()
  }
  if (c.expiryDate) {
    out.expiryDate = new Date(String(c.expiryDate)).toISOString()
  }
  if (c.certificateUrl) {
    out.certificateUrl = String(c.certificateUrl)
  }
  return out
}

export function ProfessionalDocuments() {
  const dispatch = useAppDispatch()
  const confirm = useAppConfirm()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    issuedBy: '',
    issuedDate: '',
    expiryDate: '',
  })

  useEffect(() => {
    loadCertifications()
  }, [])

  const loadCertifications = async () => {
    try {
      setLoading(true)
      const response = await ProfessionalsService.getMyProfile()
      if (response.success && response.data) {
        const rawProf = extractProfessionalFromGetResponse(response.data) as Record<string, unknown> | null
        const rawCerts = rawProf && Array.isArray(rawProf.certifications) ? rawProf.certifications : []
        setCertifications(
          (rawCerts as Record<string, unknown>[]).map((row, i) => mapRawCertToUi(row, i)),
        )
      }
    } catch (error: any) {
      console.error('Error loading certifications:', error)
      dispatch(addToast({
        message: error?.message || 'Failed to load certifications',
        severity: 'error',
      }))
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!selectedFile || !formData.name || !formData.issuedBy) {
      dispatch(addToast({ 
        message: 'Please fill in all required fields and select a file', 
        severity: 'error' 
      }))
      return
    }

    try {
      setUploading(true)
      const { url } = await UploadService.uploadImage(selectedFile, 'homeservice/professional_certifications')

      const profileRes = await ProfessionalsService.getMyProfile()
      if (!profileRes.success || !profileRes.data) {
        throw new Error('Could not load profile to save certificate')
      }
      const rawProf = extractProfessionalFromGetResponse(profileRes.data) as Record<string, unknown>
      const rawCerts = Array.isArray(rawProf.certifications)
        ? (rawProf.certifications as Record<string, unknown>[])
        : []

      const nextCert: ApiCert = {
        name: formData.name.trim(),
        issuedBy: formData.issuedBy.trim(),
        certificateUrl: url,
        verificationStatus: 'pending',
      }
      if (formData.issuedDate) {
        nextCert.issuedDate = new Date(formData.issuedDate).toISOString()
      }
      if (formData.expiryDate) {
        nextCert.expiryDate = new Date(formData.expiryDate).toISOString()
      }

      await ProfessionalsService.updateMyProfile({
        certifications: [...rawCerts.map(rawCertToPutPayload), nextCert],
      })

      dispatch(addToast({
        message: 'Certificate uploaded successfully!',
        severity: 'success',
      }))
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setFormData({ name: '', issuedBy: '', issuedDate: '', expiryDate: '' })
      loadCertifications()
    } catch (error: any) {
      dispatch(addToast({
        message: error?.message || 'Failed to upload certificate',
        severity: 'error',
      }))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (certId: string) => {
    const ok = await confirm({
      title: 'Delete certificate?',
      message: 'Are you sure you want to delete this certificate?',
      danger: true,
      confirmLabel: 'Delete',
    })
    if (!ok) return

    try {
      const profileRes = await ProfessionalsService.getMyProfile()
      if (!profileRes.success || !profileRes.data) {
        throw new Error('Could not load profile')
      }
      const rawProf = extractProfessionalFromGetResponse(profileRes.data) as Record<string, unknown>
      const rawCerts = Array.isArray(rawProf.certifications)
        ? (rawProf.certifications as Record<string, unknown>[])
        : []
      const filtered = rawCerts.filter((c) => String(c._id ?? '') !== certId)
      if (filtered.length === rawCerts.length) {
        throw new Error('Certificate not found')
      }
      await ProfessionalsService.updateMyProfile({
        certifications: filtered.map(rawCertToPutPayload),
      })
      dispatch(addToast({
        message: 'Certificate deleted successfully!',
        severity: 'success',
      }))
      loadCertifications()
    } catch (error: any) {
      dispatch(addToast({
        message: error?.message || 'Failed to delete certificate',
        severity: 'error',
      }))
    }
  }

  const handleDownload = (cert: Certification) => {
    if (cert.certificateUrl) {
      window.open(cert.certificateUrl, '_blank')
    }
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const expiry = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const getVerificationChip = (status: string) => {
    const config: any = {
      verified: { label: 'Verified', color: 'success', icon: <VerifiedIcon /> },
      pending: { label: 'Pending Review', color: 'warning' },
      rejected: { label: 'Rejected', color: 'error' },
    }
    const c = config[status] || config.pending
    return <Chip label={c.label} color={c.color} size="small" icon={c.icon} />
  }

  if (loading && certifications.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Documents & Certifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your professional certificates and documents
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Certificate
        </Button>
      </Box>

      {/* Expiring Soon Alert */}
      {certifications.some(c => isExpiringSoon(c.expiryDate)) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You have {certifications.filter(c => isExpiringSoon(c.expiryDate)).length} certificate(s) expiring within 30 days. Please renew them soon.
          </Typography>
        </Alert>
      )}

      {/* Certifications Table */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          {certifications.length === 0 ? (
            <Box textAlign="center" py={4}>
              <DocumentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Certifications Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your professional certificates to build trust with customers
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Your First Certificate
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Certificate Name</TableCell>
                    <TableCell>Issued By</TableCell>
                    <TableCell>Issued Date</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {certifications.map((cert) => (
                    <TableRow key={cert._id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <DocumentIcon color="primary" />
                          <Typography variant="body2" fontWeight={500}>
                            {cert.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{cert.issuedBy}</TableCell>
                      <TableCell>
                        {cert.issuedDate 
                          ? new Date(cert.issuedDate).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {cert.expiryDate 
                            ? new Date(cert.expiryDate).toLocaleDateString()
                            : 'No Expiry'}
                          {isExpired(cert.expiryDate) && (
                            <Chip label="Expired" color="error" size="small" />
                          )}
                          {isExpiringSoon(cert.expiryDate) && (
                            <Chip label="Expiring Soon" color="warning" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getVerificationChip(cert.verificationStatus)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {cert.certificateUrl && (
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => handleDownload(cert)}
                              >
                                <DownloadIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(cert._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false)
          setSelectedFile(null)
          setFormData({ name: '', issuedBy: '', issuedDate: '', expiryDate: '' })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Certificate</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* File Upload */}
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              {selectedFile ? (
                <Box>
                  <Typography variant="body1" fontWeight={500}>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF, PNG, JPG (Max 10MB)
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Form Fields */}
            <TextField
              fullWidth
              label="Certificate Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Issued By *"
              value={formData.issuedBy}
              onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
              placeholder="e.g., Government of India, ABC Institute"
              required
            />
            <TextField
              fullWidth
              type="date"
              label="Issued Date"
              value={formData.issuedDate}
              onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Expiry Date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false)
              setSelectedFile(null)
              setFormData({ name: '', issuedBy: '', issuedDate: '', expiryDate: '' })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !formData.name || !formData.issuedBy || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
