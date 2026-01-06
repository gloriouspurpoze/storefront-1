import React from 'react'
import {
  Box,
  Slider as MuiSlider,
  Typography,
  FormControl,
  FormLabel,
  FormHelperText,
  Stack,
  Chip,
  useTheme,
} from '@mui/material'
import { styled } from '@mui/material/styles'
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
  sx?: any
}
const StyledSlider = styled(MuiSlider)(({ theme }) => ({
  '& .MuiSlider-thumb': {
    height: 20,
    width: 20,
    backgroundColor: theme.palette.primary.main,
    border: '2px solid currentColor',
    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
      boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
    },
    '&:before': {
      display: 'none',
    },
  },
  '& .MuiSlider-track': {
    height: 6,
    borderRadius: 3,
  },
  '& .MuiSlider-rail': {
    height: 6,
    borderRadius: 3,
    opacity: 0.3,
  },
  '& .MuiSlider-mark': {
    height: 8,
    width: 8,
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.main,
    opacity: 0.7,
  },
  '& .MuiSlider-markActive': {
    backgroundColor: theme.palette.primary.main,
    opacity: 1,
  },
  '& .MuiSlider-markLabel': {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: 8,
  },
  '& .MuiSlider-valueLabel': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
}))
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
  track = 'normal',
  scale,
  getAriaLabel,
  getAriaValueText,
  className,
  sx,
}) => {
  const handleChange = (event: Event, newValue: number | number[]) => {
    onChange(newValue)
  }
  const formatValue = (val: number) => {
    if (valueLabelFormat) {
      return valueLabelFormat(val)
    }
    return val.toString()
  }
  const getCurrentValue = () => {
    if (Array.isArray(value)) {
      return value.map(formatValue).join(' - ')
    }
    return formatValue(value)
  }
  return (
    <FormControl fullWidth disabled={disabled} className={className} sx={sx}>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 500 }}>
            {label}
          </FormLabel>
          {showValue && (
            <Box>
              {showValueAsChip ? (
                <Chip
                  label={getCurrentValue()}
                  size="small"
                  color={color}
                  variant="outlined"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {getCurrentValue()}
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </Box>
      <Box sx={{ px: 1 }}>
        <StyledSlider
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          marks={marks}
          disabled={disabled}
          color={color}
          orientation={orientation}
          size={size}
          valueLabelDisplay={valueLabelDisplay}
          valueLabelFormat={valueLabelFormat}
          track={track}
          scale={scale}
          getAriaLabel={getAriaLabel}
          getAriaValueText={getAriaValueText}
          sx={{
            ...(orientation === 'vertical' && {
              height: 200,
              '& .MuiSlider-markLabel': {
                marginLeft: 8,
                marginTop: 0,
              },
            }),
          }}
        />
      </Box>
      {helperText && (
        <FormHelperText sx={{ mt: 1 }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  )
}
// Preset slider configurations for common use cases
export const SliderPresets = {
  // Percentage slider (0-100)
  percentage: {
    min: 0,
    max: 100,
    step: 1,
    valueLabelFormat: (value: number) => `${value}%`,
  },
  
  // Rating slider (1-5)
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
  
  // Price range slider (0-1000)
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
  
  // Time slider (0-24 hours)
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
  
  // Volume slider (0-100)
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