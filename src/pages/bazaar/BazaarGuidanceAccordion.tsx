import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Shared product/legal guidance for Bazaar admin screens (offers, chats, listing review).
 * Kept in sync with fixer-backend/docs/API_BAZAAR.md.
 */
export function BazaarGuidanceAccordion({
  defaultExpanded = false,
}: {
  defaultExpanded?: boolean
}) {
  return (
    <details
      className={cn('group mb-4 rounded-lg border bg-card', defaultExpanded && 'open')}
      open={defaultExpanded}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
        <span>Operations, lifecycle & compliance</span>
        <ChevronDown className="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-3 border-t px-3 py-2 text-sm">
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Offer semantics</h3>
          <p className="text-muted-foreground">
            Typical lifecycle: <strong>pending</strong> → optional <strong>countered</strong> →{' '}
            <strong>accepted</strong>, <strong>declined</strong>, <strong>withdrawn</strong>, or{' '}
            <strong>expired</strong> after <code className="rounded bg-muted px-0.5">expiresAt</code>. Settlement and
            fulfillment are defined by your product rules (pickup, delivery, off-platform payment, etc.).
          </p>
        </div>
        <hr className="border-border" />
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Listing threads</h3>
          <p className="text-muted-foreground">
            Each thread is scoped to a listing (see <code className="rounded bg-muted px-0.5">metadata.listingId</code>).
            When a listing is removed or sold, archive or close threads in the backend so buyers are not misled. Message
            retention should match your privacy policy and jurisdiction.
          </p>
        </div>
        <hr className="border-border" />
        <div>
          <h3 className="mb-1 text-xs font-medium uppercase text-muted-foreground">Trust & safety</h3>
          <p className="text-muted-foreground">
            Use rate limits and abuse detection on the API for public endpoints. For moderation, wire reports to support
            or a queue; admin Bazaar screens are for <strong>visibility</strong> and export — blocking users or hiding
            listings requires backend/admin actions you control.
          </p>
        </div>
      </div>
    </details>
  )
}
