import React from 'react'
import { MessageCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { cn } from '../../lib/utils'

type Variant = 'default' | 'compact'

/**
 * In-app ops guidance: WhatsApp as lead source, WhatsApp activities, platform IDs — no Meta API required.
 */
export function CrmWhatsAppStaffPlaybook({ variant = 'default', className }: { variant?: Variant; className?: string }) {
  const compact = variant === 'compact'

  return (
    <Card className={cn('border-storm-deep/25 bg-storm-deep/[0.06]', className)}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-storm-deep dark:text-storm-sea" aria-hidden />
          <CardTitle className="text-base">WhatsApp & jobs — how staff should use CRM</CardTitle>
        </div>
        {!compact ? (
          <CardDescription>
            Process only (no WhatsApp Business API in this screen). Keeps reporting and handoffs consistent.
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            <span className="text-foreground">Lead source:</span> for WhatsApp enquiries, set{' '}
            <strong className="text-foreground">Lead source</strong> to <strong className="text-foreground">WhatsApp</strong> on the lead or contact
            (use presets in the form).
          </li>
          <li>
            <span className="text-foreground">Log outcomes:</span> after quotes, follow-ups, or no-shows, add an{' '}
            <strong className="text-foreground">Activity</strong> with type <strong className="text-foreground">WhatsApp</strong> (or Call / Site
            visit) and link it to the <strong className="text-foreground">contact</strong> or <strong className="text-foreground">deal</strong>.
          </li>
          {!compact ? (
            <li>
              <span className="text-foreground">Platform IDs:</span> once the customer exists in the app or a job is on the board, open the contact
              and paste <strong className="text-foreground">Platform user ID</strong>, <strong className="text-foreground">Booking ID</strong>, and/or{' '}
              <strong className="text-foreground">Order ID</strong> — the drawer shows quick links to Users, Bookings, and Orders.
            </li>
          ) : (
            <li>
              <span className="text-foreground">Platform IDs:</span> paste user / booking / order IDs on the contact when the job exists — links
              appear in the contact panel.
            </li>
          )}
          <li>
            <span className="text-foreground">Pipeline:</span> update <strong className="text-foreground">lifecycle</strong> and{' '}
            <strong className="text-foreground">deal stage</strong> when reality changes (quoted → scheduled → paid).
          </li>
        </ol>
      </CardContent>
    </Card>
  )
}
