import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
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
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <PageHeader
          title="Industry service pages"
          subtitle="One place for money-page SEO: landing copy & technical meta (canonical, OG, schema), spare-parts rate card, and internal cross-links. Pick a catalog industry once; it applies to all tabs. Hyperlocal keys still use the locality slug on the Landing tab."
          icon={<Megaphone className="h-7 w-7" aria-hidden />}
        />

        <Card sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ md: 'center' }}
                flexWrap="wrap"
              >
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel id="industry-hub-catalog">Catalog industry</InputLabel>
                  <Select
                    labelId="industry-hub-catalog"
                    label="Catalog industry"
                    value={catalogKey}
                    onChange={(e) => setCatalogKey(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {CMS_CATALOG_CATEGORIES.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tabs
                  value={hubTab}
                  onChange={(_, v) => setHubTab(v as HubTab)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ borderBottom: 1, borderColor: 'divider', flex: 1, minWidth: 0 }}
                >
                  <Tab label="Landing & SEO" value="landing" sx={{ textTransform: 'none', fontWeight: 600 }} />
                  <Tab label="Rate card" value="rate-card" sx={{ textTransform: 'none', fontWeight: 600 }} />
                  <Tab label="Cross-linking" value="cross-linking" sx={{ textTransform: 'none', fontWeight: 600 }} />
                </Tabs>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Rate card and cross-linking feed the same consumer catalog keys as industry landings — keeping pricing,
                entity topics, and internal links aligned per vertical.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Box sx={{ display: hubTab === 'landing' ? 'block' : 'none' }}>
          <CategoryMarketingManagement />
        </Box>
        {hubTab === 'rate-card' && <RateCardManagement />}
        {hubTab === 'cross-linking' && <CrossLinkingManagement />}
      </Box>
    </IndustryServicePagesCatalogContext.Provider>
  )
}
