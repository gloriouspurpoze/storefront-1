import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { FixedMessage } from '../../components/common/FixedMessage'
import {
  ProviderTable,
  ProviderFilters,
  ProviderDetailsDialog,
  VerificationStatusDialog,
  DeleteProviderDialog,
  ProviderStatsWidget,
  BulkActions,
} from '../../components/providers'
import { ProvidersService } from '../../services/api/providers.service'
import { ServiceProvider } from '../../types'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'

export function ProvidersManagement() {
  const navigate = useNavigate()
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(Date.now())
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')

  const [page, setPage] = useState(0)
  const [limit] = useState(10)
  const [total, setTotal] = useState(0)

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null)

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  })

  useEffect(() => {
    void fetchProviders()
  }, [page, limit, searchTerm, statusFilter, experienceFilter])

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 6000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const query = {
        page: page + 1,
        limit,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        experience: experienceFilter !== 'all' ? experienceFilter : undefined,
      }

      const response = await ProvidersService.getProviders(query)

      if (response.data?.serviceProviders || response.data?.providers) {
        const providersList = response.data?.serviceProviders || response.data?.providers || []

        const transformedProviders = (providersList as unknown[]).map((provider: any) => ({
          ...provider,
          businessName: provider.business_name || provider.businessName,
          businessLicense: provider.business_license || provider.businessLicense,
          servicesOffered: (provider.services_offered || provider.servicesOffered || []) as string[],
          serviceAreas: (provider.service_areas || provider.serviceAreas || []) as string[],
          verificationStatus: provider.verification_status || provider.verificationStatus,
          yearsExperience: provider.years_experience || provider.yearsExperience,
          business_name: provider.business_name || provider.businessName,
          services_offered: (provider.services_offered || provider.servicesOffered || []) as string[],
          service_areas: (provider.service_areas || provider.serviceAreas || []) as string[],
          verification_status: provider.verification_status || provider.verificationStatus,
          years_experience: provider.years_experience || provider.yearsExperience,
        })) as unknown as ServiceProvider[]

        setProviders(transformedProviders)
        setTotal(response.data.pagination?.total || 0)
      } else {
        setProviders([])
        setTotal(0)
      }
    } catch (error: unknown) {
      console.error('Error fetching providers:', error)
      showSnackbar(error instanceof Error ? error.message : 'Failed to fetch providers', 'error')
      setProviders([])
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    void fetchProviders()
    setRefreshKey(Date.now())
    setSelectedProviderIds([])
  }

  const handleCreate = () => {
    navigate('/providers/create')
  }

  const handleEdit = (provider: ServiceProvider) => {
    navigate(`/providers/edit/${provider.id}`)
  }

  const handleView = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setDetailsDialogOpen(true)
  }

  const handleDelete = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setDeleteDialogOpen(true)
  }

  const handleVerificationStatus = (provider: ServiceProvider) => {
    setSelectedProvider(provider)
    setVerificationDialogOpen(true)
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setExperienceFilter('all')
    setPage(0)
  }

  const handleApplyFilters = () => {
    setPage(0)
    void fetchProviders()
  }

  return (
    <div>
      <PageHeader
        title="Service Providers"
        subtitle="Manage service providers and their verification status"
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <BulkActions
              selectedIds={selectedProviderIds}
              onSuccess={handleSuccess}
              onClearSelection={() => setSelectedProviderIds([])}
            />
            <Button type="button" className="gap-1.5 rounded-lg" onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Add provider
            </Button>
          </div>
        }
      />

      <ProviderStatsWidget onRefresh={refreshKey} />

      <ProviderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        experienceFilter={experienceFilter}
        onExperienceChange={setExperienceFilter}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      <ProviderTable
        providers={providers}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onVerification={handleVerificationStatus}
        onDelete={handleDelete}
      />

      <ProviderDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        provider={selectedProvider}
      />

      <VerificationStatusDialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        provider={selectedProvider}
        onSuccess={handleSuccess}
      />

      <DeleteProviderDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        provider={selectedProvider}
        onSuccess={handleSuccess}
      />

      {snackbar.open && (
        <FixedMessage variant={snackbar.severity === 'error' ? 'error' : 'default'}>
          {snackbar.message}
        </FixedMessage>
      )}
    </div>
  )
}
