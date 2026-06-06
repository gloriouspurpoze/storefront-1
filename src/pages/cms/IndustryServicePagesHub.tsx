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
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui'
import { PageHeader } from '../../components/common/PageHeader'
import { Link } from 'react-router-dom'
import { CircleDollarSign, Megaphone } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { useCmsCatalogCategories } from '../../hooks/useCmsCatalogCategories'
import { selectValueWhenListed } from '../../lib/selectValueGuard'
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

  const catalogSelectAllowed = useMemo(() => catalogOptions.map((o) => o.value), [catalogOptions])
  const catalogSelectValue = useMemo(
    () => selectValueWhenListed(effectiveCatalogKey, catalogSelectAllowed),
    [effectiveCatalogKey, catalogSelectAllowed],
  )

  return (
    <IndustryServicePagesCatalogContext.Provider value={ctx}>
      <div className="p-4 sm:p-6 md:p-8">
        <PageHeader
          title="Industry service pages"
          subtitle="Same catalog industry everywhere: Landing = Industry × Location × page content (saved per key). Service areas = which URLs exist. Rate card & cross-linking use the same industry key. Public SEO JSON is consumed on https://www.profixer.in (see Metadata & SEO tab for technical fields)."
          icon={<Megaphone className="h-7 w-7" aria-hidden />}
        />

        <Tabs
          value={hubTab}
          onValueChange={(v) => setHubTab(v as HubTab)}
          className="w-full space-y-4"
        >
          <Card className="border-border/80 shadow-sm">
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-4 sm:max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="industry-hub-catalog" className="text-sm font-semibold">
                    Catalog industry
                  </Label>
                  <Select
                    value={catalogSelectValue}
                    onValueChange={setCatalogKey}
                    disabled={catalogOptionsLoading || catalogOptions.length === 0}
                  >
                    <SelectTrigger id="industry-hub-catalog" className="h-10 w-full">
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
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspace</p>
                <div className="overflow-x-auto rounded-lg border border-border/80 bg-muted/25 shadow-sm">
                  <TabsList className="mb-0 inline-flex h-auto min-h-10 w-max min-w-full justify-start gap-0.5 rounded-none border-0 bg-transparent p-1.5">
                    <TabsTrigger
                      value="landing"
                      className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Landing &amp; SEO
                    </TabsTrigger>
                    <TabsTrigger
                      value="service-areas"
                      className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Service areas
                    </TabsTrigger>
                    <TabsTrigger
                      value="rate-card"
                      className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Rate card
                    </TabsTrigger>
                    <TabsTrigger
                      value="cross-linking"
                      className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      Cross-linking
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Service areas drive the locality picker on the Landing tab and the consumer URL allowlist. Rate card and
                cross-linking use the same catalog industry key as landings.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to="/cms/pricing-category-meta">
                    <CircleDollarSign className="mr-1.5 h-4 w-4" aria-hidden />
                    Pricing category meta (answer-engine copy)
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <TabsContent value="landing" className="mt-0 outline-none focus-visible:outline-none">
            <CategoryMarketingManagement />
          </TabsContent>
          <TabsContent value="service-areas" className="mt-0 outline-none focus-visible:outline-none">
            <ServiceCatalogLocalitiesPanel
              rows={serviceLocalities.rows}
              loading={serviceLocalities.loading}
              error={serviceLocalities.error}
              onRefresh={() => void serviceLocalities.refresh()}
            />
          </TabsContent>
          <TabsContent value="rate-card" className="mt-0 outline-none focus-visible:outline-none">
            <RateCardManagement />
          </TabsContent>
          <TabsContent value="cross-linking" className="mt-0 outline-none focus-visible:outline-none">
            <CrossLinkingManagement />
          </TabsContent>
        </Tabs>
      </div>
    </IndustryServicePagesCatalogContext.Provider>
  )
}
