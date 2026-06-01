import React, { useEffect, useMemo, useState } from 'react'
import { type StorefrontDomain } from '../../services/api/storefrontDomains.service'
import {
  isLocalAdminHost,
  pickStorefrontUrl,
  platformStorefrontDevUrl,
  platformStorefrontProdUrl,
  resolveStorefrontUrl,
} from '../../lib/storefrontUrls'
import { storefrontDomainsService } from '../../services/api/storefrontDomains.service'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  HStack,
  VStack,
} from '../ui'
import {
  ExternalLink,
  Globe,
  Laptop,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'

export function StorefrontPreviewPanel({
  tenantId,
  tenantSlug,
}: {
  tenantId: string
  tenantSlug: string
}) {
  const [domains, setDomains] = useState<StorefrontDomain[]>([])
  const [loading, setLoading] = useState(false)
  const [iframeBust, setIframeBust] = useState(0)

  const reloadDomains = async () => {
    setLoading(true)
    try {
      const res = await storefrontDomainsService.list(tenantId)
      setDomains(res.data?.domains ?? [])
    } catch {
      setDomains([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reloadDomains()
  }, [tenantId])

  const verifiedPrimary = useMemo(
    () => domains.find((d) => d.verified && d.isPrimary),
    [domains],
  )
  const verifiedOther = useMemo(
    () => domains.filter((d) => d.verified && !d.isPrimary),
    [domains],
  )

  const isLocal = isLocalAdminHost()
  const devUrl = platformStorefrontDevUrl(tenantSlug)
  const prodUrl = platformStorefrontProdUrl(tenantSlug)
  const primaryUrl = pickStorefrontUrl({ slug: tenantSlug, domains })

  const openPrimary = () => {
    window.open(primaryUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4" />
          Storefront preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <VStack spacing={4}>
          <p className="text-xs text-muted-foreground leading-snug">
            Live preview of the public site. Opens verified custom domain when set; otherwise
            the platform subdomain ({isLocal ? 'local dev on :3001' : 'production'}).
          </p>

          <div className="space-y-2">
            <UrlRow
              icon={<Globe className="h-3.5 w-3.5" />}
              label="Platform subdomain (prod)"
              url={prodUrl}
            />
            <UrlRow
              icon={<Laptop className="h-3.5 w-3.5" />}
              label="Local dev"
              url={devUrl}
              hint="Storefront: cd storefront && npm run dev"
            />
            {verifiedPrimary ? (
              <UrlRow
                icon={<Globe className="h-3.5 w-3.5 text-emerald-600" />}
                label="Primary custom domain"
                url={`https://${verifiedPrimary.hostname}`}
                badge={<Badge variant="outline">verified · primary</Badge>}
              />
            ) : loading ? (
              <p className="text-xs text-muted-foreground">
                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                Checking custom domains…
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No verified custom domain — using platform subdomain for preview.
              </p>
            )}
            {verifiedOther.map((d) => (
              <UrlRow
                key={d.id}
                icon={<Globe className="h-3.5 w-3.5" />}
                label="Custom domain"
                url={`https://${d.hostname}`}
                badge={<Badge variant="secondary">verified</Badge>}
              />
            ))}
          </div>

          <HStack spacing={2}>
            <Button type="button" size="sm" onClick={openPrimary}>
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              Open in new tab
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIframeBust((n) => n + 1)}
              title="Reload preview"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> Reload preview
            </Button>
          </HStack>

          <div className="rounded-md border border-border bg-muted/30 p-1.5">
            <iframe
              key={iframeBust}
              src={primaryUrl}
              title={`${tenantSlug} storefront preview`}
              className="h-[640px] w-full rounded-sm bg-background"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Blank or 404? Restart the storefront dev server after changing{' '}
              <code className="text-[10px]">storefront/.env.local</code> (
              <code className="text-[10px]">NEXT_PUBLIC_API_BASE_URL=http://localhost:8005/api</code>
              ).
            </span>
          </p>
        </VStack>
      </CardContent>
    </Card>
  )
}

function UrlRow({
  icon,
  label,
  url,
  hint,
  badge,
}: {
  icon: React.ReactNode
  label: string
  url: string
  hint?: string
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded border border-border bg-background px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
          {badge}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block truncate font-mono text-sm text-primary hover:underline"
          title={url}
        >
          {url}
        </a>
        {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
      <Button asChild size="sm" variant="ghost">
        <a href={url} target="_blank" rel="noreferrer" aria-label={`Open ${url}`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    </div>
  )
}
