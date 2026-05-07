import React from 'react'
import { useParams } from 'react-router-dom'
import {
  Tldraw,
  type TLStoreSnapshot,
  createTLStore,
  defaultAssetUtils,
  defaultBindingUtils,
  defaultShapeUtils,
} from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import { getSnapshot, loadSnapshot } from '@tldraw/editor'
import { BoardsService } from '../../services/api/boards.service'
import { useBoardsSocket } from '../../hooks/useBoardsSocket'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, VStack, useToast } from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'
import { Save, Users } from 'lucide-react'

type BoardState = {
  version: number
  tldraw?: TLStoreSnapshot
  meetingNotes: { text: string }
}

const EMPTY_STATE: BoardState = { version: 1, meetingNotes: { text: '' } }

export function BoardRoom() {
  const { id } = useParams()
  const boardId = id || null
  const { toast } = useToast()

  const { socket, isConnected } = useBoardsSocket(boardId)

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [title, setTitle] = React.useState<string>('Board')
  const [memberRole, setMemberRole] = React.useState<'owner' | 'editor' | 'viewer'>('viewer')
  const [state, setState] = React.useState<BoardState>(EMPTY_STATE)

  const canEdit = memberRole === 'owner' || memberRole === 'editor'

  const store = React.useMemo(
    () =>
      createTLStore({
        shapeUtils: defaultShapeUtils,
        bindingUtils: defaultBindingUtils,
        assetUtils: defaultAssetUtils,
      }),
    [],
  )
  const applyingRemoteRef = React.useRef(false)

  const load = React.useCallback(async () => {
    if (!boardId) return
    setLoading(true)
    try {
      const r = await BoardsService.getOne(boardId)
      if (!r.success || !r.data) throw new Error(r.message || 'Failed to load board')
      setTitle(r.data.title)
      setMemberRole(r.data.memberRole)
      const s = (r.data.state || {}) as Partial<BoardState>
      const next: BoardState = {
        version: typeof s.version === 'number' ? s.version : 1,
        tldraw: (s as any).tldraw as TLStoreSnapshot | undefined,
        meetingNotes: (s as any).meetingNotes?.text != null ? { text: String((s as any).meetingNotes.text) } : { text: '' },
      }
      setState(next)
      if (next.tldraw) {
        applyingRemoteRef.current = true
        loadSnapshot(store, { document: next.tldraw } as any, { forceOverwriteSessionState: true } as any)
        applyingRemoteRef.current = false
      }
    } catch (e) {
      toast({ title: 'Board', description: e instanceof Error ? e.message : 'Failed to load', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [boardId, toast])

  React.useEffect(() => {
    void load()
  }, [load])

  // Realtime: apply remote state
  React.useEffect(() => {
    if (!socket) return
    const onState = (payload: any) => {
      if (!payload || payload.boardId !== boardId) return
      const s = payload.state as Partial<BoardState>
      if (!s) return
      const next: BoardState = {
        version: typeof s.version === 'number' ? s.version : 1,
        tldraw: (s as any).tldraw as TLStoreSnapshot | undefined,
        meetingNotes: (s as any).meetingNotes?.text != null ? { text: String((s as any).meetingNotes.text) } : { text: '' },
      }
      setState(next)
      if (next.tldraw) {
        applyingRemoteRef.current = true
        loadSnapshot(store, { document: next.tldraw } as any, { forceOverwriteSessionState: true } as any)
        applyingRemoteRef.current = false
      }
    }
    socket.on('board:state', onState)
    return () => {
      socket.off('board:state', onState)
    }
  }, [socket, boardId])

  // Autosave (REST) + broadcast (socket)
  const saveNow = React.useCallback(
    async (nextState: BoardState) => {
      if (!boardId) return
      if (!canEdit) return
      setSaving(true)
      try {
        const snap = getSnapshot(store)
        const payload: BoardState = { ...nextState, tldraw: snap.document, version: (nextState.version || 0) + 1 }
        setState(payload)
        await BoardsService.saveState(boardId, payload as any)
        if (socket && isConnected) {
          socket.emit('board:state', { boardId, state: payload })
        }
      } catch (e) {
        toast({ title: 'Save', description: e instanceof Error ? e.message : 'Failed to save', variant: 'destructive' })
      } finally {
        setSaving(false)
      }
    },
    [boardId, canEdit, isConnected, socket, toast, store],
  )

  const debouncedSaveRef = React.useRef<number | null>(null)
  const scheduleSave = (next: BoardState) => {
    if (!canEdit) return
    if (debouncedSaveRef.current) window.clearTimeout(debouncedSaveRef.current)
    debouncedSaveRef.current = window.setTimeout(() => {
      void saveNow(next)
    }, 700)
  }

  const onNotesChange = (text: string) => {
    if (!canEdit) return
    const next = { ...state, meetingNotes: { text } }
    setState(next)
    scheduleSave(next)
  }

  // Save when tldraw store changes (debounced)
  React.useEffect(() => {
    if (!canEdit) return
    const unsubscribe = store.listen(() => {
      if (applyingRemoteRef.current) return
      scheduleSave(state)
    })
    return () => {
      unsubscribe()
    }
  }, [store, canEdit, state])


  if (!boardId) {
    return <div className="p-6">Invalid board.</div>
  }

  return (
    <div className="p-6">
      <VStack spacing={6}>
        <PageHeader
          title={loading ? 'Board' : title}
          subtitle={
            loading
              ? 'Loading…'
              : `Role: ${memberRole} · Realtime: ${isConnected ? 'connected' : 'offline'}`
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => void saveNow(state)}
              disabled={!canEdit || saving}
              loading={saving}
              variant="outline"
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>

          <Button variant="outline" className="gap-2" disabled>
            <Users className="h-4 w-4" />
            Invites (next)
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[560px] w-full overflow-hidden rounded-md border">
                <div className={!canEdit ? 'pointer-events-none' : undefined}>
                  <Tldraw
                    store={store}
                    onMount={() => {
                      if (state.tldraw) {
                        applyingRemoteRef.current = true
                        loadSnapshot(
                          store,
                          { document: state.tldraw } as any,
                          { forceOverwriteSessionState: true } as any,
                        )
                        applyingRemoteRef.current = false
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meeting notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={state.meetingNotes.text}
                onChange={(e) => onNotesChange(e.target.value)}
                disabled={!canEdit}
                rows={18}
                placeholder="Agenda, decisions, action items…"
              />
              <div className="text-xs text-muted-foreground">
                Autosaves while you type. Version: {state.version}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium">Invite someone</div>
                <Input disabled placeholder="email@company.com (UI next)" />
              </div>
            </CardContent>
          </Card>
        </div>
      </VStack>
    </div>
  )
}

