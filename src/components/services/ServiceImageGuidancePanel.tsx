import React from 'react'
import { ImageIcon, Smartphone, CheckCircle2 } from 'lucide-react'
import {
  SERVICE_CARD_IMAGE_SPEC,
  SERVICE_IMAGE_GUIDANCE,
} from '../../constants/serviceImageSpec'
import { cn } from '../../lib/utils'

export interface ServiceImageGuidancePanelProps {
  className?: string
  compact?: boolean
}

export const ServiceImageGuidancePanel: React.FC<ServiceImageGuidancePanelProps> = ({
  className,
  compact = false,
}) => (
  <div
    className={cn(
      'rounded-lg border border-[#00142F]/10 bg-[#F4F6F9] p-4',
      className,
    )}
  >
    <div className="mb-3 flex items-center gap-2">
      <Smartphone className="h-4 w-4 text-[#00142F]" aria-hidden />
      <p className="text-sm font-semibold text-[#00142F]">Mobile app image guide</p>
    </div>

    {!compact && (
      <div className="mb-3 flex items-center gap-3 rounded-md border border-dashed border-[#00142F]/20 bg-white px-3 py-2">
        <ImageIcon className="h-8 w-8 shrink-0 text-[#FE9D16]" aria-hidden />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-[#00142F]">
            Target ratio {SERVICE_CARD_IMAGE_SPEC.aspectLabel}
          </p>
          <p>
            {SERVICE_CARD_IMAGE_SPEC.recommendedWidth}×{SERVICE_CARD_IMAGE_SPEC.recommendedHeight}px
            {' · '}
            min {SERVICE_CARD_IMAGE_SPEC.minWidth}×{SERVICE_CARD_IMAGE_SPEC.minHeight}px
          </p>
        </div>
      </div>
    )}

    <ul className="space-y-2">
      {SERVICE_IMAGE_GUIDANCE.map((line) => (
        <li key={line} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FE9D16]" aria-hidden />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  </div>
)
