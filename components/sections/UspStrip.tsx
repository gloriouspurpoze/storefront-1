import type { ReactNode } from 'react'
import './sections.css'

export type Usp = { icon: ReactNode; title: string; text?: string }

export function UspStrip({ items }: { items: Usp[] }) {
  if (!items.length) return null
  return (
    <section className="sf-usp" aria-label="Why shop with us">
      <ul className="sf-usp__list sf-container">
        {items.map((u) => (
          <li key={u.title} className="sf-usp__item">
            <span className="sf-usp__icon">{u.icon}</span>
            <span>
              <strong>{u.title}</strong>
              {u.text && <span className="sf-usp__text">{u.text}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
