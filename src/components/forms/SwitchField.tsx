import React from 'react'
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Tooltip,
  Stack,
} from '@mui/material'
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

export interface SwitchFieldProps {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  error?: string
  helperText?: string
  disabled?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  size?: 'small' | 'medium'
  required?: boolean
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  tooltip,
  status,
  color = 'primary',
  size = 'medium',
  required = false,
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
    onChange(event.target.checked)
  }

  return (
    <Box sx={{ width: '100%' }}>
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

      <FormControlLabel
        control={
          <Switch
            checked={value}
            onChange={handleChange}
            disabled={disabled}
            color={color}
            size={size}
          />
        }
        label={
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="body2"
              color={error ? 'error.main' : value ? 'text.primary' : 'text.secondary'}
            >
              {value ? 'Enabled' : 'Disabled'}
            </Typography>
            {status && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {getStatusIcon()}
              </Box>
            )}
          </Stack>
        }
        sx={{
          margin: 0,
          '& .MuiFormControlLabel-label': {
            marginLeft: 1,
          },
        }}
      />

      {/* Helper Text */}
      {(helperText || error) && (
        <Typography
          variant="caption"
          color={error ? 'error.main' : 'text.secondary'}
          sx={{ mt: 0.5, display: 'block' }}
        >
          {error || helperText}
        </Typography>
      )}
    </Box>
  )
}

export default SwitchField
