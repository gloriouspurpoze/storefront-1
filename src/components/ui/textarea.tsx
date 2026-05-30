import * as React from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea — multi-line variant of DESIGN.md `text-input`.
 * Same hairline-strong border, rounded.md, padding {spacing.sm} {spacing.md}.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-hairline-strong bg-canvas px-md py-sm text-body-md text-ink ring-offset-background',
          'placeholder:text-graphite',
          'focus-visible:outline-none focus-visible:border-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
