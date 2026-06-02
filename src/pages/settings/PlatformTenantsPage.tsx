import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  VStack,
  HStack,
  useToast,
  Checkbox,
} from '../../components/ui'
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Loader2,
  Layers,
  Mail,
  Plus,
  RefreshCw,
  Shield,
  Globe,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAppDispatch } from '../../store/hooks'
import { setTenant } from '../../store/slices/tenantSlice'
import {
  platformTenantsService,
  type PlatformTenantRow,
  type IsolationSummary,
} from '../../services/api/platformTenants.service'
import { DEFAULT_VERTICAL_KEY, normalizeVerticalKey, type VerticalKey } from '../../verticals/core/types'
import { getVerticalPack, VERTICAL_PACK_OPTIONS } from '../../verticals/registry'
import {
  formatPlanPriceInr,
  getBillingPlansForVertical,
  getDefaultPlanKey,
  getPlanForVertical,
  getRecommendedPlan,
  planLabelFor,
} from '../../lib/verticalPlans'
import {
  TENANT_FEATURE_MODULES,
  summarizeTenantModules,
  tenantModuleLabel,
} from '../../lib/tenantFeatureModules'
import { usersService } from '../../services/api/users.service'
import type { Permission, UserRole } from '../../types/rbac.types'
import { getRolePermissions } from '../../config/rbac.config'
import { PermissionChipPicker } from '../../components/users/PermissionChipPicker'
import { payTenantPlanWithRazorpay } from '../../lib/payTenantPlan'
import { StorefrontDomainsPanel } from '../../components/storefront/StorefrontDomainsPanel'
import { StorefrontPreviewPanel } from '../../components/storefront/StorefrontPreviewPanel'
import { StorefrontStudioPanel } from '../../components/storefront/StorefrontStudioPanel'
import { resolveStorefrontUrl } from '../../lib/storefrontUrls'

/** Compact module badges for the organizations table. */
function TenantModulesCell({ featureModules }: { featureModules?: string[] | null }) {
  const summary = summarizeTenantModules(featureModules)
  if (summary.mode === 'all') {
    return (
      <Badge variant="outline" className="font-normal text-xs">
        All {TENANT_FEATURE_MODULES.length} modules
      </Badge>
    )
  }
  if (summary.mode === 'none') {
    return (
      <Badge variant="destructive" className="font-normal text-xs">
        No API access
      </Badge>
    )
  }
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1">
      {summary.keys.map((k) => (
        <Badge key={k} variant="secondary" className="font-normal text-[10px]">
          {tenantModuleLabel(k)}
        </Badge>
      ))}
    </div>
  )
}

function verticalLabel(key: string | undefined): string {
  const k = normalizeVerticalKey(key)
  return VERTICAL_PACK_OPTIONS.find((o) => o.key === k)?.label ?? k
}

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
  const [verticalKey, setVerticalKey] = useState<VerticalKey>(DEFAULT_VERTICAL_KEY)
  const [openChecklistAfterCreate, setOpenChecklistAfterCreate] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detailVerticalKey, setDetailVerticalKey] = useState<VerticalKey>(DEFAULT_VERTICAL_KEY)
  const [detailPlanKey, setDetailPlanKey] = useState('')
  const [savingVertical, setSavingVertical] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [applyingPlanModules, setApplyingPlanModules] = useState(false)
  /** True while a Razorpay Checkout for this tenant is in flight. */
  const [chargingRazorpay, setChargingRazorpay] = useState(false)
  /** Tenant id while resolving storefront URL for "View site". */
  const [openingStorefrontId, setOpeningStorefrontId] = useState<string | null>(null)

  const openStorefront = async (t: PlatformTenantRow) => {
    const id = tenantIdString(t)
    const tenantSlug = t.slug?.trim()
    if (!id || !tenantSlug) return
    setOpeningStorefrontId(id)
    try {
      const url = await resolveStorefrontUrl(id, tenantSlug)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      toast({
        title: 'Could not open storefront',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setOpeningStorefrontId(null)
    }
  }

  const createPlanOptions = useMemo(
    () => getBillingPlansForVertical(verticalKey),
    [verticalKey],
  )

  useEffect(() => {
    setPlanKey(getDefaultPlanKey(verticalKey))
  }, [verticalKey])

  const [detail, setDetail] = useState<PlatformTenantRow | null>(null)
  const [iso, setIso] = useState<IsolationSummary | null>(null)
  const [attachEmail, setAttachEmail] = useState('')
  const [domainHost, setDomainHost] = useState('')
  const [domains, setDomains] = useState<Array<{ _id: string; hostname: string; verified?: boolean; isPrimary?: boolean }>>([])
  /** `null` = no restriction (backend omit/unset). Non-null = explicit allowlist (may be empty). */
  const [moduleAllowlist, setModuleAllowlist] = useState<string[] | null>(null)
  const [savingModules, setSavingModules] = useState(false)
  /** Tenant queued for hard-delete confirmation (slug-typed). `null` = dialog closed. */
  const [tenantToDelete, setTenantToDelete] = useState<PlatformTenantRow | null>(null)
  const [deleteSlugInput, setDeleteSlugInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  /** Invite admin dialog state — scoped to the currently-open `detail` tenant. */
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('staff')
  const [inviteCustomizeAccess, setInviteCustomizeAccess] = useState(false)
  const [invitePermissions, setInvitePermissions] = useState<Set<Permission>>(
    () => new Set(getRolePermissions('staff')),
  )
  const [inviting, setInviting] = useState(false)

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
      const vk = normalizeVerticalKey(t.verticalKey)
      const fm = t.featureModules === undefined || t.featureModules === null ? null : [...t.featureModules]
      dispatch(
        setTenant({
          id,
          name: t.name,
          slug: t.slug,
          verticalKey: vk,
          featureModules: fm,
          planKey: t.planKey,
          billingStatus: t.billingStatus,
        }),
      )
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
    setDetailVerticalKey(normalizeVerticalKey(t.verticalKey))
    setDetailPlanKey(t.planKey?.trim() || getDefaultPlanKey(normalizeVerticalKey(t.verticalKey)))
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
      const vk = verticalKey
      const pk = planKey.trim() || getDefaultPlanKey(vk)
      const plan = getPlanForVertical(vk, pk) ?? getRecommendedPlan(vk)
      const res = await platformTenantsService.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        ownerEmail: ownerEmail.trim() || undefined,
        planKey: pk,
        verticalKey: vk,
      })
      const bundle = res.data as
        | { tenant?: PlatformTenantRow & { id?: string }; ownerAttached?: boolean; message?: string }
        | undefined
      const created = bundle?.tenant
      const tid = created ? tenantIdString(created) : ''
      if (tid && created) {
        dispatch(
          setTenant({
            id: tid,
            name: created.name,
            slug: created.slug,
            verticalKey: normalizeVerticalKey(created.verticalKey ?? vk),
            featureModules: created.featureModules ?? plan.includedModules,
            planKey: created.planKey ?? pk,
            billingStatus: created.billingStatus,
          }),
        )
        try {
          await platformTenantsService.update(tid, {
            verticalKey: vk,
            planKey: pk,
            featureModules: created.featureModules ?? plan.includedModules,
          })
        } catch {
          /* backend may not support verticalKey yet — sidebar still uses Redux */
        }
      }
      setCreateOpen(false)
      setName('')
      setSlug('')
      setOwnerEmail('')
      setPlanKey('')
      setVerticalKey(DEFAULT_VERTICAL_KEY)
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

  const openInvite = () => {
    setInviteEmail('')
    setInviteFirstName('')
    setInviteLastName('')
    setInviteRole('staff')
    setInviteCustomizeAccess(false)
    setInvitePermissions(new Set(getRolePermissions('staff')))
    setInviteOpen(true)
  }

  const applyInviteRoleTemplate = (role: UserRole) => {
    setInvitePermissions(new Set(getRolePermissions(role)))
  }

  /**
   * Create a brand-new dashboard admin attached to `detail` and email them a
   * temp-password invite. Uses `POST /auth/register/admin` with `tenant_id` so a
   * platform super-admin (no JWT tenant) can target a specific organization.
   *
   * Server enforces tenant plan limits (`requireTenantPlanLimits('users')`); we
   * surface that error verbatim if hit.
   */
  const submitInvite = async () => {
    if (!detail) return
    const email = inviteEmail.trim().toLowerCase()
    const firstName = inviteFirstName.trim()
    const lastName = inviteLastName.trim()
    if (!email || !firstName) {
      toast({ title: 'Email and first name are required', variant: 'destructive' })
      return
    }
    if (inviteCustomizeAccess && invitePermissions.size === 0) {
      toast({
        title: 'Pick at least one permission',
        description: 'Custom access needs at least one permission chip, or turn off customization.',
        variant: 'destructive',
      })
      return
    }
    setInviting(true)
    try {
      const fullAdminNoCustomize = inviteRole === 'admin' && !inviteCustomizeAccess
      const rbacScoping = fullAdminNoCustomize
        ? {}
        : {
            rbacPermissionMode: 'explicit' as const,
            permissions: inviteCustomizeAccess
              ? Array.from(invitePermissions)
              : getRolePermissions(inviteRole),
          }

      const res = await usersService.createUser({
        email,
        firstName,
        lastName: lastName || 'Admin',
        userType: 'admin',
        rbacRole: inviteRole,
        inviteTeamMember: true,
        tenantId: detail._id,
        username: email,
        ...rbacScoping,
      })
      toast({
        title: res.inviteEmailSent ? 'Invite sent' : 'User created',
        description:
          res.inviteEmailSent
            ? `${email} received an onboarding email with a temporary password.`
            : res.serverMessage ||
              `Account created. Share login credentials manually if the invite email did not deliver.`,
      })
      setInviteOpen(false)
      if (detail) await openDetail(detail)
      await load()
    } catch (e) {
      toast({
        title: 'Invite failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setInviting(false)
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

  const saveVerticalKey = async () => {
    if (!detail) return
    setSavingVertical(true)
    try {
      await platformTenantsService.update(detail._id, { verticalKey: detailVerticalKey })
      const fresh = await platformTenantsService.get(detail._id)
      const row = fresh.data as PlatformTenantRow | undefined
      if (row) {
        setDetail(row)
        setDetailVerticalKey(normalizeVerticalKey(row.verticalKey))
        applyTenantContext(row)
      }
      toast({ title: 'Industry vertical updated' })
      await load()
    } catch (e) {
      toast({
        title: 'Update failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setSavingVertical(false)
    }
  }

  const savePlanKey = async () => {
    if (!detail) return
    setSavingPlan(true)
    try {
      await platformTenantsService.update(detail._id, { planKey: detailPlanKey.trim() })
      const fresh = await platformTenantsService.get(detail._id)
      const row = fresh.data as PlatformTenantRow | undefined
      if (row) {
        setDetail(row)
        setDetailPlanKey(row.planKey?.trim() || getDefaultPlanKey(detailVerticalKey))
        applyTenantContext(row)
      }
      toast({ title: 'Plan updated' })
      await load()
    } catch (e) {
      toast({
        title: 'Plan update failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setSavingPlan(false)
    }
  }

  const applyPlanModules = async () => {
    if (!detail) return
    const plan = getPlanForVertical(detailVerticalKey, detailPlanKey)
    if (!plan) {
      toast({ title: 'Unknown plan for this vertical', variant: 'destructive' })
      return
    }
    setApplyingPlanModules(true)
    try {
      await platformTenantsService.update(detail._id, { featureModules: [...plan.includedModules] })
      const fresh = await platformTenantsService.get(detail._id)
      const row = fresh.data as PlatformTenantRow | undefined
      if (row) {
        setDetail(row)
        const m = row.featureModules
        setModuleAllowlist(m === undefined || m === null ? null : [...m])
        applyTenantContext(row)
      }
      toast({
        title: 'Modules aligned to plan',
        description: `${plan.label}: ${plan.includedModules.join(', ')}`,
      })
      await load()
    } catch (e) {
      toast({
        title: 'Could not apply plan modules',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setApplyingPlanModules(false)
    }
  }

  /**
   * Charge the selected plan via Razorpay Checkout. Used by platform operators
   * to collect payment on behalf of a tenant (tenant admins use the same flow
   * from the regular Billing page — see `BillingUpgradePage`). On success the
   * backend flips `billingProvider=razorpay`, `billingStatus=active`, stamps
   * the plan, and we refresh local state.
   */
  const chargeWithRazorpay = async () => {
    if (!detail) return
    const plan = getPlanForVertical(detailVerticalKey, detailPlanKey)
    if (!plan) {
      toast({ title: 'Pick a valid plan first', variant: 'destructive' })
      return
    }
    setChargingRazorpay(true)
    try {
      const verify = await payTenantPlanWithRazorpay({
        planKey: detailPlanKey.trim(),
        verticalKey: detailVerticalKey,
        tenantId: detail._id,
        displayName: detail.name,
        description: `${plan.label} — monthly SaaS plan`,
        themeColor: '#0f172a',
      })
      const fresh = await platformTenantsService.get(detail._id)
      const row = fresh.data as PlatformTenantRow | undefined
      if (row) {
        setDetail(row)
        setDetailPlanKey(row.planKey?.trim() || getDefaultPlanKey(detailVerticalKey))
        applyTenantContext(row)
      }
      toast({
        title: 'Plan activated',
        description: `Paid via Razorpay. Active until ${new Date(verify.currentPeriodEnd).toLocaleDateString()}.`,
      })
      await load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment failed'
      toast({
        title: msg === 'Payment cancelled' ? 'Checkout closed' : 'Razorpay payment failed',
        description: msg,
        variant: msg === 'Payment cancelled' ? 'default' : 'destructive',
      })
    } finally {
      setChargingRazorpay(false)
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

  /** Open slug-typed confirm dialog. Caller must double-check this is the right org. */
  const requestDelete = (t: PlatformTenantRow) => {
    setTenantToDelete(t)
    setDeleteSlugInput('')
  }

  const cancelDelete = () => {
    if (deleting) return
    setTenantToDelete(null)
    setDeleteSlugInput('')
  }

  /** Confirm + execute hard delete. Backend cascades all tenant-scoped collections. */
  const confirmDelete = async () => {
    if (!tenantToDelete) return
    const expected = tenantToDelete.slug.trim().toLowerCase()
    const typed = deleteSlugInput.trim().toLowerCase()
    if (typed !== expected) {
      toast({
        title: 'Slug does not match',
        description: `Type "${expected}" exactly to confirm.`,
        variant: 'destructive',
      })
      return
    }
    setDeleting(true)
    try {
      const res = await platformTenantsService.remove(tenantToDelete._id, expected)
      const data = res.data as
        | { deletedCounts?: Record<string, number>; detachedUsers?: number; message?: string }
        | undefined
      const cascaded = data?.deletedCounts ?? {}
      const totalRows = Object.values(cascaded).reduce((sum, n) => sum + Number(n || 0), 0)
      toast({
        title: 'Tenant deleted',
        description:
          data?.message ??
          `Removed ${totalRows} tenant-scoped row(s); detached ${data?.detachedUsers ?? 0} user(s).`,
      })
      // Close detail panel if we just deleted the one being viewed.
      if (detail?._id === tenantToDelete._id) {
        setDetail(null)
        setIso(null)
        setDomains([])
      }
      setTenantToDelete(null)
      setDeleteSlugInput('')
      await load()
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-0 flex-1 p-4 sm:p-6">
      <VStack spacing={6}>
        <PageHeader
          title="Organizations"
          subtitle="Each row is a customer workspace: industry, plan, which app modules they can use, domains, and admins."
          icon={<Building2 className="h-8 w-8 shrink-0" aria-hidden />}
          action={
            <HStack spacing={2}>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add organization
              </Button>
            </HStack>
          }
        />

        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">{total}</strong> organization{total === 1 ? '' : 's'} on the
                platform.
              </p>
              <p>
                Use <strong className="text-foreground">Manage</strong> to set plans and API modules. Use{' '}
                <strong className="text-foreground">Launch checklist</strong> to track go-live steps for that customer.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
              <Link to="/settings/saas">
                <ClipboardList className="h-4 w-4" />
                Launch readiness
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              API modules (what you can turn on per organization)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              By default every organization gets <strong className="text-foreground">all modules</strong>. You can
              restrict access in Manage → App modules. These are the only keys the backend accepts.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TENANT_FEATURE_MODULES.map((m) => (
                <li
                  key={m.key}
                  className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <p className="font-medium">{m.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{m.key}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {createOpen && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add organization</CardTitle>
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
                <Label htmlFor="pt-plan">SaaS plan</Label>
                <select
                  id="pt-plan"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={planKey}
                  onChange={(e) => setPlanKey(e.target.value)}
                >
                  {createPlanOptions.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                      {p.recommended ? ' (recommended)' : ''}
                      {formatPlanPriceInr(p) ? ` — ${formatPlanPriceInr(p)}/mo` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {getPlanForVertical(verticalKey, planKey)?.description ??
                    getRecommendedPlan(verticalKey).description}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-vertical">Industry vertical</Label>
                <select
                  id="pt-vertical"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={verticalKey}
                  onChange={(e) => setVerticalKey(normalizeVerticalKey(e.target.value))}
                >
                  {VERTICAL_PACK_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{getVerticalPack(verticalKey).description}</p>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-border/80 bg-muted/20 p-3">
                <Checkbox
                  id="pt-open-checklist"
                  checked={openChecklistAfterCreate}
                  onCheckedChange={(v) => setOpenChecklistAfterCreate(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="pt-open-checklist" className="cursor-pointer text-sm font-normal leading-snug">
                  After create, open <strong className="font-medium text-foreground">Launch readiness</strong> for this
                  new organization (recommended).
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
                      <th className="pb-2 pr-3">Vertical</th>
                      <th className="pb-2 pr-3">Plan</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">Billing</th>
                      <th className="pb-2 pr-3">App modules</th>
                      <th className="pb-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t) => (
                      <tr key={t._id} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium">{t.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{t.slug}</td>
                        <td className="py-2 pr-3 text-xs">{verticalLabel(t.verticalKey)}</td>
                        <td className="py-2 pr-3 text-xs">
                          {planLabelFor(normalizeVerticalKey(t.verticalKey), t.planKey)}
                        </td>
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
                        <td className="py-2 pr-3 align-top">
                          <TenantModulesCell featureModules={t.featureModules} />
                        </td>
                        <td className="py-2">
                          <HStack spacing={2} className="flex-wrap">
                            <Button type="button" variant="outline" size="sm" onClick={() => void openDetail(t)}>
                              Manage
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Open the public storefront (verified custom domain if set)"
                              disabled={openingStorefrontId === tenantIdString(t)}
                              onClick={() => void openStorefront(t)}
                            >
                              {openingStorefrontId === tenantIdString(t) ? (
                                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              )}
                              View site
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => goToPlatformChecklist(t)}
                              title="Open launch readiness checklist for this organization"
                            >
                              <ClipboardList className="mr-1 h-3.5 w-3.5" />
                              Launch
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => void toggleSuspend(t)}>
                              {t.suspendedAt ? 'Unsuspend' : 'Suspend'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => requestDelete(t)}
                              title="Permanently delete tenant and cascade-wipe all its data"
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
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
                Open launch readiness checklist
              </Button>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3 text-sm max-w-lg">
                <p className="font-semibold text-xs">Industry vertical</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  Controls which sidebar groups and workflows this organization sees. Changing vertical affects
                  navigation only until domain entities are migrated.
                </p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={detailVerticalKey}
                  onChange={(e) => setDetailVerticalKey(normalizeVerticalKey(e.target.value))}
                >
                  {VERTICAL_PACK_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Button type="button" size="sm" disabled={savingVertical} onClick={() => void saveVerticalKey()}>
                  {savingVertical ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save vertical'}
                </Button>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3 text-sm max-w-lg">
                <p className="font-semibold text-xs">SaaS plan &amp; billing</p>
                <p className="text-xs text-muted-foreground leading-snug">
                  Plans are defined per vertical. Assign a plan key for reporting; use{' '}
                  <strong className="text-foreground">Apply plan modules</strong> to sync API entitlements with the
                  plan manifest.
                </p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={detailPlanKey}
                  onChange={(e) => setDetailPlanKey(e.target.value)}
                >
                  {getBillingPlansForVertical(detailVerticalKey).map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                      {formatPlanPriceInr(p) ? ` — ${formatPlanPriceInr(p)}/mo` : ''}
                    </option>
                  ))}
                </select>
                {getPlanForVertical(detailVerticalKey, detailPlanKey) && (
                  <p className="text-xs text-muted-foreground">
                    {getPlanForVertical(detailVerticalKey, detailPlanKey)?.description}
                    {getPlanForVertical(detailVerticalKey, detailPlanKey)?.limits?.maxUsers != null && (
                      <>
                        {' '}
                        · up to {getPlanForVertical(detailVerticalKey, detailPlanKey)?.limits?.maxUsers} users
                      </>
                    )}
                  </p>
                )}
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    Status:{' '}
                    <Badge
                      variant={detail.billingStatus === 'active' ? 'default' : 'outline'}
                      className="font-mono"
                    >
                      {detail.billingStatus || 'none'}
                    </Badge>
                    {detail.billingProvider && detail.billingProvider !== 'none' ? (
                      <>
                        {' '}
                        · provider <span className="font-mono">{detail.billingProvider}</span>
                      </>
                    ) : null}
                  </p>
                  {detail.razorpayCurrentPeriodEnd && (
                    <p>
                      Current period ends{' '}
                      <span className="font-medium text-foreground">
                        {new Date(detail.razorpayCurrentPeriodEnd).toLocaleDateString()}
                      </span>
                      {detail.razorpayLastPaymentId ? (
                        <>
                          {' '}
                          · last payment{' '}
                          <span className="font-mono">{detail.razorpayLastPaymentId.slice(0, 14)}…</span>
                        </>
                      ) : null}
                    </p>
                  )}
                  {detail.stripeCustomerId ? (
                    <p>
                      Stripe customer{' '}
                      <span className="font-mono">{detail.stripeCustomerId.slice(0, 12)}…</span>
                    </p>
                  ) : null}
                </div>
                <HStack spacing={2} className="flex-wrap">
                  <Button type="button" size="sm" disabled={savingPlan} onClick={() => void savePlanKey()}>
                    {savingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save plan'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={applyingPlanModules}
                    onClick={() => void applyPlanModules()}
                  >
                    {applyingPlanModules ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply plan modules'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    className="bg-storm-deep text-white hover:bg-storm-deep/90"
                    disabled={
                      chargingRazorpay ||
                      !detailPlanKey.trim() ||
                      !getPlanForVertical(detailVerticalKey, detailPlanKey)
                    }
                    onClick={() => void chargeWithRazorpay()}
                  >
                    {chargingRazorpay ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="mr-1.5 h-4 w-4" />
                        Charge with Razorpay
                      </>
                    )}
                  </Button>
                </HStack>
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Razorpay collects one month of access (INR) and the server activates the plan automatically.
                  The price comes from the selected plan above — admins cannot upgrade for free by tampering
                  with the client.
                </p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-4 space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-sm">App modules (API access)</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug">
                    Controls which premium areas this organization’s admins can use. When unrestricted, all{' '}
                    {TENANT_FEATURE_MODULES.length} modules below are allowed.
                  </p>
                </div>

                <div className="flex items-start gap-2 rounded-md border border-border bg-background p-3">
                  <Checkbox
                    id="pt-restrict-modules"
                    checked={moduleAllowlist !== null}
                    onCheckedChange={(v) => {
                      if (v === true) {
                        setModuleAllowlist(TENANT_FEATURE_MODULES.map((o) => o.key))
                      } else {
                        setModuleAllowlist(null)
                      }
                    }}
                    className="mt-0.5"
                  />
                  <Label htmlFor="pt-restrict-modules" className="cursor-pointer text-sm font-normal leading-snug">
                    <span className="font-medium text-foreground">Limit which modules this org can use</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Off = full access. On = only checked modules work for their team.
                    </span>
                  </Label>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {TENANT_FEATURE_MODULES.map((opt) => {
                    const enabled =
                      moduleAllowlist === null || moduleAllowlist.includes(opt.key)
                    return (
                      <div
                        key={opt.key}
                        className={`flex items-start gap-2 rounded-md border p-3 ${
                          enabled ? 'border-storm-deep/25 bg-background' : 'border-border bg-muted/50'
                        }`}
                      >
                        {moduleAllowlist === null ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-storm-deep" aria-hidden />
                        ) : (
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
                            className="mt-0.5"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <Label
                            htmlFor={moduleAllowlist === null ? undefined : `pt-mod-${opt.key}`}
                            className={`text-sm font-medium leading-snug ${moduleAllowlist !== null ? 'cursor-pointer' : ''}`}
                          >
                            {opt.label}
                          </Label>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{opt.description}</p>
                          <p className="mt-1 font-mono text-[10px] text-muted-foreground">API: {opt.key}</p>
                        </div>
                        {!enabled && moduleAllowlist !== null && (
                          <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Off" />
                        )}
                      </div>
                    )
                  })}
                </div>

                {moduleAllowlist !== null && moduleAllowlist.length === 0 && (
                  <p className="text-xs text-destructive">
                    No modules selected — this organization cannot use CRM, CMS, finance, marketing, team work,
                    bazaar, or e-commerce APIs until you enable at least one.
                  </p>
                )}

                {moduleAllowlist !== null && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setModuleAllowlist(TENANT_FEATURE_MODULES.map((m) => m.key))}
                  >
                    Select all modules
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  disabled={savingModules}
                  onClick={() => void saveModuleAllowlist()}
                >
                  {savingModules ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save app modules'}
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

              {/* Super-admin preview: opens the live storefront in an iframe + new tab. */}
              <StorefrontPreviewPanel tenantId={detail._id} tenantSlug={detail.slug} />

              {/* Storefront Studio — branding, SEO, feature flags (super-admin controls locks). */}
              <StorefrontStudioPanel
                tenantId={detail._id}
                tenantSlug={detail.slug}
                isSuperAdmin
              />

              {/* Phase 4 — Storefront subdomain + custom domain wizard. Wraps
                  the Vercel Domains API on the backend; degrades to a manual
                  CNAME view when Vercel creds are not set. */}
              <StorefrontDomainsPanel tenantId={detail._id} />

              <div className="rounded-md border border-border bg-muted/30 p-4 space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-sm">Admins for this organization</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug">
                    Invite a new admin by email (they get a temporary password + login link), or attach
                    an existing platform user to this organization.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-md border border-border bg-background p-3 space-y-2">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Invite new admin
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      Sends an onboarding email with temp password. Counts toward the plan's user limit.
                    </p>
                    <Button type="button" size="sm" onClick={openInvite} className="gap-1.5">
                      <UserPlus className="h-3.5 w-3.5" />
                      Invite admin…
                    </Button>
                  </div>

                  <div className="rounded-md border border-border bg-background p-3 space-y-2">
                    <p className="text-sm font-medium">Attach existing user</p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      Use when the user already has a platform account. They must sign out and back in
                      to pick up this organization on their JWT.
                    </p>
                    <HStack spacing={2} className="flex-wrap">
                      <Input
                        className="max-w-xs"
                        value={attachEmail}
                        onChange={(e) => setAttachEmail(e.target.value)}
                        placeholder="admin@client.com"
                      />
                      <Button type="button" size="sm" variant="outline" onClick={() => void attachUser()}>
                        Attach
                      </Button>
                    </HStack>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Need to set per-feature permissions for an existing member? Open the{' '}
                  <Link to="/users" className="font-medium text-primary underline-offset-4 hover:underline">
                    Users page
                  </Link>{' '}
                  while this organization is the active context — that's what the <strong className="text-foreground">Launch</strong> button on the table sets.
                </p>
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

              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-2">
                <p className="font-semibold text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Danger zone
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  Permanently deletes this organization and cascade-wipes every tenant-scoped row
                  (CRM, AMC, marketing, team work, boards, finance, domains, …). Dashboard users are
                  detached, not deleted. This cannot be undone.
                </p>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => requestDelete(detail)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete tenant…
                </Button>
              </div>

              <Button type="button" variant="outline" onClick={() => setDetail(null)}>
                Close detail
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog
          open={inviteOpen}
          onOpenChange={(open) => {
            if (!open && !inviting) setInviteOpen(false)
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Invite admin to {detail?.name ?? 'organization'}
              </DialogTitle>
              <DialogDescription>
                They will receive an email with a temporary password and a link to set their own. They
                sign in with this email as their username; after they sign in, their JWT will scope
                them to this organization automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pt-invite-email">Work email</Label>
                <Input
                  id="pt-invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@client.com"
                  autoFocus
                  disabled={inviting}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pt-invite-first">First name</Label>
                  <Input
                    id="pt-invite-first"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    placeholder="Alex"
                    disabled={inviting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pt-invite-last">Last name</Label>
                  <Input
                    id="pt-invite-last"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                    placeholder="Doe"
                    disabled={inviting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-invite-role">Role</Label>
                <select
                  id="pt-invite-role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => {
                    const role = e.target.value as UserRole
                    setInviteRole(role)
                    if (!inviteCustomizeAccess) {
                      applyInviteRoleTemplate(role)
                    }
                  }}
                  disabled={inviting}
                >
                  <option value="staff">Staff — view + day-to-day ops only (recommended)</option>
                  <option value="manager">Manager — most features, no destructive actions</option>
                  <option value="admin">Admin — FULL dashboard access (every feature)</option>
                </select>
                <p className="text-xs text-muted-foreground leading-snug">
                  {inviteRole === 'admin' ? (
                    <span className="text-destructive">
                      Admin grants every dashboard permission inside this org. Pick Manager or Staff to
                      scope what they can do, then fine-tune chips later from{' '}
                      <Link
                        to="/settings/access/assign"
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        Settings → Access → Assign access
                      </Link>
                      .
                    </span>
                  ) : (
                    <>
                      Starts from the {inviteRole} template. Narrow further later on{' '}
                      <Link
                        to="/settings/access/assign"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Settings → Access → Assign access
                      </Link>{' '}
                      — the saved chip list will be the user&apos;s exact allowlist.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
                <Checkbox
                  id="pt-invite-customize"
                  checked={inviteCustomizeAccess}
                  onCheckedChange={(checked) => {
                    const on = checked === true
                    setInviteCustomizeAccess(on)
                    if (on && invitePermissions.size === 0) {
                      applyInviteRoleTemplate(inviteRole)
                    }
                    if (!on) {
                      applyInviteRoleTemplate(inviteRole)
                    }
                  }}
                  disabled={inviting}
                />
                <div className="space-y-1">
                  <Label htmlFor="pt-invite-customize" className="cursor-pointer font-medium">
                    Customize permissions now
                  </Label>
                  <p className="text-xs text-muted-foreground leading-snug">
                    When checked, the chips below are saved as an explicit allowlist on the server
                    (enforced on API + sidebar). Unchecked uses the {inviteRole} template — except
                    Admin, which stays full access.
                  </p>
                </div>
              </div>
              {inviteCustomizeAccess || inviteRole !== 'admin' ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Permission allowlist</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={inviting}
                      onClick={() => applyInviteRoleTemplate(inviteRole)}
                    >
                      Reset to {inviteRole} template
                    </Button>
                  </div>
                  <PermissionChipPicker
                    selected={invitePermissions}
                    onChange={setInvitePermissions}
                    disabled={inviting || (!inviteCustomizeAccess && inviteRole !== 'admin')}
                  />
                </div>
              ) : null}
              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <p>
                  Counts against this org's plan{' '}
                  <span className="font-mono">{detail?.planKey || 'none'}</span> user limit. The server
                  rejects the invite with a clear error if the limit is hit.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteOpen(false)}
                disabled={inviting}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitInvite()} disabled={inviting}>
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="mr-1 h-4 w-4" />
                    Send invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={tenantToDelete !== null}
          onOpenChange={(open) => {
            if (!open) cancelDelete()
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete tenant permanently?
              </DialogTitle>
              <DialogDescription>
                This will hard-delete <strong>{tenantToDelete?.name}</strong> and remove every
                tenant-scoped row across CRM, AMC, marketing, team work, boards, finance, and
                domains. Dashboard users are detached (their accounts remain). This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-1">
                <p>
                  Slug: <span className="font-mono">{tenantToDelete?.slug}</span>
                </p>
                <p className="text-muted-foreground">
                  Id: <span className="font-mono">{tenantToDelete?._id}</span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pt-delete-confirm">
                  Type <span className="font-mono font-semibold">{tenantToDelete?.slug}</span> to
                  confirm
                </Label>
                <Input
                  id="pt-delete-confirm"
                  value={deleteSlugInput}
                  onChange={(e) => setDeleteSlugInput(e.target.value)}
                  placeholder={tenantToDelete?.slug}
                  autoFocus
                  disabled={deleting}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={cancelDelete} disabled={deleting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void confirmDelete()}
                disabled={
                  deleting ||
                  deleteSlugInput.trim().toLowerCase() !==
                    (tenantToDelete?.slug.trim().toLowerCase() ?? '')
                }
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete tenant
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </VStack>
    </div>
  )
}

export default PlatformTenantsPage
