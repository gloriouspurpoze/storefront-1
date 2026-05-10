import React, { useCallback, useEffect, useState } from 'react'
import { Loader2, MapPin, Pencil, Plus, Archive } from 'lucide-react'
import { OperationsCommercialService } from '../../services/api/operations-commercial.service'
import type { OperatingCityDto } from '../../types/operating-commercial.types'
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

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

export function OperationsCommercialCitiesPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_operating_terms')

  const [rows, setRows] = useState<OperatingCityDto[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OperatingCityDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [state, setState] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [sortOrder, setSortOrder] = useState('0')
  const [priceMultiplier, setPriceMultiplier] = useState('1')
  const [serviceRadiusKm, setServiceRadiusKm] = useState('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const res = await OperationsCommercialService.listCities({
        page: 1,
        limit: 20,
        search: search.trim() || undefined,
      })
      setRows(res.data?.cities ?? [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load cities')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!dialogOpen || editing || slugTouched) return
    setSlug(slugify(name))
  }, [name, dialogOpen, editing, slugTouched])

  function openNew() {
    setEditing(null)
    setName('')
    setState('')
    setSlug('')
    setSlugTouched(false)
    setSortOrder('0')
    setPriceMultiplier('1')
    setServiceRadiusKm('')
    setNotes('')
    setIsActive(true)
    setDialogOpen(true)
  }

  function openEdit(row: OperatingCityDto) {
    setEditing(row)
    setName(row.name)
    setState(row.state ?? '')
    setSlug(row.slug)
    setSlugTouched(true)
    setSortOrder(String(row.sortOrder ?? 0))
    setPriceMultiplier(String(row.priceMultiplier ?? 1))
    setServiceRadiusKm(row.serviceRadiusKm != null ? String(row.serviceRadiusKm) : '')
    setNotes(row.notes ?? '')
    setIsActive(row.isActive !== false)
    setDialogOpen(true)
  }

  async function saveCity() {
    if (!canManage || !name.trim()) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        state: state.trim() || undefined,
        slug: slug.trim().toLowerCase() || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
        priceMultiplier: parseFloat(priceMultiplier) || 1,
        serviceRadiusKm: serviceRadiusKm.trim() ? parseFloat(serviceRadiusKm) : undefined,
        notes: notes.trim() || undefined,
        isActive,
      }
      if (editing) {
        await OperationsCommercialService.patchCity(editing.id, body)
      } else {
        await OperationsCommercialService.createCity(body)
      }
      setDialogOpen(false)
      void load()
    } catch {
      /* toast */
    } finally {
      setSaving(false)
    }
  }

  async function archive(row: OperatingCityDto) {
    if (!canManage) return
    if (!window.confirm(`Archive “${row.name}”? It will be hidden from active city lists.`)) return
    try {
      await OperationsCommercialService.archiveCity(row.id)
      void load()
    } catch {
      /* toast */
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Operating cities & zones
            </CardTitle>
            <CardDescription>
              Define where ProFixer accepts jobs — use <strong className="text-foreground">price multiplier</strong> for
              metro premiums or lower-tier markets, and optional dispatch radius for ops planning.
            </CardDescription>
          </div>
          {canManage && (
            <Button type="button" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add city
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="city-search">Search</Label>
              <Input
                id="city-search"
                placeholder="Name, slug, state…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void load()}
                className="w-[240px]"
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Apply
            </Button>
          </div>

          {err && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {err}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading cities…
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Radius (km)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No cities yet — add your primary service metros and tier-2 expansion markets.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-medium">{row.name}</div>
                          {row.state && <div className="text-xs text-muted-foreground">{row.state}</div>}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                        <TableCell className="tabular-nums">{row.priceMultiplier}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {row.serviceRadiusKm ?? '—'}
                        </TableCell>
                        <TableCell>
                          {row.isActive ? (
                            <Badge>Active</Badge>
                          ) : (
                            <Badge variant="secondary">Archived</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage && (
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" type="button" onClick={() => openEdit(row)}>
                                <Pencil className="mr-1 h-3.5 w-3.5" />
                                Edit
                              </Button>
                              {row.isActive && (
                                <Button variant="ghost" size="sm" type="button" onClick={() => void archive(row)}>
                                  <Archive className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit city' : 'Add city'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="ct-name">City name</Label>
              <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mumbai" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-state">State / region (optional)</Label>
              <Input id="ct-state" value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-slug">Slug (URL key)</Label>
              <Input
                id="ct-slug"
                className="font-mono text-sm"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setSlug(e.target.value)
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ct-sort">Sort order</Label>
                <Input id="ct-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ct-mult">Price multiplier</Label>
                <Input
                  id="ct-mult"
                  type="number"
                  step="0.01"
                  min={0.25}
                  max={5}
                  value={priceMultiplier}
                  onChange={(e) => setPriceMultiplier(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-rad">Service radius reference (km, optional)</Label>
              <Input
                id="ct-rad"
                type="number"
                min={1}
                max={500}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(e.target.value)}
                placeholder="25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-notes">Notes</Label>
              <Textarea id="ct-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="ct-act" checked={isActive} onCheckedChange={(v) => setIsActive(v === true)} />
              <Label htmlFor="ct-act" className="cursor-pointer font-normal">
                Active (shown to booking flows when wired)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving || !name.trim()} onClick={() => void saveCity()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
