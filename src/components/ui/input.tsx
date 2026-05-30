import * as React from 'react'

import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input — projection of DESIGN.md `text-input` component.
 * - h-control (44px) → DESIGN.md text-input height
 * - rounded-md (4px) → DESIGN.md rounded.md
 * - border-hairline-strong (#c2c2c2) → DESIGN.md text-input default 1px steel border
 * - focus: 1px ink border (no halo) per the "text-input-focused" entry; we
 *   keep a focus-ring for keyboard a11y since DESIGN.md is silent on it.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-control w-full rounded-md border border-hairline-strong bg-canvas px-md py-sm text-body-md text-ink ring-offset-background',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
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
Input.displayName = 'Input'

export { Input }
