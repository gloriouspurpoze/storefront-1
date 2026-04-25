import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  size?: 'small' | 'medium' | 'large'
}

type EmptySize = 'small' | 'medium' | 'large'

const padding: Record<EmptySize, string> = {
  small: 'p-4',
  medium: 'p-6',
  large: 'p-8',
}

const titleClass: Record<EmptySize, string> = {
  small: 'text-base sm:text-lg',
  medium: 'text-lg sm:text-xl',
  large: 'text-xl sm:text-2xl',
}

export function EmptyState({ icon, title, description, action, size = 'medium' }: EmptyStateProps) {
  const getIconTextSize = () => (size === 'small' ? 'text-4xl' : size === 'large' ? 'text-8xl' : 'text-6xl')

  return (
    <Card>
      <CardContent className={cn('text-center', padding[size || 'medium'])}>
        {icon && (
          <div className={cn('mb-2 flex justify-center text-muted-foreground', getIconTextSize())}>
            {icon}
          </div>
        )}

        <h3 className={cn('mb-1 font-semibold', titleClass[size || 'medium'])}>{title}</h3>

        <p className="mb-3 text-sm text-muted-foreground sm:text-base">{description}</p>

        {action && (
          <Button size="lg" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
