import React, { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  SupportTicketsService,
  SupportTicketRow,
  SupportTicketsPagination,
} from '../../services/api/supportTickets.service'
import { cn } from '../../lib/utils'

export default function SupportTicketsQueuePage() {
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<SupportTicketRow[]>([])
  const [pagination, setPagination] = useState<SupportTicketsPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (p: number) => {
    try {
      setLoading(true)
      setError(null)
      const res = await SupportTicketsService.listTicketQueue({ page: p, limit: 50 })
      if (res.success && res.data && typeof res.data === 'object') {
        const d = res.data as { tickets?: SupportTicketRow[]; pagination?: SupportTicketsPagination }
        setRows(Array.isArray(d.tickets) ? d.tickets : [])
        setPagination(d.pagination ?? null)
        setPage(p)
      } else {
        setRows([])
        setPagination(null)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  const userLabel = (t: SupportTicketRow) => {
    const u = t.userId as { firstName?: string; lastName?: string; email?: string } | undefined
    if (!u) return '—'
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
    return name ? `${name} · ${u.email ?? ''}` : u.email ?? '—'
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Support tickets"
        subtitle="All cases from POST /api/feedback-support/support/tickets — includes provider app disputes ([PROVIDER_BOOKING_CASE]) and general requests ([PROVIDER_GENERAL_REQUEST]). Uses your admin session against REACT_APP_API_URL."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
              <Link to="/support/refund-requests">Refund queue</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => void load(page)}>
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No tickets match this page.</div>
        ) : (
          <ul className="divide-y">
            {rows.map((t) => (
              <li key={t._id} className="list-none p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{t.ticketNumber}</span>
                      <Badge variant="secondary">{t.category}</Badge>
                      <Badge variant="outline">{t.status}</Badge>
                      {t.priority ? <Badge variant="outline">{t.priority}</Badge> : null}
                    </div>
                    <p className="truncate font-medium">{t.subject || '(no subject)'}</p>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{t.description}</p>
                    <p className="text-xs text-muted-foreground">User: {userLabel(t)}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(t.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => void load(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => void load(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
