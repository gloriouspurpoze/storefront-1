/**
 * Badge — projection of DESIGN.md `badge-pill-*` components.
 * Tokens used (DESIGN.md):
 *   default     → colors.primary       (HP Electric Blue CTA)
 *   secondary   → colors.cloud + ink   (neutral chip)
 *   destructive → colors.bloom-deep    (error / sale-emphasis brick)
 *   success     → colors.storm-deep    (neutral status accent per DESIGN.md)
 *   warning     → colors.bloom-coral   (sale-tag coral; DESIGN.md "Bloom Coral")
 *   info        → colors.primary-soft + colors.primary (soft blue chip)
 *   outline     → canvas + ink + hairline border
 * DO NOT add new variants without first adding a token to DESIGN.md.
 */
import React from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'border-transparent bg-primary text-primary-foreground hover:bg-primary/90':
              variant === 'default',
            'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80':
              variant === 'secondary',
            'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90':
              variant === 'destructive',
            'border-hairline bg-canvas text-ink': variant === 'outline',
            'border-transparent bg-storm-deep text-on-ink hover:bg-storm-deep/90':
              variant === 'success',
            'border-transparent bg-bloom-coral text-on-primary hover:bg-bloom-coral/90':
              variant === 'warning',
            'border-transparent bg-primary-soft text-primary-deep hover:bg-primary-soft/80':
              variant === 'info',
          },
          className,
        )}
        {...props}
      />
    )
  },
)
Badge.displayName = 'Badge'

export { Badge }
