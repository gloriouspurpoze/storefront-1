import React from 'react'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'

export interface FormFieldProps {
  id?: string
  label: string
  /** Helper or character count under the control */
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Consistent label + control + optional description for forms and dialogs.
 */
export function FormField({ id, label, description, children, className }: FormFieldProps) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      {id ? <Label htmlFor={id}>{label}</Label> : <Label>{label}</Label>}
      {children}
      {description != null && description !== '' && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
