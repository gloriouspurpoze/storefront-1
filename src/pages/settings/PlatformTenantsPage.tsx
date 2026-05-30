import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  VStack,
  HStack,
  useToast,
  Checkbox,
} from '../../components/ui'
import {
  Building2,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Globe,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAppDispatch } from '../../store/hooks'
import { setTenant } from '../../store/slices/tenantSlice'
import {
  platformTenantsService,
  type PlatformTenantRow,
  type IsolationSummary,
} from '../../services/api/platformTenants.service'

/** Must match fixer-backend `TENANT_FEATURE_KEYS` + `requireTenantFeature` usage. */
const TENANT_MODULE_OPTIONS: { key: string; label: string }[] = [
  { key: 'cms', label: 'CMS & site appearance' },
  { key: 'crm', label: 'CRM' },
  { key: 'finance', label: 'Finance' },
  { key: 'marketing_workspace', label: 'Marketing workspace' },
  { key: 'team_work', label: 'Team work' },
  { key: 'bazaar', label: 'Bazaar (marketplace admin)' },
]

/** Normalize Mongo-style id from API (`_id` or `id`). */
function tenantIdString(t: PlatformTenantRow | (Partial<PlatformTenantRow> & { id?: string })): string {
  const raw = t._id ?? (t as { id?: string }).id
  return raw != null ? String(raw) : ''
}

export function PlatformTenantsPage() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [rows, setRows] = useState<PlatformTenantRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [planKey, setPlanKey] = useState('')
  const [openChecklistAfterCreate, setOpenChecklistAfterCreate] = useState(true)
  const [saving, setSaving] = useState(false)

  const [detail, setDetail] = useState<PlatformTenantRow | null>(null)
  const [iso, setIso] = useState<IsolationSummary | null>(null)
  const [attachEmail, setAttachEmail] = useState('')
  const [domainHost, setDomainHost] = useState('')
  const [domains, setDomains] = useState<Array<{ _id: string; hostname: string; verified?: boolean; isPrimary?: boolean }>>([])
  /** `null` = no restriction (backend omit/unset). Non-null = explicit allowlist (may be empty). */
  const [moduleAllowlist, setModuleAllowlist] = useState<string[] | null>(null)
  const [savingModules, setSavingModules] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await platformTenantsService.list(1, 100)
      const payload = res.data as { tenants?: PlatformTenantRow[]; total?: number } | undefined
      setRows(payload?.tenants ?? [])
      setTotal(payload?.total ?? 0)
    } catch (e) {
      toast({
        title: 'Could not load tenants',
        description: e instanceof Error ? e.message : 'API error',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  /** Sync Redux tenant context so `/settings/saas` checklist + `X-Tenant-Id` match this org. */
  const applyTenantContext = useCallback(
    (t: PlatformTenantRow) => {
      const id = tenantIdString(t)
      if (!id) return
      dispatch(setTenant({ id, name: t.name, slug: t.slug }))
    },
    [dispatch],
  )

  const goToPlatformChecklist = useCallback(
    (t: PlatformTenantRow) => {
      applyTenantContext(t)
      navigate('/settings/saas')
      toast({
        title: 'Checklist opened',
        description: `Launch checklist is scoped to ${t.name} (${tenantIdString(t).slice(0, 8)}…).`,
      })
    },
    [applyTenantContext, navigate, toast],
  )

  const openDetail = async (t: PlatformTenantRow) => {
    setDetail(t)
    setAttachEmail('')
    setDomainHost('')
    setIso(null)
    const fm = t.featureModules
    setModuleAllowlist(fm === undefined || fm === null ? null : [...fm])
    try {
      const [fullRes, isoRes, domRes] = await Promise.all([
        platformTenantsService.get(t._id),
        platformTenantsService.isolationSummary(t._id),
        platformTenantsService.listDomains(t._id),
      ])
      const row = fullRes.data as PlatformTenantRow | undefined
      if (row) {
        setDetail(row)
        const m = row.featureModules
        setModuleAllowlist(m === undefined || m === null ? null : [...m])
      }
      setIso(isoRes.data as IsolationSummary)
      const d = domRes.data as typeof domains
      setDomains(Array.isArray(d) ? d : [])
    } catch {
      toast({ title: 'Could not load tenant detail', variant: 'destructive' })
    }
  }

  const saveModuleAllowlist = async () => {
    if (!detail) return
    setSavingModules(true)
    try {
      await platformTenantsService.update(detail._id, {
        featureModules: moduleAllowlist === null ? null : moduleAllowlist,
      })
      const fresh = await platformTenantsService.get(detail._id)
      const row = fresh.data as PlatformTenantRow | undefined
      if (row) {
        setDetail(row)
        const m = row.featureModules
        setModuleAllowlist(m === undefined || m === null ? null : [...m])
      }
      toast({ title: 'Module access updated', description: 'JWT tenants see changes within ~1 minute (server cache).' })
      await load()
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setSavingModules(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      toast({ title: 'Name and slug required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await platformTenantsService.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        ownerEmail: ownerEmail.trim() || undefined,
        planKey: planKey.trim() || undefined,
      })
      const bundle = res.data as
        | { tenant?: PlatformTenantRow & { id?: string }; ownerAttached?: boolean; message?: string }
        | undefined
      const created = bundle?.tenant
      const tid = created ? tenantIdString(created) : ''
      if (tid && created) {
        dispatch(setTenant({ id: tid, name: created.name, slug: created.slug }))
      }
      setCreateOpen(false)
      setName('')
      setSlug('')
      setOwnerEmail('')
      setPlanKey('')
      await load()
      if (tid && created) {
        toast({
          title: 'Tenant created',
          description: openChecklistAfterCreate
            ? 'Opening SaaS platform — minimum checklist is now keyed to this organization in this browser.'
            : 'Organization context updated for this browser. Open SaaS platform when ready to complete the checklist.',
        })
        if (openChecklistAfterCreate) {
          navigate('/settings/saas')
        }
      }
    } catch (e) {
      toast({
        title: 'Create failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleSuspend = async (t: PlatformTenantRow) => {
    const suspended = !t.suspendedAt
    try {
      await platformTenantsService.update(t._id, {
        suspended,
        suspensionReason: suspended ? 'Suspended from admin' : undefined,
      })
      await load()
      if (detail?._id === t._id) {
        const fresh = await platformTenantsService.get(t._id)
        const row = fresh.data as PlatformTenantRow | undefined
        if (row) await openDetail(row)
      }
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    }
  }

  const attachUser = async () => {
    if (!detail || !attachEmail.trim()) return
    try {
      await platformTenantsService.attachUser(detail._id, attachEmail.trim())
      setAttachEmail('')
      await openDetail(detail)
      await load()
    } catch (e) {
      toast({
        title: 'Attach failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    }
  }

  const addDomain = async () => {
    if (!detail || !domainHost.trim()) return
    try {
      await platformTenantsService.addDomain(detail._id, domainHost.trim(), false)
      setDomainHost('')
      await openDetail(detail)
    } catch (e) {
      toast({
        title: 'Domain failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    }
  }

  const removeDomain = async (domainId: string) => {
    if (!detail) return
    try {
      await platformTenantsService.removeDomain(detail._id, domainId)
      await openDetail(detail)
    } catch (e) {
      toast({
        title: 'Remove failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-0 flex-1 p-4 sm:p-6">
      <VStack spacing={6}>
        <PageHeader
          title="Organizations (tenants)"
          subtitle="Platform operators only: create workspaces, map domains, attach admins. Requires backend /api/platform/tenants + manage_system_settings."
          icon={<Building2 className="h-8 w-8 shrink-0" aria-hidden />}
          action={
            <HStack spacing={2}>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                New tenant
              </Button>
            </HStack>
          }
        />

        <p className="text-sm text-muted-foreground">
          Total: <strong>{total}</strong>. Consumer hostname resolution (verified domains):{' '}
          <code className="rounded bg-muted px-1">GET /api/platform/tenants/resolve?host=</code>
        </p>
        <p className="text-sm text-muted-foreground">
          After you create a tenant, this app sets <strong>organization context</strong> in the browser so the{' '}
          <strong>Minimum platform checklist</strong> on <code className="rounded bg-muted px-1">/settings/saas</code>{' '}
          applies to that tenant (stored locally per tenant id). Use <strong>Checklist</strong> on a row to jump there.
        </p>

        {createOpen && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create tenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="pt-name">Display name</Label>
                <Input id="pt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Services" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-slug">Slug (unique)</Label>
                <Input id="pt-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="acme-services" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-owner">Owner email (optional)</Label>
                <Input
                  id="pt-owner"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="ops@client.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-plan">Plan key (optional)</Label>
                <Input id="pt-plan" value={planKey} onChange={(e) => setPlanKey(e.target.value)} placeholder="growth" />
              </div>
              <div className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/20 p-3">
                <Checkbox
                  id="pt-open-checklist"
                  checked={openChecklistAfterCreate}
                  onCheckedChange={(v) => setOpenChecklistAfterCreate(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="pt-open-checklist" className="cursor-pointer text-sm font-normal leading-snug">
                  After create, go to <strong className="font-medium text-foreground">SaaS platform</strong> and set
                  checklist scope to this new tenant (recommended).
                </Label>
              </div>
              <HStack spacing={2}>
                <Button type="button" disabled={saving} onClick={() => void handleCreate()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
              </HStack>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Tenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenants yet. Create one or run npm run seed:saas-tenant on the backend.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">Slug</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">Billing</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t._id} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium">{t.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{t.slug}</td>
                        <td className="py-2 pr-3">
                          {t.suspendedAt ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : t.isActive ? (
                            <Badge variant="outline">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-xs">{t.billingStatus || 'none'}</td>
                        <td className="py-2">
                          <HStack spacing={2}>
                            <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(t)}>
                              Manage
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => goToPlatformChecklist(t)}
                              title="Set tenant context and open launch checklist"
                            >
                              <ClipboardList className="mr-1 h-3.5 w-3.5" />
                              Checklist
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => void toggleSuspend(t)}>
                              {t.suspendedAt ? 'Unsuspend' : 'Suspend'}
                            </Button>
                          </HStack>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {detail && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{detail.name}</CardTitle>
              <p className="text-xs text-muted-foreground font-mono">{detail._id}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" variant="default" size="sm" onClick={() => goToPlatformChecklist(detail)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Platform checklist for this organization
              </Button>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3 text-sm">
                <p className="font-semibold text-xs">API module access (tenant allowlist)</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  Default is <strong className="text-foreground">full access</strong> (no field). Turn on restrictions to
                  limit CRM, CMS, finance, marketing, team work, and bazaar admin APIs for this org’s tenant-scoped JWTs.
                </p>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="pt-restrict-modules"
                    checked={moduleAllowlist !== null}
                    onCheckedChange={(v) => {
                      if (v === true) {
                        setModuleAllowlist(TENANT_MODULE_OPTIONS.map((o) => o.key))
                      } else {
                        setModuleAllowlist(null)
                      }
                    }}
                    className="mt-0.5"
                  />
                  <Label htmlFor="pt-restrict-modules" className="cursor-pointer text-xs font-normal leading-snug">
                    Restrict modules (explicit allowlist)
                  </Label>
                </div>
                {moduleAllowlist !== null && (
                  <div className="space-y-2 pl-1 border-l-2 border-border ml-1">
                    {TENANT_MODULE_OPTIONS.map((opt) => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`pt-mod-${opt.key}`}
                          checked={moduleAllowlist.includes(opt.key)}
                          onCheckedChange={(v) => {
                            setModuleAllowlist((prev) => {
                              if (prev === null) return prev
                              if (v === true) return prev.includes(opt.key) ? prev : [...prev, opt.key]
                              return prev.filter((k) => k !== opt.key)
                            })
                          }}
                        />
                        <Label htmlFor={`pt-mod-${opt.key}`} className="cursor-pointer text-xs font-normal">
                          {opt.label}{' '}
                          <span className="font-mono text-[10px] text-muted-foreground">({opt.key})</span>
                        </Label>
                      </div>
                    ))}
                    {moduleAllowlist.length === 0 && (
                      <p className="text-xs text-bloom-coral dark:text-bloom-coral">
                        Allowlist is empty — tenant admins cannot call gated module APIs until you grant at least one key.
                      </p>
                    )}
                  </div>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={savingModules}
                  onClick={() => void saveModuleAllowlist()}
                >
                  {savingModules ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save module access'}
                </Button>
              </div>

              {iso && (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                  <p className="font-semibold mb-2">Isolation summary (tenant-scoped rows)</p>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    <li>Users: {iso.users}</li>
                    <li>Domains: {iso.domains}</li>
                    <li>Marketing campaigns: {iso.marketingCampaigns}</li>
                    <li>Calendar entries: {iso.marketingCalendarEntries}</li>
                    <li>Social posts: {iso.marketingSocialPosts}</li>
                    <li>Team projects: {iso.teamWorkProjects}</li>
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label>Attach dashboard user by email</Label>
                <HStack spacing={2} className="flex-wrap">
                  <Input
                    className="max-w-xs"
                    value={attachEmail}
                    onChange={(e) => setAttachEmail(e.target.value)}
                    placeholder="admin@client.com"
                  />
                  <Button type="button" size="sm" onClick={() => void attachUser()}>
                    Attach
                  </Button>
                </HStack>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Custom hostname (storefront routing)
                </Label>
                <HStack spacing={2} className="flex-wrap">
                  <Input
                    className="max-w-md"
                    value={domainHost}
                    onChange={(e) => setDomainHost(e.target.value)}
                    placeholder="www.client.com"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => void addDomain()}>
                    Add domain
                  </Button>
                </HStack>
                <p className="text-xs text-muted-foreground">
                  Mark verified server-side when DNS/TLS checks pass (currently stored unverified by default).
                </p>
                <ul className="space-y-1 text-sm">
                  {domains.map((d) => (
                    <li key={d._id} className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1">
                      <span className="font-mono text-xs">{d.hostname}</span>
                      <span className="text-xs text-muted-foreground">
                        {d.verified ? 'verified' : 'pending'} {d.isPrimary ? '· primary' : ''}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void removeDomain(d._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>

              <Button type="button" variant="outline" onClick={() => setDetail(null)}>
                Close detail
              </Button>
            </CardContent>
          </Card>
        )}
      </VStack>
    </div>
  )
}

export default PlatformTenantsPage
