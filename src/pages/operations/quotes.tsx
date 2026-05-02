import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Stack,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  AttachMoney as DollarIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Pending as PendingIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material'
import type { Quote, QuoteAdminReviewStatus } from '../../types'
import { formatCurrency, formatDate } from '../../lib/utils'
import { QuotesService } from '../../services/api/quotes.service'
import { usePermissions } from '../../hooks/usePermissions'

const statusColors = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
  expired: 'default',
} as const

const statusIcons = {
  pending: PendingIcon,
  accepted: CheckCircleIcon,
  rejected: CancelIcon,
  expired: ScheduleIcon,
} as const

const reviewLabel = (s: QuoteAdminReviewStatus | undefined) => {
  if (s === 'pending_review') return 'Awaiting platform review'
  if (s === 'rejected') return 'Platform rejected'
  return 'Released to customer'
}

function quoteText(q: Quote) {
  return (q.description || q.notes || '').trim()
}

function validUntilRaw(q: Quote) {
  return q.valid_until ?? q.validUntil
}

function createdRaw(q: Quote) {
  return q.created_at ?? q.createdAt
}

export function Quotes() {
  const theme = useTheme()
  const { checkPermission } = usePermissions()
  const canReview = checkPermission('approve_quotes')

  const [listTab, setListTab] = useState<'all' | 'review'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuQuote, setMenuQuote] = useState<Quote | null>(null)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      if (listTab === 'review') {
        const res = await QuotesService.getAdminReviewQueue({ page: 1, limit: 100 })
        const payload = res.data as { quotes?: Quote[]; pagination?: { total?: number } }
        setQuotes(Array.isArray(payload?.quotes) ? payload.quotes : [])
        setTotalCount(payload?.pagination?.total ?? (payload?.quotes?.length ?? 0))
      } else {
        const res = await QuotesService.getQuotes({ page: 1, limit: 100 })
        const payload = res.data as { quotes?: Quote[]; pagination?: { total?: number } }
        setQuotes(Array.isArray(payload?.quotes) ? payload.quotes : [])
        setTotalCount(payload?.pagination?.total ?? (payload?.quotes?.length ?? 0))
      }
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load quotes')
      setQuotes([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [listTab])

  useEffect(() => {
    void load()
  }, [load])

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const text = quoteText(quote).toLowerCase()
      const matchesSearch =
        !searchTerm ||
        text.includes(searchTerm.toLowerCase()) ||
        String(quote.amount).includes(searchTerm) ||
        (quote.id && quote.id.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = selectedStatus === 'all' || quote.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [quotes, searchTerm, selectedStatus])

  const quoteStats = useMemo(() => {
    return {
      pending: quotes.filter((q) => q.status === 'pending').length,
      accepted: quotes.filter((q) => q.status === 'accepted').length,
      rejected: quotes.filter((q) => q.status === 'rejected').length,
      expired: quotes.filter((q) => q.status === 'expired').length,
      pendingReview: quotes.filter((q) => q.admin_review_status === 'pending_review').length,
    }
  }, [quotes])

  const openDetail = (q: Quote) => {
    setDetailQuote(q)
    setReviewNote('')
    setDetailOpen(true)
  }

  const runAdminReview = async (action: 'approve' | 'reject') => {
    if (!detailQuote) return
    setReviewSubmitting(true)
    try {
      await QuotesService.adminReviewQuote(detailQuote.id, action, reviewNote)
      setDetailOpen(false)
      setDetailQuote(null)
      await load()
    } catch {
      /* toasts from api base */
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quote: Quote) => {
    setAnchorEl(event.currentTarget)
    setMenuQuote(quote)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuQuote(null)
  }

  const StatCard = ({ title, value, color = 'primary' }: { title: string; value: number; color?: string }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: `${color}.main`,
            }}
          />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const QuoteCard = ({ quote }: { quote: Quote }) => {
    const StatusIcon = statusIcons[quote.status]
    const statusColor = statusColors[quote.status]
    const pro = quote.professional
    const proName = pro
      ? [pro.firstName, pro.lastName].filter(Boolean).join(' ') || pro.email || 'Professional'
      : null

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Quote #{quote.id.slice(-8).toUpperCase()}
                </Typography>
                <Chip
                  icon={<StatusIcon />}
                  label={quote.status}
                  size="small"
                  color={statusColor}
                  sx={{ textTransform: 'capitalize' }}
                />
                {quote.admin_review_status && (
                  <Chip
                    size="small"
                    color={quote.admin_review_status === 'pending_review' ? 'info' : 'default'}
                    label={reviewLabel(quote.admin_review_status)}
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {quoteText(quote) || '—'}
              </Typography>
              {proName && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Pro: {proName}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => openDetail(quote)}
              >
                View
              </Button>
              <IconButton size="small" onClick={(e) => handleMenuOpen(e, quote)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatCurrency(quote.amount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Amount
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={String(quote.service_request_id ?? quote.serviceRequestId ?? '—')}>
                    {quote.booking_id ? `Booking` : 'Request'}{' '}
                    #{(quote.service_request_id ?? quote.booking_id ?? quote.serviceRequestId ?? '—').toString().slice(-8)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {quote.booking_id ? 'Booking / add-on' : 'Service request'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                    {quote.provider?.businessName ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Company
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {validUntilRaw(quote) ? formatDate(validUntilRaw(quote) as string) : '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Valid until
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Customer
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {quote.customer
                  ? [quote.customer.firstName, quote.customer.lastName].filter(Boolean).join(' ') ||
                    quote.customer.email ||
                    '—'
                  : '—'}
              </Typography>
            </Box>
            <Chip
              label={createdRaw(quote) ? formatDate(createdRaw(quote) as string) : '—'}
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Quotes
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review professional quotations (photos + notes), approve or reject before the customer can accept.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant={listTab === 'all' ? 'contained' : 'outlined'} onClick={() => setListTab('all')}>
            All quotes
          </Button>
          <Button
            variant={listTab === 'review' ? 'contained' : 'outlined'}
            color="warning"
            startIcon={<GavelIcon />}
            onClick={() => setListTab('review')}
          >
            Review queue
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={listTab === 'review' ? 4 : 3}>
          <StatCard title="Pending (customer)" value={quoteStats.pending} color="warning" />
        </Grid>
        <Grid item xs={6} sm={listTab === 'review' ? 4 : 3}>
          <StatCard title="Accepted" value={quoteStats.accepted} color="success" />
        </Grid>
        <Grid item xs={6} sm={listTab === 'review' ? 4 : 3}>
          <StatCard title="Rejected" value={quoteStats.rejected} color="error" />
        </Grid>
        {listTab === 'all' ? (
          <Grid item xs={6} sm={3}>
            <StatCard title="Expired" value={quoteStats.expired} color="default" />
          </Grid>
        ) : (
          <Grid item xs={12} sm={12}>
            <Card variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Queue total (server): <strong>{totalCount}</strong> · In this page sample awaiting review:{' '}
                  <strong>{quoteStats.pendingReview}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Job status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Job status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                fullWidth
                sx={{ height: 56 }}
                onClick={() => void load()}
                disabled={loading}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loadError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {loadError}
        </Typography>
      )}

      {loading ? (
        <Typography color="text.secondary">Loading quotes…</Typography>
      ) : filteredQuotes.length > 0 ? (
        <Stack spacing={2}>
          {filteredQuotes.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </Stack>
      ) : (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <DollarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No quotes found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : listTab === 'review'
                  ? 'Nothing is waiting for platform review.'
                  : 'Quotes will appear when providers or professionals submit them.'}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuQuote) openDetail(menuQuote)
            handleMenuClose()
          }}
        >
          <VisibilityIcon sx={{ mr: 1 }} />
          View details
        </MenuItem>
      </Menu>

      <Dialog open={detailOpen} onClose={() => !reviewSubmitting && setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Quote detail
          {detailQuote?.admin_review_status === 'pending_review' && (
            <Chip size="small" label="Needs your decision" color="warning" sx={{ ml: 1 }} />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {detailQuote && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                ID: {detailQuote.id}
              </Typography>
              <Typography variant="h5">{formatCurrency(detailQuote.amount)}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Scope / description
              </Typography>
              <Typography variant="body1">{detailQuote.description || '—'}</Typography>
              {detailQuote.notes ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Additional notes
                  </Typography>
                  <Typography variant="body2">{detailQuote.notes}</Typography>
                </>
              ) : null}
              <Typography variant="subtitle2" color="text.secondary">
                Workflow
              </Typography>
              <Chip label={reviewLabel(detailQuote.admin_review_status)} size="small" variant="outlined" />
              {detailQuote.professional && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Professional
                  </Typography>
                  <Typography variant="body2">
                    {[detailQuote.professional.firstName, detailQuote.professional.lastName]
                      .filter(Boolean)
                      .join(' ') || detailQuote.professional.email}
                  </Typography>
                  {detailQuote.professional.categories?.length ? (
                    <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                      {detailQuote.professional.categories.map((c) => (
                        <Chip key={c} label={c} size="small" />
                      ))}
                    </Stack>
                  ) : null}
                </Box>
              )}
              {(detailQuote.attachment_urls?.length ?? 0) > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Photos & attachments
                  </Typography>
                  <Grid container spacing={1}>
                    {(detailQuote.attachment_urls ?? []).map((url) => (
                      <Grid item xs={6} sm={4} key={url}>
                        <Box
                          component="a"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ display: 'block' }}
                        >
                          <Box
                            component="img"
                            src={url}
                            alt=""
                            sx={{
                              width: '100%',
                              height: 120,
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              {canReview && detailQuote.admin_review_status === 'pending_review' && (
                <TextField
                  label="Internal note (optional)"
                  fullWidth
                  multiline
                  minRows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Reason for rejection or approval context (visible in audit)"
                />
              )}
              {detailQuote.admin_review_note && (
                <Typography variant="body2" color="text.secondary">
                  Last review note: {detailQuote.admin_review_note}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDetailOpen(false)} disabled={reviewSubmitting}>
            Close
          </Button>
          {canReview && detailQuote?.admin_review_status === 'pending_review' && (
            <>
              <Button color="error" variant="outlined" disabled={reviewSubmitting} onClick={() => runAdminReview('reject')}>
                Reject
              </Button>
              <Button color="success" variant="contained" disabled={reviewSubmitting} onClick={() => runAdminReview('approve')}>
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}
