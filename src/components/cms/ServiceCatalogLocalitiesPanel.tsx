import React, { useMemo, useState } from 'react'
import { Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { cn } from '../../lib/utils'
import { appToast } from '../../lib/appToast'
import { CMSService } from '../../services/api'
import type { ServiceCatalogLocalityRow } from '../../hooks/useServiceCatalogLocalities'

function slugifyHint(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type EditState =
  | { mode: 'create' }
  | { mode: 'edit'; row: ServiceCatalogLocalityRow }

export function ServiceCatalogLocalitiesPanel({
  rows,
  loading,
  error,
  onRefresh,
}: {
  rows: ServiceCatalogLocalityRow[]
  loading: boolean
  error: string | null
  onRefresh: () => void | Promise<void>
}) {
  const [dialog, setDialog] = useState<EditState | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formSort, setFormSort] = useState('0')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [rows],
  )

  const openCreate = () => {
    setFormName('')
    setFormSlug('')
    setFormSort(String((sorted[sorted.length - 1]?.sortOrder ?? 0) + 10))
    setFormActive(true)
    setDialog({ mode: 'create' })
  }

  const openEdit = (row: ServiceCatalogLocalityRow) => {
    setFormName(row.name)
    setFormSlug(row.slug)
    setFormSort(String(row.sortOrder))
    setFormActive(row.isActive)
    setDialog({ mode: 'edit', row })
  }

  const closeDialog = () => {
    if (!saving) setDialog(null)
  }

  const handleSave = async () => {
    const name = formName.trim()
    if (!name) {
      appToast('Enter a display name (e.g. Mira Road).', 'error')
      return
    }
    setSaving(true)
    try {
      const sortOrder = Number.parseInt(formSort, 10)
      if (dialog?.mode === 'create') {
        await CMSService.createServiceCatalogLocality({
          name,
          slug: formSlug.trim() || undefined,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          isActive: formActive,
        })
        appToast('Location created.', 'success')
      } else if (dialog?.mode === 'edit') {
        await CMSService.updateServiceCatalogLocality(dialog.row._id, {
          name,
          slug: formSlug.trim() || dialog.row.slug,
          sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
          isActive: formActive,
        })
        appToast('Location updated.', 'success')
      }
      setDialog(null)
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || (e instanceof Error ? e.message : 'Save failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: ServiceCatalogLocalityRow) => {
    if (!window.confirm(`Delete “${row.name}” (${row.slug})? Existing CMS keys using this slug are unchanged.`)) {
      return
    }
    setDeletingId(row._id)
    try {
      await CMSService.deleteServiceCatalogLocality(row._id)
      appToast('Location deleted.', 'success')
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || 'Delete failed', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleActive = async (row: ServiceCatalogLocalityRow, next: boolean) => {
    try {
      await CMSService.updateServiceCatalogLocality(row._id, { isActive: next })
      appToast(next ? 'Location activated (URLs live).' : 'Location deactivated (404 on consumer).', 'success')
      await onRefresh()
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast(msg || 'Update failed', 'error')
    }
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="space-y-4 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
              Service areas (hyperlocal URLs)
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Controls which locality segments work on{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/services/{'{category}'}/{'{locality}'}</code>.
              Inactive = consumer returns 404 (technical SEO: trim thin/index-bloat areas). Landing CMS keys use{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">industry__slug</code>.
            </p>
          </div>
          <Button type="button" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add location
          </Button>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No locations yet. Add one, or run backend{' '}
            <code className="rounded bg-muted px-1 text-xs">npm run seed:service-catalog-localities</code>.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="font-mono text-xs">URL slug</TableHead>
                  <TableHead className="w-[88px] text-center">Order</TableHead>
                  <TableHead className="w-[100px] text-center">Active</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row._id} className={cn(!row.isActive && 'bg-muted/40')}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                    <TableCell className="text-center tabular-nums">{row.sortOrder}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={row.isActive}
                        onCheckedChange={(v) => void toggleActive(row, v)}
                        aria-label={`${row.isActive ? 'Deactivate' : 'Activate'} ${row.name}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                          disabled={deletingId === row._id}
                          onClick={() => void handleDelete(row)}
                        >
                          {deletingId === row._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === 'edit' ? 'Edit location' : 'Add location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="loc-name">Display name</Label>
              <Input
                id="loc-name"
                value={formName}
                onChange={(e) => {
                  const v = e.target.value
                  setFormName(v)
                  if (dialog?.mode === 'create') setFormSlug(slugifyHint(v))
                }}
                placeholder="e.g. Borivali West"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-slug">URL slug</Label>
              <Input
                id="loc-slug"
                className="font-mono text-sm"
                value={formSlug}
                onChange={(e) => setFormSlug(slugifyHint(e.target.value))}
                placeholder="borivali-west"
              />
              <p className="text-[11px] text-muted-foreground">
                Lowercase hyphens only. Used in CMS key <span className="font-mono">industry__slug</span>.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-sort">Sort order</Label>
              <Input
                id="loc-sort"
                type="number"
                value={formSort}
                onChange={(e) => setFormSort(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="loc-active" checked={formActive} onCheckedChange={setFormActive} />
              <Label htmlFor="loc-active" className="font-normal">
                Active (live on website)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Save
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
