'use client'

import { createThemedOffersStrip } from '@/theme-kit/content'

/**
 * Client boundary for the shared `sfo` offers strip. The theme-kit factory hands
 * `renderItem` / `getItemKey` functions to the client `OffersStrip`, which a server
 * component cannot do (functions are not serialisable) — so server callers render this
 * and pass plain slide data only.
 */
export const SharedOffersStrip = createThemedOffersStrip('sfo')
