import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ChevronDown,
  Code2,
  Eye,
  GripVertical,
  HelpCircle,
  History,
  Loader2,
  Mail,
  MoreHorizontal,
  RotateCcw,
  Save,
  Search,
} from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { PageHeader } from '../../components/common/PageHeader'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Separator } from '../../components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useToast } from '../../components/ui/use-toast'
import { cn } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { CMSService } from '../../services/api/cms.service'

type TemplateListItem = Awaited<ReturnType<typeof CMSService.listEmailTemplates>>[number]

/** Viewport workspace height on large screens (under app bar + breadcrumbs + compact header) */
const WORKSPACE_LG_HEIGHT = 'lg:h-[calc(100dvh-10rem)] lg:max-h-[calc(100dvh-10rem)]'

function apiErr(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as
      | {
          message?: string
          validation?: { missing?: string[]; unknown?: string[] }
        }
      | undefined
    if (d?.validation && (d.validation.missing?.length || d.validation.unknown?.length)) {
      const bits: string[] = []
      if (d.validation.missing?.length) bits.push(`Missing: ${d.validation.missing.join(', ')}`)
      if (d.validation.unknown?.length) bits.push(`Unknown: ${d.validation.unknown.join(', ')}`)
      return `${d?.message || 'Validation failed'} (${bits.join('; ')})`
    }
    if (d?.message && typeof d.message === 'string') return d.message
    return e.message
  }
  return e instanceof Error ? e.message : String(e)
}

export default function EmailTemplatesManagement() {
  const { toast } = useToast()
  const [list, setList] = useState<TemplateListItem[]>([])
  const [listQuery, setListQuery] = useState('')
  const [loadingList, setLoadingList] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof CMSService.getEmailTemplate>> | null>(null)
  const [editorHtml, setEditorHtml] = useState('')
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [validationHints, setValidationHints] = useState<{ missing: string[]; unknown: string[] } | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [mjmlMode, setMjmlMode] = useState(false)
  const [skipPlaceholderValidation, setSkipPlaceholderValidation] = useState(false)
  const [allowUnknownPlaceholders, setAllowUnknownPlaceholders] = useState(false)
  const [changeNote, setChangeNote] = useState('')
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof CMSService.listEmailTemplateVersions>>>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [workspaceTab, setWorkspaceTab] = useState<'source' | 'preview'>('source')
  const isXlUp = useMediaQuery('(min-width: 1280px)')

  const filteredList = useMemo(() => {
    const q = listQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.filename.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    )
  }, [list, listQuery])

  const refreshList = async () => {
    setLoadingList(true)
    try {
      const data = await CMSService.listEmailTemplates()
      setList(data)
      setSelectedId((prev) => prev ?? (data[0]?.id ?? null))
    } catch (e: unknown) {
      toast({ title: 'Error', description: apiErr(e), variant: 'destructive' })
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    void refreshList()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial catalog load only
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    ;(async () => {
      setLoadingDetail(true)
      setPreviewHtml(null)
      setValidationHints(null)
      setWorkspaceTab('source')
      try {
        const d = await CMSService.getEmailTemplate(selectedId)
        if (cancelled) return
        setDetail(d)
        setEditorHtml(d.html)
      } catch (e: unknown) {
        toast({ title: 'Error', description: apiErr(e), variant: 'destructive' })
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId, toast])

  useEffect(() => {
    if (!selectedId) {
      setVersions([])
      return
    }
    let cancelled = false
    setVersionsLoading(true)
    void (async () => {
      try {
        const v = await CMSService.listEmailTemplateVersions(selectedId)
        if (!cancelled) setVersions(v)
      } catch {
        if (!cancelled) setVersions([])
      } finally {
        if (!cancelled) setVersionsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedId])

  const selectedSummary = useMemo(() => list.find((t) => t.id === selectedId), [list, selectedId])

  const runPreview = async () => {
    if (!selectedId) return
    setPreviewLoading(true)
    try {
      const data = await CMSService.previewEmailTemplate(selectedId, {
        htmlDraft: editorHtml,
        sourceFormat: mjmlMode ? 'mjml' : 'html',
      })
      setPreviewHtml(data.html)
      setValidationHints(data.validationHints ?? null)
      const h = data.validationHints
      if (h && (h.missing.length || h.unknown.length)) {
        toast({
          title: 'Preview ready — check placeholders',
          description:
            [h.missing.length ? `Missing: ${h.missing.join(', ')}` : '', h.unknown.length ? `Unknown: ${h.unknown.join(', ')}` : '']
              .filter(Boolean)
              .join(' · ') || undefined,
        })
      } else {
        toast({ title: 'Preview updated', description: 'Rendered with sample data from the server.' })
      }
      if (!isXlUp) {
        setWorkspaceTab('preview')
      }
    } catch (e: unknown) {
      toast({ title: 'Preview error', description: apiErr(e), variant: 'destructive' })
    } finally {
      setPreviewLoading(false)
    }
  }

  const saveOverride = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await CMSService.saveEmailTemplateOverride(selectedId, {
        htmlBody: editorHtml,
        sourceFormat: mjmlMode ? 'mjml' : 'html',
        skipPlaceholderValidation,
        allowUnknownPlaceholders,
        changeNote: changeNote.trim() || undefined,
      })
      toast({
        title: 'Saved',
        description: mjmlMode ? 'MJML was compiled to HTML for storage and sending.' : 'Outgoing mail will use this HTML.',
      })
      setChangeNote('')
      await refreshList()
      const d = await CMSService.getEmailTemplate(selectedId)
      setDetail(d)
      setEditorHtml(d.html)
      const v = await CMSService.listEmailTemplateVersions(selectedId)
      setVersions(v)
    } catch (e: unknown) {
      toast({ title: 'Error', description: apiErr(e), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const revertDefault = async () => {
    if (!selectedId) return
    setSaving(true)
    try {
      await CMSService.revertEmailTemplateToDefault(selectedId)
      toast({ title: 'Reverted', description: 'Built-in file template is active again (prior override snapshotted).' })
      const d = await CMSService.getEmailTemplate(selectedId)
      setDetail(d)
      setEditorHtml(d.html)
      setPreviewHtml(null)
      setValidationHints(null)
      await refreshList()
      const v = await CMSService.listEmailTemplateVersions(selectedId)
      setVersions(v)
    } catch (e: unknown) {
      toast({ title: 'Error', description: apiErr(e), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const restoreVersion = async (versionId: string) => {
    if (!selectedId) return
    setRestoringId(versionId)
    try {
      await CMSService.restoreEmailTemplateVersion(selectedId, versionId)
      toast({ title: 'Restored', description: 'That snapshot is now the live override.' })
      const d = await CMSService.getEmailTemplate(selectedId)
      setDetail(d)
      setEditorHtml(d.html)
      setPreviewHtml(null)
      await refreshList()
      const v = await CMSService.listEmailTemplateVersions(selectedId)
      setVersions(v)
    } catch (e: unknown) {
      toast({ title: 'Restore failed', description: apiErr(e), variant: 'destructive' })
    } finally {
      setRestoringId(null)
    }
  }

  const loadRepoBaseline = () => {
    if (!detail) return
    setEditorHtml(detail.fileBaselineHtml)
    setPreviewHtml(null)
    setValidationHints(null)
    toast({
      title: 'Baseline loaded',
      description: 'Editor shows the repository default. Save to publish as a custom override.',
    })
  }

  const previewPanel = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border bg-white dark:bg-zinc-950">
      {previewHtml ? (
        <iframe title="Email preview" className="min-h-0 flex-1 w-full border-0" sandbox="" srcDoc={previewHtml} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
          <Eye className="h-8 w-8 opacity-40" aria-hidden />
          <p>
            Run <span className="font-medium text-foreground">Preview</span> to render this template with sample data from the
            server.
          </p>
        </div>
      )}
    </div>
  )

  const sourceLabel = mjmlMode ? 'MJML source' : 'HTML source'

  const editorField = (
    <textarea
      id="email-html-editor"
      className="box-border min-h-0 w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-[13px] leading-relaxed outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
      spellCheck={false}
      value={editorHtml}
      onChange={(e) => setEditorHtml(e.target.value)}
      aria-label={sourceLabel}
    />
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title="Email templates"
        subtitle="Edit transactional messages, preview with sample data, then publish. Overrides are versioned."
        icon={<Mail className="h-6 w-6 text-primary" aria-hidden />}
      />

      <details className="group mb-4 rounded-lg border border-border/80 bg-muted/40 px-4 py-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-foreground outline-none marker:hidden [&::-webkit-details-marker]:hidden">
          <HelpCircle className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>How this screen works</span>
          <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <ul className="mt-3 space-y-2 pl-6 text-muted-foreground marker:text-muted-foreground [&>li]:list-disc">
          <li>
            Pick a template on the left, edit <strong className="text-foreground">HTML</strong> or{' '}
            <strong className="text-foreground">MJML</strong>, then <strong className="text-foreground">Preview</strong> before
            saving.
          </li>
          <li>
            <strong className="text-foreground">Save</strong> stores your override and snapshots the previous version.{' '}
            <strong className="text-foreground">Revert</strong> restores the built-in file from the repo.
          </li>
          <li>
            Merge tags must match the registry unless you expand &quot;Advanced save options&quot; to relax validation.
          </li>
        </ul>
      </details>

      <div
        className={cn(
          'grid min-h-[min(560px,calc(100dvh-12rem))] flex-1 grid-cols-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(260px,300px)_1fr]',
          WORKSPACE_LG_HEIGHT,
        )}
      >
        {/* Template catalog */}
        <aside className="flex max-h-72 min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm lg:max-h-none lg:min-h-0">
          <div className="shrink-0 border-b px-3 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search templates…"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                className="h-9 pl-9"
                aria-label="Search templates"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {loadingList ? 'Loading…' : `${filteredList.length} of ${list.length} shown`}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loadingList ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredList.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">No templates match your search.</p>
            ) : (
              <ul className="space-y-0.5">
                {filteredList.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        selectedId === t.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted/80',
                      )}
                    >
                      <div className="font-medium leading-snug">{t.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {t.hasCustom ? (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] font-normal',
                              selectedId === t.id && 'bg-primary-foreground/20 text-primary-foreground',
                            )}
                          >
                            Custom
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-normal',
                              selectedId === t.id && 'border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground',
                            )}
                          >
                            Default
                          </Badge>
                        )}
                        <span
                          className={cn(
                            'truncate font-mono text-[10px] opacity-80',
                            selectedId === t.id && 'text-primary-foreground/90',
                          )}
                        >
                          {t.filename}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Editor workspace */}
        <section className="flex min-h-[min(420px,45vh)] flex-col gap-0 overflow-hidden rounded-xl border bg-card shadow-sm lg:min-h-0">
          {loadingDetail || !detail ? (
            <div className="flex flex-1 items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Primary toolbar */}
              <div className="shrink-0 space-y-3 border-b bg-muted/20 px-4 py-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h2 className="text-lg font-semibold leading-tight tracking-tight">{detail.title}</h2>
                    <p className="text-sm text-muted-foreground">{detail.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={detail.activeSource === 'database' ? 'default' : 'outline'}>
                        {detail.activeSource === 'database' ? 'Live: database override' : 'Live: built-in file'}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs font-normal">
                        {detail.filename}
                      </Badge>
                      {mjmlMode ? <Badge variant="secondary">MJML → HTML</Badge> : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5">
                      <Checkbox id="mjml-mode-toolbar" checked={mjmlMode} onCheckedChange={(v) => setMjmlMode(v === true)} />
                      <Label htmlFor="mjml-mode-toolbar" className="cursor-pointer text-xs font-normal">
                        MJML
                      </Label>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void runPreview()} disabled={previewLoading}>
                      {previewLoading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Eye className="mr-1.5 h-4 w-4" />
                      )}
                      Preview
                    </Button>
                    <Button type="button" size="sm" onClick={() => void saveOverride()} disabled={saving}>
                      {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                      Save
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="px-2.5" aria-label="More actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={loadRepoBaseline}>
                          <Code2 className="mr-2 h-4 w-4" />
                          Load repo default into editor
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => void revertDefault()}
                          disabled={saving || !selectedSummary?.hasCustom}
                          className="text-destructive focus:text-destructive"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Revert to built-in file
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {validationHints && (validationHints.missing.length > 0 || validationHints.unknown.length > 0) ? (
                  <div
                    className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-foreground"
                    role="status"
                  >
                    {validationHints.missing.length > 0 ? (
                      <p>
                        <span className="font-semibold">Missing placeholders:</span> {validationHints.missing.join(', ')}
                      </p>
                    ) : null}
                    {validationHints.unknown.length > 0 ? (
                      <p className={validationHints.missing.length > 0 ? 'mt-1' : ''}>
                        <span className="font-semibold">Unknown placeholders:</span> {validationHints.unknown.join(', ')}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Merge tags (registry)</p>
                  <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
                    {detail.placeholders.map((p) => (
                      <code
                        key={p}
                        className="shrink-0 rounded-md border bg-background px-2 py-1 font-mono text-[11px] text-foreground"
                      >
                        {`{{${p}}}`}
                      </code>
                    ))}
                  </div>
                </div>

                <details className="rounded-lg border bg-background/80">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium outline-none marker:hidden [&::-webkit-details-marker]:hidden">
                    Advanced save options
                    <span className="ml-2 font-normal text-muted-foreground">(validation, change note)</span>
                  </summary>
                  <div className="space-y-3 border-t px-3 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="skip-val"
                          checked={skipPlaceholderValidation}
                          onCheckedChange={(v) => setSkipPlaceholderValidation(v === true)}
                        />
                        <Label htmlFor="skip-val" className="cursor-pointer text-sm font-normal">
                          Skip placeholder validation on save
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="allow-unknown"
                          checked={allowUnknownPlaceholders}
                          onCheckedChange={(v) => setAllowUnknownPlaceholders(v === true)}
                        />
                        <Label htmlFor="allow-unknown" className="cursor-pointer text-sm font-normal">
                          Allow unknown {'{{placeholders}}'}
                        </Label>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="change-note" className="text-xs text-muted-foreground">
                        Change note (stored on the snapshot that gets replaced)
                      </Label>
                      <Input
                        id="change-note"
                        placeholder="e.g. Updated CTA for Diwali campaign"
                        value={changeNote}
                        onChange={(e) => setChangeNote(e.target.value)}
                        className="mt-1.5 h-9"
                      />
                    </div>
                  </div>
                </details>
              </div>

              {/* Editor + preview: tabs on smaller screens, split on xl+ */}
              <div className="flex min-h-0 flex-1 flex-col">
                {isXlUp ? (
                  <PanelGroup
                    autoSaveId="fixer-admin-cms-email-templates"
                    direction="horizontal"
                    className="flex min-h-0 flex-1"
                  >
                    <Panel defaultSize={52} minSize={22} className="min-h-0 min-w-0">
                      <div className="flex h-full min-h-0 flex-col border-r border-border p-4">
                        <label
                          className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          htmlFor="email-html-editor"
                        >
                          {sourceLabel}
                        </label>
                        {editorField}
                      </div>
                    </Panel>
                    <PanelResizeHandle
                      hitAreaMargins={{ fine: 10, coarse: 16 }}
                      className={cn(
                        'group relative flex w-2 shrink-0 items-center justify-center outline-none',
                        'bg-border/90 transition-colors hover:bg-primary/35',
                        'focus-visible:z-10 focus-visible:bg-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                        'data-[resize-handle-state=drag]:bg-primary/45',
                      )}
                      aria-label="Resize editor and preview"
                    >
                      <span
                        className={cn(
                          'pointer-events-none flex h-14 w-5 items-center justify-center rounded-md',
                          'border border-border/80 bg-muted/95 shadow-sm',
                          'text-muted-foreground group-hover:text-foreground',
                          'group-data-[resize-handle-state=drag]:text-foreground',
                        )}
                      >
                        <GripVertical className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      </span>
                    </PanelResizeHandle>
                    <Panel defaultSize={48} minSize={22} className="min-h-0 min-w-0 bg-muted/10">
                      <div className="flex h-full min-h-0 flex-col p-4">
                        <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Preview (sandboxed)
                        </span>
                        {previewPanel}
                      </div>
                    </Panel>
                  </PanelGroup>
                ) : (
                  <Tabs
                    value={workspaceTab}
                    onValueChange={(v) => setWorkspaceTab(v as 'source' | 'preview')}
                    className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3"
                  >
                    <TabsList className="grid w-full max-w-md shrink-0 grid-cols-2">
                      <TabsTrigger value="source">{mjmlMode ? 'MJML' : 'HTML'}</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="source" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
                      <label
                        className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                        htmlFor="email-html-editor"
                      >
                        {sourceLabel}
                      </label>
                      {editorField}
                    </TabsContent>
                    <TabsContent value="preview" className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
                      <span className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Preview (sandboxed)
                      </span>
                      {previewPanel}
                    </TabsContent>
                  </Tabs>
                )}
              </div>

              <Separator />

              <details className="group shrink-0 border-t bg-muted/10 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium outline-none marker:hidden [&::-webkit-details-marker]:hidden">
                  <History className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">Version history</span>
                  <Badge variant="secondary" className="shrink-0 font-normal">
                    {versions.length}
                  </Badge>
                  <span className="min-w-[1rem] flex-1" />
                  {versionsLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                  ) : null}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-xs text-muted-foreground">
                  Each save, restore, or revert keeps the prior override as a snapshot (up to 50 per template).
                </p>
                {versions.length === 0 && !versionsLoading ? (
                  <p className="mt-3 text-sm text-muted-foreground">No snapshots yet for this template.</p>
                ) : (
                  <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto lg:max-h-64">
                    {versions.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString()}</div>
                          {row.changeNote ? <div className="mt-0.5 text-sm font-medium">{row.changeNote}</div> : null}
                          <div className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{row.previewSnippet}</div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                          disabled={restoringId === row.id || !selectedId}
                          onClick={() => void restoreVersion(row.id)}
                        >
                          {restoringId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restore'}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
