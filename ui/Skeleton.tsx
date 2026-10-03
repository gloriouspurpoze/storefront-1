import type { CSSProperties } from 'react'
import { cx } from './cx'

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={cx('sf-skeleton', className)} style={style} aria-hidden />
}
