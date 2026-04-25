import React from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { NotificationManager } from '../../components/notifications/NotificationManager'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

export function Notifications() {
  return (
    <div className="mx-auto max-w-7xl py-3">
      <PageHeader
        title="Notifications"
        subtitle="In-app feed, optional broadcast sends, reusable templates, and channel preferences—aligned with typical SaaS notification operations."
        action={
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="font-normal">
              In-app feed
            </Badge>
            <Badge variant="outline" className="font-normal">
              Broadcast API
            </Badge>
            <Badge variant="outline" className="font-normal">
              Web push (device)
            </Badge>
          </div>
        }
      />

      <Card className="overflow-hidden border">
        <div className="border-b bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Restrict high-impact actions with server-side roles (for example <code className="rounded bg-muted px-0.5">notification_send</code> /{' '}
            <code className="rounded bg-muted px-0.5">notification_manage</code>). This UI assumes your API enforces the
            same rules.
          </p>
        </div>
        <CardContent className="p-0">
          <NotificationManager />
        </CardContent>
      </Card>
    </div>
  )
}
