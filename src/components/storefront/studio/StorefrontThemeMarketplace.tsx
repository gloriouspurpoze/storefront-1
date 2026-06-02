import React from 'react'
import { Badge, Button } from '../../ui'
import type { StorefrontThemeCatalogItem } from '../../../services/api/storefrontStudio.service'

export function StorefrontThemeMarketplace({
  themes,
  selectedKey,
  onSelect,
  isSuperAdmin,
}: {
  themes: StorefrontThemeCatalogItem[]
  selectedKey?: string
  onSelect: (key: string) => void
  isSuperAdmin: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {themes.map((t) => {
        const active = selectedKey === t.key
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            className={`rounded-lg border p-3 text-left transition ${
              active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
            }`}
          >
            <div
              className="mb-3 h-16 rounded-md"
              style={{ background: t.previewGradient }}
            />
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{t.name}</span>
              {t.tier === 'pro' && <Badge variant="secondary">Pro</Badge>}
              {active && <Badge>Active</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
            {t.tier === 'pro' && t.priceInr != null && !isSuperAdmin && (
              <p className="mt-2 text-xs font-medium text-primary">₹{t.priceInr}/mo — contact platform to unlock</p>
            )}
            {isSuperAdmin && t.tier === 'pro' && (
              <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => onSelect(t.key)}>
                Assign theme
              </Button>
            )}
          </button>
        )
      })}
    </div>
  )
}
