import { AnnouncementBar } from '@/components/content/AnnouncementBar'
import type { ResolvedAnnouncement } from '@/lib/storefrontContent'

export function MenuFastCardsAnnouncementBar({ data }: { data: ResolvedAnnouncement }) {
  return (
    <AnnouncementBar
      title={data.title}
      description={data.description}
      ctaText={data.ctaText}
      ctaUrl={data.ctaUrl}
      className="mf-cards-announcement"
      innerClassName="mf-cards-announcement-inner"
      titleClassName="mf-cards-announcement-title"
      descriptionClassName="mf-cards-announcement-desc"
      ctaClassName="mf-cards-announcement-cta"
    />
  )
}
