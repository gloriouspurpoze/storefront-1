import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Tldraw,
  type TLStoreSnapshot,
  createTLStore,
  defaultAssetUtils,
  defaultBindingUtils,
  defaultShapeUtils,
  type TLAssetStore,
} from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { getSnapshot, loadSnapshot } from '@tldraw/editor'
import { BoardsService } from '../../services/api/boards.service'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  VStack,
  useToast,
} from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'
import { Download, ExternalLink, GripVertical, Image as ImageIcon, Loader2, Save, Trash2, Users } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { usePermissions } from '../../hooks/usePermissions'
import { cn } from '../../lib/utils'

/**
 * Board canvas uses tldraw (MIT open source: https://github.com/tldraw/tldraw).
 * We persist via REST (`state.tldraw` document snapshot) — no WebSocket sync / IndexedDB
 * persistence, which was causing schema errors with mismatched or corrupt multiplayer data.
 */
type BoardPersistState = {
  version: number
  tldraw?: TLStoreSnapshot
  meetingNotes: { text: string }
}

const EMPTY_PERSIST: BoardPersistState = { version: 1, meetingNotes: { text: '' } }

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function boardAuthGate(boardId: string | null) {
  if (!boardId) return <div className="p-6">Invalid board.</div>
  if (!localStorage.getItem('token')) return <div className="p-6">Please sign in again (missing token).</div>
  return null
}

export function BoardRoomSync() {
  const { id } = useParams()
  const boardId = id || null
  const { toast } = useToast()
  const gate = boardAuthGate(boardId)
  if (gate) return gate
  return <BoardRoomSyncInner boardId={boardId!} layout="default" toast={toast} />
}

/** Full-viewport canvas in a new route (also opened via “Canvas in new tab”). */
export function BoardCanvasFullPage() {
  const { id } = useParams()
  const boardId = id || null
  const { toast } = useToast()
  const gate = boardAuthGate(boardId)
  if (gate) return gate
  return <BoardRoomSyncInner boardId={boardId!} layout="canvasOnly" toast={toast} />
}

function BoardRoomSyncInner(props: {
  boardId: string
  layout: 'default' | 'canvasOnly'
  toast: ReturnType<typeof useToast>['toast']
}) {
  const { boardId, layout, toast } = props

  const [loadingMeta, setLoadingMeta] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState('Board')
  const [memberRole, setMemberRole] = React.useState<'owner' | 'editor' | 'viewer'>('viewer')

  const navigate = useNavigate()
  const { checkPermission } = usePermissions()
  const canEdit = memberRole === 'owner' || memberRole === 'editor'
  const canInviteBoard = canEdit && checkPermission('invite_board_members')

  const [persistState, setPersistState] = React.useState<BoardPersistState>(EMPTY_PERSIST)
  const [saving, setSaving] = React.useState(false)
  const [titleDraft, setTitleDraft] = React.useState(title)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const applyingRemoteRef = React.useRef(false)

  const assets: TLAssetStore = React.useMemo(() => {
    return {
      async upload(_asset: any, file: File) {
        const r = await BoardsService.uploadAsset(boardId, file)
        if (!r.success || !r.data?.src) throw new Error(r.message || 'Upload failed')
        return { src: r.data.src }
      },
      resolve(asset: any) {
        return asset.props.src
      },
    } as TLAssetStore
  }, [boardId])

  const store = React.useMemo(
    () =>
      createTLStore({
        shapeUtils: defaultShapeUtils,
        bindingUtils: defaultBindingUtils,
        assetUtils: defaultAssetUtils,
        assets,
      }),
    [assets],
  )

  React.useEffect(() => {
    setTitleDraft(title)
  }, [title])

  const loadBoard = React.useCallback(async () => {
    setLoadError(null)
    setLoadingMeta(true)
    try {
      const r = await BoardsService.getOne(boardId)
      if (!r.success || !r.data) throw new Error(r.message || 'Failed to load board')
      setTitle(r.data.title)
      setMemberRole(r.data.memberRole)
      const s = (r.data.state || {}) as Record<string, unknown>
      const next: BoardPersistState = {
        version: typeof s.version === 'number' ? s.version : 1,
        tldraw: (s as { tldraw?: TLStoreSnapshot }).tldraw,
        meetingNotes:
          (s as { meetingNotes?: { text?: unknown } }).meetingNotes?.text != null
            ? { text: String((s as { meetingNotes: { text: unknown } }).meetingNotes.text) }
            : { text: '' },
      }
      setPersistState(next)
      if (next.tldraw) {
        applyingRemoteRef.current = true
        try {
          loadSnapshot(store, { document: next.tldraw } as any, { forceOverwriteSessionState: true } as any)
        } catch (e) {
          console.warn('[board] Ignoring invalid tldraw snapshot', e)
          toast({
            title: 'Canvas reset',
            description: 'Saved drawing data was unreadable. Starting with a blank canvas.',
            variant: 'destructive',
          })
        }
        applyingRemoteRef.current = false
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load board')
    } finally {
      setLoadingMeta(false)
    }
  }, [boardId, setMemberRole, setTitle, store, toast])

  React.useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  const saveNow = React.useCallback(
    async (next: BoardPersistState) => {
      if (!canEdit) return
      setSaving(true)
      try {
        const snap = getSnapshot(store)
        const payload: BoardPersistState = {
          ...next,
          tldraw: snap.document,
          version: (next.version || 0) + 1,
        }
        setPersistState(payload)
        await BoardsService.saveState(boardId, payload as any)
      } catch (e) {
        toast({ title: 'Save', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' })
      } finally {
        setSaving(false)
      }
    },
    [boardId, canEdit, store, toast],
  )

  const debouncedSaveRef = React.useRef<number | null>(null)
  const scheduleSave = React.useCallback(
    (next: BoardPersistState) => {
      if (!canEdit) return
      if (debouncedSaveRef.current) window.clearTimeout(debouncedSaveRef.current)
      debouncedSaveRef.current = window.setTimeout(() => {
        void saveNow(next)
      }, 700)
    },
    [canEdit, saveNow],
  )

  React.useEffect(() => {
    if (!canEdit) return
    const unsubscribe = store.listen(() => {
      if (applyingRemoteRef.current) return
      scheduleSave(persistState)
    })
    return () => {
      unsubscribe()
    }
  }, [store, canEdit, persistState, scheduleSave])

  const commitTitle = async () => {
    const t = titleDraft.trim()
    if (!t) {
      setTitleDraft(title)
      return
    }
    if (t === title || !canEdit) return
    try {
      const r = await BoardsService.update(boardId, { title: t })
      if (!r.success) throw new Error(r.message || 'Failed to rename')
      setTitle(t)
      toast({ title: 'Board updated', description: 'Name saved.' })
    } catch (e) {
      setTitleDraft(title)
      toast({
        title: 'Rename failed',
        description: e instanceof Error ? e.message : 'Could not save name',
        variant: 'destructive',
      })
    }
  }

  const runDeleteBoard = async () => {
    setDeleting(true)
    try {
      const r = await BoardsService.remove(boardId)
      if (!r.success) throw new Error(r.message || 'Failed to delete')
      toast({ title: 'Board deleted' })
      navigate('/boards')
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Could not delete board',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const onNotesChange = (text: string) => {
    if (!canEdit) return
    const next = { ...persistState, meetingNotes: { text } }
    setPersistState(next)
    scheduleSave(next)
  }

  const [exportFormat, setExportFormat] = React.useState<'png' | 'jpeg' | 'webp' | 'svg'>('png')
  const [exportPixelRatio, setExportPixelRatio] = React.useState<number>(2)
  const [exportSelectionOnly, setExportSelectionOnly] = React.useState(false)
  const [jpegQualityPct, setJpegQualityPct] = React.useState(92)

  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<'editor' | 'viewer'>('editor')
  const [inviting, setInviting] = React.useState(false)

  const isWide = useMediaQuery('(min-width: 1024px)')

  const getExportShapeIds = (editor: any) => {
    if (!exportSelectionOnly) return []
    const ids = editor?.getSelectedShapeIds?.() as string[] | undefined
    if (!ids?.length) {
      throw new Error('Select shapes first, or turn off “Selection only”.')
    }
    return ids
  }

  const sendBoardInvite = async () => {
    const email = inviteEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      toast({ title: 'Invite', description: 'Enter a valid email address.', variant: 'destructive' })
      return
    }
    setInviting(true)
    try {
      const r = await BoardsService.invite(boardId, email, inviteRole)
      if (!r.success) throw new Error(r.message || 'Could not create invite')
      const d = r.data as { acceptPath?: string; token?: string; alreadyMember?: boolean } | undefined
      if (d?.alreadyMember) {
        toast({ title: 'Already on board', description: 'That person is already a member.' })
        setInviteEmail('')
        return
      }
      const path = d?.acceptPath || (d?.token ? `/boards/invites/${d.token}` : '')
      const link = path ? `${window.location.origin}${path}` : ''
      toast({
        title: 'Invite ready',
        description: link
          ? `Share this link with them: ${link}`
          : 'They can accept from their email or invite link.',
      })
      setInviteEmail('')
    } catch (e) {
      toast({
        title: 'Invite failed',
        description: e instanceof Error ? e.message : 'Could not send invite',
        variant: 'destructive',
      })
    } finally {
      setInviting(false)
    }
  }

  const runRasterExport = async (format: 'png' | 'jpeg' | 'webp') => {
    const editor = (window as any).__tldrawEditor as any
    if (!editor?.toImage) throw new Error('Editor not ready')
    const shapes = getExportShapeIds(editor)
    return editor.toImage(shapes, {
      format,
      background: true,
      pixelRatio: exportPixelRatio,
      quality: format === 'jpeg' ? jpegQualityPct / 100 : undefined,
    })
  }

  const boardCanvas = (
    <div className={`h-full w-full min-h-[360px] ${!canEdit ? 'pointer-events-none' : ''}`}>
      <Tldraw
        className="h-full w-full"
        store={store}
        onMount={(editor) => {
          ;(window as any).__tldrawEditor = editor
        }}
      />
    </div>
  )

  const openCanvasInNewTab = React.useCallback(() => {
    window.open(`${window.location.origin}/boards/${boardId}/canvas`, '_blank', 'noopener,noreferrer')
  }, [boardId])

  const loadingShell = (className: string) => (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-muted-foreground', className)}>
      <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm">Loading board…</p>
    </div>
  )

  const errorShell = (className: string) => (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-6 text-center', className)}>
      <p className="max-w-md text-sm text-destructive">{loadError}</p>
      <Button type="button" variant="outline" onClick={() => void loadBoard()}>
        Try again
      </Button>
      {layout === 'canvasOnly' ? (
        <Button type="button" variant="ghost" asChild>
          <Link to={`/boards/${boardId}`}>Open full board page</Link>
        </Button>
      ) : null}
    </div>
  )

  if (loadError) {
    if (layout === 'canvasOnly') {
      return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {errorShell('flex-1')}
        </div>
      )
    }
    return (
      <div className="p-6">
        {errorShell('mx-auto min-h-[50vh] w-full max-w-md')}
      </div>
    )
  }

  if (loadingMeta) {
    if (layout === 'canvasOnly') {
      return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {loadingShell('flex-1')}
        </div>
      )
    }
    return <div className="p-6">{loadingShell('min-h-[50vh] w-full')}</div>
  }

  if (layout === 'canvasOnly') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex shrink-0 items-center gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/boards">All boards</Link>
          </Button>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to={`/boards/${boardId}`}>Details & notes</Link>
          </Button>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{title}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!canEdit || saving}
            onClick={() => void saveNow(persistState)}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </header>
        <div className="relative min-h-0 flex-1">{boardCanvas}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <VStack spacing={6}>
        <PageHeader
          title={loadingMeta ? 'Board' : title}
          subtitle={
            loadingMeta
              ? 'Loading…'
              : `Role: ${memberRole} · Autosave · tldraw (open source)`
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-lg">
            <Label htmlFor="board-title-input">Board name</Label>
            <Input
              id="board-title-input"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => void commitTitle()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              disabled={!canEdit || loadingMeta}
              placeholder="Board title"
            />
            <p className="text-xs text-muted-foreground">Press Enter or click away to save.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {memberRole === 'owner' ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => setDeleteOpen(true)}
                disabled={loadingMeta}
              >
                <Trash2 className="h-4 w-4" />
                Delete board
              </Button>
            ) : null}
          </div>
        </div>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this board?</DialogTitle>
              <DialogDescription>
                This removes the board for everyone in your organization. Canvas snapshots and meeting notes on the server
                will be deleted. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => void runDeleteBoard()} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" disabled={!canEdit || saving} onClick={() => void saveNow(persistState)}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save now'}
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => openCanvasInNewTab()}>
                <ExternalLink className="h-4 w-4" />
                Canvas in new tab
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  try {
                    const editor = (window as any).__tldrawEditor as any
                    if (!editor?.toImage) throw new Error('Editor not ready')
                    if (exportFormat === 'svg') {
                      const shapes = getExportShapeIds(editor)
                      const result = await editor.toImage(shapes, {
                        format: 'svg',
                        background: true,
                        scale: 1,
                      })
                      if (!result?.blob) throw new Error('Export failed')
                      downloadBlob(result.blob, `${title || 'board'}.svg`)
                      return
                    }
                    const result = await runRasterExport(exportFormat)
                    if (!result?.blob) throw new Error('Export failed')
                    const ext = exportFormat === 'jpeg' ? 'jpg' : exportFormat
                    downloadBlob(result.blob, `${title || 'board'}.${ext}`)
                  } catch (e) {
                    toast({
                      title: 'Export',
                      description: e instanceof Error ? e.message : 'Failed',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                <ImageIcon className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={async () => {
                  try {
                    const result = await runRasterExport('png')
                    if (!result?.blob) throw new Error('Export failed')
                    const { jsPDF } = await import('jspdf')
                    const pngUrl = URL.createObjectURL(result.blob)
                    const img = new Image()
                    await new Promise<void>((resolve, reject) => {
                      img.onload = () => resolve()
                      img.onerror = () => reject(new Error('Failed to load export'))
                      img.src = pngUrl
                    })
                    const pdf = new jsPDF({
                      orientation: img.width >= img.height ? 'l' : 'p',
                      unit: 'px',
                      format: [img.width, img.height],
                    })
                    pdf.addImage(img, 'PNG', 0, 0, img.width, img.height)
                    const out = pdf.output('blob')
                    downloadBlob(out, `${title || 'board'}.pdf`)
                    URL.revokeObjectURL(pngUrl)
                  } catch (e) {
                    toast({ title: 'Export PDF', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' })
                  }
                }}
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/20 p-3 text-sm">
              <div className="grid gap-1.5">
                <Label className="text-xs">Format</Label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as typeof exportFormat)}>
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Pixel ratio</Label>
                <Select
                  value={String(exportPixelRatio)}
                  onValueChange={(v) => setExportPixelRatio(Number(v))}
                  disabled={exportFormat === 'svg'}
                >
                  <SelectTrigger className="h-8 w-[88px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1×</SelectItem>
                    <SelectItem value="2">2×</SelectItem>
                    <SelectItem value="3">3×</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {exportFormat === 'jpeg' ? (
                <div className="grid gap-1.5">
                  <Label className="text-xs">JPEG quality</Label>
                  <Select value={String(jpegQualityPct)} onValueChange={(v) => setJpegQualityPct(Number(v))}>
                    <SelectTrigger className="h-8 w-[88px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="85">85%</SelectItem>
                      <SelectItem value="92">92%</SelectItem>
                      <SelectItem value="97">97%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <label className="flex cursor-pointer items-center gap-2 pb-1">
                <Checkbox checked={exportSelectionOnly} onCheckedChange={(c) => setExportSelectionOnly(c === true)} />
                <span className="text-xs text-muted-foreground">Selection only</span>
              </label>
            </div>
          </div>

        </div>

        <PanelGroup
          direction={isWide ? 'horizontal' : 'vertical'}
          className="min-h-[min(72vh,680px)] w-full lg:min-h-[calc(100dvh-14rem)]"
        >
          <Panel defaultSize={62} minSize={isWide ? 38 : 25} className="min-h-0 min-w-0">
            <Card className="flex h-full min-h-0 flex-col border-0 shadow-sm ring-1 ring-border/60">
              <CardHeader className="shrink-0 pb-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>Canvas</CardTitle>
                    <CardDescription>
                      tldraw — MIT license. Toolbar: draw, shapes, text, notes, images, and more. Your work autosaves to the
                      server.
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => openCanvasInNewTab()}>
                    <ExternalLink className="h-4 w-4" />
                    Full screen
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 pt-0">
                <div className="h-full min-h-[380px] w-full overflow-hidden rounded-md border bg-background">{boardCanvas}</div>
              </CardContent>
            </Card>
          </Panel>

          <PanelResizeHandle
            hitAreaMargins={{ fine: 10, coarse: 16 }}
            className={cn(
              'group relative flex shrink-0 outline-none',
              isWide
                ? 'w-2 items-center justify-center bg-border/80 transition-colors hover:bg-primary/30 data-[resize-handle-state=drag]:bg-primary/40'
                : 'h-3 w-full flex-col items-center justify-center bg-border/80 py-0.5 transition-colors hover:bg-primary/30 data-[resize-handle-state=drag]:bg-primary/40',
            )}
            aria-label="Resize canvas and meeting notes"
          >
            <span
              className={cn(
                'pointer-events-none flex items-center justify-center rounded-md border border-border/80 bg-muted/90 text-muted-foreground shadow-sm group-hover:text-foreground',
                isWide ? 'h-16 w-5' : 'h-5 w-16',
              )}
            >
              <GripVertical className={cn('h-4 w-4 shrink-0 opacity-70', !isWide && 'rotate-90')} aria-hidden />
            </span>
          </PanelResizeHandle>

          <Panel defaultSize={38} minSize={isWide ? 22 : 20} className="min-h-0 min-w-0">
            <Card className="flex h-full min-h-0 flex-col border-0 shadow-sm ring-1 ring-border/60">
              <CardHeader className="shrink-0 pb-2">
                <CardTitle>Meeting notes</CardTitle>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto pt-0">
                <Textarea
                  value={persistState.meetingNotes.text}
                  onChange={(e) => onNotesChange(e.target.value)}
                  disabled={!canEdit}
                  className="min-h-[120px] flex-1 resize-none"
                  placeholder="Agenda, decisions, action items…"
                />
                <p className="text-xs text-muted-foreground">Version {persistState.version} · autosaved while you edit</p>

                <div id="board-invite" className="space-y-2 rounded-md border bg-muted/10 p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    Invite someone by email
                  </div>
                  {!canEdit ? (
                    <p className="text-xs text-muted-foreground">Only owners and editors can invite people to this board.</p>
                  ) : !canInviteBoard ? (
                    <p className="text-xs text-muted-foreground">
                      Your account needs the <span className="font-medium text-foreground">invite board members</span> permission.
                      Ask an administrator to grant it.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <div className="grid min-w-0 flex-1 gap-1.5">
                          <Label htmlFor="board-invite-email" className="text-xs">
                            Email
                          </Label>
                          <Input
                            id="board-invite-email"
                            type="email"
                            autoComplete="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                void sendBoardInvite()
                              }
                            }}
                          />
                        </div>
                        <div className="grid w-full gap-1.5 sm:w-[140px]">
                          <Label htmlFor="board-invite-role" className="text-xs">
                            Role
                          </Label>
                          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'editor' | 'viewer')}>
                            <SelectTrigger id="board-invite-role" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          className="w-full shrink-0 sm:w-auto"
                          disabled={inviting}
                          onClick={() => void sendBoardInvite()}
                        >
                          {inviting ? 'Sending…' : 'Send invite'}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We&apos;ll give you a link to share. They must sign in with the invited email to accept.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </Panel>
        </PanelGroup>
      </VStack>
    </div>
  )
}
