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
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { IndustryServicePagesCatalogContext } from './IndustryServicePagesContext'
import CategoryMarketingManagement from './CategoryMarketingManagement'
import RateCardManagement from './RateCardManagement'
import CrossLinkingManagement from './CrossLinkingManagement'
import { ServiceCatalogLocalitiesPanel } from '../../components/cms/ServiceCatalogLocalitiesPanel'
import { useServiceCatalogLocalities } from '../../hooks/useServiceCatalogLocalities'

const HUB_TABS = ['landing', 'service-areas', 'rate-card', 'cross-linking'] as const
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
  const catalogFromUrl = searchParams.get('catalog')?.trim() ?? ''
  const [catalogKey, setCatalogKeyState] = useState(catalogFromUrl)
  const { options: catalogOptions, loading: catalogOptionsLoading, defaultSlug } = useCmsCatalogCategories()

  const effectiveCatalogKey = useMemo(() => {
    if (catalogOptions.length === 0) return catalogKey
    if (catalogKey && catalogOptions.some((o) => o.value === catalogKey)) return catalogKey
    return defaultSlug ?? catalogOptions[0]?.value ?? ''
  }, [catalogOptions, catalogKey, defaultSlug])

  useEffect(() => {
    const c = searchParams.get('catalog')?.trim()
    if (c) setCatalogKeyState(c)
  }, [searchParams])

  useEffect(() => {
    if (catalogOptionsLoading || catalogOptions.length === 0) return
    const slugs = new Set(catalogOptions.map((o) => o.value))
    if (catalogKey && slugs.has(catalogKey)) return
    const next = defaultSlug ?? catalogOptions[0]?.value ?? ''
    if (!next) return
    setCatalogKeyState(next)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('catalog', next)
    setSearchParams(nextParams, { replace: true })
  }, [catalogOptionsLoading, catalogOptions, catalogKey, defaultSlug, searchParams, setSearchParams])

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

  const serviceLocalities = useServiceCatalogLocalities()

  const ctx = useMemo(
    () => ({
      catalogKey: effectiveCatalogKey,
      setCatalogKey,
    }),
    [effectiveCatalogKey, setCatalogKey],
  )

  return (
    <IndustryServicePagesCatalogContext.Provider value={ctx}>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Industry service pages"
          subtitle="Same catalog industry everywhere: Landing = Industry × Location × page content (saved per key). Service areas = which URLs exist. Rate card & cross-linking use the same industry key. Public SEO JSON is consumed on my.profixer.in (see Metadata & SEO tab for technical fields)."
          icon={<Megaphone className="h-7 w-7" aria-hidden />}
        />

        <Card className="mb-4">
          <CardContent className="space-y-4 pt-6">
            <div className="flex min-w-0 flex-col flex-wrap gap-4 md:flex-row md:items-center">
              <div className="flex min-w-[240px] flex-col gap-2">
                <Label htmlFor="industry-hub-catalog">Catalog industry</Label>
                <Select
                  value={effectiveCatalogKey}
                  onValueChange={setCatalogKey}
                  disabled={catalogOptionsLoading || catalogOptions.length === 0}
                >
                  <SelectTrigger id="industry-hub-catalog" className="w-full min-w-[240px]">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogOptions.map((opt) => (
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
                    value="service-areas"
                    className="shrink-0 font-semibold data-[state=active]:shadow-sm"
                  >
                    Service areas
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
              Service areas drive the locality picker on the Landing tab and the consumer URL allowlist. Rate card and
              cross-linking use the same catalog industry key as landings.
            </p>
          </CardContent>
        </Card>

        <div className={hubTab === 'landing' ? 'block' : 'hidden'}>
          <CategoryMarketingManagement />
        </div>
        {hubTab === 'service-areas' ? (
          <ServiceCatalogLocalitiesPanel
            rows={serviceLocalities.rows}
            loading={serviceLocalities.loading}
            error={serviceLocalities.error}
            onRefresh={() => void serviceLocalities.refresh()}
          />
        ) : null}
        {hubTab === 'rate-card' && <RateCardManagement />}
        {hubTab === 'cross-linking' && <CrossLinkingManagement />}
      </div>
    </IndustryServicePagesCatalogContext.Provider>
  )
}
