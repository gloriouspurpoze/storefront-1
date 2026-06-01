import React, { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { getVerticalPack, verticalKeyFromMarketingSlug } from '../../verticals/registry'
import { normalizeVerticalKey } from '../../verticals/core/types'
import { getDefaultPlanKey, getRecommendedPlan } from '../../lib/verticalPlans'

export function VerticalSignupWizard() {
  const { verticalKey: paramKey } = useParams<{ verticalKey: string }>()
  const navigate = useNavigate()
  const verticalKey = normalizeVerticalKey(
    paramKey ?? verticalKeyFromMarketingSlug(paramKey ?? '') ?? 'home_services',
  )
  const pack = getVerticalPack(verticalKey)
  const recommended = getRecommendedPlan(verticalKey)

  const [step, setStep] = useState(1)
  const [orgName, setOrgName] = useState('')
  const [email, setEmail] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-6 p-6">
          <div>
            <p className="text-xs font-semibold uppercase text-primary">Get started</p>
            <h1 className="text-2xl font-bold">{pack.label}</h1>
            <p className="text-sm text-muted-foreground">{pack.description}</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm">
                Recommended plan: <strong>{recommended.label}</strong> — platform operators complete tenant
                provisioning on <Link to="/settings/tenants" className="text-primary underline">Platform tenants</Link>.
              </p>
              <Button type="button" className="w-full" onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org">Organization name</Label>
                <Input id="org" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">
                Default plan key for ops: <span className="font-mono">{getDefaultPlanKey(verticalKey)}</span>
              </p>
              <Button type="button" className="w-full" onClick={() => navigate('/auth')}>
                Go to sign in / register
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            <Link to={`/${pack.marketingSlug ?? ''}`} className="underline">
              Back to {pack.label} overview
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
