import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Autocomplete,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

export interface TagFieldProps {
  label: string
  value: string[]
  onChange: (tags: string[]) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  maxTags?: number
  allowDuplicates?: boolean
  suggestions?: string[]
  freeSolo?: boolean
  size?: 'small' | 'medium'
}

export const TagField: React.FC<TagFieldProps> = ({
  label,
  value = [],
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Add tags...',
  tooltip,
  status,
  maxTags = 20,
  allowDuplicates = false,
  suggestions = [],
  freeSolo = true,
  size = 'medium',
}) => {
  const [inputValue, setInputValue] = useState('')

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

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (!trimmedTag) return

    if (value.length >= maxTags) {
      return
    }

    if (!allowDuplicates && value.includes(trimmedTag)) {
      return
    }

    onChange([...value, trimmedTag])
    setInputValue('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddTag(inputValue)
    }
  }

  const handleAutocompleteChange = (event: any, newValue: string[]) => {
    onChange(newValue)
  }

  const canAddMore = value.length < maxTags

  if (freeSolo) {
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

        <Autocomplete
          multiple
          freeSolo
          options={suggestions}
          value={value}
          onChange={handleAutocompleteChange}
          inputValue={inputValue}
          onInputChange={(event, newInputValue) => {
            setInputValue(newInputValue)
          }}
          disabled={disabled}
          size={size}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                onDelete={disabled ? undefined : () => handleRemoveTag(option)}
                color="primary"
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={canAddMore ? placeholder : `Maximum ${maxTags} tags reached`}
              variant="outlined"
              error={!!error}
              helperText={error || helperText}
              onKeyPress={handleKeyPress}
            />
          )}
          getOptionLabel={(option) => option}
          isOptionEqualToValue={(option, value) => option === value}
          noOptionsText="No suggestions available"
          sx={{
            '& .MuiOutlinedInput-root': {
              padding: '4px 8px',
            },
          }}
        />

        {/* Tag Count */}
        {maxTags && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {value.length}/{maxTags} tags
          </Typography>
        )}
      </Box>
    )
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

      {/* Tags Display */}
      {value.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {value.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={disabled ? undefined : () => handleRemoveTag(tag)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Add Tag Input */}
      {canAddMore && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            fullWidth
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            size={size}
            variant="outlined"
            error={!!error}
            helperText={error || helperText}
          />
          <Button
            variant="outlined"
            onClick={() => handleAddTag(inputValue)}
            disabled={!inputValue.trim() || disabled}
            startIcon={<AddIcon />}
            size={size}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            Add
          </Button>
        </Box>
      )}

      {/* Max Tags Warning */}
      {!canAddMore && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
          Maximum {maxTags} tags reached. Remove some to add more.
        </Typography>
      )}

      {/* Tag Count */}
      {maxTags && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {value.length}/{maxTags} tags
        </Typography>
      )}
    </Box>
  )
}

export default TagField
