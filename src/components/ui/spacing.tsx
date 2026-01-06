/**
 * Spacing Components
 * Layout utilities for consistent spacing
 */
import * as React from "react"
import { cn } from "../../lib/utils"

// Spacing scale mapping
const spacingMap = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
} as const

type SpacingValue = keyof typeof spacingMap

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column'
  spacing?: SpacingValue
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ 
    direction = 'column', 
    spacing = 4, 
    align, 
    justify, 
    className, 
    children,
    ...props 
  }, ref) => {
    const alignMap = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    }
    
    const justifyMap = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    }

    const classes = cn(
      'flex',
      direction === 'row' ? 'flex-row' : 'flex-col',
      spacingMap[spacing],
      align && alignMap[align],
      justify && justifyMap[justify],
      className
    )
    
    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)
Stack.displayName = "Stack"

// VStack - Vertical Stack
export const VStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="column" {...props} />
)
VStack.displayName = "VStack"

// HStack - Horizontal Stack
export const HStack = React.forwardRef<HTMLDivElement, Omit<StackProps, 'direction'>>(
  (props, ref) => <Stack ref={ref} direction="row" {...props} />
)
HStack.displayName = "HStack"

// Spacer - Empty space
export const Spacer: React.FC<{ size?: SpacingValue; axis?: 'x' | 'y' | 'both' }> = ({ 
  size = 4, 
  axis = 'y' 
}) => {
  const sizeValue = size * 4 // Convert to pixels (Tailwind scale)
  
  const style = {
    x: { width: `${sizeValue}px`, height: 0 },
    y: { width: 0, height: `${sizeValue}px` },
    both: { width: `${sizeValue}px`, height: `${sizeValue}px` },
  }
  
  return <div style={style[axis]} />
}

