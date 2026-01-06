import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'

export interface Specification {
  key: string
  value: string
  group: string
}

export interface SpecificationFieldProps {
  label: string
  value: Specification[]
  onChange: (specifications: Specification[]) => void
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  tooltip?: string
  status?: 'success' | 'error' | 'warning' | 'info'
  groups?: string[]
  allowCustomGroups?: boolean
  maxSpecifications?: number
}

export const SpecificationField: React.FC<SpecificationFieldProps> = ({
  label,
  value = [],
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  tooltip,
  status,
  groups = ['General', 'Technical', 'Physical', 'Warranty', 'Other'],
  allowCustomGroups = true,
  maxSpecifications = 50,
}) => {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newGroup, setNewGroup] = useState('General')

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

  const handleSpecificationChange = (index: number, field: keyof Specification, newValue: string) => {
    const updatedSpecs = value.map((spec, i) =>
      i === index ? { ...spec, [field]: newValue } : spec
    )
    onChange(updatedSpecs)
  }

  const addSpecification = () => {
    if (newKey.trim() && newValue.trim() && value.length < maxSpecifications) {
      const newSpec: Specification = {
        key: newKey.trim(),
        value: newValue.trim(),
        group: newGroup,
      }
      onChange([...value, newSpec])
      setNewKey('')
      setNewValue('')
      setNewGroup('General')
    }
  }

  const removeSpecification = (index: number) => {
    const updatedSpecs = value.filter((_, i) => i !== index)
    onChange(updatedSpecs)
  }

  const groupedSpecs = value.reduce((acc, spec) => {
    const group = spec.group || 'General'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(spec)
    return acc
  }, {} as Record<string, Specification[]>)

  const canAddMore = value.length < maxSpecifications

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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

      {/* Specifications List */}
      {value.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {Object.entries(groupedSpecs).map(([group, specs]) => (
            <Card key={group} sx={{ mb: 2 }}>
              <CardContent sx={{ pb: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'primary.main' }}>
                  {group} ({specs.length})
                </Typography>
                <Stack spacing={1}>
                  {specs.map((spec, index) => {
                    const globalIndex = value.findIndex(s => s === spec)
                    return (
                      <Box key={globalIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          label="Key"
                          value={spec.key}
                          onChange={(e) => handleSpecificationChange(globalIndex, 'key', e.target.value)}
                          size="small"
                          disabled={disabled}
                          variant="outlined"
                        />
                        <TextField
                          fullWidth
                          label="Value"
                          value={spec.value}
                          onChange={(e) => handleSpecificationChange(globalIndex, 'value', e.target.value)}
                          size="small"
                          disabled={disabled}
                          variant="outlined"
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Group</InputLabel>
                          <Select
                            value={spec.group}
                            label="Group"
                            onChange={(e) => handleSpecificationChange(globalIndex, 'group', e.target.value)}
                            disabled={disabled}
                          >
                            {groups.map((group) => (
                              <MenuItem key={group} value={group}>
                                {group}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton
                          onClick={() => removeSpecification(globalIndex)}
                          color="error"
                          disabled={disabled}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add New Specification */}
      {canAddMore && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Add New Specification
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="Specification Key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                size="small"
                disabled={disabled}
                variant="outlined"
                placeholder="e.g., Weight, Color, Material"
              />
              <TextField
                fullWidth
                label="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                size="small"
                disabled={disabled}
                variant="outlined"
                placeholder="e.g., 2.5 lbs, Red, Steel"
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Group</InputLabel>
                <Select
                  value={newGroup}
                  label="Group"
                  onChange={(e) => setNewGroup(e.target.value)}
                  disabled={disabled}
                >
                  {groups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                onClick={addSpecification}
                disabled={!newKey.trim() || !newValue.trim() || disabled}
                startIcon={<AddIcon />}
                size="small"
                sx={{ minWidth: 'auto', px: 2 }}
              >
                Add
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Max Specifications Warning */}
      {!canAddMore && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Maximum {maxSpecifications} specifications allowed. Remove some to add more.
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {/* Summary */}
      {value.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${value.length} specifications`}
            color="primary"
            variant="outlined"
            size="small"
          />
          {Object.keys(groupedSpecs).map((group) => (
            <Chip
              key={group}
              label={`${group}: ${groupedSpecs[group].length}`}
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export default SpecificationField
