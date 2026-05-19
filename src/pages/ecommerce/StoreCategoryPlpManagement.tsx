import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Checkbox } from '../../components/ui/checkbox'
import { CMSService } from '../../services/api/cms.service'
import { CategoriesService } from '../../services/api/categories.service'
import {
  emptyStoreCategoryPlpConfig,
  normalizeStoreCategoryPlpConfig,
  normalizeStoreCategoryPlpRecord,
  type StoreCategoryPlpConfig,
  type StorePlpFaqBlock,
  type StorePlpIntroSection,
  type StorePlpSubcategoryBlock,
} from '../../types/storeCategoryPlp'
import { appToast } from '../../lib/appToast'

const PUBLIC_ORIGIN = (process.env.REACT_APP_PUBLIC_SITE_ORIGIN || 'https://www.profixer.in').replace(/\/$/, '')

export default function StoreCategoryPlpManagement() {
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [data, setData] = useState<Record<string, StoreCategoryPlpConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const config = useMemo(() => {
    const raw = data[selectedSlug]
    return raw ? normalizeStoreCategoryPlpConfig(raw) : emptyStoreCategoryPlpConfig()
  }, [data, selectedSlug])

  const updateConfig = useCallback(
    (patch: Partial<StoreCategoryPlpConfig>) => {
      if (!selectedSlug) return
      setData((prev) => ({
        ...prev,
        [selectedSlug]: { ...normalizeStoreCategoryPlpConfig(prev[selectedSlug]), ...patch },
      }))
    },
    [selectedSlug]
  )

  useEffect(() => {
    void (async () => {
      try {
        const [cats, plp] = await Promise.all([
          CategoriesService.getCategoriesForProductUIs({ page: 1, limit: 200 }),
          CMSService.getStoreCategoryPlp(),
        ])
        const rawCats = cats as { categories?: { slug?: string; name?: string }[] } | { slug?: string; name?: string }[]
        const list = Array.isArray(rawCats)
          ? rawCats
          : Array.isArray(rawCats?.categories)
            ? rawCats.categories!
            : []
        const opts = (list as { slug?: string; name?: string }[])
          .map((c) => ({ slug: String(c.slug ?? '').trim(), name: String(c.name ?? c.slug ?? '').trim() }))
          .filter((c) => c.slug)
        setCategories(opts)
        if (opts.length && !selectedSlug) setSelectedSlug(opts[0].slug)
        setData(normalizeStoreCategoryPlpRecord(plp))
      } catch (e) {
        appToast('Failed to load store PLP CMS', 'error')
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSave = async () => {
    if (!selectedSlug) return
    try {
      setSaving(true)
      const payload = { ...data, [selectedSlug]: config }
      await CMSService.updateStoreCategoryPlp(payload)
      setData(normalizeStoreCategoryPlpRecord(payload))
      appToast('Store category PLP saved', 'success')
    } catch (e) {
      appToast('Save failed', 'error')
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title="Store category PLP"
        subtitle="SEO, intro, subcategories, FAQs, and filters for each /store/[category] aisle. Data is served from the API — no static copy in the app."
      />
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] space-y-2">
          <Label>Product category</Label>
          <Select value={selectedSlug} onValueChange={setSelectedSlug}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name} ({c.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Checkbox
            id="plp-enabled"
            checked={config.enabled}
            onCheckedChange={(v) => updateConfig({ enabled: Boolean(v) })}
          />
          <Label htmlFor="plp-enabled">Published on storefront</Label>
        </div>
        <Button onClick={handleSave} disabled={saving || !selectedSlug} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
        {selectedSlug && (
          <a
            href={`${PUBLIC_ORIGIN}/store/${encodeURIComponent(selectedSlug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Preview live →
          </a>
        )}
      </div>

      <Tabs defaultValue="metadata" className="mt-6">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="intro">Intro</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="guide">Buying guide</TabsTrigger>
          <TabsTrigger value="cta">Bulk CTA</TabsTrigger>
          <TabsTrigger value="technical">Technical SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page metadata</CardTitle>
              <CardDescription>Title, meta description, H1 — used in generateMetadata().</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SEO title</Label>
                <Input value={config.seoTitle} onChange={(e) => updateConfig({ seoTitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Meta description</Label>
                <Textarea
                  rows={3}
                  value={config.metaDescription}
                  onChange={(e) => updateConfig({ metaDescription: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>H1</Label>
                <Input value={config.h1} onChange={(e) => updateConfig({ h1: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Short description (below H1)</Label>
                <Textarea
                  rows={2}
                  value={config.shortDescription}
                  onChange={(e) => updateConfig({ shortDescription: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intro" className="mt-4">
          <IntroSectionsEditor
            sections={config.introSections}
            onChange={(introSections) => updateConfig({ introSections })}
          />
        </TabsContent>

        <TabsContent value="subcategories" className="mt-4">
          <SubcategoriesEditor
            categorySlug={selectedSlug}
            items={config.subcategories}
            onChange={(subcategories) => updateConfig({ subcategories })}
          />
        </TabsContent>

        <TabsContent value="faqs" className="mt-4">
          <FaqsEditor faqs={config.faqs} onChange={(faqs) => updateConfig({ faqs })} />
        </TabsContent>

        <TabsContent value="filters" className="mt-4">
          <FiltersEditor
            filterConfig={config.filterConfig}
            onChange={(filterConfig) => updateConfig({ filterConfig })}
          />
        </TabsContent>

        <TabsContent value="guide" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Buying guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Section title"
                value={config.buyingGuide.title}
                onChange={(e) => updateConfig({ buyingGuide: { ...config.buyingGuide, title: e.target.value } })}
              />
              <Textarea
                rows={8}
                placeholder="Paragraphs (one per line)"
                value={config.buyingGuide.paragraphs.join('\n\n')}
                onChange={(e) =>
                  updateConfig({
                    buyingGuide: {
                      ...config.buyingGuide,
                      paragraphs: e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
                    },
                  })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk / contractor CTA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={config.bulkCta.headline}
                onChange={(e) => updateConfig({ bulkCta: { ...config.bulkCta, headline: e.target.value } })}
              />
              <Textarea
                rows={2}
                value={config.bulkCta.description}
                onChange={(e) => updateConfig({ bulkCta: { ...config.bulkCta, description: e.target.value } })}
              />
              <Textarea
                rows={2}
                placeholder="WhatsApp prefill message"
                value={config.bulkCta.whatsappMessage}
                onChange={(e) => updateConfig({ bulkCta: { ...config.bulkCta, whatsappMessage: e.target.value } })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO</CardTitle>
              <CardDescription>Canonical override and robots. Filter URLs with 2+ params get noindex on the client.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Robots meta</Label>
                <Input
                  value={config.technicalSeo.robotsMeta}
                  onChange={(e) =>
                    updateConfig({ technicalSeo: { ...config.technicalSeo, robotsMeta: e.target.value } })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Canonical override (optional)</Label>
                <Input
                  placeholder={`${PUBLIC_ORIGIN}/store/${selectedSlug}`}
                  value={config.technicalSeo.canonicalOverride}
                  onChange={(e) =>
                    updateConfig({ technicalSeo: { ...config.technicalSeo, canonicalOverride: e.target.value } })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IntroSectionsEditor({
  sections,
  onChange,
}: {
  sections: StorePlpIntroSection[]
  onChange: (s: StorePlpIntroSection[]) => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Intro sections</CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([...sections, { id: `sec-${Date.now()}`, title: '', paragraphs: [''] }])
          }
        >
          <Plus className="h-4 w-4" /> Add section
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((sec, i) => (
          <div key={sec.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between gap-2">
              <Input
                placeholder="Section title"
                value={sec.title}
                onChange={(e) => {
                  const next = [...sections]
                  next[i] = { ...sec, title: e.target.value }
                  onChange(next)
                }}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => onChange(sections.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              rows={5}
              placeholder="Paragraphs separated by blank lines"
              value={sec.paragraphs.join('\n\n')}
              onChange={(e) => {
                const next = [...sections]
                next[i] = {
                  ...sec,
                  paragraphs: e.target.value.split(/\n\n+/).map((p) => p.trim()).filter(Boolean),
                }
                onChange(next)
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SubcategoriesEditor({
  categorySlug,
  items,
  onChange,
}: {
  categorySlug: string
  items: StorePlpSubcategoryBlock[]
  onChange: (s: StorePlpSubcategoryBlock[]) => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subcategory cards</CardTitle>
          <CardDescription>Links to /store/{categorySlug}/[slug]</CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onChange([
              ...items,
              { slug: '', title: '', description: '', imageUrl: '/images/carousel-electrical.png', sortOrder: items.length },
            ])
          }
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((sub, i) => (
          <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
            <Input
              placeholder="slug (e.g. switches)"
              value={sub.slug}
              onChange={(e) => {
                const next = [...items]
                next[i] = { ...sub, slug: e.target.value }
                onChange(next)
              }}
            />
            <Input
              placeholder="Title"
              value={sub.title}
              onChange={(e) => {
                const next = [...items]
                next[i] = { ...sub, title: e.target.value }
                onChange(next)
              }}
            />
            <Textarea
              className="sm:col-span-2"
              rows={2}
              placeholder="Description"
              value={sub.description}
              onChange={(e) => {
                const next = [...items]
                next[i] = { ...sub, description: e.target.value }
                onChange(next)
              }}
            />
            <Input
              className="sm:col-span-2"
              placeholder="Image URL"
              value={sub.imageUrl}
              onChange={(e) => {
                const next = [...items]
                next[i] = { ...sub, imageUrl: e.target.value }
                onChange(next)
              }}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FaqsEditor({ faqs, onChange }: { faqs: StorePlpFaqBlock[]; onChange: (f: StorePlpFaqBlock[]) => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>FAQs (FAQPage schema)</CardTitle>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...faqs, { question: '', answer: '' }])}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <Input
              placeholder="Question"
              value={f.question}
              onChange={(e) => {
                const next = [...faqs]
                next[i] = { ...f, question: e.target.value }
                onChange(next)
              }}
            />
            <Textarea
              rows={3}
              placeholder="Answer"
              value={f.answer}
              onChange={(e) => {
                const next = [...faqs]
                next[i] = { ...f, answer: e.target.value }
                onChange(next)
              }}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(faqs.filter((_, j) => j !== i))}>
              Remove
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FiltersEditor({
  filterConfig,
  onChange,
}: {
  filterConfig: StoreCategoryPlpConfig['filterConfig']
  onChange: (f: StoreCategoryPlpConfig['filterConfig']) => void
}) {
  const patch = (p: Partial<StoreCategoryPlpConfig['filterConfig']>) => onChange({ ...filterConfig, ...p })
  return (
    <Card>
      <CardHeader>
        <CardTitle>PLP filters</CardTitle>
        <CardDescription>Query-param filters on the storefront (brand, price, type, etc.).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(
          [
            ['enableBrand', 'Brand'],
            ['enablePrice', 'Price'],
            ['enableProductType', 'Product type'],
            ['enableAmpere', 'Ampere'],
            ['enableWireSize', 'Wire size'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              checked={filterConfig[key]}
              onCheckedChange={(v) => patch({ [key]: Boolean(v) })}
            />
            <Label>{label}</Label>
          </div>
        ))}
        <div className="space-y-2">
          <Label>Brands (comma-separated)</Label>
          <Input
            value={filterConfig.brands.join(', ')}
            onChange={(e) =>
              patch({
                brands: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Product types (comma-separated)</Label>
          <Input
            value={filterConfig.productTypes.join(', ')}
            onChange={(e) =>
              patch({
                productTypes: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
