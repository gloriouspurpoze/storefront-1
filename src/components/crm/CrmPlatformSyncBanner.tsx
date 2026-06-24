import { RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import type { PlatformSyncStats } from '../../lib/crmPlatformSync'

interface CrmPlatformSyncBannerProps {
  syncing: boolean
  lastSync: PlatformSyncStats | null
  syncError: string | null
  onSync: () => void
  canManage: boolean
}

export function CrmPlatformSyncBanner({
  syncing,
  lastSync,
  syncError,
  onSync,
  canManage,
}: CrmPlatformSyncBannerProps) {
  if (!canManage && !lastSync && !syncError) return null

  return (
    <div className="mb-4 rounded-lg border border-border/80 bg-muted/30 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-medium text-foreground">Platform sync</p>
          <p className="text-muted-foreground">
            Leads auto-link when customers sign up or bookings change (server-side sync). WhatsApp enquiries
            stay manual — use <strong>New WhatsApp lead</strong>.
          </p>
          {lastSync ? (
            <p className="text-xs text-muted-foreground">
              Last sync: {lastSync.created} new, {lastSync.updated} updated · scanned {lastSync.fromUsers}{' '}
              users & {lastSync.fromBookings} bookings
            </p>
          ) : null}
          {syncError ? <p className="text-xs text-destructive">{syncError}</p> : null}
        </div>
        {canManage ? (
          <Button type="button" size="sm" variant="outline" className="shrink-0 gap-1.5" disabled={syncing} onClick={onSync}>
            <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </Button>
        ) : null}
      </div>
    </div>
  )
}
