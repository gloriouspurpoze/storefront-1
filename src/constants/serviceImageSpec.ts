/**
 * Platform service hero image spec — keep in sync with fixerapp card (16:10 cover).
 */
export const SERVICE_CARD_IMAGE_SPEC = {
  aspectRatio: 16 / 10,
  aspectLabel: '16:10',
  recommendedWidth: 800,
  recommendedHeight: 500,
  minWidth: 640,
  minHeight: 400,
  maxUploadMb: 5,
  maxGalleryImages: 5,
} as const

export const SERVICE_IMAGE_GUIDANCE = [
  `Use landscape ${SERVICE_CARD_IMAGE_SPEC.aspectLabel} photos (recommended ${SERVICE_CARD_IMAGE_SPEC.recommendedWidth}×${SERVICE_CARD_IMAGE_SPEC.recommendedHeight}px, minimum ${SERVICE_CARD_IMAGE_SPEC.minWidth}×${SERVICE_CARD_IMAGE_SPEC.minHeight}px).`,
  'Center the subject (technician, equipment, or finished work). Edges may crop on the customer app.',
  'Avoid heavy text, logos, or watermarks in the image — use the service title in the app instead.',
  'First / primary image is the card hero on Home, Services, and search.',
  `Formats: JPG, PNG, or WebP. Max ${SERVICE_CARD_IMAGE_SPEC.maxUploadMb}MB per file.`,
] as const
