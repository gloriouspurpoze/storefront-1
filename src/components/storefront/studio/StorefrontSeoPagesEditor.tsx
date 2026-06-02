import React from 'react'
import { Input, Label, Switch, Textarea } from '../../ui'
import { SEO_ROUTE_PRESETS } from '../../../services/api/storefrontStudio.service'
import type { StorefrontConfigSeo } from '../../../services/api/storefrontStudio.service'

export function StorefrontSeoPagesEditor({
  seo,
  onChange,
}: {
  seo: StorefrontConfigSeo
  onChange: (seo: StorefrontConfigSeo) => void
}) {
  const pages = seo.pages ?? {}

  const setPage = (path: string, patch: Partial<NonNullable<StorefrontConfigSeo['pages']>[string]>) => {
    onChange({
      ...seo,
      pages: {
        ...pages,
        [path]: { ...pages[path], ...patch },
      },
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Override title and description per URL path. Leave blank to use defaults.
      </p>
      {SEO_ROUTE_PRESETS.map((path) => {
        const p = pages[path] ?? {}
        return (
          <div key={path} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-medium">{path}</span>
              <label className="flex items-center gap-2 text-xs">
                noindex
                <Switch
                  checked={p.noindex === true}
                  onCheckedChange={(v) => setPage(path, { noindex: v })}
                />
              </label>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={p.title ?? ''}
                onChange={(e) => setPage(path, { title: e.target.value })}
                placeholder="Page title"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={p.description ?? ''}
                onChange={(e) => setPage(path, { description: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">OG image URL</Label>
              <Input
                value={p.ogImageUrl ?? ''}
                onChange={(e) => setPage(path, { ogImageUrl: e.target.value })}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
