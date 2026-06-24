import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getConsumerSiteOrigin } from '../../lib/bookingTrackUrl'
import { TrackBookingPageInner } from './TrackBookingPageInner'

/**
 * Legacy admin route — redirects to the consumer site when REACT_APP_PUBLIC_SITE_ORIGIN is set.
 */
export function TrackBookingPage() {
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const consumer = getConsumerSiteOrigin()
    if (typeof window === 'undefined') return
    const adminOrigin = window.location.origin.replace(/\/$/, '')
    if (consumer === adminOrigin) return
    const target = new URL(`${consumer}/track-booking`)
    searchParams.forEach((value, key) => {
      target.searchParams.set(key, value)
    })
    window.location.replace(target.toString())
  }, [searchParams])

  const consumer = getConsumerSiteOrigin()
  if (typeof window !== 'undefined' && consumer !== window.location.origin.replace(/\/$/, '')) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">
        Opening track page on {consumer.replace(/^https?:\/\//, '')}…
      </div>
    )
  }

  return <TrackBookingPageInner />
}

export default TrackBookingPage
