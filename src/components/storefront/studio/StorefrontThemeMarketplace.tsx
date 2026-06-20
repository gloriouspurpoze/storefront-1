import React from 'react'
import { Badge, Button, Switch } from '../../ui'
import type {
  StorefrontTemplateSettings,
  StorefrontThemeCatalogItem,
} from '../../../services/api/storefrontStudio.service'

function ThemeGrid({
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
  if (themes.length === 0) return null

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
            <div className="mb-3 h-16 rounded-md" style={{ background: t.previewGradient }} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-sm">{t.name}</span>
              {t.kind === 'layout' && <Badge variant="outline">Layout</Badge>}
              {t.isPrivate && <Badge variant="secondary">Custom</Badge>}
              {t.tier === 'pro' && !t.isPrivate && <Badge variant="secondary">Pro</Badge>}
              {active && <Badge>Active</Badge>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
            {t.htmlSource && (
              <p className="mt-1 text-[10px] text-muted-foreground/80">Design ref: {t.htmlSource}</p>
            )}
            {t.tier === 'pro' && t.priceInr != null && !isSuperAdmin && (
              <p className="mt-2 text-xs font-medium text-primary">
                ₹{t.priceInr}/mo — contact platform to unlock
              </p>
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

export function StorefrontThemeMarketplace({
  themes,
  selectedKey,
  onSelect,
  isSuperAdmin,
  templateSettings = {},
  onTemplateSettingChange,
}: {
  themes: StorefrontThemeCatalogItem[]
  selectedKey?: string
  onSelect: (key: string) => void
  isSuperAdmin: boolean
  templateSettings?: StorefrontTemplateSettings
  onTemplateSettingChange?: (
    themeKey: string,
    patch: { showPreferredDateOfDelivery?: boolean; showPreferredTimeOfDelivery?: boolean },
  ) => void
}) {
  const layouts = themes.filter((t) => t.kind === 'layout')
  const styles = themes.filter((t) => t.kind === 'style')
  const activeTheme = themes.find((t) => t.key === selectedKey)
  const activeSettings = selectedKey ? templateSettings[selectedKey] ?? {} : {}

  return (
    <div className="space-y-6">
      {layouts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">Layout templates</h3>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Choose the overall page structure for your storefront. Each option maps to a full React template.
          </p>
          <ThemeGrid
            themes={layouts}
            selectedKey={selectedKey}
            onSelect={onSelect}
            isSuperAdmin={isSuperAdmin}
          />
        </section>
      )}

      {selectedKey && activeTheme?.kind === 'layout' && onTemplateSettingChange && (
        <section className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">Checkout options — {activeTheme.name}</h3>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            These settings apply when this layout template is active on your storefront.
          </p>
          <div className="flex items-center justify-between rounded border border-border p-3">
            <div>
              <span className="text-sm font-medium">Preferred date of delivery</span>
              <p className="text-xs text-muted-foreground">
                Show a date picker in the delivery details section at checkout.
              </p>
            </div>
            <Switch
              checked={Boolean(activeSettings.showPreferredDateOfDelivery)}
              onCheckedChange={(checked) =>
                onTemplateSettingChange(selectedKey, { showPreferredDateOfDelivery: checked })
              }
            />
          </div>
          <div className="mt-2 flex items-center justify-between rounded border border-border p-3">
            <div>
              <span className="text-sm font-medium">Preferred time of delivery</span>
              <p className="text-xs text-muted-foreground">
                Show a time picker and validate against ordering hours for the selected day.
              </p>
            </div>
            <Switch
              checked={Boolean(activeSettings.showPreferredTimeOfDelivery)}
              onCheckedChange={(checked) =>
                onTemplateSettingChange(selectedKey, { showPreferredTimeOfDelivery: checked })
              }
            />
          </div>
        </section>
      )}

      {styles.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold">Style variants</h3>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">
            Color and typography tweaks on the default layout for your business type.
          </p>
          <ThemeGrid
            themes={styles}
            selectedKey={selectedKey}
            onSelect={onSelect}
            isSuperAdmin={isSuperAdmin}
          />
        </section>
      )}
    </div>
  )
}
