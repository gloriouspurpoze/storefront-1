import type { Slider, SliderMediaType, SliderPlaybackSettings } from '../types'

export const SLIDER_MEDIA_TYPE_LABELS: Record<SliderMediaType, string> = {
  image: 'Static image',
  video: 'Video (MP4 / WebM)',
  gif: 'Animated GIF',
  lottie: 'Lottie animation',
}

export const SLIDER_MEDIA_SPECS: Record<
  SliderMediaType,
  { hint: string; maxMb: number; formats: string }
> = {
  image: {
    hint: '1920×600 hero recommended. One file for all screens — keep text and subjects centered.',
    maxMb: 5,
    formats: 'JPG, PNG, WebP',
  },
  gif: {
    hint: 'Short looped GIF for lightweight motion. Keep under 3 MB when possible.',
    maxMb: 8,
    formats: 'GIF',
  },
  video: {
    hint: 'MP4 (H.264) preferred; WebM supported. Add a poster image for fast first paint.',
    maxMb: 80,
    formats: 'MP4, WebM, MOV',
  },
  lottie: {
    hint: 'Bodymovin JSON from After Effects / LottieFiles. Use a poster for web fallback.',
    maxMb: 5,
    formats: 'JSON',
  },
}

export const DEFAULT_SLIDER_PLAYBACK: SliderPlaybackSettings = {
  autoplay: true,
  loop: true,
  muted: true,
  playsInline: true,
}

export function normalizeSliderMediaType(raw?: string | null): SliderMediaType {
  const v = String(raw || 'image').toLowerCase()
  if (v === 'video' || v === 'gif' || v === 'lottie') return v
  return 'image'
}

export function inferMediaTypeFromUrl(url: string): SliderMediaType | null {
  const u = url.toLowerCase().split('?')[0]
  if (u.endsWith('.gif')) return 'gif'
  if (/\.(mp4|webm|mov|m4v)$/.test(u)) return 'video'
  if (u.endsWith('.json') || u.endsWith('.lottie')) return 'lottie'
  return null
}

/** Primary asset URL for list thumbnails */
export function sliderThumbnailUrl(slider: Pick<Slider, 'media_type' | 'image_url' | 'poster_url' | 'video_url'>): string {
  const type = normalizeSliderMediaType(slider.media_type)
  if (type === 'video') return slider.poster_url || slider.image_url || ''
  return slider.image_url || slider.poster_url || ''
}

export interface SliderPreviewSources {
  mediaType: SliderMediaType
  imageUrl?: string
  videoUrl?: string
  posterUrl?: string
  lottieUrl?: string
  playback: SliderPlaybackSettings
}

export function buildSliderPreviewSources(form: {
  media_type: SliderMediaType
  image_url: string
  video_url: string
  poster_url: string
  lottie_url: string
  playback: SliderPlaybackSettings
}): SliderPreviewSources {
  return {
    mediaType: form.media_type,
    imageUrl: form.image_url || undefined,
    videoUrl: form.video_url || undefined,
    posterUrl: form.poster_url || form.image_url || undefined,
    lottieUrl: form.lottie_url || undefined,
    playback: { ...DEFAULT_SLIDER_PLAYBACK, ...form.playback },
  }
}

export function sliderFromApi(raw: Slider): Slider {
  return {
    ...raw,
    media_type: normalizeSliderMediaType(raw.media_type),
    playback: { ...DEFAULT_SLIDER_PLAYBACK, ...(raw.playback || {}) },
  }
}
