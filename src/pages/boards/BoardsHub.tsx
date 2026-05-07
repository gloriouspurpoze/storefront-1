import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BoardsService, type BoardSummary } from '../../services/api/boards.service'
import {
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
  VStack,
  useToast,
} from '../../components/ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { PageHeader } from '../../components/common/PageHeader'
import { MoreHorizontal, Plus, Presentation, Trash2 } from 'lucide-react'

export function BoardsHub() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [title, setTitle] = React.useState('New board')
  const [boards, setBoards] = React.useState<BoardSummary[]>([])
  const [renameTarget, setRenameTarget] = React.useState<BoardSummary | null>(null)
  const [renameValue, setRenameValue] = React.useState('')
  const [renaming, setRenaming] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<BoardSummary | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await BoardsService.list()
      if (!r.success) throw new Error(r.message || 'Failed to load boards')
      setBoards(r.data || [])
    } catch (e) {
      toast({ title: 'Boards', description: e instanceof Error ? e.message : 'Failed to load', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    void load()
  }, [load])

  const onCreate = async () => {
    const t = title.trim()
    if (!t) return
    setCreating(true)
    try {
      const r = await BoardsService.create(t)
      if (!r.success || !r.data?.id) throw new Error(r.message || 'Failed to create board')
      navigate(`/boards/${r.data.id}`)
    } catch (e) {
      toast({ title: 'Create board', description: e instanceof Error ? e.message : 'Failed', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const runRename = async () => {
    if (!renameTarget) return
    const t = renameValue.trim()
    if (!t) return
    setRenaming(true)
    try {
      const r = await BoardsService.update(renameTarget.id, { title: t })
      if (!r.success) throw new Error(r.message || 'Failed to rename')
      toast({ title: 'Board renamed' })
      setRenameTarget(null)
      await load()
    } catch (e) {
      toast({
        title: 'Rename failed',
        description: e instanceof Error ? e.message : 'Could not save',
        variant: 'destructive',
      })
    } finally {
      setRenaming(false)
    }
  }

  const runDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const r = await BoardsService.remove(deleteTarget.id)
      if (!r.success) throw new Error(r.message || 'Failed to delete')
      toast({ title: 'Board deleted' })
      setDeleteTarget(null)
      await load()
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : 'Could not delete',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6">
      <VStack spacing={6}>
        <PageHeader
          title="Boards"
          subtitle="Collaborative canvas for meeting notes, sticky notes, and quick sketches."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Presentation className="h-5 w-5" />
              Create a board
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Board title" />
            <Button onClick={onCreate} loading={creating} className="gap-2">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
            </Card>
          ) : boards.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No boards yet. Create one to start collaborating.
              </CardContent>
            </Card>
          ) : (
            boards.map((b) => (
              <Card key={b.id} className="hover:bg-muted/20">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                  <CardTitle
                    className="min-w-0 flex-1 cursor-pointer truncate text-base leading-snug"
                    onClick={() => navigate(`/boards/${b.id}`)}
                  >
                    {b.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label={`Actions for ${b.title}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/boards/${b.id}`)}>Open</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameTarget(b)
                          setRenameValue(b.title)
                        }}
                      >
                        Rename…
                      </DropdownMenuItem>
                      {b.role === 'owner' ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(b)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete…
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent
                  className="cursor-pointer text-xs text-muted-foreground"
                  onClick={() => navigate(`/boards/${b.id}`)}
                >
                  Role: <span className="font-medium text-foreground">{b.role}</span>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog
          open={renameTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRenameTarget(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename board</DialogTitle>
              <DialogDescription>Update the name shown in the list and on the canvas page.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-1">
              <Label htmlFor="rename-board-input">Title</Label>
              <Input
                id="rename-board-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void runRename()
                }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={renaming}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void runRename()} disabled={renaming || !renameValue.trim()}>
                {renaming ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete board?</DialogTitle>
              <DialogDescription>
                {deleteTarget ? (
                  <>
                    Permanently delete <span className="font-medium text-foreground">{deleteTarget.title}</span>? This
                    cannot be undone.
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={() => void runDelete()} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </VStack>
    </div>
  )
}

