import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  storefrontDomainsService,
  type StorefrontDomain,
  type StorefrontDomainsResponse,
} from '../../services/api/storefrontDomains.service'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HStack,
  Input,
  Label,
  useToast,
  VStack,
} from '../ui'
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react'

/**
 * Site → Domain wizard. Lives inside the Organizations detail panel.
 *
 * Polling runs on a self-scheduling timeout (not an effect that depends on
 * `data`) so we never re-trigger fetches in a loop when state updates.
 */
export function StorefrontDomainsPanel({ tenantId }: { tenantId: string }) {
  const { toast } = useToast()
  const [data, setData] = useState<StorefrontDomainsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [hostnameInput, setHostnameInput] = useState('')
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const fetchDomains = useCallback(async (): Promise<StorefrontDomainsResponse | null> => {
    const res = await storefrontDomainsService.list(tenantId)
    return res.data ?? null
  }, [tenantId])

  const schedulePoll = useCallback(
    (payload: StorefrontDomainsResponse | null) => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current)
        pollTimerRef.current = null
      }
      const pending = (payload?.domains ?? []).some((d) => !d.verified)
      if (!pending || !mountedRef.current) return
      pollTimerRef.current = setTimeout(() => {
        void (async () => {
          try {
            const next = await fetchDomains()
            if (!mountedRef.current) return
            if (next) setData(next)
            schedulePoll(next)
          } catch {
            /* silent background poll */
          }
        })()
      }, 10_000)
    },
    [fetchDomains],
  )

  useEffect(() => {
    mountedRef.current = true
    let cancelled = false

    void (async () => {
      setLoading(true)
      try {
        const next = await fetchDomains()
        if (cancelled) return
        if (next) setData(next)
        schedulePoll(next)
      } catch (e) {
        if (!cancelled) {
          toast({
            title: 'Could not load domains',
            description: e instanceof Error ? e.message : 'Error',
            variant: 'destructive',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      mountedRef.current = false
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [tenantId, fetchDomains, schedulePoll, toast])

  const reload = async () => {
    const next = await fetchDomains()
    if (next) {
      setData(next)
      schedulePoll(next)
    }
    return next
  }

  const onAdd = async () => {
    const host = hostnameInput.trim().toLowerCase()
    if (!host) {
      toast({ title: 'Enter a domain first', variant: 'destructive' })
      return
    }
    setAdding(true)
    try {
      await storefrontDomainsService.add(tenantId, host)
      setHostnameInput('')
      await reload()
    } catch (e) {
      toast({
        title: 'Could not add domain',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }

  const onRefresh = async (domainId: string) => {
    setRefreshingId(domainId)
    try {
      const res = await storefrontDomainsService.refresh(tenantId, domainId)
      if (res.data) {
        setData((prev) => {
          if (!prev) return prev
          const domains = prev.domains.map((d) => (d.id === domainId ? res.data! : d))
          const next = { ...prev, domains }
          schedulePoll(next)
          return next
        })
      } else {
        await reload()
      }
    } catch (e) {
      toast({
        title: 'Verification check failed',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setRefreshingId(null)
    }
  }

  const onSetPrimary = async (domainId: string) => {
    try {
      await storefrontDomainsService.setPrimary(tenantId, domainId)
      await reload()
    } catch (e) {
      toast({
        title: 'Could not set primary',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    }
  }

  const onRemove = async (domain: StorefrontDomain) => {
    if (
      !window.confirm(
        `Remove ${domain.hostname}? This stops serving the site on this domain.`,
      )
    ) {
      return
    }
    setRemovingId(domain.id)
    try {
      await storefrontDomainsService.remove(tenantId, domain.id)
      await reload()
    } catch (e) {
      toast({
        title: 'Could not remove domain',
        description: e instanceof Error ? e.message : 'Error',
        variant: 'destructive',
      })
    } finally {
      setRemovingId(null)
    }
  }

  const copyToClipboard = (value: string, label: string) => {
    void navigator.clipboard.writeText(value).then(
      () => toast({ title: `${label} copied` }),
      () => toast({ title: 'Copy failed', variant: 'destructive' }),
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading domain status…
      </div>
    )
  }

  const cnameTarget = data?.cnameTarget ?? 'cname.vercel-dns.com'

  return (
    <VStack spacing={4} align="stretch">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" /> Site & domain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subdomain (included)
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-sm">{data?.subdomain ?? '—'}</span>
              {data?.subdomain && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(data.subdomain, 'Subdomain')}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-snug">
              Auto-provisioned and live the moment the org is created. No setup required.
            </p>
          </div>

          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Custom domain
              </p>
              {!data?.vercelConfigured && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  Manual verification
                </Badge>
              )}
            </div>

            {!data?.vercelConfigured && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-900">
                Vercel API not configured. Domains can be added, but verification must be
                done out-of-band. Set <code className="font-mono">VERCEL_API_TOKEN</code> +{' '}
                <code className="font-mono">VERCEL_PROJECT_ID</code> on the backend to
                enable automatic verification.
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[220px]">
                <Label htmlFor="storefront-domain-input" className="text-xs">
                  Add a domain you own
                </Label>
                <Input
                  id="storefront-domain-input"
                  placeholder="mybakery.com"
                  value={hostnameInput}
                  onChange={(e) => setHostnameInput(e.target.value)}
                  className="font-mono"
                  disabled={adding}
                />
              </div>
              <Button type="button" disabled={adding || !hostnameInput.trim()} onClick={() => void onAdd()}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add domain'}
              </Button>
            </div>

            <p className="mt-3 text-xs leading-snug text-muted-foreground">
              Point DNS at{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{cnameTarget}</code>{' '}
              (CNAME). SSL is issued automatically once DNS propagates.
            </p>
          </div>

          {(data?.domains ?? []).length > 0 && (
            <VStack spacing={3} align="stretch">
              {data?.domains.map((d) => (
                <DomainRow
                  key={d.id}
                  domain={d}
                  cnameTarget={cnameTarget}
                  isRefreshing={refreshingId === d.id}
                  isRemoving={removingId === d.id}
                  onRefresh={() => void onRefresh(d.id)}
                  onSetPrimary={() => void onSetPrimary(d.id)}
                  onRemove={() => void onRemove(d)}
                  onCopy={copyToClipboard}
                />
              ))}
            </VStack>
          )}
        </CardContent>
      </Card>
    </VStack>
  )
}

function DomainRow({
  domain,
  cnameTarget,
  isRefreshing,
  isRemoving,
  onRefresh,
  onSetPrimary,
  onRemove,
  onCopy,
}: {
  domain: StorefrontDomain
  cnameTarget: string
  isRefreshing: boolean
  isRemoving: boolean
  onRefresh: () => void
  onSetPrimary: () => void
  onRemove: () => void
  onCopy: (value: string, label: string) => void
}) {
  const live = domain.liveStatus
  const verified = domain.verified || live?.verified === true
  const misconfigured = live?.misconfigured === true
  const pending = !verified

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-medium">{domain.hostname}</span>
            {domain.isPrimary && (
              <Badge variant="default" className="text-[10px] font-normal">
                Primary
              </Badge>
            )}
            {verified ? (
              <Badge variant="secondary" className="gap-1 text-[10px] font-normal text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> Live
              </Badge>
            ) : misconfigured ? (
              <Badge variant="destructive" className="gap-1 text-[10px] font-normal">
                <AlertTriangle className="h-3 w-3" /> DNS misconfigured
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[10px] font-normal">
                <Loader2 className="h-3 w-3 animate-spin" /> Awaiting DNS
              </Badge>
            )}
          </div>
        </div>
        <HStack spacing={1}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            onClick={onRefresh}
            title="Re-check status"
          >
            {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          {verified && !domain.isPrimary && (
            <Button type="button" variant="ghost" size="sm" onClick={onSetPrimary} title="Make primary">
              <Star className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isRemoving}
            onClick={onRemove}
            title="Remove domain"
            className="text-destructive hover:text-destructive"
          >
            {isRemoving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </HStack>
      </div>

      {pending && (
        <div className="mt-3 space-y-2 rounded-md bg-muted/30 p-3 text-xs">
          <p className="font-medium text-foreground">Add this DNS record at your registrar:</p>
          <div className="overflow-x-auto rounded border border-border bg-background">
            <table className="w-full font-mono text-[11px]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-2 py-1 text-left font-semibold">Type</th>
                  <th className="px-2 py-1 text-left font-semibold">Name</th>
                  <th className="px-2 py-1 text-left font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-2 py-1.5">CNAME</td>
                  <td className="px-2 py-1.5">@</td>
                  <td className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <span>{cnameTarget}</span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => onCopy(cnameTarget, 'CNAME')}
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
                {live?.verification?.map((v, i) => (
                  <tr key={`${v.type}-${i}`} className="border-t border-border">
                    <td className="px-2 py-1.5">{v.type}</td>
                    <td className="px-2 py-1.5">{v.domain}</td>
                    <td className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="truncate">{v.value}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => onCopy(v.value, v.type)}
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="leading-snug text-muted-foreground">
            DNS can take up to 24h. We re-check every 10 seconds while verification is pending.
          </p>
        </div>
      )}
    </div>
  )
}
