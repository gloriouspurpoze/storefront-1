import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'
import { Label } from './label'
import { Badge } from './badge'

interface SliderProps {
  label: string
  value: number | number[]
  onChange: (value: number | number[]) => void
  min?: number
  max?: number
  step?: number
  marks?: Array<{ value: number; label: string }>
  disabled?: boolean
  helperText?: string
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  orientation?: 'horizontal' | 'vertical'
  size?: 'small' | 'medium'
  showValue?: boolean
  showValueAsChip?: boolean
  valueLabelDisplay?: 'on' | 'auto' | 'off'
  valueLabelFormat?: (value: number) => string
  track?: 'normal' | 'inverted' | false
  scale?: (value: number) => number
  getAriaLabel?: (index: number) => string
  getAriaValueText?: (value: number, index: number) => string
  className?: string
  /** @deprecated not used; kept for API compatibility */
  sx?: unknown
}

const colorChipVariant = (
  c: SliderProps['color'],
): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
  switch (c) {
    case 'error':
      return 'destructive'
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'primary':
    default:
      return 'default'
  }
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks,
  disabled = false,
  helperText,
  color = 'primary',
  orientation = 'horizontal',
  size = 'medium',
  showValue = true,
  showValueAsChip = false,
  valueLabelDisplay = 'auto',
  valueLabelFormat,
  track: _track = 'normal',
  scale,
  getAriaLabel,
  getAriaValueText,
  className,
}) => {
  const isRange = Array.isArray(value)
  const innerValue = isRange ? (value as number[]) : [value as number]
  const thumbSize = size === 'small' ? 'h-4 w-4' : 'h-5 w-5'
  const trackHeight = size === 'small' ? 'h-1' : 'h-1.5'

  const formatValue = (val: number) => {
    if (valueLabelFormat) {
      return valueLabelFormat(scale ? scale(val) : val)
    }
    return (scale ? scale(val) : val).toString()
  }

  const getCurrentValue = () => {
    if (isRange) {
      return (value as number[]).map((v) => formatValue(v)).join(' - ')
    }
    return formatValue(value as number)
  }

  const onValueChange = (next: number[]) => {
    if (isRange) {
      onChange(next)
    } else {
      onChange(next[0] ?? min)
    }
  }

  return (
    <div
      className={cn('w-full space-y-2', className, disabled && 'pointer-events-none opacity-50')}
    >
      <div
        className={cn(
          'mb-1 flex items-center',
          orientation === 'horizontal' ? 'justify-between' : 'flex-col items-stretch gap-2',
        )}
      >
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
        {showValue && valueLabelDisplay !== 'off' && (
          <div>
            {showValueAsChip ? (
              <Badge variant={colorChipVariant(color)} className="font-normal">
                {getCurrentValue()}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">{getCurrentValue()}</span>
            )}
          </div>
        )}
      </div>
      <div
        className={cn(
          'px-1',
          orientation === 'vertical' && 'h-[200px] py-2',
        )}
      >
        <SliderPrimitive.Root
          className={cn(
            'relative flex touch-none select-none',
            orientation === 'horizontal'
              ? 'w-full items-center'
              : 'h-[200px] w-8 flex-col items-center justify-center',
          )}
          value={innerValue}
          onValueChange={onValueChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          orientation={orientation}
          minStepsBetweenThumbs={0}
        >
          <SliderPrimitive.Track
            className={cn(
              'relative grow overflow-hidden rounded-full bg-primary/20',
              orientation === 'horizontal' ? cn('w-full', trackHeight) : 'h-full w-1.5',
            )}
          >
            <SliderPrimitive.Range
              className={cn('absolute bg-primary', orientation === 'horizontal' ? 'h-full' : 'w-full')}
            />
          </SliderPrimitive.Track>
          {innerValue.map((_, i) => (
            <SliderPrimitive.Thumb
              key={i}
              className={cn(
                'block rounded-full border-2 border-primary bg-background ring-offset-background transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                thumbSize,
              )}
              aria-label={getAriaLabel ? getAriaLabel(i) : undefined}
              aria-valuetext={getAriaValueText ? getAriaValueText(innerValue[i], i) : formatValue(innerValue[i])}
            />
          ))}
        </SliderPrimitive.Root>
        {marks && marks.length > 0 && orientation === 'horizontal' && (
          <div
            className="relative mt-1 flex justify-between px-0.5 text-xs text-muted-foreground"
            style={{ marginTop: 4 }}
          >
            {marks.map((m) => (
              <span
                key={m.value}
                className="flex min-w-0 max-w-[25%] flex-1 flex-col items-center"
              >
                <span className="truncate">{m.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
    </div>
  )
}

export const SliderPresets = {
  percentage: {
    min: 0,
    max: 100,
    step: 1,
    valueLabelFormat: (value: number) => `${value}%`,
  },

  rating: {
    min: 1,
    max: 5,
    step: 0.5,
    marks: [
      { value: 1, label: '1' },
      { value: 2, label: '2' },
      { value: 3, label: '3' },
      { value: 4, label: '4' },
      { value: 5, label: '5' },
    ],
    valueLabelFormat: (value: number) => `${value} stars`,
  },

  priceRange: {
    min: 0,
    max: 25000,
    step: 500,
    marks: [
      { value: 0, label: '₹0' },
      { value: 6250, label: '₹6,250' },
      { value: 12500, label: '₹12,500' },
      { value: 18750, label: '₹18,750' },
      { value: 25000, label: '₹25,000' },
    ],
    valueLabelFormat: (value: number) => `₹${value.toLocaleString('en-IN')}`,
  },

  timeHours: {
    min: 0,
    max: 24,
    step: 1,
    marks: [
      { value: 0, label: '12 AM' },
      { value: 6, label: '6 AM' },
      { value: 12, label: '12 PM' },
      { value: 18, label: '6 PM' },
      { value: 24, label: '12 AM' },
    ],
    valueLabelFormat: (value: number) => {
      const hour = Math.floor(value)
      const minute = Math.round((value - hour) * 60)
      const period = hour < 12 ? 'AM' : 'PM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
    },
  },

  volume: {
    min: 0,
    max: 100,
    step: 5,
    marks: [
      { value: 0, label: 'Mute' },
      { value: 25, label: '25%' },
      { value: 50, label: '50%' },
      { value: 75, label: '75%' },
      { value: 100, label: '100%' },
    ],
    valueLabelFormat: (value: number) => `${value}%`,
  },
}

export default Slider
