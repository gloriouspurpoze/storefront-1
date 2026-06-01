import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { getVerticalPack, verticalKeyFromMarketingSlug } from '../../verticals/registry'
import { normalizeVerticalKey } from '../../verticals/core/types'
import { formatPlanPriceInr, getBillingPlansForVertical } from '../../lib/verticalPlans'

export function VerticalLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const verticalKey = normalizeVerticalKey(
    verticalKeyFromMarketingSlug(slug ?? '') ?? slug ?? 'home_services',
  )
  const full = getVerticalPack(verticalKey)
  const plans = getBillingPlansForVertical(verticalKey)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">ProFixer platform</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{full.label}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{full.description}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {plans.map((p) => (
            <Card key={p.key}>
              <CardContent className="p-5">
                <p className="font-semibold">{p.label}</p>
                <p className="mt-1 text-2xl font-bold text-primary">
                  {formatPlanPriceInr(p) ?? 'Contact us'}
                  {formatPlanPriceInr(p) ? <span className="text-sm font-normal text-muted-foreground">/mo</span> : null}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link to={`/signup/${verticalKey}`}>Start free trial</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
