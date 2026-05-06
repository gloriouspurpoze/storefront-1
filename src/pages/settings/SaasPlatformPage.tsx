import React, { useEffect, useMemo, useState } from 'react'
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
} from '../../components/ui'
import {
  Building2,
  CheckSquare,
  ClipboardList,
  ExternalLink,
  RefreshCw,
  Shield,
  CreditCard,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  SAAS_MODE,
  TENANT_HEADER,
  getBillingPortalUrl,
  getLegalComplianceDocsUrl,
  getLegalPrivacyUrl,
  getLegalTermsUrl,
} from '../../lib/saasEnv'
import {
  SAAS_PLATFORM_CHECKLIST_ITEMS,
  loadSaasChecklistDone,
  saveSaasChecklistDone,
  type SaasPlatformChecklistId,
} from '../../lib/saasPlatformChecklistStorage'
import { Checkbox } from '../../components/ui/checkbox'
import { usePermissions } from '../../hooks/usePermissions'
import { setTenant } from '../../store/slices/tenantSlice'
import { getUserProfile } from '../../store/slices/authSlice'

export function SaasPlatformPage() {
  const { toast } = useToast()
  const dispatch = useAppDispatch()
  const tenantState = useAppSelector((s) => s.tenant)
  const tenantId = tenantState?.tenantId ?? null
  const { checkPermission } = usePermissions()
  const canSwitchTenant = checkPermission('manage_system_settings')

  const [done, setDone] = useState<Record<SaasPlatformChecklistId, boolean>>(() =>
    loadSaasChecklistDone(tenantId),
  )
  const [manualId, setManualId] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualSlug, setManualSlug] = useState('')

  useEffect(() => {
    setDone(loadSaasChecklistDone(tenantId))
  }, [tenantId])

  const billingUrl = useMemo(() => getBillingPortalUrl(), [])
  const privacyUrl = getLegalPrivacyUrl()
  const termsUrl = getLegalTermsUrl()
  const complianceUrl = getLegalComplianceDocsUrl()

  const toggle = (id: SaasPlatformChecklistId, checked: boolean) => {
    const next = { ...done, [id]: checked }
    setDone(next)
    saveSaasChecklistDone(tenantId, next)
  }

  const applyManualTenant = () => {
    const id = manualId.trim()
    if (!id) {
      toast({ title: 'Tenant id required', variant: 'destructive' })
      return
    }
    dispatch(
      setTenant({
        id,
        name: manualName.trim() || undefined,
        slug: manualSlug.trim() || undefined,
      }),
    )
    toast({
      title: 'Tenant context updated',
      description: `API calls will include ${TENANT_HEADER} until you reload from profile.`,
    })
  }

  const reloadFromProfile = async () => {
    try {
      await dispatch(getUserProfile()).unwrap()
      toast({ title: 'Profile refreshed', description: 'Tenant context synced from the server.' })
    } catch (e) {
      toast({
        title: 'Could not refresh',
        description: e instanceof Error ? e.message : 'Try signing in again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-0 flex-1 p-4 sm:p-6">
      <VStack spacing={6}>
        <PageHeader
          title="SaaS & platform readiness"
          subtitle="Operational checklist, tenant header wiring, and links to billing and legal surfaces. Enforcement stays on the backend."
          icon={<ClipboardList className="h-8 w-8 shrink-0" aria-hidden />}
        />

        {!SAAS_MODE && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">REACT_APP_SAAS_MODE</strong> is off. Enable it for organization
                indicators and tenant-scoped UX defaults. This page remains useful for any hosted operator checklist.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Tenant context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground">Header name: </span>
                  {TENANT_HEADER}
                </div>
                <div className="mt-1 break-all">
                  <span className="text-muted-foreground">Active id: </span>
                  {tenantId || '—'}
                </div>
                {(tenantState?.name || tenantState?.slug) && (
                  <div className="mt-1">
                    <span className="text-muted-foreground">Label: </span>
                    {tenantState?.name || tenantState?.slug}
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">
                Values come from login/profile payload when the API returns <code className="rounded bg-muted px-1">tenant</code>{' '}
                fields. See <code className="rounded bg-muted px-1">extractTenantFromAuth.ts</code>.
              </p>

              {canSwitchTenant && (
                <div className="space-y-3 rounded-md border border-border p-3">
                  <p className="font-medium text-foreground">Switch context (super-admin / integrations)</p>
                  <div className="space-y-2">
                    <Label htmlFor="saas-tenant-id">Tenant UUID</Label>
                    <Input
                      id="saas-tenant-id"
                      placeholder="00000000-0000-0000-0000-000000000000"
                      value={manualId}
                      onChange={(e) => setManualId(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="saas-tenant-name">Display name (optional)</Label>
                      <Input
                        id="saas-tenant-name"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saas-tenant-slug">Slug (optional)</Label>
                      <Input
                        id="saas-tenant-slug"
                        value={manualSlug}
                        onChange={(e) => setManualSlug(e.target.value)}
                      />
                    </div>
                  </div>
                  <HStack spacing={2}>
                    <Button type="button" size="sm" onClick={applyManualTenant}>
                      Apply tenant
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void reloadFromProfile()}>
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                      Reload from profile
                    </Button>
                  </HStack>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Billing & legal shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Wire env URLs so operators reach Stripe Customer Portal (or your billing vendor) and published policies.
              </p>
              <VStack spacing={2}>
                {billingUrl ? (
                  <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                    <a href={billingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open billing portal
                    </a>
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="secondary">Optional</Badge>
                    Set <code className="rounded bg-muted px-1">REACT_APP_BILLING_PORTAL_URL</code>
                  </div>
                )}
                {privacyUrl ? (
                  <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                    <a href={privacyUrl} target="_blank" rel="noopener noreferrer">
                      <Shield className="h-4 w-4" />
                      Privacy policy
                    </a>
                  </Button>
                ) : null}
                {termsUrl ? (
                  <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                    <a href={termsUrl} target="_blank" rel="noopener noreferrer">
                      <Shield className="h-4 w-4" />
                      Terms of service
                    </a>
                  </Button>
                ) : null}
                {complianceUrl ? (
                  <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                    <a href={complianceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Compliance / DPA docs
                    </a>
                  </Button>
                ) : null}
                {!privacyUrl && !termsUrl && !complianceUrl && (
                  <p className="text-xs text-muted-foreground">
                    Optional: <code className="rounded bg-muted px-1">REACT_APP_LEGAL_PRIVACY_URL</code>,{' '}
                    <code className="rounded bg-muted px-1">REACT_APP_LEGAL_TERMS_URL</code>,{' '}
                    <code className="rounded bg-muted px-1">REACT_APP_LEGAL_COMPLIANCE_DOCS_URL</code>
                  </p>
                )}
              </VStack>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4" />
              Minimum platform checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stored per tenant in this browser ({tenantId || 'global'}). Use it for launch reviews; replace with audit
              logs when you ship enterprise features.
            </p>
            <ul className="space-y-4">
              {SAAS_PLATFORM_CHECKLIST_ITEMS.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <Checkbox
                    id={`saas-check-${item.id}`}
                    checked={done[item.id]}
                    onCheckedChange={(v) => toggle(item.id, v === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor={`saas-check-${item.id}`} className="cursor-pointer font-medium leading-snug">
                      {item.title}
                    </Label>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </VStack>
    </div>
  )
}

export default SaasPlatformPage
