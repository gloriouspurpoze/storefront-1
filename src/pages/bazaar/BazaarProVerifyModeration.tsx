import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { PageHeader } from '../../components/common/PageHeader'
import {
  BazaarMarketplaceService,
  type BazaarProVerifyRequestRow,
} from '../../services/api/bazaarMarketplace.service'

function formatSeller(r: BazaarProVerifyRequestRow): string {
  const s = r.seller
  if (!s || typeof s !== 'object') return '—'
  const name = [s.firstName, s.lastName].filter(Boolean).join(' ').trim()
  return name || s.email || s.userId || s.phone || '—'
}

/**
 * Pro-Verify on-site certification queue — same Fixer admin JWT as listing review.
 */
export default function BazaarProVerifyModeration() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<BazaarProVerifyRequestRow[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [savingId, setSavingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        workflowStep: number
        technicianSummary: string
        adminInternalNote: string
        scheduledVisitAt: string
      }
    >
  >({})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await BazaarMarketplaceService.adminListProVerify({ page, limit: 20 })
      const data = (res.data as BazaarProVerifyRequestRow[]) || []
      setRows(data)
      const meta = res.meta as { pagination?: { totalPages?: number } } | undefined
      setTotalPages(meta?.pagination?.totalPages ?? 1)
      setDrafts((prev) => {
        const next = { ...prev }
        for (const r of data) {
          if (!next[r.id]) {
            next[r.id] = {
              workflowStep: r.workflowStep,
              technicianSummary: r.technicianSummary ?? '',
              adminInternalNote: '',
              scheduledVisitAt: r.scheduledVisitAt
                ? r.scheduledVisitAt.slice(0, 16)
                : '',
            }
          }
        }
        return next
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Pro-Verify queue.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  const saveRow = async (r: BazaarProVerifyRequestRow) => {
    const d = drafts[r.id]
    if (!d) return
    setSavingId(r.id)
    setError(null)
    try {
      await BazaarMarketplaceService.adminPatchProVerify(r.id, {
        workflowStep: d.workflowStep,
        technicianSummary: d.technicianSummary.trim() || undefined,
        adminInternalNote: d.adminInternalNote.trim() || undefined,
        scheduledVisitAt: d.scheduledVisitAt
          ? new Date(d.scheduledVisitAt).toISOString()
          : null,
      })
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Box>
      <PageHeader
        title="Bazaar — Pro-Verify queue"
        subtitle="Advance seller on-site verification; step 4 marks the listing ProFixer Certified"
      />

      <BazaarGuidanceAccordion />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 880 }}>
        Same admin session as <strong>Listing review</strong>. Step 4 updates the public listing badge;
        sellers see progress in the Bazaar app.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </Stack>

      {loading && rows.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No Pro-Verify requests yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {rows.map((r) => {
            const d = drafts[r.id] ?? {
              workflowStep: r.workflowStep,
              technicianSummary: r.technicianSummary ?? '',
              adminInternalNote: '',
              scheduledVisitAt: r.scheduledVisitAt ? r.scheduledVisitAt.slice(0, 16) : '',
            }
            return (
              <Paper key={r.id} sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Listing ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, mb: 1 }}>
                  {r.listingId}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  +91 {r.contactPhone} · {r.slotPreferenceLabel} · Seller: {formatSeller(r)}
                </Typography>

                <Stack spacing={2} sx={{ maxWidth: 480 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id={`step-${r.id}`}>Workflow step</InputLabel>
                    <Select
                      labelId={`step-${r.id}`}
                      label="Workflow step"
                      value={d.workflowStep}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [r.id]: { ...d, workflowStep: Number(e.target.value) },
                        }))
                      }
                    >
                      <MenuItem value={1}>1 — Request received</MenuItem>
                      <MenuItem value={2}>2 — Technician / visit scheduled</MenuItem>
                      <MenuItem value={3}>3 — Inspection & listing update</MenuItem>
                      <MenuItem value={4}>4 — Certified (badge on listing)</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    fullWidth
                    label="Dispatch note (shown to seller)"
                    value={d.technicianSummary}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [r.id]: { ...d, technicianSummary: e.target.value },
                      }))
                    }
                    placeholder="e.g. Technician assigned — window confirmed"
                  />
                  <TextField
                    size="small"
                    fullWidth
                    type="datetime-local"
                    label="Visit (local)"
                    InputLabelProps={{ shrink: true }}
                    value={d.scheduledVisitAt}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [r.id]: { ...d, scheduledVisitAt: e.target.value },
                      }))
                    }
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label="Internal note (ops only)"
                    value={d.adminInternalNote}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [r.id]: { ...d, adminInternalNote: e.target.value },
                      }))
                    }
                  />
                  <Button
                    variant="contained"
                    disabled={savingId === r.id}
                    onClick={() => void saveRow(r)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {savingId === r.id ? 'Saving…' : 'Save progress'}
                  </Button>
                </Stack>
              </Paper>
            )
          })}
        </Stack>
      )}

      {totalPages > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      ) : null}
    </Box>
  )
}
