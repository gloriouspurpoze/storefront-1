'use client'

import { useEffect, useState, type AnchorHTMLAttributes } from 'react'
import { captureAttribution, withAttribution } from '../attribution'

/**
 * Link to the admin app (signup / sign in). Renders the plain URL on the server,
 * so crawlers see a clean link, then adds first-touch attribution in the browser.
 */
export function AttributionLink({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const [resolved, setResolved] = useState(href)
  useEffect(() => {
    setResolved(withAttribution(href, captureAttribution()))
  }, [href])
  return <a href={resolved} {...rest} />
}

/** Records first-touch attribution on every page view, even without a CTA on screen. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
