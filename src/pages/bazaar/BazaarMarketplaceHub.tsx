import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  X,
  Download,
  ListFilter,
  Loader2,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
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
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Card } from '../../components/ui/card'
import { PageHeader } from '../../components/common/PageHeader'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { BazaarMarketplaceService } from '../../services/api/bazaarMarketplace.service'
import type { BazaarAdminConversationRow, BazaarAdminOfferRow } from '../../services/api/bazaarMarketplace.service'
import { cn } from '../../lib/utils'

function formatUser(u?: { firstName?: string; lastName?: string; email?: string; userId?: string }) {
  if (!u) return '—'
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return name || u.email || u.userId || '—'
}

/** Radix Select does not allow `value=""` on SelectItem — use `all` and map to no query param. */
const OFFER_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'countered', label: 'Countered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' },
]

function offerStatusBadgeClass(status: string) {
  const s = (status || '').toLowerCase()
  if (s.includes('accept')) return 'border-storm-deep/50 bg-storm-mist/30 text-storm-deep dark:bg-storm-deep/50 dark:text-on-ink'
  if (s.includes('declin') || s.includes('withdraw')) {
    return 'border-destructive/50 bg-destructive/10 text-destructive'
  }
  if (s.includes('expir')) return 'border-border bg-muted text-muted-foreground'
  if (s.includes('counter') || s.includes('pending')) {
    return 'border-bloom-coral/50 bg-bloom-rose text-bloom-coral dark:bg-bloom-coral/50 dark:text-bloom-deep'
  }
  return 'border-primary/50 bg-primary-soft text-primary dark:bg-primary/50 dark:text-primary-deep'
}

function csvEscape(cell: string) {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
  return cell
}

/** API may return a bare array or `{ offers: [] }` / `{ data: [] }` style payloads */
function normalizeList<T>(data: unknown, nestedKeys: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const key of nestedKeys) {
      const v = o[key]
      if (Array.isArray(v)) return v as T[]
    }
    if (Array.isArray(o.data)) return o.data as T[]
  }
  return []
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const lines = [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 break-words text-sm">{children}</div>
    </div>
  )
}

/**
 * Operations view for the peer-to-peer Bazaar marketplace: binding offers
 * and listing-scoped chat threads (distinct from promotional /offers).
 */
export default function BazaarMarketplaceHub() {
  const [tab, setTab] = useState<'offers' | 'chats'>('offers')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<BazaarAdminOfferRow[]>([])
  const [conversations, setConversations] = useState<BazaarAdminConversationRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState<number | null>(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [listingDraft, setListingDraft] = useState('')
  const [appliedListingId, setAppliedListingId] = useState('')

  const [drawerOffer, setDrawerOffer] = useState<BazaarAdminOfferRow | null>(null)
  const [drawerConv, setDrawerConv] = useState<BazaarAdminConversationRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 'offers') {
        const res = await BazaarMarketplaceService.adminListOffers({
          page,
          limit: 20,
          ...(statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(appliedListingId ? { listingId: appliedListingId } : {}),
        })
        setOffers(normalizeList<BazaarAdminOfferRow>(res.data, ['offers']))
        setTotalPages(res.meta?.pagination?.totalPages ?? 1)
        const t = res.meta?.pagination?.total
        setTotalItems(typeof t === 'number' ? t : null)
      } else {
        const res = await BazaarMarketplaceService.adminListConversations({
          page,
          limit: 20,
          ...(appliedListingId ? { listingId: appliedListingId } : {}),
        })
        setConversations(
          normalizeList<BazaarAdminConversationRow>(res.data, ['conversations', 'threads']),
        )
        setTotalPages(res.meta?.pagination?.totalPages ?? 1)
        const t = res.meta?.pagination?.total
        setTotalItems(typeof t === 'number' ? t : null)
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [tab, page, statusFilter, appliedListingId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
    setStatusFilter('all')
    setListingDraft('')
    setAppliedListingId('')
    setDrawerOffer(null)
    setDrawerConv(null)
  }, [tab])

  const rangeLabel = useMemo(() => {
    if (totalItems == null) return null
    const start = (page - 1) * 20 + 1
    const end = Math.min(page * 20, totalItems)
    return `${start}–${end} of ${totalItems}`
  }, [page, totalItems])

  const exportOffersCsv = () => {
    if (offers.length === 0) return
    const header = [
      'offerId',
      'listingId',
      'amountInr',
      'counterAmountInr',
      'status',
      'buyer',
      'buyerEmail',
      'seller',
      'sellerEmail',
      'expiresAt',
      'createdAt',
    ]
    const rows = offers.map((o) => [
      o._id,
      o.listingId,
      String(o.amountInr ?? ''),
      o.counterAmountInr != null ? String(o.counterAmountInr) : '',
      o.status,
      formatUser(o.buyerId),
      o.buyerId?.email ?? '',
      formatUser(o.sellerId),
      o.sellerId?.email ?? '',
      o.expiresAt ?? '',
      o.createdAt ?? '',
    ])
    downloadCsv(`bazaar-offers-${new Date().toISOString().slice(0, 10)}.csv`, header, rows)
  }

  const exportConversationsCsv = () => {
    if (conversations.length === 0) return
    const header = [
      'conversationId',
      'type',
      'title',
      'listingId',
      'participants',
      'lastMessage',
      'lastMessageAt',
      'updatedAt',
    ]
    const rows = conversations.map((c) => [
      c._id,
      c.type,
      c.title ?? '',
      c.metadata?.listingId ?? '',
      (c.participants || [])
        .map((p) => `${formatUser(p.userId)} (${p.role})`)
        .join('; '),
      (c.lastMessage?.text ?? '').replace(/\s+/g, ' ').trim(),
      c.lastMessage?.sentAt ?? '',
      c.updatedAt ?? '',
    ])
    downloadCsv(`bazaar-listing-chats-${new Date().toISOString().slice(0, 10)}.csv`, header, rows)
  }

  const detailOpen = Boolean(drawerOffer || drawerConv)

  return (
    <div>
      <PageHeader
        title="Bazaar marketplace"
        subtitle="Peer listing offers and per-listing buyer–seller threads (separate from discount offers under /offers)."
        icon={<Store className="h-9 w-9 text-primary" aria-hidden />}
      />

      <BazaarGuidanceAccordion />

      <div className="mb-4 rounded-md border border-bloom-coral/40 bg-bloom-rose/80 p-3 text-sm dark:border-bloom-coral dark:bg-bloom-coral/30">
        <p>
          <strong>Peer-to-peer disclaimer:</strong> Payments and handoffs may occur outside this admin app. Ensure
          customer-facing terms, liability, and regional rules (consumer protection, second-hand goods, etc.) are
          documented in your mobile/web product.
        </p>
      </div>

      <div className="mb-4 rounded-md border border-primary/20 bg-primary-soft/80 p-3 text-sm dark:border-primary dark:bg-primary/30">
        <p>
          This page loads read-only data from <strong>GET /api/bazaar/admin/offers</strong> and{' '}
          <strong>GET /api/bazaar/admin/conversations</strong>. Audit trails and enforcement belong in your API and app
          tier.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as 'offers' | 'chats')}
        className="mb-4"
      >
        <Card className="overflow-hidden p-0">
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="offers" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Listing offers
            </TabsTrigger>
            <TabsTrigger value="chats" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
              Listing chats
            </TabsTrigger>
          </TabsList>
        </Card>
      </Tabs>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          {tab === 'offers' && (
            <div className="space-y-1.5">
              <Label htmlFor="bazaar-status" className="sr-only">
                Offer status
              </Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger id="bazaar-status" className="h-8 w-[180px]">
                  <SelectValue placeholder="Offer status" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_STATUS_FILTERS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="listing-id" className="text-xs text-muted-foreground">
              Listing ID
            </Label>
            <Input
              id="listing-id"
              className="h-8 min-w-[220px]"
              placeholder="Exact listing id"
              value={listingDraft}
              onChange={(e) => setListingDraft(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              setAppliedListingId(listingDraft.trim())
              setPage(1)
            }}
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setListingDraft('')
              setAppliedListingId('')
              setPage(1)
            }}
          >
            Clear listing filter
          </Button>
          {tab === 'offers' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
            >
              Clear status
            </Button>
          )}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            title="Exports the current page of rows only (adjust filters & pagination as needed)."
            disabled={tab === 'offers' ? offers.length === 0 : conversations.length === 0}
            onClick={tab === 'offers' ? exportOffersCsv : exportConversationsCsv}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV (this page)
          </Button>
        </div>
        {rangeLabel && <p className="mt-2 text-xs text-muted-foreground">{rangeLabel}</p>}
      </Card>

      {error && (
        <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tab === 'offers' ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
                <TableHead className="text-right">Counter (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No marketplace offers match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((row) => (
                  <TableRow
                    key={row._id}
                    className="cursor-pointer"
                    onClick={() => {
                      setDrawerConv(null)
                      setDrawerOffer(row)
                    }}
                  >
                    <TableCell>
                      <p className="max-w-[200px] truncate font-mono text-sm" title={row.listingId}>
                        {row.listingId}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">{row.amountInr?.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      {row.counterAmountInr != null ? row.counterAmountInr.toLocaleString('en-IN') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-xs', offerStatusBadgeClass(row.status))}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatUser(row.buyerId)}</TableCell>
                    <TableCell>{formatUser(row.sellerId)}</TableCell>
                    <TableCell>{row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conversation</TableHead>
                <TableHead>Listing ID</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Last message</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No listing threads match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                conversations.map((row) => (
                  <TableRow
                    key={row._id}
                    className="cursor-pointer"
                    onClick={() => {
                      setDrawerOffer(null)
                      setDrawerConv(row)
                    }}
                  >
                    <TableCell>
                      <p className="font-mono text-sm">{row._id}</p>
                      <p className="text-xs text-muted-foreground">{row.title || '—'}</p>
                    </TableCell>
                    <TableCell>{row.metadata?.listingId ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {row.participants?.map((p) => (
                          <Badge key={`${row._id}-${p.role}-${formatUser(p.userId)}`} variant="outline" className="text-xs">
                            {formatUser(p.userId)} · {p.role}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[16rem]">
                      <p className="truncate text-sm" title={row.lastMessage?.text}>
                        {row.lastMessage?.text || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {row.lastMessage?.sentAt
                        ? new Date(row.lastMessage.sentAt).toLocaleString()
                        : new Date(row.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDrawerOffer(null)
            setDrawerConv(null)
          }
        }}
      >
        <DialogContent
          className={cn(
            '[&>button.absolute]:hidden',
            'fixed right-0 top-0 left-auto z-50 h-full max-h-screen w-full max-w-md !translate-x-0 !translate-y-0',
            'rounded-none border-l p-0 sm:max-w-md sm:rounded-l-lg',
            'gap-0 overflow-hidden p-0'
          )}
        >
          <div className="flex items-center border-b px-4 py-3">
            <DialogHeader className="flex-1 space-y-0 p-0 text-left">
              <DialogTitle className="text-base">{drawerOffer ? 'Offer detail' : 'Thread detail'}</DialogTitle>
            </DialogHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Close"
              onClick={() => {
                setDrawerOffer(null)
                setDrawerConv(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
            {drawerOffer && (
              <>
                <DetailBlock label="Offer ID">{drawerOffer._id}</DetailBlock>
                <DetailBlock label="Listing ID">{drawerOffer.listingId}</DetailBlock>
                <DetailBlock label="Amount (₹)">{drawerOffer.amountInr?.toLocaleString('en-IN')}</DetailBlock>
                {drawerOffer.counterAmountInr != null && (
                  <DetailBlock label="Counter (₹)">{drawerOffer.counterAmountInr.toLocaleString('en-IN')}</DetailBlock>
                )}
                <DetailBlock label="Status">
                  <Badge variant="outline" className={cn(offerStatusBadgeClass(drawerOffer.status))}>
                    {drawerOffer.status}
                  </Badge>
                </DetailBlock>
                <DetailBlock label="Buyer">{formatUser(drawerOffer.buyerId)}</DetailBlock>
                {drawerOffer.buyerId?.email && <DetailBlock label="Buyer email">{drawerOffer.buyerId.email}</DetailBlock>}
                <DetailBlock label="Seller">{formatUser(drawerOffer.sellerId)}</DetailBlock>
                {drawerOffer.sellerId?.email && (
                  <DetailBlock label="Seller email">{drawerOffer.sellerId.email}</DetailBlock>
                )}
                <DetailBlock label="Expires">
                  {drawerOffer.expiresAt ? new Date(drawerOffer.expiresAt).toLocaleString() : '—'}
                </DetailBlock>
                <DetailBlock label="Created">
                  {drawerOffer.createdAt ? new Date(drawerOffer.createdAt).toLocaleString() : '—'}
                </DetailBlock>
                {drawerOffer.updatedAt && (
                  <DetailBlock label="Updated">{new Date(drawerOffer.updatedAt).toLocaleString()}</DetailBlock>
                )}
              </>
            )}
            {drawerConv && (
              <>
                <DetailBlock label="Conversation ID">{drawerConv._id}</DetailBlock>
                <DetailBlock label="Type">{drawerConv.type}</DetailBlock>
                {drawerConv.title && <DetailBlock label="Title">{drawerConv.title}</DetailBlock>}
                <DetailBlock label="Listing ID">{drawerConv.metadata?.listingId ?? '—'}</DetailBlock>
                <p className="mb-2 mt-4 text-sm font-semibold">Participants</p>
                <div className="space-y-2">
                  {drawerConv.participants?.map((p) => (
                    <div key={`${drawerConv._id}-${p.role}-${p.userId?.email}`} className="rounded-md border p-2 text-sm">
                      <p>{formatUser(p.userId)}</p>
                      <Badge className="mt-1" variant="secondary">
                        {p.role}
                      </Badge>
                      {p.userId?.email && <p className="mt-1 text-xs text-muted-foreground">{p.userId.email}</p>}
                    </div>
                  ))}
                </div>
                {drawerConv.lastMessage && (
                  <div className="mt-4">
                    <DetailBlock label="Last message at">
                      {new Date(drawerConv.lastMessage.sentAt).toLocaleString()}
                    </DetailBlock>
                    <DetailBlock label="Preview">{drawerConv.lastMessage.text}</DetailBlock>
                  </div>
                )}
                <DetailBlock label="Updated">{new Date(drawerConv.updatedAt).toLocaleString()}</DetailBlock>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/chat">Open messages hub</Link>
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Find the same thread in the main chat UI if it is wired to the same conversation store.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
