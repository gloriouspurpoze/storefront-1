import type { StorefrontConfig, StorefrontSlider } from '@/lib/storefront-api'
import type { HeroSlide } from './HeroCarousel'

/** Admin sliders (`home_page_hero`) → hero slides; falls back to Studio hero copy. */
export function buildHeroSlides(
  sliders: StorefrontSlider[],
  cfg: StorefrontConfig | null,
  fallback: { title: string; subtitle?: string; ctaLabel: string; ctaHref: string; eyebrow?: string },
): HeroSlide[] {
  const now = Date.now()
  const live = sliders
    .filter((s) => s.is_active !== false)
    .filter((s) => !s.start_date || Date.parse(s.start_date) <= now)
    .filter((s) => !s.end_date || Date.parse(s.end_date) >= now)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map<HeroSlide>((s) => ({
      id: s.id,
      eyebrow: s.subtitle,
      title: s.title,
      subtitle: s.description,
      imageUrl: s.media_type === 'video' ? s.poster_url || s.image_url : s.image_url,
      mobileImageUrl: s.media_type === 'video' ? s.poster_url_mobile : s.image_url_mobile,
      videoUrl: s.media_type === 'video' ? s.video_url : undefined,
      ctaLabel: s.button_text,
      ctaHref:
        s.button_url ||
        (s.product_slug ? `/products/${s.product_slug}` : s.category_slug ? `/categories/${s.category_slug}` : undefined),
    }))
  if (live.length) return live

  const c = cfg?.content
  return [
    {
      id: 'hero-default',
      eyebrow: fallback.eyebrow,
      title: c?.heroHeadline || fallback.title,
      subtitle: c?.heroSubcopy || fallback.subtitle,
      ctaLabel: c?.heroCtaLabel || fallback.ctaLabel,
      ctaHref: c?.heroCtaHref || fallback.ctaHref,
    },
  ]
}
