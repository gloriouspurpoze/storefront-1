import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material'
import {
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Clear as ClearIcon,
} from '@mui/icons-material'

export interface SelectOption {
  value: any
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  options: SelectOption[]
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  fullWidth?: boolean
  size?: 'small' | 'medium'
  variant?: 'outlined' | 'filled' | 'standard'
  multiple?: boolean
  clearable?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  groupBy?: boolean
  renderValue?: (selected: any) => React.ReactNode
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  multiple = false,
  clearable = false,
  tooltip,
  status,
  groupBy = false,
  renderValue,
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

  const handleChange = (event: any) => {
    onChange(event.target.value)
  }

  const handleClear = () => {
    onChange(multiple ? [] : '')
  }

  const groupedOptions = groupBy
    ? options.reduce((acc, option) => {
        const group = option.group || 'Other'
        if (!acc[group]) {
          acc[group] = []
        }
        acc[group].push(option)
        return acc
      }, {} as Record<string, SelectOption[]>)
    : null

  const renderSelectValue = (selected: any) => {
    if (renderValue) {
      return renderValue(selected)
    }

    if (multiple) {
      if (!Array.isArray(selected) || selected.length === 0) {
        return <Typography color="text.secondary">{placeholder}</Typography>
      }
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map((val: any) => {
            const option = options.find(opt => opt.value === val)
            return (
              <Chip
                key={val}
                label={option?.label || val}
                size="small"
                variant="outlined"
              />
            )
          })}
        </Box>
      )
    }

    const selectedOption = options.find(opt => opt.value === selected)
    return selectedOption ? selectedOption.label : placeholder || ''
  }

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

      <FormControl
        fullWidth={fullWidth}
        error={!!error}
        disabled={disabled}
        size={size}
        variant={variant}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={handleChange}
          label={label}
          multiple={multiple}
          renderValue={renderSelectValue}
          displayEmpty
          endAdornment={
            clearable && value && !disabled ? (
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{ mr: 1 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : undefined
          }
        >
          {groupedOptions ? (
            Object.entries(groupedOptions).map(([group, groupOptions]) => [
              <MenuItem key={`group-${group}`} disabled>
                <Typography variant="subtitle2" color="text.secondary">
                  {group}
                </Typography>
              </MenuItem>,
              ...groupOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  sx={{ pl: 3 }}
                >
                  {option.label}
                </MenuItem>
              )),
            ])
          ) : (
            options.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </MenuItem>
            ))
          )}
        </Select>
        <FormHelperText error={!!error}>
          {error || helperText}
        </FormHelperText>
      </FormControl>
    </Box>
  )
}

export default SelectField
