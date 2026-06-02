import React, { useState } from 'react'
import { Badge, Button, HStack } from '../../ui'
import { Loader2 } from 'lucide-react'
import type { StorefrontAddonCatalogItem, StorefrontConfig } from '../../../services/api/storefrontStudio.service'
import { buyStorefrontAddon } from '../../../lib/payStorefrontAddon'

export function StorefrontAddonsSection({
  cfg,
  addons,
  isSuperAdmin,
  tenantId,
  brandColor,
  brandName,
  prefill,
  onGrant,
  onRevoke,
  onConfigUpdated,
}: {
  cfg: StorefrontConfig
  addons: StorefrontAddonCatalogItem[]
  isSuperAdmin: boolean
  tenantId: string
  brandColor?: string
  brandName?: string
  prefill?: { name?: string; email?: string; contact?: string }
  onGrant: (flagKey: string, sku: string) => void
  onRevoke: (flagKey: string) => void
  onConfigUpdated?: (next: StorefrontConfig) => void
}) {
  const purchased = cfg.featureAddons ?? {}
  const [busySku, setBusySku] = useState<string | null>(null)

  const buy = async (sku: string, label: string) => {
    setBusySku(sku)
    try {
      const res = await buyStorefrontAddon({
        sku,
        displayName: brandName || 'Storefront add-on',
        description: label,
        prefill,
        themeColor: brandColor,
      })
      if (res.config && onConfigUpdated) onConfigUpdated(res.config)
    } catch {
      // toast already shown by api / razorpay layer
    } finally {
      setBusySku(null)
    }
  }

  return (
    <div className="space-y-2">
      {addons.map((a) => {
        const active = purchased[a.flagKey]?.purchased || cfg.featureFlags[a.flagKey as keyof typeof cfg.featureFlags]
        return (
          <div
            key={a.sku}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3"
          >
            <div>
              <HStack spacing={2} align="center">
                <span className="text-sm font-medium">{a.label}</span>
                {active ? <Badge variant="default">Active</Badge> : <Badge variant="outline">Locked</Badge>}
              </HStack>
              <p className="text-xs text-muted-foreground">{a.description}</p>
              <p className="text-xs font-medium mt-1">₹{a.priceInr}/mo · {a.sku}</p>
            </div>
            <div className="flex gap-2">
              {isSuperAdmin ? (
                active ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => onRevoke(a.flagKey)}>
                    Revoke
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => onGrant(a.flagKey, a.sku)}>
                    Grant free
                  </Button>
                )
              ) : active ? null : (
                <Button
                  type="button"
                  size="sm"
                  disabled={busySku === a.sku}
                  onClick={() => buy(a.sku, a.label)}
                >
                  {busySku === a.sku ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Buy ₹{a.priceInr}
                </Button>
              )}
            </div>
          </div>
        )
      })}
      {!isSuperAdmin && (
        <p className="text-xs text-muted-foreground">
          Paid widgets are enabled after your platform operator confirms payment or assigns the add-on.
        </p>
      )}
      {isSuperAdmin && (
        <p className="text-xs text-muted-foreground">Tenant: {tenantId}</p>
      )}
    </div>
  )
}
