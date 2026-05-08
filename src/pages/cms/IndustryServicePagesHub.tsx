import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'
import { Megaphone } from 'lucide-react'
import { CMS_CATALOG_CATEGORIES } from '../../constants/cmsCatalogCategories'
import { IndustryServicePagesCatalogContext } from './IndustryServicePagesContext'
import CategoryMarketingManagement from './CategoryMarketingManagement'
import RateCardManagement from './RateCardManagement'
import CrossLinkingManagement from './CrossLinkingManagement'

const HUB_TABS = ['landing', 'rate-card', 'cross-linking'] as const
type HubTab = (typeof HUB_TABS)[number]

function normalizeHubTab(raw: string | null): HubTab {
  if (raw && HUB_TABS.includes(raw as HubTab)) return raw as HubTab
  return 'landing'
}

/**
 * Single workspace for industry SEO: landing templates (category-marketing JSON),
 * rate card lines, and cross-linking problems — shared catalog key + URL ?tab= & ?catalog=
 */
export default function IndustryServicePagesHub() {
  const [searchParams, setSearchParams] = useSearchParams()
  const hubTab = useMemo(() => normalizeHubTab(searchParams.get('tab')), [searchParams])
  const catalogFromUrl = searchParams.get('catalog')?.trim() || 'ac'
  const [catalogKey, setCatalogKeyState] = useState(catalogFromUrl)

  useEffect(() => {
    const c = searchParams.get('catalog')?.trim()
    if (c) setCatalogKeyState(c)
  }, [searchParams])

  const setCatalogKey = useCallback(
    (key: string) => {
      setCatalogKeyState(key)
      const next = new URLSearchParams(searchParams)
      next.set('catalog', key)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setHubTab = useCallback(
    (tab: HubTab) => {
      const next = new URLSearchParams(searchParams)
      if (tab === 'landing') next.delete('tab')
      else next.set('tab', tab)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const ctx = useMemo(
    () => ({
      catalogKey,
      setCatalogKey,
    }),
    [catalogKey, setCatalogKey],
  )

  return (
    <IndustryServicePagesCatalogContext.Provider value={ctx}>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Industry service pages"
          subtitle="One place for money-page SEO: landing copy & technical meta (canonical, OG, schema), spare-parts rate card, and internal cross-links. Pick a catalog industry once; it applies to all tabs. Hyperlocal keys still use the locality slug on the Landing tab."
          icon={<Megaphone className="h-7 w-7" aria-hidden />}
        />

        <Card className="mb-4">
          <CardContent className="space-y-4 pt-6">
            <div className="flex min-w-0 flex-col flex-wrap gap-4 md:flex-row md:items-center">
              <div className="flex min-w-[240px] flex-col gap-2">
                <Label htmlFor="industry-hub-catalog">Catalog industry</Label>
                <Select value={catalogKey} onValueChange={setCatalogKey}>
                  <SelectTrigger id="industry-hub-catalog" className="w-full min-w-[240px]">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {CMS_CATALOG_CATEGORIES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Tabs
                value={hubTab}
                onValueChange={(v) => setHubTab(v as HubTab)}
                className="min-w-0 flex-1"
              >
                <TabsList className="h-auto w-full min-w-0 flex-wrap justify-start gap-1 overflow-x-auto bg-muted/80 p-1">
                  <TabsTrigger
                    value="landing"
                    className="shrink-0 font-semibold data-[state=active]:shadow-sm"
                  >
                    Landing & SEO
                  </TabsTrigger>
                  <TabsTrigger
                    value="rate-card"
                    className="shrink-0 font-semibold data-[state=active]:shadow-sm"
                  >
                    Rate card
                  </TabsTrigger>
                  <TabsTrigger
                    value="cross-linking"
                    className="shrink-0 font-semibold data-[state=active]:shadow-sm"
                  >
                    Cross-linking
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <p className="text-sm text-muted-foreground">
              Rate card and cross-linking feed the same consumer catalog keys as industry landings — keeping pricing,
              entity topics, and internal links aligned per vertical.
            </p>
          </CardContent>
        </Card>

        <div className={hubTab === 'landing' ? 'block' : 'hidden'}>
          <CategoryMarketingManagement />
        </div>
        {hubTab === 'rate-card' && <RateCardManagement />}
        {hubTab === 'cross-linking' && <CrossLinkingManagement />}
      </div>
    </IndustryServicePagesCatalogContext.Provider>
  )
}
