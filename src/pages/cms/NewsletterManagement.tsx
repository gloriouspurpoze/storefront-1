import React from 'react'
import { Megaphone, Mail, Puzzle, ExternalLink } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'

export default function NewsletterManagement() {
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Newsletter & Email Marketing"
        subtitle="Manage subscribers and email campaigns for your client website"
      />

      <div className="space-y-6">
        <div
          className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          Connect your email service provider (ESP) to collect subscribers and send campaigns. Common integrations:
          Mailchimp, Sendinblue, ConvertKit, or your backend API.
        </div>

        <Card className="overflow-hidden border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-10 w-10" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="mb-2 text-lg font-bold">Market-standard checklist</h2>
                <p className="mb-3 text-sm text-muted-foreground">Your client site can offer:</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>Signup form (footer / pop-up / inline)</li>
                  <li>Double opt-in (confirm email)</li>
                  <li>Segments (e.g. by interest or category)</li>
                  <li>Campaigns (promos, product updates, blog digest)</li>
                  <li>Unsubscribe and preference center</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="mb-2 flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Integration options</h2>
            </div>
            <Separator className="mb-3" />
            <p className="mb-4 text-sm text-muted-foreground">
              Add a backend endpoint (e.g. <code className="rounded bg-muted px-0.5">POST /api/newsletter/subscribe</code>
              ) that forwards to your ESP, or embed your ESP’s signup form on the client site. Use webhooks from your
              ESP to keep subscriber counts in sync.
            </p>
            <Button variant="outline" asChild>
              <a
                href="https://www.mailchimp.com/developers/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <Puzzle className="h-4 w-4" />
                View Mailchimp API docs
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
