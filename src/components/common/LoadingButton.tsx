import React from 'react'
import { Button, type ButtonProps } from '../ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type LoadingButtonProps = Omit<ButtonProps, 'children' | 'loading' | 'leftIcon'> & {
  loading?: boolean
  loadingText?: string
  children?: React.ReactNode
  /** MUI-style alias for `leftIcon` */
  startIcon?: React.ReactNode
  leftIcon?: React.ReactNode
}

export function LoadingButton({
  loading = false,
  loadingText = 'Loading...',
  disabled = false,
  children,
  leftIcon,
  startIcon,
  className,
  ...props
}: LoadingButtonProps) {
  const icon = leftIcon ?? startIcon
  return (
    <Button
      {...props}
      className={cn(className)}
      disabled={disabled || loading}
      loading={false}
      leftIcon={
        loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          icon
        )
      }
    >
      {loading ? loadingText : children}
    </Button>
  )
}
