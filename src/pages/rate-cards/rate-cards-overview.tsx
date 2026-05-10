import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, CircleDollarSign, Users, Package, Wrench } from 'lucide-react'
import { CMSService } from '../../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

function countLines(blob: Record<string, unknown>): { categories: number; lines: number } {
  let lines = 0
  let categories = 0
  for (const v of Object.values(blob)) {
    if (!Array.isArray(v)) continue
    categories += 1
    lines += v.length
  }
  return { categories, lines }
}

export function RateCardsOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Record<string, unknown>>({})
  const [provider, setProvider] = useState<Record<string, unknown>>({})

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setErr(null)
      try {
        const [c, p] = await Promise.all([CMSService.getRateCards(), CMSService.getProviderRateCards()])
        if (cancelled) return
        setCustomer(typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : {})
        setProvider(typeof p === 'object' && p !== null ? (p as Record<string, unknown>) : {})
      } catch (e: unknown) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Failed to load rate card snapshots')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const custStats = useMemo(() => countLines(customer), [customer])
  const provStats = useMemo(() => countLines(provider), [provider])

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
          Loading pricing snapshots…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CircleDollarSign className="h-4 w-4" />
                  Customer categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{custStats.categories}</p>
                <p className="text-xs text-muted-foreground">Keys in published rate-card JSON</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Customer lines</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{custStats.lines}</p>
                <p className="text-xs text-muted-foreground">Parts / jobs shown on catalog</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Provider categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{provStats.categories}</p>
                <p className="text-xs text-muted-foreground">Partner playbook blob (admin-only)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Provider lines</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{provStats.lines}</p>
                <p className="text-xs text-muted-foreground">Economics / SLA hints for ops</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-md border-border">
              <CardHeader>
                <CardTitle className="text-lg">Workflow</CardTitle>
                <CardDescription>
                  Keep customer rows aligned with industry CMS keys (same picker as landing pages). Provider rows are
                  for desk training — they do not replace contract payouts in ledger code.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="outline" asChild className="justify-between rounded-md">
                  <Link to="/rate-cards/customer">
                    Edit customer matrix
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-between rounded-md">
                  <Link to="/rate-cards/provider">
                    Edit provider playbook
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-between rounded-md">
                  <Link to="/rate-cards/catalog">
                    Review SKU & service tariffs
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-md border-border">
              <CardHeader>
                <CardTitle className="text-lg">Shortcuts</CardTitle>
                <CardDescription>Deep links into POS-adjacent surfaces.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button variant="secondary" asChild className="justify-start gap-2 rounded-md">
                  <Link to="/operations/pos">
                    <Wrench className="h-4 w-4" />
                    Home-service POS
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="justify-start gap-2 rounded-md">
                  <Link to="/platform-services">
                    <Wrench className="h-4 w-4" />
                    Platform services
                  </Link>
                </Button>
                <Button variant="secondary" asChild className="justify-start gap-2 rounded-md">
                  <Link to="/products">
                    <Package className="h-4 w-4" />
                    Store SKUs
                  </Link>
                </Button>
                <Button variant="ghost" asChild className="justify-start text-muted-foreground">
                  <Link to="/cms/category-marketing?tab=rate-card">Industry CMS tab (legacy entry)</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
