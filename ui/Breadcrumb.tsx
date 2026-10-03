import Link from 'next/link'
import type { ReactNode } from 'react'

export type Crumb = { label: string; href?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="sf-breadcrumb">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`}>
            {c.href && i < items.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({ title, crumbs, children }: { title: ReactNode; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <header className="sf-page-head sf-container">
      {crumbs && crumbs.length > 0 && <Breadcrumb items={crumbs} />}
      <h1 className="sf-page-head__title">{title}</h1>
      {children}
    </header>
  )
}
