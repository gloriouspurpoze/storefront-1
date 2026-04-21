import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  FormControl,
  InputLabel,
} from '@mui/material'
import {
  Storefront as StorefrontIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { PageHeader } from '../../components/common/PageHeader'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { BazaarMarketplaceService } from '../../services/api/bazaarMarketplace.service'
import type {
  BazaarAdminConversationRow,
  BazaarAdminOfferRow,
} from '../../services/api/bazaarMarketplace.service'

function formatUser(u?: { firstName?: string; lastName?: string; email?: string; userId?: string }) {
  if (!u) return '—'
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return name || u.email || u.userId || '—'
}

const OFFER_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'countered', label: 'Countered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' },
]

function offerStatusColor(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
  const s = (status || '').toLowerCase()
  if (s.includes('accept')) return 'success'
  if (s.includes('declin') || s.includes('withdraw')) return 'error'
  if (s.includes('expir')) return 'default'
  if (s.includes('counter') || s.includes('pending')) return 'warning'
  return 'info'
}

function csvEscape(cell: string) {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
  return cell
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
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Box sx={{ wordBreak: 'break-word', mt: 0.25, typography: 'body2' }}>{children}</Box>
    </Box>
  )
}

/**
 * Operations view for the peer-to-peer Bazaar marketplace: binding offers
 * and listing-scoped chat threads (distinct from promotional /offers).
 */
export default function BazaarMarketplaceHub() {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<BazaarAdminOfferRow[]>([])
  const [conversations, setConversations] = useState<BazaarAdminConversationRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState<number | null>(null)

  const [statusFilter, setStatusFilter] = useState('')
  const [listingDraft, setListingDraft] = useState('')
  const [appliedListingId, setAppliedListingId] = useState('')

  const [drawerOffer, setDrawerOffer] = useState<BazaarAdminOfferRow | null>(null)
  const [drawerConv, setDrawerConv] = useState<BazaarAdminConversationRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (tab === 0) {
        const res = await BazaarMarketplaceService.adminListOffers({
          page,
          limit: 20,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(appliedListingId ? { listingId: appliedListingId } : {}),
        })
        setOffers((res.data as BazaarAdminOfferRow[]) || [])
        setTotalPages(res.meta?.pagination?.totalPages ?? 1)
        const t = res.meta?.pagination?.total
        setTotalItems(typeof t === 'number' ? t : null)
      } else {
        const res = await BazaarMarketplaceService.adminListConversations({
          page,
          limit: 20,
          ...(appliedListingId ? { listingId: appliedListingId } : {}),
        })
        setConversations((res.data as BazaarAdminConversationRow[]) || [])
        setTotalPages(res.meta?.pagination?.totalPages ?? 1)
        const t = res.meta?.pagination?.total
        setTotalItems(typeof t === 'number' ? t : null)
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Failed to load'
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
    setStatusFilter('')
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

  return (
    <Box>
      <PageHeader
        title="Bazaar marketplace"
        subtitle="Peer listing offers and per-listing buyer–seller threads (separate from discount offers under /offers)."
        icon={<StorefrontIcon color="primary" />}
      />

      <BazaarGuidanceAccordion />

      <Alert severity="warning" sx={{ mb: 2 }}>
        <strong>Peer-to-peer disclaimer:</strong> Payments and handoffs may occur outside this admin app. Ensure
        customer-facing terms, liability, and regional rules (consumer protection, second-hand goods, etc.) are
        documented in your mobile/web product.
      </Alert>

      <Alert severity="info" sx={{ mb: 2 }}>
        This page loads read-only data from <strong>GET /api/bazaar/admin/offers</strong> and{' '}
        <strong>GET /api/bazaar/admin/conversations</strong>. Audit trails and enforcement belong in your API and app
        tier.
      </Alert>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Listing offers" />
          <Tab label="Listing chats" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap">
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterListIcon color="action" fontSize="small" />
            <Typography variant="subtitle2">Filters</Typography>
          </Stack>
          {tab === 0 && (
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="bazaar-status-label">Offer status</InputLabel>
              <Select
                labelId="bazaar-status-label"
                label="Offer status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
              >
                {OFFER_STATUS_FILTERS.map((o) => (
                  <MenuItem key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            size="small"
            label="Listing ID"
            placeholder="Exact listing id"
            value={listingDraft}
            onChange={(e) => setListingDraft(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setAppliedListingId(listingDraft.trim())
              setPage(1)
            }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setListingDraft('')
              setAppliedListingId('')
              setPage(1)
            }}
          >
            Clear listing filter
          </Button>
          {tab === 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setStatusFilter('')
                setPage(1)
              }}
            >
              Clear status
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Exports the current page of rows only (adjust filters & pagination as needed).">
            <span>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                variant="outlined"
                disabled={tab === 0 ? offers.length === 0 : conversations.length === 0}
                onClick={tab === 0 ? exportOffersCsv : exportConversationsCsv}
              >
                Export CSV (this page)
              </Button>
            </span>
          </Tooltip>
        </Stack>
        {rangeLabel && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {rangeLabel}
          </Typography>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Listing</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
                <TableCell align="right">Counter (₹)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Buyer</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Expires</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary">No marketplace offers match your filters.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((row) => (
                  <TableRow
                    key={row._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrawerConv(null)
                      setDrawerOffer(row)
                    }}
                  >
                    <TableCell>
                      <Tooltip title={row.listingId}>
                        <Typography variant="body2" fontFamily="monospace" noWrap sx={{ maxWidth: 200 }}>
                          {row.listingId}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">{row.amountInr?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">
                      {row.counterAmountInr != null ? row.counterAmountInr.toLocaleString('en-IN') : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status} color={offerStatusColor(row.status)} variant="outlined" />
                    </TableCell>
                    <TableCell>{formatUser(row.buyerId)}</TableCell>
                    <TableCell>{formatUser(row.sellerId)}</TableCell>
                    <TableCell>{row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Conversation</TableCell>
                <TableCell>Listing ID</TableCell>
                <TableCell>Participants</TableCell>
                <TableCell>Last message</TableCell>
                <TableCell>Last activity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conversations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No listing threads match your filters.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                conversations.map((row) => (
                  <TableRow
                    key={row._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setDrawerOffer(null)
                      setDrawerConv(row)
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {row._id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {row.title || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.metadata?.listingId ?? '—'}</TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5} flexWrap="wrap" useFlexGap>
                        {row.participants?.map((p) => (
                          <Chip
                            key={`${row._id}-${p.role}-${formatUser(p.userId)}`}
                            size="small"
                            label={`${formatUser(p.userId)} · ${p.role}`}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2" noWrap title={row.lastMessage?.text}>
                        {row.lastMessage?.text || '—'}
                      </Typography>
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
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}

      <Drawer
        anchor="right"
        open={Boolean(drawerOffer || drawerConv)}
        onClose={() => {
          setDrawerOffer(null)
          setDrawerConv(null)
        }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 0 } }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            {drawerOffer ? 'Offer detail' : 'Thread detail'}
          </Typography>
          <IconButton
            aria-label="Close"
            onClick={() => {
              setDrawerOffer(null)
              setDrawerConv(null)
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ p: 2, overflow: 'auto' }}>
          {drawerOffer && (
            <>
              <DetailBlock label="Offer ID">{drawerOffer._id}</DetailBlock>
              <DetailBlock label="Listing ID">{drawerOffer.listingId}</DetailBlock>
              <DetailBlock label="Amount (₹)">{drawerOffer.amountInr?.toLocaleString('en-IN')}</DetailBlock>
              {drawerOffer.counterAmountInr != null && (
                <DetailBlock label="Counter (₹)">{drawerOffer.counterAmountInr.toLocaleString('en-IN')}</DetailBlock>
              )}
              <DetailBlock label="Status">
                <Chip size="small" label={drawerOffer.status} color={offerStatusColor(drawerOffer.status)} />
              </DetailBlock>
              <DetailBlock label="Buyer">{formatUser(drawerOffer.buyerId)}</DetailBlock>
              {drawerOffer.buyerId?.email && (
                <DetailBlock label="Buyer email">{drawerOffer.buyerId.email}</DetailBlock>
              )}
              <DetailBlock label="Seller">{formatUser(drawerOffer.sellerId)}</DetailBlock>
              {drawerOffer.sellerId?.email && (
                <DetailBlock label="Seller email">{drawerOffer.sellerId.email}</DetailBlock>
              )}
              <DetailBlock label="Expires">{drawerOffer.expiresAt ? new Date(drawerOffer.expiresAt).toLocaleString() : '—'}</DetailBlock>
              <DetailBlock label="Created">{drawerOffer.createdAt ? new Date(drawerOffer.createdAt).toLocaleString() : '—'}</DetailBlock>
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
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Participants
              </Typography>
              <Stack spacing={1}>
                {drawerConv.participants?.map((p) => (
                  <Paper key={`${drawerConv._id}-${p.role}-${p.userId?.email}`} variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="body2">{formatUser(p.userId)}</Typography>
                    <Chip size="small" label={p.role} sx={{ mt: 0.5 }} />
                    {p.userId?.email && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {p.userId.email}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
              {drawerConv.lastMessage && (
                <Box sx={{ mt: 2 }}>
                  <DetailBlock label="Last message at">
                    {new Date(drawerConv.lastMessage.sentAt).toLocaleString()}
                  </DetailBlock>
                  <DetailBlock label="Preview">{drawerConv.lastMessage.text}</DetailBlock>
                </Box>
              )}
              <DetailBlock label="Updated">{new Date(drawerConv.updatedAt).toLocaleString()}</DetailBlock>
              <Button component={RouterLink} to="/chat" size="small" variant="outlined" sx={{ mt: 2 }}>
                Open messages hub
              </Button>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Find the same thread in the main chat UI if it is wired to the same conversation store.
              </Typography>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
