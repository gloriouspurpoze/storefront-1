import React from 'react'
import type { MarketingCampaign } from '../../types/marketingWorkspace.types'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

type Props = {
  id?: string
  label?: string
  campaigns: MarketingCampaign[]
  value: string | undefined
  onChange: (campaignId: string | undefined) => void
  optional?: boolean
}

export function CampaignSelect({
  id = 'campaign-select',
  label = 'Campaign',
  campaigns,
  value,
  onChange,
  optional = true,
}: Props) {
  const v = value && value.length > 0 ? value : '__none__'
  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <Select
        value={v}
        onValueChange={(next) => onChange(next === '__none__' ? undefined : next)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={optional ? 'Optional' : 'Select campaign'} />
        </SelectTrigger>
        <SelectContent>
          {optional ? <SelectItem value="__none__">No campaign</SelectItem> : null}
          {campaigns.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
