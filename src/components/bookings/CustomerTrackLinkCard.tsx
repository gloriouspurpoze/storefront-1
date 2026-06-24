import React, { useCallback, useMemo } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { buildBookingTrackPageUrl, bookingTrackRefFromId } from '../../lib/bookingTrackUrl'
import { useAppSelector } from '../../store/hooks'
import { appToast } from '../../lib/appToast'

type Props = {
  bookingId: string
  customerPhone?: string
  className?: string
}

export function CustomerTrackLinkCard({ bookingId, customerPhone, className }: Props) {
  const tenantId = useAppSelector((s) => s.tenant?.tenantId ?? null)
  const ref = useMemo(() => bookingTrackRefFromId(bookingId), [bookingId])
  const trackUrl = useMemo(
    () =>
      buildBookingTrackPageUrl({
        bookingId,
        phone: customerPhone,
        tenantId,
      }),
    [bookingId, customerPhone, tenantId],
  )

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trackUrl)
      appToast.success('Customer track link copied')
    } catch {
      appToast.error('Could not copy — select the link and copy manually')
    }
  }, [trackUrl])

  const copyRef = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ref)
      appToast.success('Booking reference copied')
    } catch {
      appToast.error('Could not copy reference')
    }
  }, [ref])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Customer tracking</CardTitle>
        <CardDescription>
          Share this link or reference — no login required. Customer enters the same mobile number used
          at the counter.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[8rem] flex-1">
            <p className="mb-1 text-xs text-muted-foreground">Reference</p>
            <p className="font-mono text-lg font-semibold tracking-wide">#{ref}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyRef()}>
            <Copy className="mr-1.5 h-4 w-4" aria-hidden />
            Copy ref
          </Button>
        </div>
        <div className="flex gap-2">
          <Input readOnly value={trackUrl} className="font-mono text-xs" aria-label="Track link" />
          <Button type="button" variant="outline" size="icon" onClick={() => void copyLink()} title="Copy link">
            <Copy className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="outline" size="icon" asChild title="Open track page">
            <a href={trackUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
