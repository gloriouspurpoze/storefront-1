import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  Video,
} from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'
import { cn } from '../../lib/utils'

const SUPPORT_EMAIL = process.env.REACT_APP_SUPPORT_EMAIL || 'support@profixer.in'
const SUPPORT_PHONE = process.env.REACT_APP_SUPPORT_PHONE || '+91-98765-43210'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    category: 'Products',
    question: 'How do I add a new product?',
    answer:
      'Go to E-commerce → Products → Add product. Complete pricing, media, and SEO fields, then publish when ready.',
  },
  {
    id: '2',
    category: 'Users',
    question: 'How are roles and permissions enforced?',
    answer:
      'This admin checks permissions on each route. Your API must enforce the same rules server-side for every write.',
  },
  {
    id: '3',
    category: 'Operations',
    question: 'Where do service requests and bookings show up?',
    answer:
      'Operations → Service requests and Bookings. Filters help triage by status; exports live on those screens when enabled.',
  },
  {
    id: '4',
    category: 'Notifications',
    question: 'How do I broadcast to users?',
    answer:
      'Open Notifications in the sidebar: in-app feed, templates, and optional broadcast sends when your backend allows it.',
  },
  {
    id: '5',
    category: 'Data',
    question: 'How do I export operational data?',
    answer:
      'Use Reports & data for shortcuts. Most tables expose CSV or Excel when the API supports export — check each module\'s toolbar.',
  },
  {
    id: '6',
    category: 'System',
    question: 'How do I verify the API is reachable?',
    answer:
      'System → System status runs live probes against your configured REACT_APP_API_URL using your current session.',
  },
  {
    id: '7',
    category: 'Operations',
    question: 'Where do provider dispute and support tickets appear?',
    answer:
      'Open Support ticket queue (sidebar System → Support tickets, or Help & support → shortcut). It calls GET /api/feedback-support/support/tickets — same pipeline as the provider app “Report issue” and Profile → Submit support ticket.',
  },
]

export function Support() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null)

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return FAQ_ITEMS
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    )
  }, [searchQuery])

  return (
    <div className="min-h-0 flex-1 space-y-8">
      <PageHeader
        title="Help & support"
        subtitle="Contact channels, FAQs, and links into the admin. Prefer in-app chat for customer conversations."
        icon={<LifeBuoy className="h-8 w-8 shrink-0" aria-hidden />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Contact</CardTitle>
            <CardDescription>Pick the channel that matches urgency and audience.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ContactTile
              icon={<Mail className="h-5 w-5" />}
              title="Email"
              body={`${SUPPORT_EMAIL} — typical reply within one business day.`}
              action={
                <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" asChild>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>Compose email</a>
                </Button>
              }
            />
            <ContactTile
              icon={<Phone className="h-5 w-5" />}
              title="Phone"
              body={`${SUPPORT_PHONE} — for production-impacting issues.`}
              action={
                <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" asChild>
                  <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}>Call</a>
                </Button>
              }
            />
            <ContactTile
              icon={<MessageCircle className="h-5 w-5" />}
              title="In-app chat"
              body="Operator console for customer and provider threads."
              action={
                <Button variant="default" size="sm" className="mt-3 w-full sm:w-auto" asChild>
                  <Link to="/chat">Open chat</Link>
                </Button>
              }
            />
            <ContactTile
              icon={<Video className="h-5 w-5" />}
              title="Live session"
              body="Schedule a screen-share for onboarding or incident review."
              action={
                <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" asChild>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Schedule a support session')}`}
                  >
                    Request session
                  </a>
                </Button>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shortcuts</CardTitle>
            <CardDescription>Jump to operational pages.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="justify-between font-normal" asChild>
              <Link to="/support/tickets">
                Support ticket queue <Badge variant="secondary">feedback-support API</Badge>
              </Link>
            </Button>
            <Button variant="outline" className="justify-between font-normal" asChild>
              <Link to="/system-status">
                System status <Badge variant="secondary">Live checks</Badge>
              </Link>
            </Button>
            <Button variant="outline" className="justify-between font-normal" asChild>
              <Link to="/reports">Reports &amp; data</Link>
            </Button>
            <Button variant="outline" className="justify-between font-normal" asChild>
              <Link to="/notifications">Notifications</Link>
            </Button>
            <Button variant="outline" className="justify-between font-normal" asChild>
              <Link to="/settings">Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4" aria-hidden />
            Frequently asked questions
          </CardTitle>
          <CardDescription>Search across questions and answers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search FAQs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search FAQs"
          />
          {filteredFaqs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No matches. Try another keyword.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {filteredFaqs.map((item) => {
                const open = openFaq === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-muted/50"
                      onClick={() => setOpenFaq(open ? null : item.id)}
                      aria-expanded={open}
                    >
                      <span className="mt-0.5 shrink-0 text-muted-foreground">
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{item.question}</span>
                          <Badge variant="outline" className="text-[0.65rem] font-normal">
                            {item.category}
                          </Badge>
                        </span>
                        {open && (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" aria-hidden />
            Documentation & resources
          </CardTitle>
          <CardDescription>Wire these URLs when your docs site or API portal is ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResourceCard title="Admin guide" description="Internal runbooks for your team." href="#" />
            <ResourceCard title="API reference" description="REST shapes your backend exposes." href="#" />
            <ResourceCard title="Analytics" description="Charts when endpoints are enabled." href="/analytics" internal />
            <ResourceCard title="Release notes" description="Shipped changes and migrations." href="#" />
          </div>
          <Separator className="my-6" />
          <p className="text-xs text-muted-foreground">
            Set <code className="rounded bg-muted px-1">REACT_APP_SUPPORT_EMAIL</code> and{' '}
            <code className="rounded bg-muted px-1">REACT_APP_SUPPORT_PHONE</code> in your env files to customize
            contact details without code changes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function ContactTile({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode
  title: string
  body: string
  action: React.ReactNode
}) {
  return (
    <div className="flex gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        {action}
      </div>
    </div>
  )
}

function ResourceCard({
  title,
  description,
  href,
  internal,
}: {
  title: string
  description: string
  href: string
  internal?: boolean
}) {
  const className =
    'flex flex-col rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-muted/40 hover:border-primary/30'
  if (internal && href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        <span className="font-medium">{title}</span>
        <span className="mt-1 text-sm text-muted-foreground">{description}</span>
      </Link>
    )
  }
  return (
    <a href={href} className={cn(className, href === '#' && 'pointer-events-none opacity-60')}>
      <span className="font-medium">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{description}</span>
      {href === '#' && (
        <Badge variant="outline" className="mt-3 w-fit text-[0.65rem] font-normal">
          Configure URL
        </Badge>
      )}
    </a>
  )
}

export default Support
