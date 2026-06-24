import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { CrmSubnav } from '../../components/crm/CrmSubnav'
import { CrmDealPipelineBoard } from '../../components/crm/CrmDealPipelineBoard'
import { CrmDealPipelineOverview } from '../../components/crm/CrmDealPipelineOverview'
import { ConfirmDeleteDialog } from '../../components/crm/ConfirmDeleteDialog'
import { CrmListToolbar } from '../../components/crm/CrmListToolbar'
import { CrmListShell } from '../../components/crm/CrmListShell'
import { CrmEmptyState } from '../../components/crm/CrmEmptyState'
import { CrmDataGridSkeleton, CrmPipelineSkeleton } from '../../components/crm/CrmDataGridSkeleton'
import { CrmDealDetailDrawer } from '../../components/crm/CrmRecordDrawers'
import { CrmDealFollowUpDialog } from '../../components/crm/CrmDealFollowUpDialog'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridRowSelectionModel,
} from '../../components/crm/CrmDataTable'
import { crmService } from '../../services/api/crm.service'
import { usePermissions } from '../../hooks/usePermissions'
import { useCrmSearchParam } from '../../hooks/useCrmUrlFilters'
import { activitiesForDeal, filterDeals } from '../../utils/crmFilters'
import type { CrmActivity, CrmCompany, CrmContact, CrmDeal, CrmDealStage } from '../../types/crm.types'
import { DEAL_PIPELINE_STAGES, DEAL_STAGE_LABELS, CRM_DEAL_CURRENCIES } from '../../lib/crmNiche'
import { PROFESSIONAL_TRADE_CATEGORIES, getProfessionalCategoryLabel } from '../../constants/professionalCategories'
import {
  applyStageDefaults,
  normalizeCrmPhone,
  resolveDealPrimaryContact,
  suggestDealName,
} from '../../lib/crmDealForm'
import { buildFollowUpMap, summarizeDealFollowUp } from '../../lib/crmDealFollowUp'
import { computePipelineOverviewStats } from '../../lib/crmDealPipelineMetrics'
import { formatMoneyAmount, APP_CURRENCY } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'

const STAGES = DEAL_PIPELINE_STAGES

const emptySelection: GridRowSelectionModel = { type: 'include', ids: new Set() }

export function CrmDeals() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_crm')
  const [searchParams, setSearchParams] = useSearchParams()
  const { qInput, setQInput, setParam } = useCrmSearchParam()
  const stageFilter = searchParams.get('stage') ?? 'all'
  const followUpFilter = searchParams.get('followUp') ?? 'all'
  const view: 'pipeline' | 'table' = searchParams.get('view') === 'table' ? 'table' : 'pipeline'

  const setView = (v: 'pipeline' | 'table') => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        if (v === 'pipeline') p.delete('view')
        else p.set('view', 'table')
        return p
      },
      { replace: true }
    )
  }

  const [tick, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CrmDeal | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [rows, setRows] = useState<CrmDeal[]>([])
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [activities, setActivities] = useState<CrmActivity[]>([])
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>(emptySelection)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [dealToDeleteId, setDealToDeleteId] = useState<string | null>(null)
  const [drawerDeal, setDrawerDeal] = useState<CrmDeal | null>(null)
  const [followUpDeal, setFollowUpDeal] = useState<CrmDeal | null>(null)
  const dealNameTouched = useRef(false)

  const contactPhoneById = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of contacts) {
      if (c.phone) map.set(c.id, c.phone)
    }
    return map
  }, [contacts])

  useEffect(() => {
    let c = true
    setLoading(true)
    setLoadError(null)
    Promise.all([
      crmService.listDeals(),
      crmService.listCompanies(),
      crmService.listContacts(),
      crmService.listActivities(),
    ])
      .then(([d, co, ct, act]) => {
        if (!c) return
        setRows(d)
        setCompanies(co)
        setContacts(ct)
        setActivities(act)
      })
      .catch(() => {
        if (c) setLoadError('Could not load deals. Check your connection and try again.')
      })
      .finally(() => {
        if (c) setLoading(false)
      })
    return () => {
      c = false
    }
  }, [tick])

  useEffect(() => {
    if (!snackbar.open) return undefined
    const t = window.setTimeout(() => setSnackbar((s) => ({ ...s, open: false })), 4000)
    return () => window.clearTimeout(t)
  }, [snackbar.open, snackbar.message])

  const followUpByDealId = useMemo(
    () => buildFollowUpMap(activities, rows.map((r) => r.id)),
    [activities, rows]
  )

  const overdueDealCount = useMemo(() => {
    let n = 0
    for (const d of rows) {
      if ((followUpByDealId.get(d.id)?.overdueCount ?? 0) > 0) n++
    }
    return n
  }, [rows, followUpByDealId])

  const noFollowUpCount = useMemo(() => {
    let n = 0
    for (const d of rows) {
      if (followUpByDealId.get(d.id)?.status === 'none') n++
    }
    return n
  }, [rows, followUpByDealId])

  const filteredRows = useMemo(() => {
    let list = filterDeals(rows, qInput, stageFilter)
    if (followUpFilter === 'overdue') {
      list = list.filter((d) => followUpByDealId.get(d.id)?.status === 'overdue')
    } else if (followUpFilter === 'due_today') {
      list = list.filter((d) => followUpByDealId.get(d.id)?.status === 'due_today')
    } else if (followUpFilter === 'none') {
      list = list.filter((d) => followUpByDealId.get(d.id)?.status === 'none')
    }
    return list
  }, [rows, qInput, stageFilter, followUpFilter, followUpByDealId])

  const pipelineStats = useMemo(
    () => computePipelineOverviewStats(filteredRows, STAGES, overdueDealCount, noFollowUpCount),
    [filteredRows, overdueDealCount, noFollowUpCount]
  )

  const handleStageOverviewClick = useCallback(
    (stage: CrmDealStage) => {
      setParam('stage', stageFilter === stage ? 'all' : stage)
    },
    [setParam, stageFilter]
  )

  const [form, setForm] = useState({
    name: '',
    amount: 0,
    currency: 'INR',
    stage: 'inquiry' as CrmDealStage,
    probability: 10,
    companyId: '' as string | undefined,
    primaryContactId: '' as string | undefined,
    expectedCloseDate: '',
    notes: '',
    locality: '',
    serviceCategory: '',
    phone: '',
    platformBookingId: '',
    platformOrderId: '',
  })

  const syncPhoneFromContact = (contactId?: string) => {
    if (!contactId) return
    const c = contacts.find((x) => x.id === contactId)
    if (c?.phone) setForm((f) => ({ ...f, phone: c.phone ?? f.phone }))
  }

  const openCreate = () => {
    dealNameTouched.current = false
    setEditing(null)
    setForm({
      name: '',
      amount: 0,
      currency: 'INR',
      stage: 'inquiry',
      probability: 10,
      companyId: undefined,
      primaryContactId: undefined,
      expectedCloseDate: '',
      notes: '',
      locality: '',
      serviceCategory: '',
      phone: '',
      platformBookingId: '',
      platformOrderId: '',
    })
    setOpen(true)
  }

  const openEdit = useCallback(
    (row: CrmDeal) => {
      dealNameTouched.current = true
      setEditing(row)
      const linkedPhone = row.phone ?? (row.primaryContactId ? contactPhoneById.get(row.primaryContactId) : '') ?? ''
      setForm({
        name: row.name,
        amount: row.amount,
        currency: row.currency,
        stage: row.stage,
        probability: row.probability,
        companyId: row.companyId,
        primaryContactId: row.primaryContactId,
        expectedCloseDate: row.expectedCloseDate?.slice(0, 10) ?? '',
        notes: row.notes ?? '',
        locality: row.locality ?? '',
        serviceCategory: row.serviceCategory ?? '',
        phone: linkedPhone,
        platformBookingId: row.platformBookingId ?? '',
        platformOrderId: row.platformOrderId ?? '',
      })
      setOpen(true)
    },
    [contactPhoneById],
  )

  const refresh = useCallback(() => setTick((x) => x + 1), [])

  const handleMarkFollowUpDone = useCallback(
    async (activityId: string) => {
      const act = activities.find((a) => a.id === activityId)
      if (!act) return
      await crmService.upsertActivity({
        ...act,
        status: 'done',
        completedAt: new Date().toISOString(),
      })
      setSnackbar({ open: true, message: 'Follow-up marked done', severity: 'success' })
      refresh()
    },
    [activities, refresh]
  )

  const handleMoveDeal = useCallback(
    async (dealId: string, newStage: CrmDealStage) => {
      const deal = rows.find((d) => d.id === dealId)
      if (!deal || deal.stage === newStage) return
      const prev = rows
      setRows((r) => r.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)))
      try {
        await crmService.upsertDeal({
          ...deal,
          stage: newStage,
        })
        setSnackbar({ open: true, message: 'Stage updated', severity: 'success' })
      } catch {
        setRows(prev)
        setSnackbar({ open: true, message: 'Could not move deal', severity: 'error' })
        throw new Error('move failed')
      }
    },
    [rows]
  )

  const runDeleteIds = async (ids: string[]) => {
    setDeleteLoading(true)
    try {
      await Promise.all(ids.map((id) => crmService.deleteDeal(id)))
      setSelectionModel(emptySelection)
      refresh()
      setSnackbar({ open: true, message: ids.length > 1 ? 'Deals removed' : 'Deal removed', severity: 'success' })
      setDeleteTarget(null)
      setDealToDeleteId(null)
    } catch {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const baseColumns: GridColDef<CrmDeal>[] = useMemo(
    () => [
      { field: 'name', headerName: 'Deal', flex: 1.2, minWidth: 180 },
      {
        field: 'phone',
        headerName: 'Phone',
        width: 120,
        renderCell: (p) => p.row.phone ?? (p.row.primaryContactId ? contactPhoneById.get(p.row.primaryContactId) : '') ?? '—',
      },
      {
        field: 'serviceCategory',
        headerName: 'Service',
        width: 130,
        renderCell: (p) => (p.row.serviceCategory ? getProfessionalCategoryLabel(p.row.serviceCategory) : '—'),
      },
      {
        field: 'amount',
        headerName: 'Amount',
        width: 130,
        renderCell: (p) => formatMoneyAmount(p.row.amount, p.row.currency),
      },
      {
        field: 'stage',
        headerName: 'Stage',
        width: 130,
        renderCell: (p) => <Badge className="font-normal">{DEAL_STAGE_LABELS[p.row.stage]}</Badge>,
      },
      { field: 'probability', headerName: '%', width: 70 },
      {
        field: 'expectedCloseDate',
        headerName: 'Close',
        width: 120,
        renderCell: (p) => (p.row.expectedCloseDate ? String(p.row.expectedCloseDate).slice(0, 10) : '—'),
      },
      {
        field: 'view',
        headerName: '',
        width: 70,
        sortable: false,
        renderCell: (p) => (
          <div className="inline-flex">
            <GridActionsCellItem icon={<Eye className="h-4 w-4" />} label="Details" onClick={() => setDrawerDeal(p.row)} />
          </div>
        ),
      },
    ],
    [contactPhoneById],
  )

  const actionColumn: GridColDef<CrmDeal> = useMemo(
    () => ({
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: ({ row }) => [
        <GridActionsCellItem key="edit" icon={<Pencil className="h-4 w-4" />} label="Edit" onClick={() => openEdit(row)} />,
        <GridActionsCellItem
          key="del"
          icon={<Trash2 className="h-4 w-4" />}
          label="Delete"
          onClick={() => {
            setDealToDeleteId(row.id)
            setDeleteTarget('single')
          }}
        />,
      ],
    }),
    [openEdit]
  )

  const columns = canManage ? [...baseColumns, actionColumn] : baseColumns

  const selectedIds = useMemo(
    () => Array.from(selectionModel.ids).map((id) => String(id)),
    [selectionModel]
  )
  const drawerActivities = drawerDeal ? activitiesForDeal(activities, drawerDeal.id) : []
  const drawerCompany = drawerDeal?.companyId
    ? companies.find((c) => c.id === drawerDeal.companyId)?.name
    : undefined
  const drawerContactName = useMemo(() => {
    if (!drawerDeal?.primaryContactId) return undefined
    const c = contacts.find((x) => x.id === drawerDeal.primaryContactId)
    return c ? `${c.firstName} ${c.lastName}` : undefined
  }, [drawerDeal, contacts])

  const isEmpty = !loading && !loadError && rows.length === 0

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Deals"
        subtitle="Revenue pipeline for home-service jobs — inquiry → quote → scheduled → paid. Link phone & service for ops follow-up."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              <Button type="button" size="sm" variant={view === 'pipeline' ? 'default' : 'outline'} onClick={() => setView('pipeline')}>
                Pipeline
              </Button>
              <Button type="button" size="sm" variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')}>
                Table
              </Button>
            </div>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => crmService.downloadExport('deals')}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {canManage ? (
              <Button size="sm" className="gap-1" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New deal
              </Button>
            ) : null}
          </div>
        }
      />
      <CrmSubnav />

      <CrmListToolbar qInput={qInput} onQChange={setQInput} searchPlaceholder="Search deals…">
        <div className="space-y-1.5">
          <Label className="sr-only">Stage</Label>
          <Select value={stageFilter} onValueChange={(v) => setParam('stage', v)}>
            <SelectTrigger className="h-9 w-[min(100%,10rem)] sm:w-40" aria-label="Stage">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {DEAL_STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="sr-only">Follow-up</Label>
          <Select value={followUpFilter} onValueChange={(v) => setParam('followUp', v)}>
            <SelectTrigger className="h-9 w-[min(100%,10rem)] sm:w-44" aria-label="Follow-up filter">
              <SelectValue placeholder="Follow-up" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All follow-ups</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="due_today">Due today</SelectItem>
              <SelectItem value="none">No follow-up</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CrmListToolbar>

      {view === 'pipeline' && !loading && !loadError && rows.length > 0 ? (
        <CrmDealPipelineOverview
          deals={filteredRows}
          stages={STAGES}
          stageLabels={DEAL_STAGE_LABELS}
          formatMoney={formatMoneyAmount}
          currency={APP_CURRENCY}
          overdueFollowUps={overdueDealCount}
          noFollowUpCount={noFollowUpCount}
          activeStage={stageFilter !== 'all' ? stageFilter : undefined}
          onStageClick={handleStageOverviewClick}
          onFollowUpFilter={(f) => setParam('followUp', f)}
        />
      ) : null}

      {canManage && view === 'table' && selectedIds.length > 0 ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">{selectedIds.length} selected</p>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteTarget('bulk')}>
            Delete selected
          </Button>
        </div>
      ) : null}

      <CrmListShell
        loading={loading}
        error={loadError}
        onRetry={refresh}
        isEmpty={isEmpty}
        empty={
          <Card>
            <CrmEmptyState
              title="No deals yet"
              description="Create a deal to track opportunities through your pipeline."
              actionLabel={canManage ? 'New deal' : undefined}
              onAction={canManage ? openCreate : undefined}
            />
          </Card>
        }
        skeleton={view === 'pipeline' ? <CrmPipelineSkeleton /> : <CrmDataGridSkeleton />}
      >
        {view === 'table' ? (
          <Card>
            <CardContent className="p-0">
              {filteredRows.length === 0 && rows.length > 0 ? (
                <CrmEmptyState title="No matching deals" description="Try adjusting search or stage filter." />
              ) : (
                <DataGrid
                  rows={filteredRows}
                  columns={columns}
                  getRowId={(r) => r.id}
                  pageSizeOptions={[10, 25, 50]}
                  initialPageSize={10}
                  checkboxSelection={canManage}
                  rowSelectionModel={selectionModel}
                  onRowSelectionModelChange={setSelectionModel}
                  minHeight={360}
                  className="border-0"
                />
              )}
            </CardContent>
          </Card>
        ) : filteredRows.length === 0 && rows.length > 0 ? (
          <Card>
            <CrmEmptyState title="No matching deals" description="Try adjusting search or stage filter." />
          </Card>
        ) : (
          <CrmDealPipelineBoard
            stages={STAGES}
            stageLabels={DEAL_STAGE_LABELS}
            deals={filteredRows}
            stageStats={pipelineStats.byStage}
            followUpByDealId={followUpByDealId}
            canManage={canManage}
            formatMoney={formatMoneyAmount}
            currency={APP_CURRENCY}
            onEdit={openEdit}
            onViewDeal={(d) => setDrawerDeal(d)}
            onMoveDeal={handleMoveDeal}
            onScheduleFollowUp={canManage ? setFollowUpDeal : undefined}
            onMarkFollowUpDone={canManage ? handleMarkFollowUpDone : undefined}
          />
        )}
      </CrmListShell>

      <CrmDealDetailDrawer
        open={!!drawerDeal}
        onClose={() => setDrawerDeal(null)}
        deal={drawerDeal}
        formatMoney={formatMoneyAmount}
        companyName={drawerCompany}
        contactName={drawerContactName}
        activities={drawerActivities}
        followUp={drawerDeal ? summarizeDealFollowUp(activities, drawerDeal.id) : null}
        onScheduleFollowUp={
          canManage && drawerDeal
            ? () => {
                setFollowUpDeal(drawerDeal)
              }
            : undefined
        }
        onMarkFollowUpDone={canManage ? handleMarkFollowUpDone : undefined}
        onEdit={() => {
          if (drawerDeal) {
            openEdit(drawerDeal)
            setDrawerDeal(null)
          }
        }}
      />

      <CrmDealFollowUpDialog
        open={!!followUpDeal}
        deal={followUpDeal}
        onClose={() => setFollowUpDeal(null)}
        onSaved={() => {
          setSnackbar({ open: true, message: 'Follow-up scheduled', severity: 'success' })
          refresh()
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'single' && !!dealToDeleteId}
        title="Delete this deal?"
        description="This cannot be undone. Related activities stay in the system but may show a broken link."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setDealToDeleteId(null)
          }
        }}
        onConfirm={async () => {
          if (dealToDeleteId) await runDeleteIds([dealToDeleteId])
        }}
      />

      <ConfirmDeleteDialog
        open={deleteTarget === 'bulk'}
        title={`Delete ${selectedIds.length} deals?`}
        description="This cannot be undone."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null)
        }}
        onConfirm={async () => {
          await runDeleteIds(selectedIds)
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4 text-left">
            <DialogTitle>{editing ? 'Edit deal' : 'New deal'}</DialogTitle>
            <DialogDescription>
              Capture the job, customer phone, and service trade. Stage drives default win probability — standard
              home-services pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(70vh,640px)] overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Deal</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="dl-name">Deal name *</Label>
                    <Input
                      id="dl-name"
                      value={form.name}
                      placeholder="e.g. AC servicing — Powai"
                      onChange={(e) => {
                        dealNameTouched.current = true
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dl-amt">Amount (₹)</Label>
                    <Input
                      id="dl-amt"
                      type="number"
                      min={0}
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Currency</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_DEAL_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Stage</Label>
                    <Select
                      value={form.stage}
                      onValueChange={(v) => {
                        const stage = v as CrmDealStage
                        setForm((f) => ({ ...f, stage, ...applyStageDefaults(stage) }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {DEAL_STAGE_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dl-pct">Win probability %</Label>
                    <Input
                      id="dl-pct"
                      type="number"
                      min={0}
                      max={100}
                      value={form.probability}
                      onChange={(e) => setForm((f) => ({ ...f, probability: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="dl-close">Expected close date</Label>
                    <Input
                      id="dl-close"
                      type="date"
                      value={form.expectedCloseDate}
                      onChange={(e) => setForm((f) => ({ ...f, expectedCloseDate: e.target.value }))}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Customer & job</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dl-phone">Phone *</Label>
                    <Input
                      id="dl-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="10-digit mobile"
                      value={form.phone}
                      onChange={(e) => {
                        const phone = e.target.value
                        const match = contacts.find((c) => normalizeCrmPhone(c.phone) === normalizeCrmPhone(phone))
                        setForm((f) => ({
                          ...f,
                          phone,
                          primaryContactId: match?.id ?? f.primaryContactId,
                        }))
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Links to an existing contact by phone, or creates a lead on save.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Primary contact</Label>
                    <Select
                      value={form.primaryContactId ?? 'none'}
                      onValueChange={(v) => {
                        const id = v === 'none' ? undefined : v
                        setForm((f) => ({ ...f, primaryContactId: id }))
                        syncPhoneFromContact(id)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional — pick from CRM" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None — use phone only</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
                            {c.phone ? ` · ${c.phone}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dl-locality">Locality / area</Label>
                    <Input
                      id="dl-locality"
                      value={form.locality}
                      onChange={(e) => {
                        const locality = e.target.value
                        setForm((f) => {
                          const next = { ...f, locality }
                          if (!dealNameTouched.current && !f.name.trim()) {
                            next.name = suggestDealName(f.serviceCategory, locality)
                          }
                          return next
                        })
                      }}
                      placeholder="e.g. Powai, Andheri East"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Service category</Label>
                    <Select
                      value={form.serviceCategory || 'none'}
                      onValueChange={(v) => {
                        const serviceCategory = v === 'none' ? '' : v
                        setForm((f) => {
                          const next = { ...f, serviceCategory }
                          if (!dealNameTouched.current && !f.name.trim()) {
                            next.name = suggestDealName(serviceCategory, f.locality)
                          }
                          return next
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {PROFESSIONAL_TRADE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>B2B account</Label>
                    <Select
                      value={form.companyId ?? 'none'}
                      onValueChange={(v) => setForm((f) => ({ ...f, companyId: v === 'none' ? undefined : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Society / AMC (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None — homeowner deal</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <details className="rounded-lg border bg-muted/30 px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">Advanced — platform IDs</summary>
                <div className="mt-3 grid gap-3 pb-2 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="dl-pbid">Platform booking ID</Label>
                    <Input
                      id="dl-pbid"
                      value={form.platformBookingId}
                      onChange={(e) => setForm((f) => ({ ...f, platformBookingId: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dl-poid">Platform order ID</Label>
                    <Input
                      id="dl-poid"
                      value={form.platformOrderId}
                      onChange={(e) => setForm((f) => ({ ...f, platformOrderId: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </details>

              <div className="space-y-1.5">
                <Label htmlFor="dl-notes">Notes</Label>
                <Textarea
                  id="dl-notes"
                  rows={3}
                  value={form.notes}
                  placeholder="Scope, competitor quote, access instructions…"
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canManage}
              onClick={() => {
                if (!form.name.trim()) {
                  setSnackbar({ open: true, message: 'Deal name is required', severity: 'error' })
                  return
                }
                const phoneDigits = normalizeCrmPhone(form.phone)
                if (phoneDigits.length < 10 && !form.primaryContactId && !editing) {
                  setSnackbar({ open: true, message: 'Enter a valid 10-digit phone or link a contact', severity: 'error' })
                  return
                }
                void (async () => {
                  try {
                    const primaryContactId = await resolveDealPrimaryContact({
                      phone: form.phone,
                      primaryContactId: form.primaryContactId,
                      contacts,
                      locality: form.locality,
                      serviceCategory: form.serviceCategory,
                    })
                    await crmService.upsertDeal({
                      id: editing?.id,
                      name: form.name.trim(),
                      amount: form.amount,
                      currency: form.currency || APP_CURRENCY,
                      stage: form.stage,
                      probability: Math.min(100, Math.max(0, form.probability)),
                      companyId: form.companyId,
                      primaryContactId,
                      expectedCloseDate: form.expectedCloseDate || undefined,
                      notes: form.notes || undefined,
                      locality: form.locality || undefined,
                      serviceCategory: form.serviceCategory || undefined,
                      phone: normalizeCrmPhone(form.phone) || undefined,
                      platformBookingId: form.platformBookingId.trim() || undefined,
                      platformOrderId: form.platformOrderId.trim() || undefined,
                    })
                    setOpen(false)
                    refresh()
                    setSnackbar({ open: true, message: 'Deal saved', severity: 'success' })
                  } catch {
                    setSnackbar({ open: true, message: 'Save failed', severity: 'error' })
                  }
                })()
              }}
            >
              Save deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {snackbar.open ? (
        <div
          role="status"
          className={cn(
            'fixed bottom-4 left-1/2 z-[200] w-[min(100%,20rem)] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-md',
            snackbar.severity === 'error'
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-storm-deep bg-storm-deep text-white',
          )}
        >
          {snackbar.message}
        </div>
      ) : null}
    </div>
  )
}
