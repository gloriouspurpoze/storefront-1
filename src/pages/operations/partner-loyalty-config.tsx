import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, RefreshCw, Trophy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { PartnerLoyaltyService } from '../../services/api/partner-loyalty.service'
import { DEFAULT_PARTNER_LOYALTY_CONFIG, type PartnerLoyaltyTierRule } from '../../lib/partnerLoyaltyScore'
import { usePermissions } from '../../hooks/usePermissions'

export function PartnerLoyaltyConfigPage() {
  const { checkPermission } = usePermissions()
  const canManage = checkPermission('manage_operating_terms')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recalculating, setRecalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [rollingWindowDays, setRollingWindowDays] = useState(90)
  const [autoApplyCommission, setAutoApplyCommission] = useState(false)
  const [tiers, setTiers] = useState<PartnerLoyaltyTierRule[]>(DEFAULT_PARTNER_LOYALTY_CONFIG.tiers)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await PartnerLoyaltyService.getConfig()
      const cfg = res.data
      if (cfg) {
        setEnabled(cfg.enabled !== false)
        setRollingWindowDays(cfg.rollingWindowDays ?? 90)
        setAutoApplyCommission(cfg.autoApplyCommission === true)
        setTiers(cfg.tiers?.length ? cfg.tiers : DEFAULT_PARTNER_LOYALTY_CONFIG.tiers)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    if (!canManage) return
    setSaving(true)
    setError(null)
    try {
      await PartnerLoyaltyService.putConfig({
        enabled,
        rollingWindowDays,
        autoApplyCommission,
        tiers,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const recalculate = async () => {
    if (!canManage) return
    setRecalculating(true)
    setError(null)
    try {
      await PartnerLoyaltyService.recalculateAll(300)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Recalculate failed')
    } finally {
      setRecalculating(false)
    }
  }

  const updateTier = (index: number, patch: Partial<PartnerLoyaltyTierRule>) => {
    setTiers((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)))
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading loyalty program…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Trophy className="h-5 w-5 text-primary" />
            Partner loyalty program
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Bronze → Silver → Gold → Elite tiers reward verified partners with lower commission and priority
            job matching. Scores use rating, completed jobs, and cancel rate.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/operations/supply-quality">Supply quality roster</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Program settings</CardTitle>
          <CardDescription>
            When auto-apply commission is on, recalculate writes tier commission to each partner profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3">
              <Switch
                id="loyalty-enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
                disabled={!canManage}
              />
              <Label htmlFor="loyalty-enabled">Program enabled</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="loyalty-auto-commission"
                checked={autoApplyCommission}
                onCheckedChange={setAutoApplyCommission}
                disabled={!canManage}
              />
              <Label htmlFor="loyalty-auto-commission">Auto-apply tier commission</Label>
            </div>
          </div>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="rolling-window">Rolling window (days)</Label>
            <Input
              id="rolling-window"
              type="number"
              min={30}
              max={365}
              value={rollingWindowDays}
              onChange={(e) => setRollingWindowDays(Number(e.target.value) || 90)}
              disabled={!canManage}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tier rules</CardTitle>
          <CardDescription>Partners qualify for the highest tier they meet all criteria for.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Min jobs</TableHead>
                <TableHead>Min rating</TableHead>
                <TableHead>Max cancel %</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Commission %</TableHead>
                <TableHead>Priority boost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.map((tier, i) => (
                <TableRow key={tier.tier}>
                  <TableCell className="font-medium">{tier.label}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={tier.minCompletedJobs}
                      onChange={(e) => updateTier(i, { minCompletedJobs: Number(e.target.value) || 0 })}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 w-20"
                      value={tier.minRating}
                      onChange={(e) => updateTier(i, { minRating: Number(e.target.value) || 0 })}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={tier.maxCancelRatePercent}
                      onChange={(e) => updateTier(i, { maxCancelRatePercent: Number(e.target.value) || 0 })}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell>{tier.requiresVerified ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={tier.commissionPercent ?? 15}
                      onChange={(e) => updateTier(i, { commissionPercent: Number(e.target.value) || 0 })}
                      disabled={!canManage}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-8 w-20"
                      value={tier.priorityBoost ?? 0}
                      onChange={(e) => updateTier(i, { priorityBoost: Number(e.target.value) || 0 })}
                      disabled={!canManage}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save settings
          </Button>
          <Button variant="secondary" onClick={() => void recalculate()} disabled={recalculating}>
            {recalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Recalculate all partners
          </Button>
        </div>
      )}
    </div>
  )
}
