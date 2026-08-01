import { AnnouncementBar } from '@/components/content/AnnouncementBar'
import type { ResolvedAnnouncement } from '@/lib/storefrontContent'

export function LuxeEssenceAnnouncementBar({ data }: { data: ResolvedAnnouncement }) {
  return (
    <AnnouncementBar
      title={data.title}
      description={data.description}
      ctaText={data.ctaText}
      ctaUrl={data.ctaUrl}
      className="le-announcement"
      innerClassName="le-announcement-inner"
      titleClassName="le-announcement-title"
      descriptionClassName="le-announcement-desc"
      ctaClassName="le-announcement-cta"
    />
  )
}
