import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { PageHeader } from '../../components/common/PageHeader'
import { BazaarMarketplaceService } from '../../services/api/bazaarMarketplace.service'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
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
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { cn } from '../../lib/utils'

function statusBadgeClass(status: string) {
  if (status === 'published') return 'border-storm-mist/30 bg-storm-deep/10 text-storm-deep'
  if (status === 'pending_review') return 'border-bloom-coral/40 bg-bloom-coral/10 text-bloom-coral'
  if (status === 'rejected') return 'border-destructive/20 bg-destructive/10 text-destructive'
  return 'border-border bg-muted/50'
}

function formatUser(u: unknown): string {
  if (!u || typeof u !== 'object') return '—'
  const o = u as { firstName?: string; lastName?: string; email?: string; userId?: string }
  const name = [o.firstName, o.lastName].filter(Boolean).join(' ').trim()
  return name || o.email || o.userId || '—'
}

/**
 * Full listing review console — backend: GET /api/bazaar/admin/listing-review/:id
 */
export default function BazaarListingReviewDetailPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [moderateOpen, setModerateOpen] = useState(false)
  const [moderateAction, setModerateAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!listingId) return
    setLoading(true)
    setError(null)
    try {
      const res = await BazaarMarketplaceService.adminGetListingReviewDetail(listingId)
      setData((res.data as Record<string, unknown>) || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load listing')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    void load()
  }, [load])

  const listing = data?.listing as Record<string, unknown> | undefined
  const moderation = data?.moderation as Record<string, unknown> | undefined
  const offers = data?.offers as Record<string, unknown> | undefined
  const threads = (data?.chatThreads as Record<string, unknown>[]) || []
  const proVerify = data?.proVerifyRequest as Record<string, unknown> | null | undefined

  const moderationStatus = (listing?.moderationStatus as string) || '—'
  const title = (listing?.title as string) || 'Listing'
  const images = (listing?.images as string[]) || []
  const bazaarWebBase = (process.env.REACT_APP_BAZAAR_WEB_URL || '').replace(/\/$/, '')

  const onModerate = async () => {
    if (!listingId || !moderateAction) return
    setBusy(true)
    setError(null)
    try {
      await BazaarMarketplaceService.adminModerateListing(listingId, {
        action: moderateAction,
        rejectionReason: moderateAction === 'reject' ? rejectReason : undefined,
      })
      setModerateOpen(false)
      setModerateAction(null)
      setRejectReason('')
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Moderation failed')
    } finally {
      setBusy(false)
    }
  }

  if (!listingId) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Missing listing id.</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/bazaar/listing-review">Back to queue</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link to="/bazaar/listing-review">
            <ArrowLeft className="h-4 w-4" />
            Listing review queue
          </Link>
        </Button>
      </div>

      <PageHeader
        title={loading ? 'Loading…' : title}
        subtitle="Full context for moderation — seller, offers, chats, Pro-Verify"
      />

      <BazaarGuidanceAccordion />

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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : !data || !listing ? (
        <p className="text-sm text-muted-foreground">No data.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                <CardTitle className="text-base">Listing</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={cn('text-xs', statusBadgeClass(moderationStatus))}>
                    {moderationStatus}
                  </Badge>
                  {bazaarWebBase ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`${bazaarWebBase}/bazaar/listing/${listingId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="gap-1"
                      >
                        Open on site
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {(listing.description as string) || '—'}
                  </p>
                  <Separator />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Price (₹)</span>
                      <p className="font-medium">{Number(listing.priceInr ?? 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Neighborhood</span>
                      <p className="font-medium">{(listing.neighborhood as string) || '—'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Category</span>
                      <p className="font-medium">
                        {(listing.categoryId as string) || '—'}
                        {listing.subCategoryId ? ` · ${String(listing.subCategoryId)}` : ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Condition</span>
                      <p className="font-medium">{(listing.condition as string) || '—'}</p>
                    </div>
                  </div>
                  {images.length > 0 ? (
                    <div className="space-y-2">
                      <Separator />
                      <p className="text-xs font-medium text-muted-foreground">Photos</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {images.map((src) => (
                          <a
                            key={src}
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className="aspect-square overflow-hidden rounded-md border bg-muted"
                          >
                            {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent offers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {((offers?.recent as Record<string, unknown>[]) || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No offers
                        </TableCell>
                      </TableRow>
                    ) : (
                      ((offers?.recent as Record<string, unknown>[]) || []).map((o) => (
                        <TableRow key={String(o.id)}>
                          <TableCell>{String(o.status ?? '—')}</TableCell>
                          <TableCell>₹{Number(o.amountInr ?? 0).toLocaleString('en-IN')}</TableCell>
                          <TableCell>{formatUser(o.buyerId)}</TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {o.createdAt ? new Date(String(o.createdAt)).toLocaleString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seller</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  {[
                    <p key="seller-name">{formatUser(listing.seller)}</p>,
                    listing.seller && typeof listing.seller === 'object' ? (
                      <div key="seller-meta" className="space-y-1 text-xs text-muted-foreground">
                        <p>{(listing.seller as { email?: string }).email}</p>
                        <p>{(listing.seller as { phone?: string }).phone}</p>
                        <p className="font-mono">{(listing.seller as { userId?: string }).userId}</p>
                      </div>
                    ) : null,
                  ]}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Moderation audit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Reviewed at:</span>{' '}
                    {moderation?.reviewedAt
                      ? new Date(String(moderation.reviewedAt)).toLocaleString()
                      : '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Reviewer:</span>{' '}
                    {formatUser(moderation?.reviewer)}
                  </p>
                  {moderation?.rejectionReason ? (
                    <p className="rounded-md border border-destructive/20 bg-destructive/5 p-2 text-destructive">
                      {String(moderation.rejectionReason)}
                    </p>
                  ) : null}
                  {moderationStatus === 'pending_review' ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        className="bg-storm-deep text-white hover:bg-storm-deep/90"
                        onClick={() => {
                          setModerateAction('approve')
                          setModerateOpen(true)
                        }}
                      >
                        Approve listing
                      </Button>
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive"
                        onClick={() => {
                          setModerateAction('reject')
                          setModerateOpen(true)
                        }}
                      >
                        Reject listing
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bazaar chat threads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {threads.length === 0 ? (
                    <p className="text-muted-foreground">No threads</p>
                  ) : (
                    threads.map((t) => (
                      <div key={String(t.id)} className="rounded-md border p-2">
                        <p className="font-mono text-xs">{String(t.id)}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated {t.updatedAt ? new Date(String(t.updatedAt)).toLocaleString() : '—'}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pro-Verify</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {!proVerify ? (
                    <p className="text-muted-foreground">No request for this listing</p>
                  ) : (
                    <div className="space-y-1">
                      <p>Step {String(proVerify.workflowStep ?? '—')}</p>
                      <p className="text-muted-foreground">{String(proVerify.contactPhone ?? '')}</p>
                      <Button variant="link" className="h-auto px-0" onClick={() => navigate('/bazaar/pro-verify')}>
                        Open Pro-Verify queue
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog
        open={moderateOpen}
        onOpenChange={(o) => {
          if (!o && !busy) {
            setModerateOpen(false)
            setModerateAction(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{moderateAction === 'reject' ? 'Reject listing' : 'Publish listing'}</DialogTitle>
          </DialogHeader>
          {moderateAction === 'reject' && (
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModerateOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={moderateAction === 'reject' ? 'destructive' : 'default'}
              className={moderateAction === 'approve' ? 'bg-storm-deep hover:bg-storm-deep/90' : undefined}
              disabled={busy || !moderateAction}
              onClick={() => void onModerate()}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
