/**
 * Provider Applications (Professional onboarding) list and detail.
 * Admin view for "Become a Provider" form submissions.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  RefreshCw,
  X,
  User,
  Phone,
  MapPin,
  Briefcase,
  Clock,
  StickyNote,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Pagination } from '../../components/common/Pagination'
import {
  ProfessionalApplicationsService,
  ProfessionalApplication,
  ProfessionalApplicationStatus,
  type ProfessionalApplicationSource,
} from '../../services/api/professionalApplications.service'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import { cn } from '../../lib/utils'

const STATUS_OPTIONS: { value: ProfessionalApplicationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
]

const SOURCE_OPTIONS: { value: ProfessionalApplicationSource | 'all'; label: string }[] = [
  { value: 'all', label: 'All sources' },
  { value: 'mobile_app', label: 'Provider app' },
  { value: 'web', label: 'Web form' },
  { value: 'admin', label: 'Admin' },
  { value: 'import', label: 'Import' },
]

function sourceLabel(source: string | undefined) {
  if (!source) return '—'
  const map: Record<string, string> = {
    mobile_app: 'Provider app',
    web: 'Web',
    admin: 'Admin',
    import: 'Import',
  }
  return map[source] ?? source
}

const statusClass: Record<ProfessionalApplicationStatus, string> = {
  new: 'border-primary/20 bg-primary/10 text-primary',
  contacted: 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral',
  approved: 'border-storm-mist/30 bg-storm-deep/10 text-storm-deep',
  rejected: 'border-destructive/20 bg-destructive/10 text-destructive',
  archived: 'border-border bg-muted text-muted-foreground',
}

function formatDate(value: string | undefined) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

export function ProviderApplications() {
  const [applications, setApplications] = useState<ProfessionalApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<ProfessionalApplicationStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<ProfessionalApplicationSource | 'all'>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedApp, setSelectedApp] = useState<ProfessionalApplication | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [statusValue, setStatusValue] = useState<ProfessionalApplicationStatus | ''>('')
  const [adminNotes, setAdminNotes] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 5000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ProfessionalApplicationsService.getList({
        page,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        source: sourceFilter === 'all' ? undefined : sourceFilter,
        search: searchTerm || undefined,
        city: cityFilter || undefined,
      })
      setApplications(Array.isArray(res.data) ? res.data : [])
      const meta = (res as { meta?: { pagination?: { total?: number } } }).meta
      setTotal(meta?.pagination?.total ?? 0)
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to load applications', severity: 'error' })
      setApplications([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, sourceFilter, searchTerm, cityFilter])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleRefresh = () => {
    fetchList()
    if (selectedApp) {
      ProfessionalApplicationsService.getById(selectedApp._id)
        .then((res) => {
          if (res.data) setSelectedApp(res.data as ProfessionalApplication)
        })
        .catch(() => {})
    }
  }

  const handleRowClick = (row: ProfessionalApplication) => {
    setSelectedApp(row)
    setStatusValue(row.status)
    setAdminNotes(row.adminNotes ?? '')
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedApp(null)
    setStatusValue('')
    setAdminNotes('')
  }

  const handleUpdateStatus = async () => {
    if (!selectedApp || !statusValue) return
    try {
      setDetailLoading(true)
      await ProfessionalApplicationsService.updateStatus(selectedApp._id, {
        status: statusValue as ProfessionalApplicationStatus,
        adminNotes: adminNotes || undefined,
      })
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' })
      const updated = await ProfessionalApplicationsService.getById(selectedApp._id)
      if (updated.data) setSelectedApp(updated.data as ProfessionalApplication)
      fetchList()
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Failed to update status', severity: 'error' })
    } finally {
      setDetailLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Provider Applications"
        subtitle="Web leads, imports, and new accounts from the Profixer Provider mobile app (self-registration)"
        action={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card className="mb-4 rounded-xl">
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:min-w-[220px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, phone, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchList()}
              />
            </div>
            <div className="w-full min-w-[140px] sm:w-40">
              <Label className="sr-only">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as ProfessionalApplicationStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full min-w-[140px] sm:w-40">
              <Label className="sr-only">Source</Label>
              <Select
                value={sourceFilter}
                onValueChange={(v) => setSourceFilter(v as ProfessionalApplicationSource | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              className="w-full min-w-[120px] sm:w-36"
              placeholder="City"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchList()}
            />
            <Button onClick={() => fetchList()}>Apply filters</Button>
          </div>

          <div className="relative min-h-[360px] w-full overflow-x-auto">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead className="text-right">Exp (y)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-sm text-muted-foreground">
                      No applications match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((row) => (
                    <TableRow
                      key={row._id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell className="font-mono text-xs">{row.applicationId}</TableCell>
                      <TableCell className="max-w-[180px] truncate font-medium" title={row.fullName}>
                        {row.fullName}
                      </TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{row.city}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={row.servicesInterested?.join(', ')}>
                        {row.servicesInterested?.length ? row.servicesInterested.join(', ') : '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.experienceYears ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('font-semibold', statusClass[row.status] ?? 'border-border')}
                        >
                          {row.status ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{sourceLabel(row.source)}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {total > 0 && (
              <div className="mt-2">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  itemsPerPage={pageSize}
                  onPageChange={setPage}
                  onItemsPerPageChange={(n) => {
                    setPageSize(n)
                    setPage(1)
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {snackbar.open && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 max-w-sm rounded-md border px-3 py-2 text-sm shadow-md',
            snackbar.severity === 'error'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-card',
          )}
        >
          {snackbar.message}
        </div>
      )}

      {detailOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close panel"
            onClick={handleCloseDetail}
          />
          <div className="relative z-50 flex h-full w-full max-w-md flex-col border-l bg-background shadow-lg sm:max-w-md">
            <div className="flex items-center justify-between border-b p-3">
              <h2 className="text-base font-semibold">Application details</h2>
              <Button type="button" variant="ghost" size="icon" onClick={handleCloseDetail} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Separator />
            {selectedApp && (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Name</span>
                </div>
                <p className="mb-3 text-sm font-medium">{selectedApp.fullName}</p>

                <p className="mb-0.5 text-xs text-muted-foreground">Source</p>
                <p className="mb-3 text-sm">{sourceLabel(selectedApp.source)}</p>
                {selectedApp.metadata?.userId != null && String(selectedApp.metadata.userId).trim() !== '' ? (
                  <>
                    <p className="mb-0.5 text-xs text-muted-foreground">Linked user (app account)</p>
                    <p className="mb-3 font-mono text-xs break-all text-sm">{String(selectedApp.metadata.userId)}</p>
                  </>
                ) : null}

                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs">Phone</span>
                </div>
                <p className="mb-3 text-sm">{selectedApp.phone}</p>

                {selectedApp.email && (
                  <>
                    <p className="mb-0.5 text-xs text-muted-foreground">Email</p>
                    <p className="mb-3 text-sm">{selectedApp.email}</p>
                  </>
                )}

                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">City</span>
                </div>
                <p className="mb-2 text-sm">{selectedApp.city}</p>
                {selectedApp.state && <p className="mb-3 text-sm text-muted-foreground">State: {selectedApp.state}</p>}

                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs">Services</span>
                </div>
                <p className="mb-3 text-sm">
                  {selectedApp.servicesInterested?.length ? selectedApp.servicesInterested.join(', ') : '—'}
                </p>

                <p className="mb-0.5 text-xs text-muted-foreground">Experience (years)</p>
                <p className="mb-3 text-sm">{selectedApp.experienceYears ?? '—'}</p>

                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Applied</span>
                </div>
                <p className="mb-3 text-sm">{formatDate(selectedApp.createdAt)}</p>

                {selectedApp.message && (
                  <>
                    <p className="mb-0.5 text-xs text-muted-foreground">Message</p>
                    <p className="mb-3 text-sm">{selectedApp.message}</p>
                  </>
                )}

                <Separator className="my-2" />
                <h3 className="mb-2 text-sm font-semibold">Update status</h3>
                <div className="mb-3">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={statusValue || undefined}
                    onValueChange={(v) => setStatusValue(v as ProfessionalApplicationStatus)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <StickyNote className="h-4 w-4" />
                  <span className="text-xs">Admin notes</span>
                </div>
                <Textarea
                  className="mb-3 min-h-[80px] text-sm"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes..."
                />
                <Button
                  className="w-full"
                  onClick={handleUpdateStatus}
                  disabled={detailLoading}
                >
                  {detailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {detailLoading ? 'Saving...' : 'Save status & notes'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
