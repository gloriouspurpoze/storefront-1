import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BoardsService } from '../../services/api/boards.service'
import { Card, CardContent, CardHeader, CardTitle, VStack, useToast } from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'

export function AcceptBoardInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const t = (token || '').trim()
    if (!t) return
    setLoading(true)
    ;(async () => {
      try {
        const r = await BoardsService.acceptInvite(t)
        if (!r.success || !r.data?.boardId) throw new Error(r.message || 'Invite invalid or expired')
        toast({ title: 'Invite accepted', description: 'Opening board…' })
        navigate(`/boards/${r.data.boardId}`, { replace: true })
      } catch (e) {
        toast({
          title: 'Invite',
          description: e instanceof Error ? e.message : 'Failed to accept invite',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [token, navigate, toast])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <VStack spacing={6}>
        <PageHeader title="Accept board invite" subtitle="Joining the board…" />
        <Card>
          <CardHeader>
            <CardTitle>{loading ? 'Working…' : 'Done'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            If nothing happens, make sure you’re logged in with the invited email address.
          </CardContent>
        </Card>
      </VStack>
    </div>
  )
}

