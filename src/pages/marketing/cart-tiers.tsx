import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { CouponsService } from '../../services/api/coupons.service'
import { appToast } from '../../lib/appToast'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'

type Tier = {
  minSpend: number
  discountType: 'percentage' | 'fixed'
  discountValue: number
}

export default function CartTiersPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [tiers, setTiers] = useState<Tier[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await CouponsService.getSpendTiers()
      if (res.success && res.data) {
        setIsActive(res.data.isActive)
        setTiers(res.data.tiers?.length ? res.data.tiers : defaultTiers())
      } else {
        setTiers(defaultTiers())
      }
    } catch {
      setTiers(defaultTiers())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setSaving(true)
    try {
      const res = await CouponsService.saveSpendTiers({ isActive, tiers })
      if (!res.success) {
        appToast(res.message || 'Save failed', 'error')
        return
      }
      appToast('Cart spend tiers saved', 'success')
      if (res.data?.tiers) setTiers(res.data.tiers)
    } catch (e: unknown) {
      appToast(e instanceof Error ? e.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Cart spend tiers"
        subtitle="Auto discounts when cart subtotal crosses thresholds — no code required at checkout."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/marketing/coupons">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Back to coupons
            </Link>
          </Button>
        }
      />

      <Card className="mt-6 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Spend ladder</CardTitle>
          <CardDescription>
            Applied automatically on web checkout (best qualifying tier wins). Default: ₹999 → ₹100 off,
            ₹1999 → ₹250, ₹2999 → ₹450.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <Label htmlFor="tiers-active">Active</Label>
                <Switch id="tiers-active" checked={isActive} onCheckedChange={setIsActive} />
              </div>
              {tiers.map((tier, i) => (
                <div key={i} className="grid gap-3 rounded-md border p-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label>Min spend (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.minSpend || ''}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setTiers((t) => t.map((x, j) => (j === i ? { ...x, minSpend: v } : x)))
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Discount (₹)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={tier.discountValue || ''}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        setTiers((t) =>
                          t.map((x, j) =>
                            j === i ? { ...x, discountType: 'fixed', discountValue: v } : x,
                          ),
                        )
                      }}
                    />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setTiers((t) => [...t, { minSpend: 0, discountType: 'fixed', discountValue: 0 }])}>
                Add tier
              </Button>
              <Button type="button" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save tiers
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function defaultTiers(): Tier[] {
  return [
    { minSpend: 999, discountType: 'fixed', discountValue: 100 },
    { minSpend: 1999, discountType: 'fixed', discountValue: 250 },
    { minSpend: 2999, discountType: 'fixed', discountValue: 450 },
  ]
}
