import React from 'react'
import {
  TextField,
  Box,
  Typography,
  Tooltip,
} from '@mui/material'
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

export interface DateFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  min?: string
  max?: string
  showCharCount?: boolean
  maxLength?: number
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  tooltip,
  status,
  min,
  max,
  showCharCount = false,
  maxLength,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckIcon color="success" fontSize="small" />
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />
      case 'warning':
        return <ErrorIcon color="warning" fontSize="small" />
      case 'info':
        return <InfoIcon color="info" fontSize="small" />
      default:
        return null
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  const displayValue = value || ''
  const charCount = typeof displayValue === 'string' ? displayValue.length : 0

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: error ? 'error.main' : 'text.primary',
          }}
        >
          {label}
          {required && (
            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
              *
            </Typography>
          )}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {getStatusIcon()}
      </Box>
      
      <TextField
        fullWidth={fullWidth}
        type="date"
        value={displayValue}
        onChange={handleChange}
        error={!!error}
        disabled={disabled}
        placeholder={placeholder}
        size={size}
        variant={variant}
        inputProps={{
          min,
          max,
        }}
        InputLabelProps={{
          shrink: true,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          },
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <Typography
          variant="caption"
          color={error ? 'error.main' : 'text.secondary'}
          sx={{ m: 0 }}
        >
          {error || helperText}
        </Typography>
        {showCharCount && maxLength && (
          <Typography
            variant="caption"
            color={charCount > maxLength * 0.9 ? 'warning.main' : 'text.secondary'}
          >
            {charCount}/{maxLength}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

export default DateField
