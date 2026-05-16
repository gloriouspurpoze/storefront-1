import React, { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { cn } from '../../lib/utils'
import { normalizeSliderMediaType, type SliderPreviewSources } from '../../lib/sliderMedia'
import { SliderMediaPreview } from './SliderMediaPreview'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'

/** Matches fixerapp Banner.tsx: height = width / 2.1 */
const MOBILE_HERO_ASPECT = 21 / 10

interface SliderResponsivePreviewProps {
  sources: SliderPreviewSources
  title?: string
  subtitle?: string
  buttonText?: string
  className?: string
}

type ViewportMode = 'desktop' | 'mobile'

/**
 * Shows how one hero asset crops on desktop vs mobile — no separate mobile upload.
 */
export function SliderResponsivePreview({
  sources,
  title,
  subtitle,
  buttonText,
  className,
}: SliderResponsivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportMode>('desktop')
  const mediaType = normalizeSliderMediaType(sources.mediaType)
  const isVideo = mediaType === 'video'

  return (
    <Card className={cn('overflow-hidden border-primary/15 shadow-md', className)}>
      <CardHeader className="space-y-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Live preview</p>
          <div className="inline-flex rounded-lg border bg-background p-0.5">
            <ViewportToggle
              active={viewport === 'desktop'}
              onClick={() => setViewport('desktop')}
              icon={<Monitor className="h-3.5 w-3.5" />}
              label="Desktop"
            />
            <ViewportToggle
              active={viewport === 'mobile'}
              onClick={() => setViewport('mobile')}
              icon={<Smartphone className="h-3.5 w-3.5" />}
              label="Mobile"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {viewport === 'mobile'
            ? isVideo
              ? 'Mobile app uses a wide hero card (~2.1:1). Video fills the card with cover — same as production.'
              : 'Mobile app hero is a wide card (~2.1:1), not full-screen. Keep key content centered.'
            : 'Desktop hero is wide (~21:9). One file for all screens — edges may crop on smaller widths.'}
        </p>
      </CardHeader>
      <CardContent className="bg-muted/20 p-4 sm:p-5">
        {viewport === 'desktop' ? (
          <DesktopFrame>
            <SliderMediaPreview
              sources={sources}
              title={title}
              subtitle={subtitle}
              buttonText={buttonText}
              nested
              viewport="desktop"
            />
          </DesktopFrame>
        ) : (
          <MobileAppFrame>
            <SliderMediaPreview
              sources={sources}
              title={title}
              subtitle={subtitle}
              buttonText={buttonText}
              nested
              viewport="mobile"
            />
          </MobileAppFrame>
        )}
      </CardContent>
    </Card>
  )
}

function ViewportToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('h-8 gap-1.5 rounded-md px-2.5 text-xs font-medium', active && 'shadow-sm')}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-2 flex items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Monitor className="h-3 w-3" />
        Desktop hero · 21:9
      </div>
      <div className="aspect-[21/9] w-full overflow-hidden rounded-xl border-2 border-border bg-background shadow-inner">
        {children}
      </div>
    </div>
  )
}

/** Phone chrome + in-app hero card matching production mobile layout */
function MobileAppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[340px] flex-col items-center">
      <div className="mb-2 flex w-full items-center gap-2 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Smartphone className="h-3 w-3" />
        Mobile app · 2.1:1 hero
      </div>

      <div className="w-full overflow-hidden rounded-[2rem] border-[7px] border-zinc-800 bg-zinc-900 shadow-xl dark:border-zinc-700">
        {/* Status / notch */}
        <div className="relative flex h-7 items-end justify-center bg-zinc-900 pb-1">
          <div className="absolute left-1/2 top-1.5 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
          <span className="relative z-[1] text-[9px] font-medium text-zinc-500">9:41</span>
        </div>

        {/* App content */}
        <div className="bg-background px-3 pb-3 pt-2">
          {/* Shimmer search bar placeholder */}
          <div className="mb-3 h-9 rounded-lg bg-muted/80" />

          {/* Hero carousel card — production aspect */}
          <div
            className="relative w-full overflow-hidden rounded-lg shadow-md ring-1 ring-black/5"
            style={{ aspectRatio: `${MOBILE_HERO_ASPECT}` }}
          >
            {children}
          </div>

          {/* Carousel pagination */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/25" />
          </div>

          {/* Content placeholders */}
          <div className="mt-4 space-y-2">
            <div className="h-3 w-2/5 rounded bg-muted" />
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-lg bg-muted/70" />
              ))}
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center bg-zinc-900 py-2">
          <div className="h-1 w-[100px] rounded-full bg-zinc-600" />
        </div>
      </div>
    </div>
  )
}
