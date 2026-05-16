import React, { useEffect, useRef } from 'react'
import { Film, ImageIcon, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { normalizeSliderMediaType, type SliderPreviewSources } from '../../lib/sliderMedia'
import { Badge } from '../ui/badge'

interface SliderMediaPreviewProps {
  sources: SliderPreviewSources
  title?: string
  subtitle?: string
  buttonText?: string
  className?: string
  heightClass?: string
  /** Fill parent aspect-ratio frame (responsive preview) */
  nested?: boolean
  /** Tune overlay + video chrome for desktop vs mobile app frame */
  viewport?: 'desktop' | 'mobile'
}

export function SliderMediaPreview({
  sources,
  title,
  subtitle,
  buttonText,
  className,
  heightClass = 'h-[280px] sm:h-[360px] md:h-[420px]',
  nested = false,
  viewport = 'desktop',
}: SliderMediaPreviewProps) {
  const mediaType = normalizeSliderMediaType(sources.mediaType)
  const playback = sources.playback
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || mediaType !== 'video') return
    if (playback.autoplay) {
      void el.play().catch(() => {})
    }
  }, [mediaType, sources.videoUrl, playback.autoplay])

  const hasMedia =
    (mediaType === 'video' && sources.videoUrl) ||
    (mediaType === 'lottie' && sources.lottieUrl) ||
    ((mediaType === 'gif' || mediaType === 'image') && sources.imageUrl)

  return (
    <PreviewFrame
      className={cn(nested && 'h-full min-h-0 rounded-none border-0 bg-transparent shadow-none', className)}
      heightClass={nested ? 'h-full min-h-0' : heightClass}
    >
      {!(nested && viewport === 'mobile') ? (
        <div className="absolute left-2 top-2 z-10 sm:left-3 sm:top-3">
          <MediaBadge type={mediaType} compact={viewport === 'mobile'} />
        </div>
      ) : null}

      {!hasMedia ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="h-12 w-12 opacity-40" />
          <p className="text-sm">Add media to preview</p>
        </div>
      ) : mediaType === 'video' && sources.videoUrl ? (
        <>
          <video
            ref={videoRef}
            key={sources.videoUrl}
            className="h-full w-full object-cover object-center"
            src={sources.videoUrl}
            poster={sources.posterUrl}
            autoPlay={playback.autoplay}
            loop={playback.loop}
            muted={playback.muted}
            playsInline={playback.playsInline}
            controls={!nested}
            preload="metadata"
          />
          {nested && viewport === 'mobile' && !playback.autoplay ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                <Film className="h-5 w-5 text-white" />
              </div>
            </div>
          ) : null}
        </>
      ) : mediaType === 'lottie' && sources.lottieUrl ? (
        <LottieFallback poster={sources.posterUrl} lottieUrl={sources.lottieUrl} />
      ) : sources.imageUrl ? (
        <img src={sources.imageUrl} alt="" className="h-full w-full object-cover object-center" />
      ) : null}

      {(title || subtitle || buttonText) && hasMedia ? (
        <OverlayCopy
          viewport={viewport}
          nested={nested}
          title={title}
          subtitle={subtitle}
          buttonText={buttonText}
        />
      ) : null}
    </PreviewFrame>
  )
}

function MediaBadge({ type, compact }: { type: string; compact?: boolean }) {
  const label =
    type === 'video' ? 'Video' : type === 'gif' ? 'GIF' : type === 'lottie' ? 'Lottie' : 'Image'
  const Icon = type === 'video' ? Film : type === 'lottie' ? Sparkles : ImageIcon
  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 bg-black/50 text-white backdrop-blur-sm',
        compact && 'px-1.5 py-0 text-[10px]',
      )}
    >
      <Icon className={cn(compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      {!compact ? label : null}
    </Badge>
  )
}

function OverlayCopy({
  viewport,
  nested,
  title,
  subtitle,
  buttonText,
}: {
  viewport: 'desktop' | 'mobile'
  nested: boolean
  title?: string
  subtitle?: string
  buttonText?: string
}) {
  const isMobileFrame = nested && viewport === 'mobile'

  if (isMobileFrame) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white',
        nested && viewport === 'desktop'
          ? 'p-3 sm:p-4'
          : 'p-4 sm:p-6 md:p-8',
      )}
    >
      {title ? (
        <p
          className={cn(
            'mb-1 font-bold',
            nested ? 'line-clamp-2 text-base sm:text-lg' : 'text-xl sm:text-2xl md:text-3xl',
          )}
        >
          {title}
        </p>
      ) : null}
      {subtitle ? (
        <p
          className={cn(
            'opacity-95',
            nested ? 'mb-2 line-clamp-1 text-xs' : 'mb-3 text-sm sm:text-base',
          )}
        >
          {subtitle}
        </p>
      ) : null}
      {buttonText ? (
        <span
          className={cn(
            'inline-block rounded-lg bg-white font-semibold text-gray-900',
            nested ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
          )}
        >
          {buttonText}
        </span>
      ) : null}
    </div>
  )
}

function LottieFallback({ poster, lottieUrl }: { poster?: string; lottieUrl: string }) {
  if (poster) {
    return (
      <>
        <img src={poster} alt="" className="h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 p-4 text-center text-white">
          <Sparkles className="mb-2 h-10 w-10" />
          <p className="text-sm font-medium">Lottie animation</p>
          <p className="mt-1 max-w-xs truncate text-xs opacity-90">{lottieUrl}</p>
          <p className="mt-2 text-xs opacity-75">Full motion renders in the mobile app</p>
        </div>
      </>
    )
  }
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 p-6 text-center">
      <Sparkles className="h-10 w-10 text-violet-600" />
      <p className="text-sm font-medium">Lottie JSON attached</p>
      <p className="max-w-md truncate text-xs text-muted-foreground">{lottieUrl}</p>
    </div>
  )
}

function PreviewFrame({
  children,
  className,
  heightClass,
}: {
  children: React.ReactNode
  className?: string
  heightClass: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border-2 border-primary/15 bg-muted/40 shadow-lg',
        heightClass,
        className,
      )}
    >
      {children}
    </div>
  )
}
