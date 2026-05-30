import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { PageHeader } from '../../components/common/PageHeader'
import { BazaarMarketplaceService } from '../../services/api/bazaarMarketplace.service'
import type { BazaarAdminListingRow } from '../../services/api/bazaarMarketplace.service'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { cn } from '../../lib/utils'

function formatUser(u: unknown): string {
  if (!u || typeof u !== 'object') return '—'
  const o = u as { firstName?: string; lastName?: string; email?: string; userId?: string }
  const name = [o.firstName, o.lastName].filter(Boolean).join(' ').trim()
  return name || o.email || o.userId || '—'
}

function statusBadgeClass(status: string) {
  if (status === 'published') return 'border-storm-mist/30 bg-storm-deep/10 text-storm-deep'
  if (status === 'pending_review') return 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral'
  if (status === 'rejected') return 'border-destructive/20 bg-destructive/10 text-destructive'
  return 'border-border bg-muted/50'
}

/**
 * Approve or reject user-submitted Bazaar listings before they appear in the public feed.
 */
export default function BazaarListingModeration() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<BazaarAdminListingRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('pending_review')
  const [actionRow, setActionRow] = useState<BazaarAdminListingRow | null>(null)
  const [moderateAction, setModerateAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const statusParam =
        statusFilter === 'all'
          ? undefined
          : (statusFilter as 'pending_review' | 'published' | 'rejected')
      const res = await BazaarMarketplaceService.adminListListings({
        page,
        limit: 20,
        status: statusParam,
      })
      const data = (res.data as BazaarAdminListingRow[]) || []
      setRows(data)
      const meta = res.meta as { pagination?: { totalPages?: number } } | undefined
      setTotalPages(meta?.pagination?.totalPages ?? 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listings')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const onModerate = async (action: 'approve' | 'reject') => {
    if (!actionRow?.id) return
    setBusy(true)
    setError(null)
    try {
      await BazaarMarketplaceService.adminModerateListing(actionRow.id, {
        action,
        rejectionReason: action === 'reject' ? rejectReason : undefined,
      })
      setActionRow(null)
      setModerateAction(null)
      setRejectReason('')
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Moderation failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Bazaar — listing review"
        subtitle="Approve new peer-to-peer listings before they appear site-wide"
      />

      <BazaarGuidanceAccordion />

      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
        New marketplace posts enter as <strong>Pending review</strong>. Approve to publish them to the public feed, or
        reject with an internal reason (shown to the seller when applicable).
      </p>

      {error && (
        <div
          className="mb-3 flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
          <Button type="button" variant="ghost" size="sm" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <Card className="mb-3">
        <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-end">
          <div className="w-full min-w-0 sm:max-w-xs">
            <Label>Moderation status</Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1)
                setStatusFilter(v)
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending_review">Pending review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading} className="shrink-0">
            Refresh
          </Button>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Price (₹)</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  No listings in this filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', statusBadgeClass(row.moderationStatus))}
                    >
                      {row.moderationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px]">{row.title}</TableCell>
                  <TableCell>{row.priceInr?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{formatUser(row.seller)}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="secondary" asChild>
                        <Link to={`/bazaar/listing-review/${encodeURIComponent(row.id)}`}>Details</Link>
                      </Button>
                      {row.moderationStatus === 'pending_review' ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-storm-deep text-white hover:bg-storm-deep/90"
                            onClick={() => {
                              setActionRow(row)
                              setModerateAction('approve')
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setActionRow(row)
                              setModerateAction('reject')
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      <Dialog
        open={Boolean(actionRow && moderateAction)}
        onOpenChange={(o) => {
          if (!o && !busy) {
            setActionRow(null)
            setModerateAction(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{moderateAction === 'reject' ? 'Reject listing' : 'Publish listing'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{actionRow?.title}</p>
          {moderateAction === 'reject' && (
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Stored with the listing for audit"
              />
            </div>
          )}
          {moderateAction === 'approve' && (
            <p className="text-sm text-muted-foreground">
              This listing will become visible in the public Bazaar feed and support offers/chat per your rules.
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionRow(null)
                setModerateAction(null)
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={moderateAction === 'reject' ? 'destructive' : 'default'}
              className={moderateAction === 'approve' ? 'bg-storm-deep hover:bg-storm-deep/90' : undefined}
              disabled={busy || !moderateAction}
              onClick={() => moderateAction && void onModerate(moderateAction)}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {busy ? '…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
