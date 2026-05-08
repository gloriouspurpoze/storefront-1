/**
 * ============================================================================
 * PROFESSIONALS MANAGEMENT PAGE
 * ============================================================================
 */

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Eye,
  Trash2,
  ShieldCheck,
  Clock,
  LayoutDashboard,
} from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { ProfessionalTable, ProfessionalFilters, ProfessionalStatsWidget } from '../../components/professionals'
import { ProfessionalsService } from '../../services/api/professionals.service'
import { Professional, UpdateAvailabilityData } from '../../types/professional.types'
import { getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../../store/hooks'
import { addToast } from '../../store/slices/uiSlice'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Textarea,
} from '../../components/ui'

export function ProfessionalsManagement() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(Date.now())

  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')
  const [expertiseFilter, setExpertiseFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')

  const [page, setPage] = useState(0)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)

  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingProfessional, setViewingProfessional] = useState<Professional | null>(null)

  const [verificationForm, setVerificationForm] = useState<{
    status: 'pending' | 'verified' | 'rejected'
    notes: string
  }>({ status: 'pending', notes: '' })

  const [availabilityData, setAvailabilityData] = useState<UpdateAvailabilityData>({
    availability: 'available',
    reason: '',
  })

  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [menuProfessional, setMenuProfessional] = useState<Professional | null>(null)

  useEffect(() => {
    fetchProfessionals()
  }, [page, limit, searchTerm, availabilityFilter, expertiseFilter, verificationFilter, categoryFilter, accountFilter])

  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const query: Record<string, string | number | boolean | undefined> = {
        page: page + 1,
        limit,
        search: searchTerm || undefined,
        availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
        expertiseLevel: expertiseFilter !== 'all' ? expertiseFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      }
      if (verificationFilter === 'verified') {
        query.isVerified = true
      } else if (verificationFilter === 'pending') {
        query.isVerified = false
        query.verificationStatus = 'pending'
      } else if (verificationFilter === 'rejected') {
        query.verificationStatus = 'rejected'
      }
      if (accountFilter === 'active') {
        query.isActive = true
      } else if (accountFilter === 'inactive') {
        query.isActive = false
      }

      const response = await ProfessionalsService.getProfessionals(query as never)
      const payload = response.data as
        | { professionals?: Professional[]; pagination?: { total: number } }
        | undefined
      if (payload?.professionals) {
        setProfessionals(payload.professionals)
        setTotal(payload.pagination?.total || 0)
      } else {
        setProfessionals([])
        setTotal(0)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch professionals'
      showSnackbar(message, 'error')
      setProfessionals([])
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    fetchProfessionals()
    setRefreshKey(Date.now())
  }

  const handleCreate = () => {
    navigate('/professionals/create')
  }

  const handleEdit = (professional: Professional) => {
    navigate(`/professionals/edit/${professional._id}`)
    setActionSheetOpen(false)
    setMenuProfessional(null)
  }

  const handleOpenHub = (professional: Professional) => {
    navigate(`/professionals/${professional._id}`)
    setActionSheetOpen(false)
    setMenuProfessional(null)
  }

  const handleView = (professional: Professional) => {
    setViewingProfessional(professional)
    setViewDialogOpen(true)
    setActionSheetOpen(false)
    setMenuProfessional(null)
  }

  const handleDelete = async () => {
    if (!selectedProfessional) return

    try {
      await ProfessionalsService.deleteProfessional(selectedProfessional._id)
      showSnackbar('Professional deleted successfully', 'success')
      handleSuccess()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete professional'
      showSnackbar(message, 'error')
    } finally {
      setDeleteDialogOpen(false)
      setSelectedProfessional(null)
    }
  }

  const handleVerificationSubmit = async () => {
    if (!selectedProfessional) return

    try {
      const status = verificationForm.status
      await ProfessionalsService.updateVerification(selectedProfessional._id, {
        isVerified: status === 'verified',
        verificationStatus: status,
        verificationNotes: verificationForm.notes || undefined,
      })
      showSnackbar('Verification updated successfully', 'success')
      handleSuccess()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update verification'
      showSnackbar(message, 'error')
    } finally {
      setVerificationDialogOpen(false)
      setSelectedProfessional(null)
      setVerificationForm({ status: 'pending', notes: '' })
    }
  }

  const handleAvailabilitySubmit = async () => {
    if (!selectedProfessional) return

    try {
      await ProfessionalsService.updateAvailability(selectedProfessional._id, availabilityData)
      showSnackbar('Availability updated successfully', 'success')
      handleSuccess()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update availability'
      showSnackbar(message, 'error')
    } finally {
      setAvailabilityDialogOpen(false)
      setSelectedProfessional(null)
      setAvailabilityData({ availability: 'available', reason: '' })
    }
  }

  const handleMenuClick = (_event: React.MouseEvent<HTMLElement>, professional: Professional) => {
    setMenuProfessional(professional)
    setActionSheetOpen(true)
  }

  const openVerificationDialog = () => {
    if (menuProfessional) {
      setSelectedProfessional(menuProfessional)
      const v = menuProfessional.verificationStatus
      let status: 'pending' | 'verified' | 'rejected' = 'pending'
      if (v === 'verified' || v === 'rejected' || v === 'pending') {
        status = v
      } else if (menuProfessional.isVerified) {
        status = 'verified'
      }
      setVerificationForm({ status, notes: '' })
      setVerificationDialogOpen(true)
    }
    setActionSheetOpen(false)
    setMenuProfessional(null)
  }

  const openAvailabilityDialog = () => {
    if (menuProfessional) {
      setSelectedProfessional(menuProfessional)
      setAvailabilityData({
        availability: menuProfessional.availability,
        reason: '',
      })
      setAvailabilityDialogOpen(true)
    }
    setActionSheetOpen(false)
    setMenuProfessional(null)
  }

  const openDeleteDialog = () => {
    if (menuProfessional) {
      setSelectedProfessional(menuProfessional)
      setDeleteDialogOpen(true)
    }
    setActionSheetOpen(false)
    setMenuProfessional(null)
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    dispatch(addToast({ message, severity }))
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setAvailabilityFilter('all')
    setExpertiseFilter('all')
    setVerificationFilter('all')
    setCategoryFilter('all')
    setAccountFilter('all')
    setPage(0)
  }

  const handleApplyFilters = () => {
    setPage(0)
    fetchProfessionals()
  }

  return (
    <div>
      <PageHeader
        title="Professionals"
        subtitle="Manage service professionals (workers/technicians)"
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" asChild>
              <RouterLink to="/professionals/operations">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Workforce dashboard
              </RouterLink>
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Professional
            </Button>
          </div>
        }
      />

      <ProfessionalStatsWidget onRefresh={refreshKey} />

      <ProfessionalFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        availabilityFilter={availabilityFilter}
        onAvailabilityChange={setAvailabilityFilter}
        expertiseFilter={expertiseFilter}
        onExpertiseChange={setExpertiseFilter}
        verificationFilter={verificationFilter}
        onVerificationChange={setVerificationFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        accountFilter={accountFilter}
        onAccountFilterChange={setAccountFilter}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      <ProfessionalTable
        professionals={professionals}
        loading={loading}
        onMenuClick={handleMenuClick}
        onOpenHub={handleOpenHub}
      />

      <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
          {menuProfessional ? (
            <div className="mt-4 grid gap-2 pb-6">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleView(menuProfessional)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleOpenHub(menuProfessional)}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Command center
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => handleEdit(menuProfessional)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" className="justify-start" onClick={openVerificationDialog}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Update Verification
              </Button>
              <Button variant="outline" className="justify-start" onClick={openAvailabilityDialog}>
                <Clock className="mr-2 h-4 w-4" />
                Update Availability
              </Button>
              <Button variant="destructive" className="justify-start" onClick={openDeleteDialog}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Professional details</DialogTitle>
          </DialogHeader>
          {viewingProfessional && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name and ID</p>
                <p>
                  {viewingProfessional.firstName} {viewingProfessional.lastName} — {viewingProfessional.professionalId}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Contact</p>
                <p>{viewingProfessional.email}</p>
                <p>{viewingProfessional.phoneNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Trades / categories</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(viewingProfessional.categories || []).map((c) => (
                    <span
                      key={c}
                      className="rounded bg-muted px-2 py-0.5 text-xs"
                    >
                      {getProfessionalCategoryLabel(c)}
                    </span>
                  ))}
                  {(viewingProfessional.categories || []).length === 0 ? (
                    <span className="text-muted-foreground">—</span>
                  ) : null}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Work</p>
                <p>
                  Expertise: {viewingProfessional.expertiseLevel} · {viewingProfessional.experience} years experience
                </p>
                <p>
                  Availability: {viewingProfessional.availability} · Verification:{' '}
                  {viewingProfessional.verificationStatus}
                </p>
                {viewingProfessional.serviceProviderId ? (
                  <p>Company: {viewingProfessional.serviceProviderId.businessName}</p>
                ) : null}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-end">
            {viewingProfessional ? (
              <Button
                onClick={() => {
                  setViewDialogOpen(false)
                  navigate(`/professionals/${viewingProfessional._id}`)
                }}
              >
                Command center
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Verification Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Verification status</Label>
              <Select
                value={verificationForm.status}
                onValueChange={(v) =>
                  setVerificationForm({
                    ...verificationForm,
                    status: v as 'pending' | 'verified' | 'rejected',
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-notes">Admin notes (optional)</Label>
              <Textarea
                id="verify-notes"
                rows={3}
                value={verificationForm.notes}
                onChange={(e) => setVerificationForm({ ...verificationForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerificationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerificationSubmit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Availability</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={availabilityData.availability}
                onValueChange={(v) =>
                  setAvailabilityData({
                    ...availabilityData,
                    availability: v as UpdateAvailabilityData['availability'],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avail-reason">Reason (Optional)</Label>
              <Textarea
                id="avail-reason"
                rows={2}
                value={availabilityData.reason || ''}
                onChange={(e) =>
                  setAvailabilityData({
                    ...availabilityData,
                    reason: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvailabilityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAvailabilitySubmit}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Professional</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Are you sure you want to delete{' '}
            <strong>
              {selectedProfessional?.firstName} {selectedProfessional?.lastName}
            </strong>
            ? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
