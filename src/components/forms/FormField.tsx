import React from 'react'
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  InputAdornment,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

export interface FormFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  multiline?: boolean
  rows?: number
  startAdornment?: React.ReactNode
  endAdornment?: React.ReactNode
  fullWidth?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  maxLength?: number
  showCharCount?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 1,
  startAdornment,
  endAdornment,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  maxLength,
  showCharCount = false,
  tooltip,
  status,
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

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'success.main'
      case 'error':
        return 'error.main'
      case 'warning':
        return 'warning.main'
      case 'info':
        return 'info.main'
      default:
        return 'text.secondary'
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = event.target.value
    
    if (type === 'number') {
      if (event.target.value === '') {
        onChange('')
        return
      }
      const numValue = Number(event.target.value)
      if (!isNaN(numValue)) {
        newValue = numValue
      } else {
        return
      }
    }
    
    if (maxLength && typeof newValue === 'string' && newValue.length > maxLength) {
      return
    }
    
    onChange(newValue)
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
        value={displayValue}
        onChange={handleChange}
        error={!!error}
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        size={size}
        variant={variant}
        InputProps={{
          startAdornment: startAdornment ? (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ) : undefined,
          endAdornment: endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
          ) : undefined,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: disabled ? 'action.disabledBackground' : 'background.paper',
          },
        }}
      />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
        <FormHelperText error={!!error} sx={{ m: 0 }}>
          {error || helperText}
        </FormHelperText>
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

export default FormField
