import React, { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Images, LayoutPanelTop } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import SlidersManagement from '../settings/sliders-management'
import BannerManagement from './BannerManagement'
import { SliderKnowledgeKit } from '../../components/sliders/SliderKnowledgeKit'

const HUB_TABS = ['sliders', 'banners'] as const
type HubTab = (typeof HUB_TABS)[number]

function normalizeHubTab(raw: string | null): HubTab {
  if (raw && HUB_TABS.includes(raw as HubTab)) return raw as HubTab
  return 'sliders'
}

/**
 * Single workspace: carousel slides (`/sliders` API) and CMS banners (`/cms/admin/banners`).
 * Tab state: `?tab=banners` (default = carousels).
 */
export default function SlidersBannersHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = useMemo(() => normalizeHubTab(searchParams.get('tab')), [searchParams])

  const setTab = useCallback(
    (next: HubTab) => {
      const nextParams = new URLSearchParams(searchParams)
      if (next === 'sliders') nextParams.delete('tab')
      else nextParams.set('tab', next)
      setSearchParams(nextParams, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && !HUB_TABS.includes(t as HubTab)) {
      const p = new URLSearchParams(searchParams)
      p.delete('tab')
      setSearchParams(p, { replace: true })
    }
  }, [searchParams, setSearchParams])

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <PageHeader
        title="Sliders & site banners"
        subtitle="Carousels with image, GIF, video, or Lottie slides (placement, schedules, playback) plus CMS banners for pop-ups and announcements."
        icon={<Images className="h-7 w-7" aria-hidden />}
        action={<SliderKnowledgeKit />}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as HubTab)} className="mt-4 w-full">
        <div className="overflow-x-auto rounded-lg border border-border/80 bg-muted/25 shadow-sm">
          <TabsList className="mb-0 inline-flex h-auto min-h-9 w-max min-w-full justify-start gap-0.5 rounded-none border-0 bg-transparent p-1.5">
            <TabsTrigger value="sliders" className="gap-1.5 rounded-md px-3 py-2 text-xs sm:text-sm">
              <Images className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Carousels (sliders)
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-1.5 rounded-md px-3 py-2 text-xs sm:text-sm">
              <LayoutPanelTop className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              Banners &amp; pop-ups
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sliders" className="mt-4 px-0 outline-none">
          <SlidersManagement embedded />
        </TabsContent>
        <TabsContent value="banners" className="mt-4 px-0 outline-none">
          <BannerManagement embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
