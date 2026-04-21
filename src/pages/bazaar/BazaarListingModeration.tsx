import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { PageHeader } from '../../components/common/PageHeader'
import { BazaarMarketplaceService } from '../../services/api/bazaarMarketplace.service'
import type { BazaarAdminListingRow } from '../../services/api/bazaarMarketplace.service'

function formatUser(u: unknown): string {
  if (!u || typeof u !== 'object') return '—'
  const o = u as { firstName?: string; lastName?: string; email?: string; userId?: string }
  const name = [o.firstName, o.lastName].filter(Boolean).join(' ').trim()
  return name || o.email || o.userId || '—'
}

function statusColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'published') return 'success'
  if (status === 'pending_review') return 'warning'
  if (status === 'rejected') return 'error'
  return 'default'
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
      const res = await BazaarMarketplaceService.adminListListings({
        page,
        limit: 20,
        status:
          statusFilter === 'pending_review' ||
          statusFilter === 'published' ||
          statusFilter === 'rejected'
            ? statusFilter
            : undefined,
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
    <Box>
      <PageHeader
        title="Bazaar — listing review"
        subtitle="Approve new peer-to-peer listings before they appear site-wide"
      />

      <BazaarGuidanceAccordion />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 800 }}>
        New marketplace posts enter as <strong>Pending review</strong>. Approve to publish them to
        the public feed, or reject with an internal reason (shown to the seller when applicable).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="mod-status-label">Moderation status</InputLabel>
            <Select
              labelId="mod-status-label"
              label="Moderation status"
              value={statusFilter}
              onChange={(e) => {
                setPage(1)
                setStatusFilter(e.target.value)
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="pending_review">Pending review</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Price (₹)</TableCell>
              <TableCell>Seller</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No listings in this filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.moderationStatus}
                      color={statusColor(row.moderationStatus)}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>{row.title}</TableCell>
                  <TableCell>{row.priceInr?.toLocaleString('en-IN')}</TableCell>
                  <TableCell>{formatUser(row.seller)}</TableCell>
                  <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    {row.moderationStatus === 'pending_review' ? (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          onClick={() => {
                            setActionRow(row)
                            setModerateAction('approve')
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            setActionRow(row)
                            setModerateAction('reject')
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, p) => setPage(p)}
          color="primary"
        />
      </Box>

      <Dialog
        open={Boolean(actionRow && moderateAction)}
        onClose={() => {
          if (!busy) {
            setActionRow(null)
            setModerateAction(null)
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {moderateAction === 'reject' ? 'Reject listing' : 'Publish listing'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {actionRow?.title}
          </Typography>
          {moderateAction === 'reject' && (
            <TextField
              label="Reason (optional)"
              fullWidth
              multiline
              minRows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Stored with the listing for audit"
            />
          )}
          {moderateAction === 'approve' && (
            <Typography variant="body2" color="text.secondary">
              This listing will become visible in the public Bazaar feed and support offers/chat per
              your rules.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setActionRow(null)
              setModerateAction(null)
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={moderateAction === 'reject' ? 'error' : 'success'}
            disabled={busy || !moderateAction}
            onClick={() => moderateAction && void onModerate(moderateAction)}
          >
            {busy ? <CircularProgress size={22} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
