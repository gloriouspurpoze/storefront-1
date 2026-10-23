import { describe, expect, it } from 'vitest'
import { latestDate, pageLastmod, pageSources } from '../pageLastmod'

const recorded = {
  'app/platform/[slug]/page.tsx': '2026-10-01T00:00:00.000Z',
  'lib/marketing-data/landingContent.ts': '2026-10-05T00:00:00.000Z',
  'lib/marketing-data/plans/salon.ts': '2026-10-08T00:00:00.000Z',
  'lib/marketing-data/plans/retail.ts': '2026-10-09T00:00:00.000Z',
}

describe('pageLastmod', () => {
  it('uses the newest content file for that page only', () => {
    expect(pageLastmod('/for-salons', undefined, recorded)).toBe('2026-10-08T00:00:00.000Z')
    expect(pageLastmod('/for-fitness', undefined, recorded)).toBe('2026-10-05T00:00:00.000Z')
  })

  it('lets a newer CMS SEO edit win', () => {
    expect(pageLastmod('/for-salons', '2026-10-10T12:00:00.000Z', recorded)).toBe('2026-10-10T12:00:00.000Z')
  })

  it('returns undefined when nothing is known, so <lastmod> is omitted', () => {
    expect(pageLastmod('/for-salons', undefined, {})).toBeUndefined()
    expect(pageSources('/unknown')).toEqual([])
  })

  it('ignores missing and invalid dates', () => {
    expect(latestDate([undefined, 'not a date', '2026-01-02T00:00:00Z'])).toBe('2026-01-02T00:00:00.000Z')
  })
})
