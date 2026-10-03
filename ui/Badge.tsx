import type { ReactNode } from 'react'
import { cx } from './cx'

export type BadgeTone = 'default' | 'sale' | 'new' | 'soldout' | 'soft' | 'success'

export function Badge({ tone = 'default', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return <span className={cx('sf-badge', tone !== 'default' && `sf-badge--${tone}`, className)}>{children}</span>
}
