import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Layers, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { ServiceCombosService, type ServiceComboDto, type ServiceComboPayload } from '../../services/api/service-combos.service'
import { platformServicesService, type PlatformService } from '../../services/api/platformServices.service'
import { CategoriesService } from '../../services/api/categories.service'
import type { Category } from '../../types'
import { appToast } from '../../lib/appToast'
import { useAppConfirm } from '../../components/providers/AppDialogsProvider'
import { formatMoney } from '../../lib/financeFormat'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

const PUBLIC_SITE_ORIGIN = (process.env.REACT_APP_PUBLIC_SITE_ORIGIN || 'https://www.profixer.in').replace(
  /\/$/,
  '',
)

type CatalogCategoryOption = { id: string; name: string; slug: string }

function normalizeCatalogSlug(raw: string | undefined): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function catalogPageUrl(slug: string) {
  const s = normalizeCatalogSlug(slug)
  return s ? `${PUBLIC_SITE_ORIGIN}/services/${encodeURIComponent(s)}` : null
}

const emptyForm = (): ServiceComboPayload => ({
  name: '',
  shortDescription: '',
  badge: '',
  categorySlug: '',
  items: [],
  pricingMode: 'percent_off_catalog',
  percentOff: 15,
  isActive: true,
  sortOrder: 0,
})

export default function ServiceCombosPage() {
  const confirm = useAppConfirm()
  const [combos, setCombos] = useState<ServiceComboDto[]>([])
  const [services, setServices] = useState<PlatformService[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<ServiceComboDto | null>(null)
  const [form, setForm] = useState<ServiceComboPayload>(emptyForm())
  const [pickServiceId, setPickServiceId] = useState('')
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategoryOption[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [useCustomCategorySlug, setUseCustomCategorySlug] = useState(false)

  const loadCatalogCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const cats = await CategoriesService.getCategoriesForServiceUIs({
        limit: 500,
        is_active: true,
      })
      const options: CatalogCategoryOption[] = cats
        .map((c: Category) => ({
          id: String(c.id),
          name: c.name,
          slug: normalizeCatalogSlug(c.slug),
        }))
        .filter((c) => c.slug)
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      setCatalogCategories(options)
      return options
    } catch {
      setCatalogCategories([])
      return [] as CatalogCategoryOption[]
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, sRes] = await Promise.all([
        ServiceCombosService.list({ limit: 100 }),
        platformServicesService.getServices({ limit: 500, status: 'published' }),
        loadCatalogCategories(),
      ])
      setCombos(cRes.data?.combos ?? [])
      setServices(sRes.services ?? [])
    } catch {
      setCombos([])
    } finally {
      setLoading(false)
    }
  }, [loadCatalogCategories])

  useEffect(() => {
    void load()
  }, [load])

  const slugById = useMemo(() => {
    const m = new Map<string, string>()
    catalogCategories.forEach((c) => m.set(c.id, c.slug))
    return m
  }, [catalogCategories])

  const categoryNameBySlug = useMemo(() => {
    const m = new Map<string, string>()
    catalogCategories.forEach((c) => m.set(c.slug, c.name))
    return m
  }, [catalogCategories])

  const formCategorySlug = normalizeCatalogSlug(form.categorySlug)

  const servicesForPicker = useMemo(() => {
    if (!formCategorySlug) return services
    return services.filter((s) => {
      const svcSlug = normalizeCatalogSlug(s.category)
      const catSlugFromId = s.category_id ? slugById.get(String(s.category_id)) : undefined
      return svcSlug === formCategorySlug || catSlugFromId === formCategorySlug
    })
  }, [services, formCategorySlug, slugById])

  function syncCustomSlugMode(slug: string, options: CatalogCategoryOption[]) {
    const norm = normalizeCatalogSlug(slug)
    if (!norm) {
      setUseCustomCategorySlug(false)
      return
    }
    const known = options.some((c) => c.slug === norm)
    setUseCustomCategorySlug(!known)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setUseCustomCategorySlug(false)
    setView('form')
    void loadCatalogCategories()
  }

  function openEdit(c: ServiceComboDto) {
    setEditing(c)
    const slug = normalizeCatalogSlug(c.categorySlug)
    void loadCatalogCategories().then((opts) => syncCustomSlugMode(slug, opts))
    syncCustomSlugMode(slug, catalogCategories)
    setForm({
      name: c.name,
      slug: c.slug,
      shortDescription: c.shortDescription ?? '',
      badge: c.badge ?? '',
      categorySlug: slug,
      items: c.items.map((it) => ({
        serviceId: it.serviceId,
        variantId: it.variantId,
        quantity: it.quantity,
      })),
      pricingMode: c.pricingMode,
      percentOff: c.percentOff,
      fixedPrice: c.fixedPrice,
      flatOff: c.flatOff,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
    })
    setView('form')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const categorySlug = normalizeCatalogSlug(form.categorySlug)
    if (!categorySlug) {
      appToast('Select a catalog category — bundles only show on matching /services/… pages', 'error')
      return
    }
    if (!form.items.length) {
      appToast('Add at least one service to the bundle', 'error')
      return
    }
    const payload: ServiceComboPayload = { ...form, categorySlug }
    try {
      if (editing) {
        await ServiceCombosService.update(editing.id, payload)
      } else {
        await ServiceCombosService.create(payload)
      }
      appToast(editing ? 'Bundle updated' : 'Bundle created', 'success')
      setView('list')
      void load()
    } catch (err: unknown) {
      appToast(err instanceof Error ? err.message : 'Save failed', 'error')
    }
  }

  async function remove(id: string) {
    const ok = await confirm({ title: 'Delete bundle?', message: 'This cannot be undone.', danger: true })
    if (!ok) return
    await ServiceCombosService.delete(id)
    void load()
  }

  function addServiceToBundle() {
    if (!pickServiceId) return
    if (form.items.some((i) => i.serviceId === pickServiceId)) {
      appToast('Service already in bundle', 'error')
      return
    }
    setForm((f) => ({
      ...f,
      items: [...f.items, { serviceId: pickServiceId, quantity: 1 }],
    }))
    setPickServiceId('')
  }

  if (view === 'form') {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title={editing ? 'Edit bundle' : 'New bundle SKU'}
          subtitle="Named combo shown on the customer catalog (e.g. AC Care Combo)."
        />
        <Card className="mt-6 max-w-2xl">
          <CardContent className="pt-6">
            <form onSubmit={(e) => void save(e)} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Short description</Label>
                <Textarea
                  rows={2}
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Badge</Label>
                <Input
                  placeholder="Save 15%"
                  value={form.badge ?? ''}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                />
              </div>
              <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                  <Label>Catalog page (where customers see this bundle)</Label>
                  <Select
                    value={
                      useCustomCategorySlug
                        ? '__custom__'
                        : formCategorySlug || (categoriesLoading ? '__loading__' : '')
                    }
                    onValueChange={(v) => {
                      if (v === '__custom__') {
                        setUseCustomCategorySlug(true)
                        return
                      }
                      setUseCustomCategorySlug(false)
                      setForm({ ...form, categorySlug: v })
                    }}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={categoriesLoading ? 'Loading categories…' : 'Select catalog category…'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <SelectItem value="__loading__" disabled>
                          Loading…
                        </SelectItem>
                      ) : null}
                      {catalogCategories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>
                          {c.name} ({c.slug})
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__">Custom slug (advanced)…</SelectItem>
                    </SelectContent>
                  </Select>
                  {useCustomCategorySlug ? (
                    <Input
                      className="mt-2 font-mono text-sm"
                      placeholder="legacy-or-imported-slug"
                      value={form.categorySlug ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, categorySlug: normalizeCatalogSlug(e.target.value) })
                      }
                      aria-label="Custom catalog slug"
                    />
                  ) : null}
                  {formCategorySlug ? (
                    <p className="text-caption-sm text-muted-foreground">
                      Shown on{' '}
                      <a
                        href={catalogPageUrl(formCategorySlug) ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                      >
                        /services/{formCategorySlug}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                      . Must match the URL slug exactly.
                    </p>
                  ) : (
                    <p className="text-caption-sm text-muted-foreground">
                      Pick the same category as the customer catalog URL (e.g. ac-repair, plumber).
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label>Pricing</Label>
                <Select
                  value={form.pricingMode}
                  onValueChange={(v) =>
                    setForm({ ...form, pricingMode: v as ServiceComboPayload['pricingMode'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent_off_catalog">% off catalog sum</SelectItem>
                    <SelectItem value="fixed_price">Fixed bundle price</SelectItem>
                    <SelectItem value="flat_off_catalog">Flat ₹ off catalog sum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.pricingMode === 'percent_off_catalog' && (
                <div className="space-y-2">
                  <Label>Percent off</Label>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={form.percentOff ?? ''}
                    onChange={(e) => setForm({ ...form, percentOff: Number(e.target.value) })}
                  />
                </div>
              )}
              {form.pricingMode === 'fixed_price' && (
                <div className="space-y-2">
                  <Label>Bundle price (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.fixedPrice ?? ''}
                    onChange={(e) => setForm({ ...form, fixedPrice: Number(e.target.value) })}
                  />
                </div>
              )}
              {form.pricingMode === 'flat_off_catalog' && (
                <div className="space-y-2">
                  <Label>Flat discount (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.flatOff ?? ''}
                    onChange={(e) => setForm({ ...form, flatOff: Number(e.target.value) })}
                  />
                </div>
              )}
              <div className="space-y-2 rounded-md border p-3">
                <Label>Services in bundle</Label>
                {formCategorySlug && servicesForPicker.length < services.length ? (
                  <p className="text-caption-sm text-muted-foreground">
                    Showing {servicesForPicker.length} published service(s) in{' '}
                    <span className="font-medium">{categoryNameBySlug.get(formCategorySlug) ?? formCategorySlug}</span>.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Select value={pickServiceId} onValueChange={setPickServiceId}>
                    <SelectTrigger className="min-w-[220px]">
                      <SelectValue placeholder="Add service…" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicesForPicker.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          {formCategorySlug
                            ? 'No published services in this category'
                            : 'Select a catalog category first'}
                        </SelectItem>
                      ) : (
                        servicesForPicker.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={addServiceToBundle}>
                    Add
                  </Button>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {form.items.map((it) => {
                    const svc = services.find((s) => s.id === it.serviceId)
                    return (
                      <li key={it.serviceId} className="flex justify-between gap-2">
                        <span>{svc?.name ?? it.serviceId}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              items: f.items.filter((x) => x.serviceId !== it.serviceId),
                            }))
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setView('list')}>
                  Cancel
                </Button>
                <Button type="submit">Save bundle</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Service bundles"
        icon={<Layers className="h-6 w-6" />}
        subtitle="Named combo SKUs — AC Care Combo, Plumbing Pack, etc. Shown on profixer.in category pages."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketing/coupons">
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Coupons
              </Link>
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              New bundle
            </Button>
          </div>
        }
      />
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading bundles…
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {combos.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => void remove(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {c.badge && <Badge>{c.badge}</Badge>}
                <p className="text-muted-foreground">{c.shortDescription}</p>
                <p>
                  <span className="text-muted-foreground">Customer pays </span>
                  <span className="font-semibold">{formatMoney(c.bundlePrice ?? 0)}</span>
                  {c.savings != null && c.savings > 0 && (
                    <span className="text-muted-foreground"> (save {formatMoney(c.savings)})</span>
                  )}
                </p>
                <p className="text-caption-sm text-muted-foreground">
                  {c.items.length} services ·{' '}
                  {c.categorySlug ? (
                    <>
                      {categoryNameBySlug.get(normalizeCatalogSlug(c.categorySlug)) ?? c.categorySlug}
                      {' '}
                      <span className="font-mono text-xs">({normalizeCatalogSlug(c.categorySlug)})</span>
                    </>
                  ) : (
                    'no catalog page'
                  )}
                </p>
                {c.categorySlug && catalogPageUrl(c.categorySlug) ? (
                  <a
                    href={catalogPageUrl(c.categorySlug)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View on site
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
