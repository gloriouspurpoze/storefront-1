import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, BadgePercent } from 'lucide-react'
import { PageHeader } from '../../components/common'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { usePermissions } from '../../hooks/usePermissions'
import type { Permission } from '../../types/rbac.types'

const ARTICLES: Array<{
  slug: string
  title: string
  description: string
  icon: React.ElementType
  permission: Permission | null
}> = [
  {
    slug: 'operations-commercial-terms',
    title: 'Commercial terms (fees & commissions)',
    description:
      'How Operations → Commercial → Terms maps to customer checkout, POS, provider payouts, and per-partner overrides.',
    icon: BadgePercent,
    permission: 'view_operating_terms',
  },
]

export function KnowledgeKitHub() {
  const { checkPermission } = usePermissions()
  const visible = ARTICLES.filter((a) => !a.permission || checkPermission(a.permission))

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Knowledge kit"
        subtitle="Short, practical guides for admins. Each article explains what a screen controls, who it affects (customer site, provider app, professionals), and how it ties to the API."
        icon={<BookOpen className="h-7 w-7 text-primary sm:h-8 sm:w-8" />}
      />

      <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        We add guides here over time. If a settings page links here, open the matching card to read impact before
        changing production values.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => {
          const Icon = a.icon
          return (
            <Link key={a.slug} to={`/knowledge-kit/${a.slug}`} className="group block h-full">
              <Card className="h-full border-border/80 transition-shadow group-hover:border-primary/40 group-hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Icon className="h-8 w-8 shrink-0 text-primary" aria-hidden />
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                  <CardTitle className="text-base leading-snug">{a.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{a.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm font-medium text-primary group-hover:underline">Read guide</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">You do not have access to any knowledge articles yet.</p>
      ) : null}
    </div>
  )
}
