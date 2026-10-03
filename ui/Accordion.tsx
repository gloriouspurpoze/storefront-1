import type { ReactNode } from 'react'
import { cx } from './cx'

export type AccordionItem = { id?: string; title: ReactNode; content: ReactNode; defaultOpen?: boolean }

/** Native <details>-based accordion: works without JS and in Server Components. */
export function Accordion({ items, className }: { items: AccordionItem[]; className?: string }) {
  return (
    <div className={cx('sf-accordion', className)}>
      {items.map((item, i) => (
        <details key={item.id ?? i} open={item.defaultOpen}>
          <summary>{item.title}</summary>
          <div className="sf-accordion__content">{item.content}</div>
        </details>
      ))}
    </div>
  )
}
