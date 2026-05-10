import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { AmcService } from '../../services/api/amc.service'
import type { AmcPackage } from '../../types/amc.types'
import { formatMoney } from '../../lib/financeFormat'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

const CATEGORY_PRESETS = [
  'AC servicing',
  'RO / Water purifier',
  'Plumbing',
  'Electrical',
  'Appliances',
  'Deep cleaning',
  'Pest control',
  'General handyman',
] as const

/** Explicit shape so `categoriesText` stays `string` (not inferred from `as const` presets). */
interface AmcPackageFormState {
  title: string
  slug: string
  summary: string
  description: string
  categoriesText: string
  visitsIncluded: string
  durationMonths: string
  priceFrom: string
  currency: string
  sortOrder: string
  isPublished: boolean
  imageUrl: string
}

function emptyForm(): AmcPackageFormState {
  return {
    title: '',
    slug: '',
    summary: '',
    description: '',
    categoriesText: CATEGORY_PRESETS[0],
    visitsIncluded: '4',
    durationMonths: '12',
    priceFrom: '',
    currency: 'INR',
    sortOrder: '0',
    isPublished: false,
    imageUrl: '',
  }
}

export function AmcPackagesPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_amc')

  const [rows, setRows] = useState<AmcPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AmcPackage | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AmcPackageFormState>(() => emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await AmcService.listPackages({ page: 1, limit: 100 })
      const data = res.data
      setRows(data?.packages ?? [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load packages')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (p: AmcPackage) => {
    setEditing(p)
    setForm({
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      description: p.description ?? '',
      categoriesText: (p.coveredCategories || []).join(', ') || CATEGORY_PRESETS[0],
      visitsIncluded: String(p.visitsIncluded ?? 0),
      durationMonths: String(p.durationMonths ?? 12),
      priceFrom: p.priceFrom != null ? String(p.priceFrom) : '',
      currency: p.currency || 'INR',
      sortOrder: String(p.sortOrder ?? 0),
      isPublished: !!p.isPublished,
      imageUrl: p.imageUrl ?? '',
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!canManage) return
    const title = form.title.trim()
    const summary = form.summary.trim()
    if (!title || !summary) {
      setErr('Title and short summary are required.')
      return
    }
    const visitsIncluded = parseInt(form.visitsIncluded, 10)
    const durationMonths = parseInt(form.durationMonths, 10)
    const sortOrder = parseInt(form.sortOrder, 10)
    if (Number.isNaN(visitsIncluded) || visitsIncluded < 0) {
      setErr('Invalid visits included')
      return
    }
    if (Number.isNaN(durationMonths) || durationMonths < 1) {
      setErr('Invalid duration (months)')
      return
    }
    const coveredCategories = form.categoriesText
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const priceRaw = form.priceFrom.trim()
    const priceFrom = priceRaw === '' ? undefined : parseFloat(priceRaw)
    if (priceRaw !== '' && (priceFrom == null || Number.isNaN(priceFrom) || priceFrom < 0)) {
      setErr('Invalid price')
      return
    }

    setSaving(true)
    setErr(null)
    try {
      const body: Record<string, unknown> = {
        title,
        summary,
        description: form.description.trim() || undefined,
        coveredCategories,
        visitsIncluded,
        durationMonths,
        currency: form.currency.trim() || 'INR',
        sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
        isPublished: form.isPublished,
        imageUrl: form.imageUrl.trim() || undefined,
      }
      if (form.slug.trim()) body.slug = form.slug.trim().toLowerCase()
      if (priceFrom != null) body.priceFrom = priceFrom

      if (editing) {
        await AmcService.patchPackage(editing._id, body)
      } else {
        await AmcService.createPackage(body)
      }
      setDialogOpen(false)
      void load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">AMC packages</CardTitle>
            <CardDescription>
              Published plans appear on the public website home page. Customers can send a question (feedback) or open
              WhatsApp from each card.
            </CardDescription>
          </div>
          {canManage ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New package
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {err && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages yet. Create one to show on the client home page.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Visits / term</TableHead>
                  <TableHead>From price</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.slug}</TableCell>
                    <TableCell>
                      {p.isPublished ? (
                        <Badge>Live</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {p.visitsIncluded} visits / {p.durationMonths} mo
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {p.priceFrom != null ? formatMoney(p.priceFrom, p.currency) : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,800px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit package' : 'New AMC package'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>URL slug (optional)</Label>
              <Input
                placeholder="auto from title if empty"
                className="font-mono text-xs"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Short summary (home card)</Label>
              <Textarea
                rows={2}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Full description (optional)</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Covered categories (comma-separated)</Label>
              <div className="flex flex-wrap gap-1 pb-1">
                {CATEGORY_PRESETS.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        categoriesText: f.categoriesText.includes(c) ? f.categoriesText : `${f.categoriesText}, ${c}`,
                      }))
                    }
                  >
                    + {c}
                  </Button>
                ))}
              </div>
              <Textarea
                rows={2}
                className="font-mono text-xs"
                value={form.categoriesText}
                onChange={(e) => setForm((f) => ({ ...f, categoriesText: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Visits included</Label>
                <Input
                  inputMode="numeric"
                  value={form.visitsIncluded}
                  onChange={(e) => setForm((f) => ({ ...f, visitsIncluded: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Duration (months)</Label>
                <Input
                  inputMode="numeric"
                  value={form.durationMonths}
                  onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Price from (optional)</Label>
                <Input
                  inputMode="decimal"
                  value={form.priceFrom}
                  onChange={(e) => setForm((f) => ({ ...f, priceFrom: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1">
              <Label>Sort order</Label>
              <Input
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Image URL (optional)</Label>
              <Input
                placeholder="https://…"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isPublished}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v === true }))}
              />
              Published on website
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving || !canManage} onClick={() => void save()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
