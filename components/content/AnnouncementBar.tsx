import type { ReactNode } from 'react'
import './announcement-bar.css'

export type AnnouncementBarProps = {
  title: string
  description?: string
  ctaText?: string
  ctaUrl?: string
  className?: string
  innerClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  ctaClassName?: string
  /** When true (default), scrolls content horizontally; static when reduced motion is preferred. */
  marquee?: boolean
  children?: ReactNode
}

function AnnouncementSegment({
  title,
  description,
  ctaText,
  ctaUrl,
  titleClassName,
  descriptionClassName,
  ctaClassName,
  hidden,
}: {
  title: string
  description?: string
  ctaText?: string
  ctaUrl?: string
  titleClassName?: string
  descriptionClassName?: string
  ctaClassName?: string
  hidden?: boolean
}) {
  const cta =
    ctaText && ctaUrl ? (
      <a href={ctaUrl} className={ctaClassName}>
        {ctaText}
      </a>
    ) : null

  return (
    <span className="sf-announcement__segment" aria-hidden={hidden || undefined}>
      <span className={titleClassName}>{title}</span>
      {description ? (
        <>
          <span className="sf-announcement__sep" aria-hidden="true">
            ·
          </span>
          <span className={descriptionClassName}>{description}</span>
        </>
      ) : null}
      {cta}
    </span>
  )
}

/** Shared announcement shell — theme supplies class names / children for skinning. */
export function AnnouncementBar({
  title,
  description,
  ctaText,
  ctaUrl,
  className,
  innerClassName,
  titleClassName,
  descriptionClassName,
  ctaClassName,
  marquee = true,
  children,
}: AnnouncementBarProps) {
  if (children) {
    return (
      <aside className={className} role="region" aria-label="Store announcement">
        {children}
      </aside>
    )
  }

  const rootClass = [className, marquee ? 'sf-announcement' : 'sf-announcement sf-announcement--static']
    .filter(Boolean)
    .join(' ')
  const viewportClass = ['sf-announcement__viewport', innerClassName].filter(Boolean).join(' ')

  const segmentProps = {
    title,
    description,
    ctaText,
    ctaUrl,
    titleClassName,
    descriptionClassName,
    ctaClassName,
  }

  const srText = [title, description, ctaText].filter(Boolean).join(' — ')

  if (!marquee) {
    return (
      <aside className={rootClass} role="region" aria-label="Store announcement">
        <div className={viewportClass}>
          <div className="sf-announcement__track">
            <AnnouncementSegment {...segmentProps} />
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className={rootClass} role="region" aria-label="Store announcement">
      <span className="sf-announcement__sr">{srText}</span>
      <div className={viewportClass}>
        <div className="sf-announcement__track" aria-hidden="true">
          <AnnouncementSegment {...segmentProps} />
          <AnnouncementSegment {...segmentProps} hidden />
        </div>
      </div>
    </aside>
  )
}
