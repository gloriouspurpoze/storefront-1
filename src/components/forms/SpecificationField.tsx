import React, { useState } from 'react'
import { Plus, Trash2, Info, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { cn } from '../../lib/utils'

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

const StatusIcon = ({ status }: { status?: SpecificationFieldProps['status'] }) => {
  if (!status) return null
  const cls = 'h-4 w-4 shrink-0'
  switch (status) {
    case 'success':
      return <CheckCircle2 className={cn(cls, 'text-storm-deep')} aria-hidden />
    case 'error':
      return <AlertCircle className={cn(cls, 'text-destructive')} aria-hidden />
    case 'warning':
      return <AlertTriangle className={cn(cls, 'text-bloom-coral')} aria-hidden />
    case 'info':
      return <Info className={cn(cls, 'text-muted-foreground')} aria-hidden />
    default:
      return null
  }
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
  allowCustomGroups: _allowCustomGroups = true,
  maxSpecifications = 50,
}) => {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newGroup, setNewGroup] = useState('General')

  const handleSpecificationChange = (index: number, field: keyof Specification, v: string) => {
    const updated = value.map((s, i) => (i === index ? { ...s, [field]: v } : s))
    onChange(updated)
  }

  const addSpecification = () => {
    if (newKey.trim() && newValue.trim() && value.length < maxSpecifications) {
      onChange([
        ...value,
        { key: newKey.trim(), value: newValue.trim(), group: newGroup },
      ])
      setNewKey('')
      setNewValue('')
      setNewGroup('General')
    }
  }

  const removeSpecification = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const groupedSpecs = value.reduce<Record<string, Specification[]>>((acc, spec) => {
    const g = spec.group || 'General'
    if (!acc[g]) acc[g] = []
    acc[g].push(spec)
    return acc
  }, {})

  const canAddMore = value.length < maxSpecifications

  return (
    <div className="w-full space-y-4">
      <div className="mb-1 flex items-center gap-1">
        <Label
          className={cn('text-sm font-semibold', error && 'text-destructive')}
        >
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {tooltip && (
          <span title={tooltip} className="inline-flex cursor-default text-muted-foreground">
            <Info className="h-4 w-4" />
          </span>
        )}
        <StatusIcon status={status} />
      </div>

      {value.length > 0 && (
        <div className="space-y-3">
          {Object.entries(groupedSpecs).map(([group, specs]) => (
            <Card key={group}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">
                  {group} ({specs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {specs.map((spec) => {
                  const globalIndex = value.findIndex((s) => s === spec)
                  return (
                    <div
                      key={globalIndex}
                      className="flex flex-col gap-2 sm:flex-row sm:items-end"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label className="text-xs">Key</Label>
                        <Input
                          className="h-9 w-full"
                          value={spec.key}
                          onChange={(e) =>
                            handleSpecificationChange(globalIndex, 'key', e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          className="h-9 w-full"
                          value={spec.value}
                          onChange={(e) =>
                            handleSpecificationChange(globalIndex, 'value', e.target.value)
                          }
                          disabled={disabled}
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <Label className="text-xs">Group</Label>
                        <Select
                          value={spec.group}
                          onValueChange={(v) =>
                            handleSpecificationChange(globalIndex, 'group', v)
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {groups.map((g) => (
                              <SelectItem key={g} value={g}>
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 self-end text-destructive hover:text-destructive"
                        onClick={() => removeSpecification(globalIndex)}
                        disabled={disabled}
                        aria-label="Remove specification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {canAddMore && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="mb-2 text-sm font-medium">Add New Specification</h4>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs">Specification Key</Label>
                <Input
                  className="h-9 w-full"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., Weight, Color, Material"
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs">Value</Label>
                <Input
                  className="h-9 w-full"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., 2.5 lbs, Red, Steel"
                />
              </div>
              <div className="w-full sm:w-32">
                <Label className="text-xs">Group</Label>
                <Select
                  value={newGroup}
                  onValueChange={setNewGroup}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSpecification}
                disabled={!newKey.trim() || !newValue.trim() || disabled}
                className="shrink-0"
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!canAddMore && (
        <div
          className="rounded-md border border-bloom-coral/40 bg-bloom-rose p-3 text-sm text-bloom-coral"
          role="status"
        >
          Maximum {maxSpecifications} specifications allowed. Remove some to add more.
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {helperText && !error && <p className="text-sm text-muted-foreground">{helperText}</p>}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {value.length} specifications
          </Badge>
          {Object.keys(groupedSpecs).map((g) => (
            <Badge key={g} variant="outline" className="text-xs">
              {g}: {groupedSpecs[g].length}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default SpecificationField
