/**
 * ============================================================================
 * PROFESSIONAL DOCUMENTS & CERTIFICATIONS PAGE
 * ============================================================================
 */

import React, { useState, useEffect } from 'react'
import {
  Upload,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  CloudUpload,
  Loader2,
} from 'lucide-react'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import { useDropzone } from 'react-dropzone'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { UploadService } from '../../services/api/upload.service'
import { extractProfessionalFromGetResponse } from '../../lib/professionalAdmin'
import type { UpdateProfessionalData } from '../../types/professional.types'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui'
import { cn } from '../../lib/utils'

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

function verificationBadge(status: string) {
  if (status === 'verified') {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </Badge>
    )
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Rejected</Badge>
  }
  return <Badge variant="warning">Pending Review</Badge>
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
        setCertifications((rawCerts as Record<string, unknown>[]).map((row, i) => mapRawCertToUi(row, i)))
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load certifications'
      dispatch(
        addToast({
          message,
          severity: 'error',
        }),
      )
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
      dispatch(
        addToast({
          message: 'Please fill in all required fields and select a file',
          severity: 'error',
        }),
      )
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

      dispatch(
        addToast({
          message: 'Certificate uploaded successfully!',
          severity: 'success',
        }),
      )
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setFormData({ name: '', issuedBy: '', issuedDate: '', expiryDate: '' })
      loadCertifications()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload certificate'
      dispatch(
        addToast({
          message,
          severity: 'error',
        }),
      )
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
      dispatch(
        addToast({
          message: 'Certificate deleted successfully!',
          severity: 'success',
        }),
      )
      loadCertifications()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete certificate'
      dispatch(
        addToast({
          message,
          severity: 'error',
        }),
      )
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

  if (loading && certifications.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">Documents & Certifications</h1>
            <p className="text-muted-foreground">Manage your professional certificates and documents</p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Certificate
          </Button>
        </div>

        {certifications.some((c) => isExpiringSoon(c.expiryDate)) && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm"
          >
            You have {certifications.filter((c) => isExpiringSoon(c.expiryDate)).length} certificate(s) expiring within
            30 days. Please renew them soon.
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            {certifications.length === 0 ? (
              <div className="py-10 text-center">
                <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
                <h2 className="mb-2 text-lg font-semibold text-muted-foreground">No Certifications Yet</h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload your professional certificates to build trust with customers
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Certificate
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate Name</TableHead>
                      <TableHead>Issued By</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certifications.map((cert) => (
                      <TableRow key={cert._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <span className="font-medium">{cert.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{cert.issuedBy}</TableCell>
                        <TableCell>
                          {cert.issuedDate ? new Date(cert.issuedDate).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'No Expiry'}
                            {isExpired(cert.expiryDate) && <Badge variant="destructive">Expired</Badge>}
                            {isExpiringSoon(cert.expiryDate) && <Badge variant="warning">Expiring Soon</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{verificationBadge(cert.verificationStatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {cert.certificateUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleDownload(cert)}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(cert._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={uploadDialogOpen}
          onOpenChange={(open) => {
            setUploadDialogOpen(open)
            if (!open) {
              setSelectedFile(null)
              setFormData({ name: '', issuedBy: '', issuedDate: '', expiryDate: '' })
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div
                {...getRootProps()}
                className={cn(
                  'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
                  isDragActive ? 'border-primary bg-muted' : 'border-muted-foreground/25',
                )}
              >
                <input {...getInputProps()} />
                <CloudUpload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                {selectedFile ? (
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="mb-1 text-sm">
                      {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG (Max 10MB)</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cert-name">Certificate Name *</Label>
                <Input
                  id="cert-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issued-by">Issued By *</Label>
                <Input
                  id="issued-by"
                  value={formData.issuedBy}
                  onChange={(e) => setFormData({ ...formData, issuedBy: e.target.value })}
                  placeholder="e.g., Government of India, ABC Institute"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issued-date">Issued Date</Label>
                <Input
                  id="issued-date"
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false)
                  setSelectedFile(null)
                  setFormData({ name: '', issuedBy: '', issuedDate: '', expiryDate: '' })
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || !formData.name || !formData.issuedBy || uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
