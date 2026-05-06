import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  CalendarDays,
  FlaskConical,
  LayoutGrid,
  Lightbulb,
  ListTodo,
  Rocket,
  Share2,
  Target,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const LINKS: {
  to: string
  label: string
  icon: typeof LayoutGrid
  end?: boolean
}[] = [
  { to: '/marketing', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/marketing/campaigns', label: 'Campaigns', icon: Target },
  { to: '/marketing/calendar', label: 'Content calendar', icon: CalendarDays },
  { to: '/marketing/social', label: 'Social posts', icon: Share2 },
  { to: '/marketing/live-publish', label: 'Live publish', icon: Rocket },
  { to: '/marketing/planning', label: 'Planning & ideas', icon: Lightbulb },
  { to: '/marketing/tasks', label: 'Tasks', icon: ListTodo },
  { to: '/marketing/lab', label: 'R&D & brainstorm', icon: FlaskConical },
]

export function MarketingWorkspaceSubnav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="mb-6 flex flex-wrap gap-1 rounded-lg border border-border/80 bg-muted/30 p-1"
      aria-label="Marketing workspace sections"
    >
      {LINKS.map(({ to, label, icon: Icon, end }) => {
        const active = end === true ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-background/80 hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
