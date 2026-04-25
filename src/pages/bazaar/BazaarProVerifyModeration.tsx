import React, { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { BazaarGuidanceAccordion } from './BazaarGuidanceAccordion'
import { PageHeader } from '../../components/common/PageHeader'
import {
  BazaarMarketplaceService,
  type BazaarProVerifyRequestRow,
} from '../../services/api/bazaarMarketplace.service'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
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
              scheduledVisitAt: r.scheduledVisitAt ? r.scheduledVisitAt.slice(0, 16) : '',
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
        scheduledVisitAt: d.scheduledVisitAt ? new Date(d.scheduledVisitAt).toISOString() : null,
      })
      void load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Bazaar — Pro-Verify queue"
        subtitle="Advance seller on-site verification; step 4 marks the listing ProFixer Certified"
      />

      <BazaarGuidanceAccordion />

      <p className="mb-3 max-w-3xl text-sm text-muted-foreground">
        Same admin session as <strong>Listing review</strong>. Step 4 updates the public listing badge; sellers see
        progress in the Bazaar app.
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

      <div className="mb-3 flex justify-end">
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">No Pro-Verify requests yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const d = drafts[r.id] ?? {
              workflowStep: r.workflowStep,
              technicianSummary: r.technicianSummary ?? '',
              adminInternalNote: '',
              scheduledVisitAt: r.scheduledVisitAt ? r.scheduledVisitAt.slice(0, 16) : '',
            }
            return (
              <Card key={r.id}>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Listing ID</p>
                    <p className="font-mono text-sm font-semibold">{r.listingId}</p>
                    <p className="text-sm text-muted-foreground">
                      +91 {r.contactPhone} · {r.slotPreferenceLabel} · Seller: {formatSeller(r)}
                    </p>
                  </div>

                  <div className="max-w-md space-y-3">
                    <div>
                      <Label>Workflow step</Label>
                      <Select
                        value={String(d.workflowStep)}
                        onValueChange={(v) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.id]: { ...d, workflowStep: Number(v) },
                          }))
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 — Request received</SelectItem>
                          <SelectItem value="2">2 — Technician / visit scheduled</SelectItem>
                          <SelectItem value="3">3 — Inspection & listing update</SelectItem>
                          <SelectItem value="4">4 — Certified (badge on listing)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Dispatch note (shown to seller)</Label>
                      <Textarea
                        className="mt-1"
                        value={d.technicianSummary}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.id]: { ...d, technicianSummary: e.target.value },
                          }))
                        }
                        placeholder="e.g. Technician assigned — window confirmed"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label>Visit (local)</Label>
                      <Input
                        className="mt-1"
                        type="datetime-local"
                        value={d.scheduledVisitAt}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.id]: { ...d, scheduledVisitAt: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label>Internal note (ops only)</Label>
                      <Input
                        className="mt-1"
                        value={d.adminInternalNote}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [r.id]: { ...d, adminInternalNote: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={savingId === r.id}
                      onClick={() => void saveRow(r)}
                    >
                      {savingId === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {savingId === r.id ? 'Saving…' : 'Save progress'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
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
      ) : null}
    </div>
  )
}
