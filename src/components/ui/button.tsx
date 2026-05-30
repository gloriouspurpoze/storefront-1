import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Button — projection of DESIGN.md `button-*` components.
 * Token map (DESIGN.md):
 *   variant=default     → button-primary       (bg primary, on-primary, rounded-md, h-44)
 *   variant=destructive → bloom-deep CTA       (DESIGN.md semantic destructive)
 *   variant=outline     → button-outline       (canvas + primary text + 1px primary border)
 *   variant=secondary   → button-ink           (filled black CTA used on dark photo overlays)
 *   variant=ghost       → utility (no DESIGN.md token; transparent, ink-on-cloud hover)
 *   variant=link        → button-text-link     (inline primary link with underline-on-hover)
 *   size=default        → DESIGN.md control height 44px, padding 12 24
 *   size=sm             → ~36px tight control
 *   size=lg             → 44px tall, padding 16 32 (promo CTA)
 *   size=icon           → 44×44 square (matches WCAG-AAA touch target per DESIGN.md)
 * Typography uses DESIGN.md text-button-md (14/600/0.7px tracking).
 * `uppercase` is NOT applied by default — admin forms need sentence case.
 * Use `<Button className="uppercase">` for HP-marketing-style CTAs.
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md',
    'text-button-md',
    'ring-offset-background transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary-deep',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-bloom-wine',
        outline:
          'border border-primary bg-canvas text-primary hover:bg-primary-soft hover:text-primary-deep',
        secondary: 'bg-ink text-on-ink hover:bg-ink-soft',
        ghost: 'text-ink hover:bg-cloud hover:text-ink',
        link: 'text-primary underline-offset-4 hover:underline active:text-link-pressed',
      },
      size: {
        default: 'h-control px-xl py-sm',
        sm: 'h-9 rounded-md px-md',
        lg: 'h-control rounded-md px-xxl',
        icon: 'h-control w-control',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    // Radix Slot (asChild) requires exactly one React element child — never mix with loading/icons.
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
