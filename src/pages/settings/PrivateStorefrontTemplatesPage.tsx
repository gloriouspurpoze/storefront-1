import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  VStack,
  HStack,
  useToast,
} from '../../components/ui'
import { Layers, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import {
  platformTenantsService,
  type PlatformTenantRow,
} from '../../services/api/platformTenants.service'
import {
  privateStorefrontTemplatesService,
  type PrivateStorefrontTemplate,
  type PrivateStorefrontTemplateInput,
} from '../../services/api/privateStorefrontTemplates.service'
import { VERTICAL_PACK_OPTIONS } from '../../verticals/registry'

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)'

const EMPTY_FORM: PrivateStorefrontTemplateInput = {
  key: 'private-',
  name: '',
  description: '',
  previewGradient: DEFAULT_GRADIENT,
  verticalKey: 'retail',
  kind: 'layout',
  htmlSource: 'private/your-slug/index.html',
  reactModulePath: '',
  assignedTenantIds: [],
  notes: '',
}

export function PrivateStorefrontTemplatesPage() {
  const { toast } = useToast()
  const [rows, setRows] = useState<PrivateStorefrontTemplate[]>([])
  const [tenants, setTenants] = useState<PlatformTenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PrivateStorefrontTemplate | null>(null)
  const [form, setForm] = useState<PrivateStorefrontTemplateInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const tenantMap = useMemo(() => new Map(tenants.map((t) => [t._id, t])), [tenants])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tplRes, tenantRes] = await Promise.all([
        privateStorefrontTemplatesService.list(),
        platformTenantsService.list(),
      ])
      setRows(tplRes.data ?? [])
      setTenants(tenantRes.data?.tenants ?? [])
    } catch {
      toast({ title: 'Failed to load private templates', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  const openEdit = (row: PrivateStorefrontTemplate) => {
    setEditing(row)
    setForm({
      key: row.key,
      name: row.name,
      description: row.description,
      previewGradient: row.previewGradient,
      verticalKey: row.verticalKey,
      kind: row.kind,
      htmlSource: row.htmlSource,
      reactModulePath: row.reactModulePath,
      assignedTenantIds: row.assignedTenantIds ?? [],
      notes: row.notes,
    })
    setDialogOpen(true)
  }

  const toggleTenant = (tenantId: string) => {
    setForm((prev) => {
      const ids = new Set(prev.assignedTenantIds ?? [])
      if (ids.has(tenantId)) ids.delete(tenantId)
      else ids.add(tenantId)
      return { ...prev, assignedTenantIds: [...ids] }
    })
  }

  const save = async () => {
    if (!form.key.startsWith('private-') || form.key.length < 10) {
      toast({ title: 'Key must start with private- (e.g. private-acme-boutique)', variant: 'destructive' })
      return
    }
    if (!form.name.trim() || !form.description.trim()) {
      toast({ title: 'Name and description are required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (editing) {
        const { key: _k, ...patch } = form
        await privateStorefrontTemplatesService.update(editing._id, patch)
      } else {
        await privateStorefrontTemplatesService.create(form)
      }
      setDialogOpen(false)
      await load()
    } catch {
      /* api layer toasts */
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (row: PrivateStorefrontTemplate) => {
    if (!window.confirm(`Deactivate "${row.name}"? Assigned tenants will no longer see it.`)) return
    await privateStorefrontTemplatesService.deactivate(row._id)
    await load()
  }

  return (
    <div className="min-h-0 flex-1 p-4 sm:p-6">
    <VStack spacing={6} className="max-w-5xl">
      <PageHeader
        title="Private storefront templates"
        subtitle="Tenant-exclusive layouts — hidden from the public theme marketplace. Drop HTML under storefront/templates/html-source/private/ then register here."
        icon={<Layers className="h-8 w-8 shrink-0 text-primary" aria-hidden />}
        action={
          <HStack spacing={2}>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New template
            </Button>
          </HStack>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            1. Place your HTML at{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              storefront/templates/html-source/private/&lt;slug&gt;/index.html
            </code>
          </p>
          <p>2. Create a record here with key <code className="text-xs">private-&lt;slug&gt;</code> and assign tenant(s).</p>
          <p>
            3. Convert HTML to React and register in{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">storefront/themes/private/registry.ts</code>.
          </p>
          <p>
            Assigned tenants pick the template under{' '}
            <Link to="/settings/storefront" className="text-primary underline-offset-4 hover:underline">
              Settings → Storefront → Themes
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No private templates yet. Click <strong>New template</strong> after adding HTML to the private folder.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row._id} className={!row.isActive ? 'opacity-60' : undefined}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3 min-w-0">
                  <div
                    className="h-14 w-20 shrink-0 rounded-md border"
                    style={{ background: row.previewGradient }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      <Badge variant="outline">Custom</Badge>
                      {!row.isActive && <Badge variant="destructive">Inactive</Badge>}
                      <Badge variant="secondary">{row.verticalKey}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{row.description}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">{row.key}</p>
                    {row.htmlSource && (
                      <p className="mt-1 text-[10px] text-muted-foreground">HTML: {row.htmlSource}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(row.assignedTenantIds ?? []).map((id) => {
                        const t = tenantMap.get(id)
                        return (
                          <Badge key={id} variant="outline" className="text-[10px] font-normal">
                            {t ? `${t.name} (${t.slug})` : id}
                          </Badge>
                        )
                      })}
                      {(row.assignedTenantIds ?? []).length === 0 && (
                        <span className="text-xs text-amber-700">No tenants assigned</span>
                      )}
                    </div>
                  </div>
                </div>
                <HStack spacing={2} className="shrink-0">
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(row)}>
                    Edit
                  </Button>
                  {row.isActive && (
                    <Button type="button" size="sm" variant="ghost" onClick={() => void deactivate(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </HStack>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit private template' : 'New private template'}</DialogTitle>
            <DialogDescription>
              Only assigned tenants see this in their theme picker. Key cannot be changed after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="pt-key">Key</Label>
              <Input
                id="pt-key"
                value={form.key}
                onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toLowerCase() }))}
                disabled={Boolean(editing)}
                placeholder="private-acme-boutique"
              />
            </div>
            <div>
              <Label htmlFor="pt-name">Name</Label>
              <Input
                id="pt-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="pt-desc">Description</Label>
              <Textarea
                id="pt-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="pt-vertical">Vertical</Label>
              <select
                id="pt-vertical"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.verticalKey}
                onChange={(e) => setForm((f) => ({ ...f, verticalKey: e.target.value }))}
              >
                {VERTICAL_PACK_OPTIONS.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pt-html">HTML source path</Label>
              <Input
                id="pt-html"
                value={form.htmlSource ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, htmlSource: e.target.value }))}
                placeholder="private/acme-boutique/index.html"
              />
            </div>
            <div>
              <Label htmlFor="pt-react">React module path (optional)</Label>
              <Input
                id="pt-react"
                value={form.reactModulePath ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, reactModulePath: e.target.value }))}
                placeholder="themes/private/acme-boutique/AcmeBoutiquePage.tsx"
              />
            </div>
            <div>
              <Label>Assigned tenants</Label>
              <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                {tenants.map((t) => {
                  const checked = (form.assignedTenantIds ?? []).includes(t._id)
                  return (
                    <label key={t._id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTenant(t._id)}
                      />
                      <span>
                        {t.name} <span className="text-muted-foreground">({t.slug})</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <Label htmlFor="pt-notes">Internal notes</Label>
              <Textarea
                id="pt-notes"
                value={form.notes ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VStack>
    </div>
  )
}
