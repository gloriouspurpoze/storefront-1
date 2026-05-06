import { useCallback, useEffect, useState } from 'react'
import { marketingWorkspaceApi, type MarketingWorkspaceQuery } from '../services/api/marketingWorkspace.api'
import type { MarketingWorkspaceBundle } from '../types/marketingWorkspace.types'

/**
 * Loads `/marketing-workspace/workspace` (single round-trip).
 * Pass `YYYY-MM` as a string, or `{ month, weekStart, calendarCampaignId }` for server-side filters.
 */
export function useMarketingWorkspace(opts?: string | MarketingWorkspaceQuery) {
  const month = typeof opts === 'string' ? opts : opts?.month
  const weekStart = typeof opts === 'object' ? opts?.weekStart : undefined
  const calendarCampaignId = typeof opts === 'object' ? opts?.calendarCampaignId : undefined

  const [bundle, setBundle] = useState<MarketingWorkspaceBundle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q: MarketingWorkspaceQuery | undefined =
        month || weekStart || calendarCampaignId
          ? { month, weekStart, calendarCampaignId }
          : undefined
      const b = await marketingWorkspaceApi.getWorkspace(q)
      setBundle(b)
    } catch (e) {
      setBundle(null)
      setError(e instanceof Error ? e.message : 'Could not load marketing workspace')
    } finally {
      setLoading(false)
    }
  }, [month, weekStart, calendarCampaignId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { bundle, loading, error, reload }
}
