import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, FileStack, Mail, PenLine, ArrowRight } from 'lucide-react'
import { CompanyDocumentsService } from '../../services/api/company-documents.service'
import type { CompanyDocumentsSummary } from '../../types/company-documents.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'

export function CompanyDocumentsOverviewPage() {
  const [summary, setSummary] = useState<CompanyDocumentsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await CompanyDocumentsService.getSummary()
        if (cancelled) return
        setSummary(res.data)
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load summary')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading document workspace…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileStack className="h-4 w-4" />
                  Active templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{summary?.templatesActive ?? 0}</p>
                <p className="text-xs text-muted-foreground">Non-archived library items</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Open envelopes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-primary dark:text-primary">
                  {summary?.envelopesOpen ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Draft, sent, or viewed — awaiting signature</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PenLine className="h-4 w-4" />
                  Signed (all time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums text-storm-deep dark:text-storm-sea">
                  {summary?.envelopesSigned ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Recorded acknowledgements</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How teams use this hub</CardTitle>
              <CardDescription>
                Built for a home-service POS: technicians, partners, and homeowners each see different obligations —
                NDAs, safety briefings, contractor payout rules, cancellation policies, and AMC addenda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Maintain a <strong className="text-foreground">template library</strong> with audience (customer,
                  provider, professional, internal) and lifecycle category (onboarding, hiring, termination, etc.).
                </li>
                <li>
                  Optionally attach a <strong className="text-foreground">PDF</strong> URL and compose HTML or Markdown
                  for the hosted preview recipients see before signing.
                </li>
                <li>
                  Create a <strong className="text-foreground">signature envelope</strong> per recipient email, send the
                  invite from the dashboard (SMTP on the API), or copy the signing link into WhatsApp / SMS.
                </li>
                <li>
                  Recipients acknowledge with a <strong className="text-foreground">typed full name</strong> on a hosted
                  API page — no fixer-admin login required. Audit fields capture viewed / signed timestamps when
                  configured on the server.
                </li>
                <li>
                  <strong className="text-foreground">Branding:</strong> CMS <strong className="text-foreground">Site appearance</strong>{' '}
                  (tenant <code className="rounded bg-muted px-1 text-xs">publicSiteTheme</code>) supplies logo, colors,
                  and fonts on the signing page; optional <strong className="text-foreground">Decline / Cancel</strong>{' '}
                  on envelopes closes the loop operationally.
                </li>
              </ol>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/company-documents/templates"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/company-documents/envelopes"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open envelopes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
