import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  IconButton,
  Tab,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Campaign as CampaignIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import { CMSService } from '../../services/api'
import { PageHeader } from '../../components/common/PageHeader'
import ImageUploadField from '../../components/forms/ImageUploadField'
import type { ImageFile } from '../../components/forms/ImageUploadField'
import { CMS_CATALOG_CATEGORIES } from '../../constants/cmsCatalogCategories'
import {
  META_DESC_HARD_MAX_CHARS,
  META_DESC_MIN_CHARS,
  META_DESC_OPTIMAL_MAX_CHARS,
  SEO_TITLE_HARD_MAX_CHARS,
  SEO_TITLE_MIN_CHARS,
  SEO_TITLE_OPTIMAL_MAX_CHARS,
} from '../../components/blog/blog-seo-guidelines'
import {
  type CategoryMarketingConfig,
  type LocalityGuideCmsFields,
  type LocalSeoCmsFields,
  type TechnicalSeoCmsFields,
  type ServiceTypeBlock,
  emptyCategoryMarketingConfig,
  emptyLocalityGuideSection,
  emptyBookingStep,
  emptyComparisonRow,
  emptyFaq,
  emptyRelatedLink,
  emptyServiceCard,
  emptyServiceTypeBlock,
  emptySparePart,
  emptyTrustBenefit,
  mergeCategoryConfig,
  normalizeCategoryMarketingRecord,
} from '../../types/categoryMarketing'
import { appToast } from '../../lib/appToast'
import { useIndustryServicePagesCatalog } from './IndustryServicePagesContext'

type TabKey =
  | 'metadata'
  | 'localSeo'
  | 'hero'
  | 'cards'
  | 'detailed'
  | 'trust'
  | 'areas'
  | 'pricing'
  | 'faqs'
  | 'localityGuide'
  | 'closing'

function charCountColor(len: number, min: number, optimal: number, hard: number): string {
  if (len > hard) return 'error.main'
  if (len > optimal) return 'warning.main'
  if (len >= min) return 'success.main'
  return 'text.secondary'
}

export default function CategoryMarketingManagement() {
  const industryHub = useIndustryServicePagesCatalog()
  const [standaloneCategory, setStandaloneCategory] = useState<string>('ac')
  const selectedCategory = industryHub?.catalogKey ?? standaloneCategory
  const setSelectedCategory = (v: string) => {
    if (industryHub) industryHub.setCatalogKey(v)
    else setStandaloneCategory(v)
  }

  const [data, setData] = useState<Record<string, CategoryMarketingConfig>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  /** URL locality slug for composite CMS keys, e.g. `mira-bhayandar` → `electric__mira-bhayandar`. */
  const [localitySlugForKey, setLocalitySlugForKey] = useState('')
  const [duplicateSourceKey, setDuplicateSourceKey] = useState('')
  const [importJsonText, setImportJsonText] = useState('')
  const [tab, setTab] = useState<TabKey>('metadata')

  const effectiveKey = useMemo(() => {
    const loc = localitySlugForKey.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
    if (!loc) return selectedCategory
    return `${selectedCategory}__${loc}`
  }, [selectedCategory, localitySlugForKey])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const result = await CMSService.getCategoryMarketing()
      const raw = typeof result === 'object' && result !== null ? result : {}
      setData(normalizeCategoryMarketingRecord(raw as Record<string, unknown>))
    } catch (error: unknown) {
      console.error('Error fetching category marketing:', error)
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      const fallback = error instanceof Error ? error.message : 'Failed to load'
      appToast('Error: ' + (msg || fallback), 'error')
      setData({})
    } finally {
      setLoading(false)
    }
  }

  const config = data[effectiveKey] ?? emptyCategoryMarketingConfig()

  const updateConfig = (updates: Partial<CategoryMarketingConfig>) => {
    setData((prev) => {
      const base = prev[effectiveKey] ?? emptyCategoryMarketingConfig()
      const next: CategoryMarketingConfig = {
        ...base,
        ...updates,
        leadMagnet: updates.leadMagnet
          ? { ...base.leadMagnet, ...updates.leadMagnet }
          : base.leadMagnet,
        localityGuide: updates.localityGuide
          ? { ...base.localityGuide, ...updates.localityGuide }
          : base.localityGuide,
        localSeo: updates.localSeo ? { ...base.localSeo, ...updates.localSeo } : base.localSeo,
        technicalSeo: updates.technicalSeo
          ? {
              ...base.technicalSeo,
              ...updates.technicalSeo,
              aggregateRating: updates.technicalSeo.aggregateRating
                ? { ...base.technicalSeo.aggregateRating, ...updates.technicalSeo.aggregateRating }
                : base.technicalSeo.aggregateRating,
            }
          : base.technicalSeo,
      }
      return { ...prev, [effectiveKey]: next }
    })
  }

  const updateLocalityGuide = (updates: Partial<LocalityGuideCmsFields>) => {
    updateConfig({ localityGuide: { ...config.localityGuide, ...updates } })
  }

  const updateLocalSeo = (updates: Partial<LocalSeoCmsFields>) => {
    updateConfig({ localSeo: { ...config.localSeo, ...updates } })
  }

  const updateTechnicalSeo = (updates: Partial<TechnicalSeoCmsFields>) => {
    updateConfig({
      technicalSeo: {
        ...config.technicalSeo,
        ...updates,
        aggregateRating: updates.aggregateRating
          ? { ...config.technicalSeo.aggregateRating, ...updates.aggregateRating }
          : config.technicalSeo.aggregateRating,
      },
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const payload = { ...data, [effectiveKey]: config }
      await CMSService.updateCategoryMarketing(payload)
      appToast('Category marketing saved.', 'success')
      fetchData()
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      appToast('Error: ' + (msg || 'Failed to save'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const addServiceType = () => {
    updateConfig({
      serviceTypes: [...config.serviceTypes, emptyServiceTypeBlock()],
    })
  }

  const updateServiceType = (index: number, field: keyof ServiceTypeBlock, value: string | string[]) => {
    const next = [...config.serviceTypes]
    next[index] = { ...next[index], [field]: value as never }
    updateConfig({ serviceTypes: next })
  }

  const removeServiceType = (index: number) => {
    updateConfig({ serviceTypes: config.serviceTypes.filter((_, i) => i !== index) })
  }

  const updateBullet = (typeIndex: number, bulletIndex: number, value: string) => {
    const next = [...config.serviceTypes]
    const bullets = [...(next[typeIndex].bullets || [])]
    bullets[bulletIndex] = value
    next[typeIndex] = { ...next[typeIndex], bullets }
    updateConfig({ serviceTypes: next })
  }

  const addBullet = (typeIndex: number) => {
    const next = [...config.serviceTypes]
    next[typeIndex] = {
      ...next[typeIndex],
      bullets: [...(next[typeIndex].bullets || []), ''],
    }
    updateConfig({ serviceTypes: next })
  }

  const removeBullet = (typeIndex: number, bulletIndex: number) => {
    const next = [...config.serviceTypes]
    next[typeIndex] = {
      ...next[typeIndex],
      bullets: next[typeIndex].bullets.filter((_, i) => i !== bulletIndex),
    }
    updateConfig({ serviceTypes: next })
  }

  const updateStringList = (key: keyof CategoryMarketingConfig, index: number, value: string) => {
    const arr = [...(config[key] as string[])]
    arr[index] = value
    updateConfig({ [key]: arr } as Partial<CategoryMarketingConfig>)
  }

  const removeStringListItem = (key: keyof CategoryMarketingConfig, index: number) => {
    const arr = (config[key] as string[]).filter((_, j) => j !== index)
    updateConfig({ [key]: arr } as Partial<CategoryMarketingConfig>)
  }

  const addStringListItem = (key: keyof CategoryMarketingConfig) => {
    const arr = [...(config[key] as string[]), '']
    updateConfig({ [key]: arr } as Partial<CategoryMarketingConfig>)
  }

  return (
    <Box sx={{ p: industryHub ? 0 : { xs: 2, sm: 3, md: 4 } }}>
      {!industryHub && (
        <PageHeader
          title="Industry service pages"
          subtitle="Source of truth for industry landings: core meta, technical SEO (canonical, OG/Twitter, robots, hreflang), local pack, schema toggles, answer-engine copy, hero through FAQs. Use [City], [Location], [ServiceName]; composite keys use a locality slug (e.g. ac__bandra-west)."
          action={
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} /> : <CampaignIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{ borderRadius: 2 }}
            >
              Save
            </Button>
          }
        />
      )}

      {industryHub && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} /> : <CampaignIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2 }}
          >
            Save landing template
          </Button>
        </Box>
      )}

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            {!industryHub && (
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Industry (catalog category)</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Industry (catalog category)"
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setLocalitySlugForKey('')
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {CMS_CATALOG_CATEGORIES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              size="small"
              sx={{ minWidth: 260, flex: 1 }}
              label="Locality slug (optional)"
              value={localitySlugForKey}
              onChange={(e) => setLocalitySlugForKey(e.target.value)}
              placeholder="e.g. mira-bhayandar"
              helperText="Leave empty for industry-wide. With slug, record key is industry__locality (matches public URLs)."
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Editing CMS key: <strong>{effectiveKey}</strong>
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Copy from another key
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Duplicate an existing record into <strong>{effectiveKey}</strong> (unsaved until you click Save). Use this to
            clone <code>electric</code> into <code>electric__mira-bhayandar</code>, then edit the hyperlocal fields.
          </Typography>
          {Object.keys(data).filter((k) => k !== effectiveKey).length === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No other keys loaded yet—save at least one industry template, or paste JSON below, then pick a hyperlocal
              slug and merge.
            </Alert>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel>Source key</InputLabel>
              <Select
                value={duplicateSourceKey}
                label="Source key"
                onChange={(e) => setDuplicateSourceKey(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select a key…</em>
                </MenuItem>
                {Object.keys(data)
                  .sort((a, b) => a.localeCompare(b))
                  .filter((k) => k !== effectiveKey)
                  .map((k) => (
                    <MenuItem key={k} value={k}>
                      {k}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              disabled={!duplicateSourceKey || !data[duplicateSourceKey]}
              onClick={() => {
                const src = data[duplicateSourceKey]
                if (!src) return
                const full = mergeCategoryConfig(src)
                setData((prev) => ({
                  ...prev,
                  [effectiveKey]: JSON.parse(JSON.stringify(full)) as CategoryMarketingConfig,
                }))
                appToast(
                  `Replaced "${effectiveKey}" with a full copy from "${duplicateSourceKey}". Click Save to persist.`,
                  'success',
                )
              }}
            >
              Replace current with full copy
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              disabled={!duplicateSourceKey || !data[duplicateSourceKey]}
              onClick={() => {
                const src = data[duplicateSourceKey]
                if (!src) return
                const full = mergeCategoryConfig(src)
                updateConfig({
                  localityGuide: JSON.parse(JSON.stringify(full.localityGuide)) as LocalityGuideCmsFields,
                })
                appToast(`Merged locality guide from "${duplicateSourceKey}". Click Save to persist.`, 'success')
              }}
            >
              Merge locality guide only
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              disabled={!duplicateSourceKey || !data[duplicateSourceKey]}
              onClick={() => {
                const src = data[duplicateSourceKey]
                if (!src) return
                const full = mergeCategoryConfig(src)
                updateConfig({
                  localSeo: JSON.parse(JSON.stringify(full.localSeo)) as LocalSeoCmsFields,
                })
                appToast(`Merged local SEO from "${duplicateSourceKey}". Click Save to persist.`, 'success')
              }}
            >
              Merge local SEO only
            </Button>
          </Stack>

          <Accordion sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Import JSON (merge into current key)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Paste a partial or full marketing object (same shape as the API). Values are merged into{' '}
                  <strong>{effectiveKey}</strong>;                   nested <code>leadMagnet</code>, <code>localityGuide</code>, <code>localSeo</code>, and{' '}
                  <code>technicalSeo</code> are merged field-by-field. Invalid JSON shows an error toast.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={8}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`{\n  "seoTitle": "...",\n  "localityGuide": { "enabled": true, "articleH2": "..." }\n}`}
                  InputProps={{ sx: { fontFamily: 'ui-monospace, monospace', fontSize: 13 } }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(importJsonText) as Record<string, unknown>
                        const patch = mergeCategoryConfig(parsed)
                        setData((prev) => {
                          const base = mergeCategoryConfig(
                            prev[effectiveKey] ?? emptyCategoryMarketingConfig(),
                          )
                          const combined = mergeCategoryConfig({
                            ...base,
                            ...patch,
                            leadMagnet: { ...base.leadMagnet, ...patch.leadMagnet },
                            localityGuide: { ...base.localityGuide, ...patch.localityGuide },
                            localSeo: { ...base.localSeo, ...patch.localSeo },
                            technicalSeo: {
                              ...base.technicalSeo,
                              ...patch.technicalSeo,
                              aggregateRating: {
                                ...base.technicalSeo.aggregateRating,
                                ...patch.technicalSeo?.aggregateRating,
                              },
                            },
                          })
                          return { ...prev, [effectiveKey]: combined }
                        })
                        appToast(`Merged JSON into "${effectiveKey}". Click Save to persist.`, 'success')
                      } catch (e) {
                        appToast(e instanceof Error ? e.message : 'Invalid JSON', 'error')
                      }
                    }}
                  >
                    Apply merge
                  </Button>
                  <Button variant="text" onClick={() => setImportJsonText('')}>
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', overflowX: 'auto' }}>
              <TabList
                onChange={(_, v) => setTab(v as TabKey)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab label="Metadata & SEO" value="metadata" />
                <Tab label="Local SEO" value="localSeo" />
                <Tab label="Hero & intro" value="hero" />
                <Tab label="Service cards" value="cards" />
                <Tab label="Detailed options" value="detailed" />
                <Tab label="Trust & experience" value="trust" />
                <Tab label="Areas & booking" value="areas" />
                <Tab label="Pricing & comparison" value="pricing" />
                <Tab label="FAQs & links" value="faqs" />
                <Tab label="Locality guide (SEO)" value="localityGuide" />
                <Tab label="Closing & advanced" value="closing" />
              </TabList>
            </Box>

            <TabPanel value="metadata" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Alert severity="info">
                  Editorial checklist: one H1 per page (use Main heading on the Hero tab). Use H2 for main sections and H3
                  for subsections; do not skip levels. Put the primary keyword in the H1, intro, and at least two section
                  headings. Use [City] or [Location] in copy when the live site substitutes the user&apos;s area.
                </Alert>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="SEO title"
                        value={config.seoTitle}
                        onChange={(e) => updateConfig({ seoTitle: e.target.value })}
                        placeholder="AC Repair Near Me [City] – Same-Day, Transparent Pricing"
                        inputProps={{ maxLength: SEO_TITLE_HARD_MAX_CHARS + 10 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: charCountColor(
                            config.seoTitle.length,
                            SEO_TITLE_MIN_CHARS,
                            SEO_TITLE_OPTIMAL_MAX_CHARS,
                            SEO_TITLE_HARD_MAX_CHARS,
                          ),
                        }}
                      >
                        {config.seoTitle.length} characters — target {SEO_TITLE_MIN_CHARS}–{SEO_TITLE_OPTIMAL_MAX_CHARS}{' '}
                        (hard max ~{SEO_TITLE_HARD_MAX_CHARS})
                      </Typography>
                      <TextField
                        fullWidth
                        label="Meta description"
                        multiline
                        rows={3}
                        value={config.metaDescription}
                        onChange={(e) => updateConfig({ metaDescription: e.target.value })}
                        inputProps={{ maxLength: META_DESC_HARD_MAX_CHARS + 20 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: charCountColor(
                            config.metaDescription.length,
                            META_DESC_MIN_CHARS,
                            META_DESC_OPTIMAL_MAX_CHARS,
                            META_DESC_HARD_MAX_CHARS,
                          ),
                        }}
                      >
                        {config.metaDescription.length} characters — target {META_DESC_MIN_CHARS}–
                        {META_DESC_OPTIMAL_MAX_CHARS} (hard max {META_DESC_HARD_MAX_CHARS})
                      </Typography>
                      <TextField
                        fullWidth
                        label="URL slug pattern"
                        value={config.urlSlugPattern}
                        onChange={(e) => updateConfig({ urlSlugPattern: e.target.value })}
                        placeholder="services/ac-repair-[city-slug]"
                        helperText="Pattern for the consumer site; actual routing may use params."
                      />
                      <TextField
                        fullWidth
                        label="Primary keyword"
                        value={config.primaryKeyword}
                        onChange={(e) => updateConfig({ primaryKeyword: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Hero trust badge (pill beside H1)"
                        value={(config as any).heroTrustBadge ?? ''}
                        onChange={(e) => updateConfig({ heroTrustBadge: e.target.value } as any)}
                        placeholder="e.g. 30-day warranty · Verified pros"
                        helperText="Shows in the hero as a small trust pill. Supports [City], [Location], [ServiceName]."
                      />
                      <TextField
                        fullWidth
                        label="Hero chip (highlight line)"
                        value={(config as any).heroChip ?? ''}
                        onChange={(e) => updateConfig({ heroChip: e.target.value } as any)}
                        placeholder="e.g. Same-day slots · Transparent pricing"
                        helperText="Short non-spam line under the hero intro. Supports [City], [Location], [ServiceName]."
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Hero proof points (3 cards)
                      </Typography>
                      {(
                        (Array.isArray((config as any).heroProofPoints) ? (config as any).heroProofPoints : ['']) as string[]
                      ).map((line, i) => (
                        <Stack key={`hero-proof-${i}`} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={line}
                            onChange={(e) => {
                              const base = Array.isArray((config as any).heroProofPoints)
                                ? ([...(config as any).heroProofPoints] as string[])
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateConfig({ heroProofPoints: next } as any)
                            }}
                            placeholder="e.g. Background-verified technicians"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              const base = Array.isArray((config as any).heroProofPoints)
                                ? ([...(config as any).heroProofPoints] as string[])
                                : ['']
                              updateConfig({ heroProofPoints: base.filter((_, j) => j !== i) } as any)
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateConfig({
                            heroProofPoints: [
                              ...(((config as any).heroProofPoints ?? []) as string[]),
                              '',
                            ],
                          } as any)
                        }
                      >
                        Add proof point
                      </Button>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
                        If empty, consumer will derive proof points from Trust benefits / Ways / Secondary keywords.
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                        Topic chips (replaces static semantic labels)
                      </Typography>
                      {(
                        (Array.isArray((config as any).topicChips) ? (config as any).topicChips : ['']) as string[]
                      ).map((line, i) => (
                        <Stack key={`topic-chip-${i}`} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={line}
                            onChange={(e) => {
                              const base = Array.isArray((config as any).topicChips)
                                ? ([...(config as any).topicChips] as string[])
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateConfig({ topicChips: next } as any)
                            }}
                            placeholder="e.g. fan installation · switch repair"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              const base = Array.isArray((config as any).topicChips)
                                ? ([...(config as any).topicChips] as string[])
                                : ['']
                              updateConfig({ topicChips: base.filter((_, j) => j !== i) } as any)
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateConfig({
                            topicChips: [
                              ...(((config as any).topicChips ?? []) as string[]),
                              '',
                            ],
                          } as any)
                        }
                      >
                        Add chip
                      </Button>
                      <Typography variant="caption" sx={{ color: 'text.secondary', mt: -1 }}>
                        Consumer uses Topic chips first; if empty, it falls back to Secondary keywords.
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Secondary keywords
                      </Typography>
                      {(config.secondaryKeywords.length ? config.secondaryKeywords : ['']).map((kw, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={kw}
                            onChange={(e) => {
                              const base = config.secondaryKeywords.length ? config.secondaryKeywords : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateConfig({ secondaryKeywords: next })
                            }}
                            placeholder="e.g. gas filling, installation"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateConfig({
                                secondaryKeywords: config.secondaryKeywords.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateConfig({ secondaryKeywords: [...config.secondaryKeywords, ''] })}
                      >
                        Add keyword
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <strong>Technical SEO:</strong> the consumer app should map <code>technicalSeo</code> to{' '}
                  <code>rel=&quot;canonical&quot;</code>, Open Graph / Twitter meta, robots, hreflang{' '}
                  <code>&lt;link&gt;</code>s, and JSON-LD (WebPage, Service, HowTo, BreadcrumbList, Speakable, VideoObject
                  when enabled). Pair <strong>OG image alt</strong> with the absolute image under Local SEO → Social
                  preview.
                </Alert>

                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Canonical, Open Graph &amp; Twitter
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Overrides are optional: when empty, the live site should fall back to SEO title / meta description.
                      Use absolute URLs for canonical and share images.
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Canonical URL"
                        value={config.technicalSeo.canonicalUrl}
                        onChange={(e) => updateTechnicalSeo({ canonicalUrl: e.target.value })}
                        placeholder="https://example.com/services/ac-repair/mumbai"
                        helperText="One preferred URL for this landing; reduces duplicate signals across params or UTM variants."
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          label="Open Graph title (override)"
                          value={config.technicalSeo.ogTitle}
                          onChange={(e) => updateTechnicalSeo({ ogTitle: e.target.value })}
                          placeholder="Same as SEO title if blank"
                        />
                        <TextField
                          fullWidth
                          label="Open Graph type"
                          value={config.technicalSeo.ogType}
                          onChange={(e) => updateTechnicalSeo({ ogType: e.target.value })}
                          placeholder="website"
                          helperText="Usually website or article."
                        />
                      </Stack>
                      <TextField
                        fullWidth
                        label="Open Graph description (override)"
                        multiline
                        rows={2}
                        value={config.technicalSeo.ogDescription}
                        onChange={(e) => updateTechnicalSeo({ ogDescription: e.target.value })}
                        placeholder="Same as meta description if blank"
                      />
                      <TextField
                        fullWidth
                        label="OG / Twitter image alt text"
                        value={config.technicalSeo.ogImageAlt}
                        onChange={(e) => updateTechnicalSeo({ ogImageAlt: e.target.value })}
                        placeholder="Technician servicing an AC outdoor unit in Mumbai – ProFixer"
                        helperText="Accessibility and clearer social/AI context for the share image."
                      />
                      <FormControl fullWidth size="small">
                        <InputLabel>Twitter card type</InputLabel>
                        <Select
                          label="Twitter card type"
                          value={config.technicalSeo.twitterCard || 'summary_large_image'}
                          onChange={(e) =>
                            updateTechnicalSeo({
                              twitterCard: e.target.value as TechnicalSeoCmsFields['twitterCard'],
                            })
                          }
                        >
                          <MenuItem value="summary_large_image">summary_large_image (recommended)</MenuItem>
                          <MenuItem value="summary">summary</MenuItem>
                          <MenuItem value="">Default / unset</MenuItem>
                        </Select>
                      </FormControl>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          label="Twitter site (@handle optional)"
                          value={config.technicalSeo.twitterSite}
                          onChange={(e) => updateTechnicalSeo({ twitterSite: e.target.value.replace(/^@/, '') })}
                          placeholder="yourbrand"
                        />
                        <TextField
                          fullWidth
                          label="Twitter creator (@handle optional)"
                          value={config.technicalSeo.twitterCreator}
                          onChange={(e) => updateTechnicalSeo({ twitterCreator: e.target.value.replace(/^@/, '') })}
                          placeholder="founder_handle"
                        />
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Robots, hreflang &amp; breadcrumbs
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Robots string is passed through to <code>&lt;meta name=&quot;robots&quot;&gt;</code> when set.
                      Hreflang rows power <code>link rel=&quot;alternate&quot;</code> for multilingual / regional
                      variants.
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Robots meta content"
                        value={config.technicalSeo.robotsMeta}
                        onChange={(e) => updateTechnicalSeo({ robotsMeta: e.target.value })}
                        placeholder="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
                        helperText="Use noindex for thin or duplicate landings only. Rich-result-friendly previews often include max-image-preview:large."
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Hreflang alternates
                      </Typography>
                      {(config.technicalSeo.hreflangAlternates.length
                        ? config.technicalSeo.hreflangAlternates
                        : [{ hreflang: '', href: '' }]
                      ).map((row, i) => (
                        <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                          <TextField
                            size="small"
                            label="hreflang"
                            value={row.hreflang}
                            onChange={(e) => {
                              const base = config.technicalSeo.hreflangAlternates.length
                                ? [...config.technicalSeo.hreflangAlternates]
                                : [{ hreflang: '', href: '' }]
                              const next = [...base]
                              next[i] = { ...next[i], hreflang: e.target.value }
                              updateTechnicalSeo({ hreflangAlternates: next })
                            }}
                            placeholder="en-IN"
                            sx={{ minWidth: 120 }}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Absolute URL"
                            value={row.href}
                            onChange={(e) => {
                              const base = config.technicalSeo.hreflangAlternates.length
                                ? [...config.technicalSeo.hreflangAlternates]
                                : [{ hreflang: '', href: '' }]
                              const next = [...base]
                              next[i] = { ...next[i], href: e.target.value }
                              updateTechnicalSeo({ hreflangAlternates: next })
                            }}
                            placeholder="https://…"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateTechnicalSeo({
                                hreflangAlternates: config.technicalSeo.hreflangAlternates.filter((_, j) => j !== i),
                              })
                            }
                            disabled={
                              config.technicalSeo.hreflangAlternates.length === 0 ||
                              (config.technicalSeo.hreflangAlternates.length === 1 &&
                                !config.technicalSeo.hreflangAlternates[0].hreflang &&
                                !config.technicalSeo.hreflangAlternates[0].href)
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateTechnicalSeo({
                            hreflangAlternates: [
                              ...config.technicalSeo.hreflangAlternates,
                              { hreflang: '', href: '' },
                            ],
                          })
                        }
                      >
                        Add hreflang row
                      </Button>

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.technicalSeo.enableBreadcrumbSchema}
                            onChange={(e) => updateTechnicalSeo({ enableBreadcrumbSchema: e.target.checked })}
                          />
                        }
                        label="Emit BreadcrumbList JSON-LD (use manual trail below if paths are not inferable)"
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Breadcrumb trail (name + URL per item)
                      </Typography>
                      {(config.technicalSeo.breadcrumbItems.length
                        ? config.technicalSeo.breadcrumbItems
                        : [{ name: '', url: '' }]
                      ).map((row, i) => (
                        <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                          <TextField
                            size="small"
                            label="Name"
                            value={row.name}
                            onChange={(e) => {
                              const next = [...config.technicalSeo.breadcrumbItems]
                              if (!config.technicalSeo.breadcrumbItems.length) next.push({ name: '', url: '' })
                              next[i] = { ...next[i], name: e.target.value }
                              updateTechnicalSeo({ breadcrumbItems: next })
                            }}
                            placeholder="AC repair"
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="URL"
                            value={row.url}
                            onChange={(e) => {
                              const next = [...config.technicalSeo.breadcrumbItems]
                              if (!config.technicalSeo.breadcrumbItems.length) next.push({ name: '', url: '' })
                              next[i] = { ...next[i], url: e.target.value }
                              updateTechnicalSeo({ breadcrumbItems: next })
                            }}
                            placeholder="https://…"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateTechnicalSeo({
                                breadcrumbItems: config.technicalSeo.breadcrumbItems.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateTechnicalSeo({
                            breadcrumbItems: [...config.technicalSeo.breadcrumbItems, { name: '', url: '' }],
                          })
                        }
                      >
                        Add breadcrumb item
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Structured data, entities &amp; answer engines
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Clear entities and factual summaries help Google and LLM-based search cite you accurately. Only use
                      aggregate rating when it matches visible, genuine reviews.
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Primary schema.org @type hint"
                        value={config.technicalSeo.schemaPrimaryType}
                        onChange={(e) => updateTechnicalSeo({ schemaPrimaryType: e.target.value })}
                        placeholder="ProfessionalService or HomeAndConstructionBusiness"
                        helperText="Consumer maps this to Service / LocalBusiness typing, not a substitute for valid NAP."
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.technicalSeo.enableWebPageSchema}
                            onChange={(e) => updateTechnicalSeo({ enableWebPageSchema: e.target.checked })}
                          />
                        }
                        label="Emit WebPage (or CollectionPage) JSON-LD with name, description, URL"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.technicalSeo.enableServiceOfferSchema}
                            onChange={(e) => updateTechnicalSeo({ enableServiceOfferSchema: e.target.checked })}
                          />
                        }
                        label="Emit Service / hasOfferCatalog style JSON-LD from cards &amp; pricing blocks"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.technicalSeo.enableHowToSchema}
                            onChange={(e) => updateTechnicalSeo({ enableHowToSchema: e.target.checked })}
                          />
                        }
                        label="Emit HowTo JSON-LD from booking steps (Areas & booking tab)"
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Answer-engine summary"
                        value={config.technicalSeo.answerEngineSummary}
                        onChange={(e) => updateTechnicalSeo({ answerEngineSummary: e.target.value })}
                        placeholder="2–4 factual sentences: who you serve, what’s included, pricing stance, same-day policy."
                        helperText="Use for a visible “In brief” block and/or speakable text — avoid keyword stuffing."
                      />
                      <TextField
                        fullWidth
                        label="Content modified date (ISO)"
                        value={config.technicalSeo.contentModifiedDate}
                        onChange={(e) => updateTechnicalSeo({ contentModifiedDate: e.target.value })}
                        placeholder="2026-05-01 or 2026-05-01T12:00:00+05:30"
                        helperText="Optional dateModified for WebPage when you materially refresh this landing."
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        knowsAbout / topic entities
                      </Typography>
                      {(config.technicalSeo.knowsAbout.length ? config.technicalSeo.knowsAbout : ['']).map((topic, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={topic}
                            onChange={(e) => {
                              const base = config.technicalSeo.knowsAbout.length
                                ? [...config.technicalSeo.knowsAbout]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateTechnicalSeo({ knowsAbout: next })
                            }}
                            placeholder="Air conditioning maintenance or https://en.wikipedia.org/wiki/Air_conditioning"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateTechnicalSeo({
                                knowsAbout: config.technicalSeo.knowsAbout.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateTechnicalSeo({ knowsAbout: [...config.technicalSeo.knowsAbout, ''] })}
                      >
                        Add topic
                      </Button>
                      <Typography variant="subtitle2" color="text.secondary">
                        Speakable CSS selectors
                      </Typography>
                      {(config.technicalSeo.speakableSelectors.length
                        ? config.technicalSeo.speakableSelectors
                        : ['']
                      ).map((sel, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={sel}
                            onChange={(e) => {
                              const base = config.technicalSeo.speakableSelectors.length
                                ? [...config.technicalSeo.speakableSelectors]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateTechnicalSeo({ speakableSelectors: next })
                            }}
                            placeholder=".service-answer-summary, article h1"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateTechnicalSeo({
                                speakableSelectors: config.technicalSeo.speakableSelectors.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateTechnicalSeo({
                            speakableSelectors: [...config.technicalSeo.speakableSelectors, ''],
                          })
                        }
                      >
                        Add selector
                      </Button>
                      <Typography variant="subtitle2" color="text.secondary">
                        Aggregate rating (JSON-LD) — honest values only
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          label="Rating value"
                          value={config.technicalSeo.aggregateRating.ratingValue}
                          onChange={(e) =>
                            updateTechnicalSeo({
                              aggregateRating: {
                                ...config.technicalSeo.aggregateRating,
                                ratingValue: e.target.value,
                              },
                            })
                          }
                          placeholder="4.8"
                        />
                        <TextField
                          fullWidth
                          label="Review count"
                          value={config.technicalSeo.aggregateRating.reviewCount}
                          onChange={(e) =>
                            updateTechnicalSeo({
                              aggregateRating: {
                                ...config.technicalSeo.aggregateRating,
                                reviewCount: e.target.value,
                              },
                            })
                          }
                          placeholder="1200"
                        />
                      </Stack>
                      <Typography variant="subtitle2" color="text.secondary">
                        Video URLs (VideoObject / embed URLs)
                      </Typography>
                      {(config.technicalSeo.videoEmbedUrls.length
                        ? config.technicalSeo.videoEmbedUrls
                        : ['']
                      ).map((u, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={u}
                            onChange={(e) => {
                              const base = config.technicalSeo.videoEmbedUrls.length
                                ? [...config.technicalSeo.videoEmbedUrls]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateTechnicalSeo({ videoEmbedUrls: next })
                            }}
                            placeholder="https://www.youtube.com/watch?v=…"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateTechnicalSeo({
                                videoEmbedUrls: config.technicalSeo.videoEmbedUrls.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateTechnicalSeo({ videoEmbedUrls: [...config.technicalSeo.videoEmbedUrls, ''] })
                        }
                      >
                        Add video URL
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="localSeo" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Alert severity="info">
                  <strong>Consumer app contract:</strong> map-pack style data should be read only from this CMS record
                  (<code>localSeo</code> and related fields). Avoid hardcoding service areas, NAP, or GBP URLs in the
                  public bundle so hyperlocal pages stay editable from admin.
                </Alert>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Structured data &amp; profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Toggle LocalBusiness-oriented JSON-LD on the consumer site when you have a consistent NAP and
                      service-area story for this key.
                    </Typography>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.localSeo.enableLocalBusinessSchema}
                            onChange={(e) => updateLocalSeo({ enableLocalBusinessSchema: e.target.checked })}
                          />
                        }
                        label="Enable LocalBusiness / local schema (consumer reads this flag)"
                      />
                      <TextField
                        fullWidth
                        label="Local profile name (schema / visible)"
                        value={config.localSeo.localProfileName}
                        onChange={(e) => updateLocalSeo({ localProfileName: e.target.value })}
                        placeholder="e.g. ProFixer AC Repair – Mira Road"
                        helperText="Optional override for JSON-LD name on this URL; use locality keys for true hyperlocal profiles."
                      />
                      <TextField
                        fullWidth
                        label="Opening hours summary"
                        value={config.localSeo.openingHoursSummary}
                        onChange={(e) => updateLocalSeo({ openingHoursSummary: e.target.value })}
                        placeholder="Mon–Sat 8:00–20:00 · Sun 9:00–18:00"
                      />
                      <TextField
                        fullWidth
                        label="Price range hint"
                        value={config.localSeo.priceRange}
                        onChange={(e) => updateLocalSeo({ priceRange: e.target.value })}
                        placeholder="e.g. ₹₹ or Inexpensive–Moderate"
                      />
                    </Stack>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Service area (local SEO)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Lists and narrative power “near me” relevance and internal linking to locality URLs.
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Service area headline"
                        value={config.localSeo.serviceAreaHeadline}
                        onChange={(e) => updateLocalSeo({ serviceAreaHeadline: e.target.value })}
                        placeholder="Same-day AC repair across [Location] and surrounding suburbs"
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Service area narrative"
                        value={config.localSeo.serviceAreaNarrative}
                        onChange={(e) => updateLocalSeo({ serviceAreaNarrative: e.target.value })}
                        placeholder="Unique paragraph describing coverage, dispatch times, and why you win locally."
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Places served (suburbs / neighborhoods)
                      </Typography>
                      {(config.localSeo.serviceAreaPlaceNames.length
                        ? config.localSeo.serviceAreaPlaceNames
                        : ['']
                      ).map((place, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={place}
                            onChange={(e) => {
                              const base = config.localSeo.serviceAreaPlaceNames.length
                                ? [...config.localSeo.serviceAreaPlaceNames]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateLocalSeo({ serviceAreaPlaceNames: next })
                            }}
                            placeholder="e.g. Mira Road, Bhayandar East"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateLocalSeo({
                                serviceAreaPlaceNames: config.localSeo.serviceAreaPlaceNames.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateLocalSeo({
                            serviceAreaPlaceNames: [...config.localSeo.serviceAreaPlaceNames, ''],
                          })
                        }
                      >
                        Add place
                      </Button>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
                        Local intent keywords
                      </Typography>
                      {(config.localSeo.localIntentKeywords.length
                        ? config.localSeo.localIntentKeywords
                        : ['']
                      ).map((kw, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={kw}
                            onChange={(e) => {
                              const base = config.localSeo.localIntentKeywords.length
                                ? [...config.localSeo.localIntentKeywords]
                                : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateLocalSeo({ localIntentKeywords: next })
                            }}
                            placeholder="e.g. AC repair near me in Mira Road"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateLocalSeo({
                                localIntentKeywords: config.localSeo.localIntentKeywords.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateLocalSeo({
                            localIntentKeywords: [...config.localSeo.localIntentKeywords, ''],
                          })
                        }
                      >
                        Add local keyword
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      NAP &amp; citations
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Keep consistent with Google Business Profile for trust and schema quality.
                    </Typography>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Street address"
                        value={config.localSeo.streetAddress}
                        onChange={(e) => updateLocalSeo({ streetAddress: e.target.value })}
                      />
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          label="City / locality"
                          value={config.localSeo.addressLocality}
                          onChange={(e) => updateLocalSeo({ addressLocality: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          label="Region / state"
                          value={config.localSeo.addressRegion}
                          onChange={(e) => updateLocalSeo({ addressRegion: e.target.value })}
                        />
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          fullWidth
                          label="Postal code"
                          value={config.localSeo.postalCode}
                          onChange={(e) => updateLocalSeo({ postalCode: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          label="Country code (ISO)"
                          value={config.localSeo.addressCountryCode}
                          onChange={(e) => updateLocalSeo({ addressCountryCode: e.target.value.toUpperCase() })}
                          placeholder="IN"
                          inputProps={{ maxLength: 2 }}
                        />
                      </Stack>
                      <TextField
                        fullWidth
                        label="Geo coordinates (optional)"
                        value={config.localSeo.geoLatLng}
                        onChange={(e) => updateLocalSeo({ geoLatLng: e.target.value })}
                        placeholder="19.2856,72.8691"
                        helperText="Latitude,longitude for JSON-LD geo — use the verified storefront or service center."
                      />
                      <TextField
                        fullWidth
                        label="Google Business Profile URL"
                        value={config.localSeo.googleBusinessProfileUrl}
                        onChange={(e) => updateLocalSeo({ googleBusinessProfileUrl: e.target.value })}
                        placeholder="https://maps.google.com/?cid=…"
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        sameAs URLs
                      </Typography>
                      {(config.localSeo.sameAsUrls.length ? config.localSeo.sameAsUrls : ['']).map((url, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="center">
                          <TextField
                            fullWidth
                            size="small"
                            value={url}
                            onChange={(e) => {
                              const base = config.localSeo.sameAsUrls.length ? [...config.localSeo.sameAsUrls] : ['']
                              const next = [...base]
                              next[i] = e.target.value
                              updateLocalSeo({ sameAsUrls: next })
                            }}
                            placeholder="https://"
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateLocalSeo({
                                sameAsUrls: config.localSeo.sameAsUrls.filter((_, j) => j !== i),
                              })
                            }
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateLocalSeo({ sameAsUrls: [...config.localSeo.sameAsUrls, ''] })}
                      >
                        Add URL
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Social preview
                    </Typography>
                    <TextField
                      fullWidth
                      label="Open Graph image override (absolute URL)"
                      value={config.localSeo.ogImageOverride}
                      onChange={(e) => updateLocalSeo({ ogImageOverride: e.target.value })}
                      placeholder="https://…"
                      helperText="Optional; consumer should prefer this for og:image on this service URL when set."
                    />
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="hero" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      H1 and intro (no heading for intro on the live page)
                    </Typography>
                    <TextField
                      fullWidth
                      label="Main heading (H1)"
                      value={config.mainHeading}
                      onChange={(e) => updateConfig({ mainHeading: e.target.value })}
                      placeholder="AC Repair & Service in [City] – Same-Day, Transparent Pricing"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Intro paragraph"
                      multiline
                      rows={5}
                      value={config.intro}
                      onChange={(e) => updateConfig({ intro: e.target.value })}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Intro lead magnet label (optional)"
                        value={config.introLeadMagnetLabel}
                        onChange={(e) => updateConfig({ introLeadMagnetLabel: e.target.value })}
                        placeholder="Free AC health check"
                      />
                      <TextField
                        fullWidth
                        label="Intro lead magnet URL (optional)"
                        value={config.introLeadMagnetUrl}
                        onChange={(e) => updateConfig({ introLeadMagnetUrl: e.target.value })}
                      />
                    </Stack>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
                      <ImageIcon color="action" />
                      <Typography variant="subtitle1" fontWeight={600}>
                        Images
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Hero and secondary images for this industry block.
                    </Typography>
                    <Stack spacing={3}>
                      <ImageUploadField
                        label="Image 1 (Hero / main)"
                        value={
                          config.image1
                            ? [{ id: 'img1', url: config.image1, alt: 'Image 1', isPrimary: true, order: 0 }]
                            : []
                        }
                        onChange={(images: ImageFile[]) => updateConfig({ image1: images[0]?.url })}
                        maxFiles={1}
                        maxSize={5}
                        folder="homeservice"
                        allowFromCloudinary
                        helperText="Recommended: 1200×630px or similar. Max 5MB."
                      />
                      <ImageUploadField
                        label="Image 2 (Secondary)"
                        value={
                          config.image2
                            ? [{ id: 'img2', url: config.image2, alt: 'Image 2', isPrimary: true, order: 0 }]
                            : []
                        }
                        onChange={(images: ImageFile[]) => updateConfig({ image2: images[0]?.url })}
                        maxFiles={1}
                        maxSize={5}
                        folder="homeservice"
                        allowFromCloudinary
                        helperText="Secondary image. Max 5MB."
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="cards" sx={{ px: 0 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Our Services grid (card per row in CMS; site renders as grid)
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => updateConfig({ serviceCards: [...config.serviceCards, emptyServiceCard()] })}
                    >
                      Add card
                    </Button>
                  </Box>
                  {config.serviceCards.map((card, i) => (
                    <Accordion key={i} defaultExpanded sx={{ mb: 1, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">{card.title || `Card ${i + 1}`}</Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateConfig({ serviceCards: config.serviceCards.filter((_, j) => j !== i) })
                          }}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            label="Service name (H3)"
                            value={card.title}
                            onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], title: e.target.value }
                              updateConfig({ serviceCards: next })
                            }}
                          />
                          <TextField
                            fullWidth
                            label="Short description"
                            multiline
                            rows={2}
                            value={card.description}
                            onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], description: e.target.value }
                              updateConfig({ serviceCards: next })
                            }}
                          />
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                              fullWidth
                              label="Price"
                              value={card.price}
                              onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], price: e.target.value }
                                updateConfig({ serviceCards: next })
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Rating"
                              value={card.rating}
                              onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], rating: e.target.value }
                                updateConfig({ serviceCards: next })
                              }}
                            />
                          </Stack>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                              fullWidth
                              label="Duration"
                              value={card.duration}
                              onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], duration: e.target.value }
                                updateConfig({ serviceCards: next })
                              }}
                            />
                            <TextField
                              fullWidth
                              label="Warranty badge"
                              value={card.warranty}
                              onChange={(e) => {
                                const next = [...config.serviceCards]
                                next[i] = { ...next[i], warranty: e.target.value }
                                updateConfig({ serviceCards: next })
                              }}
                            />
                          </Stack>
                          <TextField
                            fullWidth
                            label="Book now URL"
                            value={card.bookUrl}
                            onChange={(e) => {
                              const next = [...config.serviceCards]
                              next[i] = { ...next[i], bookUrl: e.target.value }
                              updateConfig({ serviceCards: next })
                            }}
                          />
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value="detailed" sx={{ px: 0 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Detailed service options (H3 + bullets)
                    </Typography>
                    <Button size="small" startIcon={<AddIcon />} onClick={addServiceType}>
                      Add block
                    </Button>
                  </Box>
                  {config.serviceTypes.map((block, typeIndex) => (
                    <Accordion
                      key={typeIndex}
                      defaultExpanded
                      sx={{ borderRadius: 1, mb: 1, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">{block.title || `Block ${typeIndex + 1}`}</Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeServiceType(typeIndex)
                          }}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={2}>
                          <TextField
                            fullWidth
                            label="Title (H3)"
                            value={block.title}
                            onChange={(e) => updateServiceType(typeIndex, 'title', e.target.value)}
                            placeholder="Foam & power jet AC service"
                          />
                          <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            value={block.description}
                            onChange={(e) => updateServiceType(typeIndex, 'description', e.target.value)}
                          />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              What&apos;s included (bullets)
                            </Typography>
                            {(block.bullets || []).map((b, bi) => (
                              <Stack key={bi} direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={b}
                                  onChange={(e) => updateBullet(typeIndex, bi, e.target.value)}
                                  placeholder="Bullet point"
                                />
                                <IconButton size="small" color="error" onClick={() => removeBullet(typeIndex, bi)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            ))}
                            <Button size="small" onClick={() => addBullet(typeIndex)} sx={{ mt: 1 }}>
                              + Bullet
                            </Button>
                          </Box>
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value="trust" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Why homeowners book ProFixer (bold subheading + paragraph)
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateConfig({ trustBenefits: [...config.trustBenefits, emptyTrustBenefit()] })
                        }
                      >
                        Add benefit
                      </Button>
                    </Box>
                    {config.trustBenefits.map((row, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
                        <Stack spacing={1} flex={1}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Subheading"
                            value={row.heading}
                            onChange={(e) => {
                              const next = [...config.trustBenefits]
                              next[i] = { ...next[i], heading: e.target.value }
                              updateConfig({ trustBenefits: next })
                            }}
                          />
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Paragraph"
                            value={row.body}
                            onChange={(e) => {
                              const next = [...config.trustBenefits]
                              next[i] = { ...next[i], body: e.target.value }
                              updateConfig({ trustBenefits: next })
                            }}
                          />
                        </Stack>
                        <IconButton
                          color="error"
                          onClick={() =>
                            updateConfig({ trustBenefits: config.trustBenefits.filter((_, j) => j !== i) })
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Legacy &quot;4 ways&quot; block (optional; use if the site still reads this section)
                    </Typography>
                    <TextField
                      fullWidth
                      label="Ways heading"
                      value={config.waysHeading}
                      onChange={(e) => updateConfig({ waysHeading: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    {(config.waysBullets || []).map((b, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={b}
                          onChange={(e) => {
                            const next = [...(config.waysBullets || [])]
                            next[i] = e.target.value
                            updateConfig({ waysBullets: next })
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            updateConfig({ waysBullets: (config.waysBullets || []).filter((_, j) => j !== i) })
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => updateConfig({ waysBullets: [...(config.waysBullets || []), ''] })}
                    >
                      Add way
                    </Button>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      What&apos;s included in our service experience
                    </Typography>
                    {(config.experienceIncluded.length ? config.experienceIncluded : ['']).map((line, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={line}
                          onChange={(e) => updateStringList('experienceIncluded', i, e.target.value)}
                          placeholder="e.g. Skilled technicians, clear approvals"
                        />
                        <IconButton size="small" color="error" onClick={() => removeStringListItem('experienceIncluded', i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={() => addStringListItem('experienceIncluded')}>
                      Add line
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="areas" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Areas we serve
                    </Typography>
                    <TextField
                      fullWidth
                      label="Optional intro copy"
                      multiline
                      rows={2}
                      value={config.areasCopy}
                      onChange={(e) => updateConfig({ areasCopy: e.target.value })}
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Localities (one per line)
                    </Typography>
                    {(config.areasList.length ? config.areasList : ['']).map((line, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={line}
                          onChange={(e) => updateStringList('areasList', i, e.target.value)}
                        />
                        <IconButton size="small" color="error" onClick={() => removeStringListItem('areasList', i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={() => addStringListItem('areasList')}>
                      Add locality
                    </Button>
                    <TextField
                      fullWidth
                      label="CTA after areas (e.g. check availability)"
                      value={config.areasCta}
                      onChange={(e) => updateConfig({ areasCta: e.target.value })}
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        How to book (numbered steps)
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateConfig({ bookingSteps: [...config.bookingSteps, emptyBookingStep()] })}
                      >
                        Add step
                      </Button>
                    </Box>
                    {config.bookingSteps.map((step, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
                        <Stack spacing={1} flex={1}>
                          <TextField
                            size="small"
                            label="Step number (optional)"
                            value={step.stepNumber}
                            onChange={(e) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], stepNumber: e.target.value }
                              updateConfig({ bookingSteps: next })
                            }}
                            sx={{ maxWidth: 120 }}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Title"
                            value={step.title}
                            onChange={(e) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], title: e.target.value }
                              updateConfig({ bookingSteps: next })
                            }}
                          />
                          <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Description"
                            value={step.description}
                            onChange={(e) => {
                              const next = [...config.bookingSteps]
                              next[i] = { ...next[i], description: e.target.value }
                              updateConfig({ bookingSteps: next })
                            }}
                          />
                        </Stack>
                        <IconButton
                          color="error"
                          onClick={() =>
                            updateConfig({ bookingSteps: config.bookingSteps.filter((_, j) => j !== i) })
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={config.contactPhone}
                        onChange={(e) => updateConfig({ contactPhone: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="WhatsApp"
                        value={config.contactWhatsapp}
                        onChange={(e) => updateConfig({ contactWhatsapp: e.target.value })}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="pricing" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Alert severity="info">
                  <Typography variant="body2" component="span">
                    <strong>Service charges</strong> for this industry are maintained in{' '}
                    <Link to="/cms/category-marketing?tab=rate-card">Rate card</Link> (same catalog category key). Use spare parts and
                    included/excluded lists here so the consumer page can show a full pricing section without duplicating
                    labour/service rows.
                  </Typography>
                </Alert>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Spare parts (item + price range)
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateConfig({ spareParts: [...config.spareParts, emptySparePart()] })}
                      >
                        Add row
                      </Button>
                    </Box>
                    {config.spareParts.map((row, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Item"
                          value={row.name}
                          onChange={(e) => {
                            const next = [...config.spareParts]
                            next[i] = { ...next[i], name: e.target.value }
                            updateConfig({ spareParts: next })
                          }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Price range"
                          value={row.priceRange}
                          onChange={(e) => {
                            const next = [...config.spareParts]
                            next[i] = { ...next[i], priceRange: e.target.value }
                            updateConfig({ spareParts: next })
                          }}
                        />
                        <IconButton color="error" onClick={() => updateConfig({ spareParts: config.spareParts.filter((_, j) => j !== i) })}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      What&apos;s included vs not included (pricing section)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Included
                    </Typography>
                    {(config.pricingIncluded.length ? config.pricingIncluded : ['']).map((line, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={line}
                          onChange={(e) => updateStringList('pricingIncluded', i, e.target.value)}
                        />
                        <IconButton size="small" color="error" onClick={() => removeStringListItem('pricingIncluded', i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={() => addStringListItem('pricingIncluded')} sx={{ mb: 2 }}>
                      Add included
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Not included
                    </Typography>
                    {(config.pricingExcluded.length ? config.pricingExcluded : ['']).map((line, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          value={line}
                          onChange={(e) => updateStringList('pricingExcluded', i, e.target.value)}
                        />
                        <IconButton size="small" color="error" onClick={() => removeStringListItem('pricingExcluded', i)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={() => addStringListItem('pricingExcluded')}>
                      Add excluded
                    </Button>
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        ProFixer vs local providers
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateConfig({ comparisonRows: [...config.comparisonRows, emptyComparisonRow()] })
                        }
                      >
                        Add row
                      </Button>
                    </Box>
                    {config.comparisonRows.map((row, i) => (
                      <Stack key={i} spacing={1} sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <Stack spacing={1} flex={1}>
                            <TextField
                              size="small"
                              fullWidth
                              label="Dimension"
                              value={row.label}
                              onChange={(e) => {
                                const next = [...config.comparisonRows]
                                next[i] = { ...next[i], label: e.target.value }
                                updateConfig({ comparisonRows: next })
                              }}
                            />
                            <TextField
                              size="small"
                              fullWidth
                              label="ProFixer"
                              value={row.profixer}
                              onChange={(e) => {
                                const next = [...config.comparisonRows]
                                next[i] = { ...next[i], profixer: e.target.value }
                                updateConfig({ comparisonRows: next })
                              }}
                            />
                            <TextField
                              size="small"
                              fullWidth
                              label="Typical local"
                              value={row.others}
                              onChange={(e) => {
                                const next = [...config.comparisonRows]
                                next[i] = { ...next[i], others: e.target.value }
                                updateConfig({ comparisonRows: next })
                              }}
                            />
                          </Stack>
                          <IconButton
                            color="error"
                            onClick={() =>
                              updateConfig({ comparisonRows: config.comparisonRows.filter((_, j) => j !== i) })
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="faqs" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        FAQs (H3 + answer — industry-specific)
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateConfig({ faqs: [...config.faqs, emptyFaq()] })}
                      >
                        Add FAQ
                      </Button>
                    </Box>
                    {config.faqs.map((faq, i) => (
                      <Accordion key={i} sx={{ mb: 1, '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="subtitle2">{faq.question || `FAQ ${i + 1}`}</Typography>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateConfig({ faqs: config.faqs.filter((_, j) => j !== i) })
                            }}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={2}>
                            <TextField
                              fullWidth
                              label="Question"
                              value={faq.question}
                              onChange={(e) => {
                                const next = [...config.faqs]
                                next[i] = { ...next[i], question: e.target.value }
                                updateConfig({ faqs: next })
                              }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              label="Answer"
                              value={faq.answer}
                              onChange={(e) => {
                                const next = [...config.faqs]
                                next[i] = { ...next[i], answer: e.target.value }
                                updateConfig({ faqs: next })
                              }}
                            />
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Related resources (internal links)
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateConfig({ relatedLinks: [...config.relatedLinks, emptyRelatedLink()] })}
                      >
                        Add link
                      </Button>
                    </Box>
                    {config.relatedLinks.map((link, i) => (
                      <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                          size="small"
                          label="Label"
                          value={link.label}
                          onChange={(e) => {
                            const next = [...config.relatedLinks]
                            next[i] = { ...next[i], label: e.target.value }
                            updateConfig({ relatedLinks: next })
                          }}
                          sx={{ minWidth: 160 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="URL"
                          value={link.url}
                          onChange={(e) => {
                            const next = [...config.relatedLinks]
                            next[i] = { ...next[i], url: e.target.value }
                            updateConfig({ relatedLinks: next })
                          }}
                        />
                        <IconButton color="error" onClick={() => updateConfig({ relatedLinks: config.relatedLinks.filter((_, j) => j !== i) })}>
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    ))}
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="localityGuide" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Alert severity="info">
                  For hyperlocal URLs (e.g. <code>/services/electrician/mira-bhayandar</code>), set Industry to{' '}
                  <strong>Electrical</strong> and Locality slug to <strong>mira-bhayandar</strong>. The CMS key becomes{' '}
                  <code>electric__mira-bhayandar</code>. Fill Metadata + FAQs, then enable the article here.
                </Alert>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.localityGuide.enabled}
                            onChange={(e) => updateLocalityGuide({ enabled: e.target.checked })}
                          />
                        }
                        label="Enable CMS locality article (replaces auto-generated guide body)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.localityGuide.expandDetailsByDefault}
                            onChange={(e) => updateLocalityGuide({ expandDetailsByDefault: e.target.checked })}
                          />
                        }
                        label="Expand long-form sections by default (better for crawlers)"
                      />
                      <TextField
                        fullWidth
                        label="Article H2 (section under the catalogue)"
                        value={config.localityGuide.articleH2}
                        onChange={(e) => updateLocalityGuide({ articleH2: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Summary lead (visible under H2)"
                        value={config.localityGuide.summaryLead}
                        onChange={(e) => updateLocalityGuide({ summaryLead: e.target.value })}
                      />
                      <Typography variant="subtitle2" color="text.secondary">
                        Lead paragraphs (main article body)
                      </Typography>
                      {(config.localityGuide.leadParagraphs.length
                        ? config.localityGuide.leadParagraphs
                        : ['']
                      ).map((para, i) => (
                        <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                          <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            label={`Paragraph ${i + 1}`}
                            value={para}
                            onChange={(e) => {
                              const base = config.localityGuide.leadParagraphs.length
                                ? [...config.localityGuide.leadParagraphs]
                                : ['']
                              base[i] = e.target.value
                              updateLocalityGuide({ leadParagraphs: base })
                            }}
                          />
                          <IconButton
                            color="error"
                            aria-label="Remove paragraph"
                            onClick={() => {
                              const base = [...config.localityGuide.leadParagraphs]
                              base.splice(i, 1)
                              updateLocalityGuide({ leadParagraphs: base.length ? base : [''] })
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateLocalityGuide({
                            leadParagraphs: [...config.localityGuide.leadParagraphs, ''],
                          })
                        }
                      >
                        Add lead paragraph
                      </Button>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>
                        Depth sections (optional H2 blocks)
                      </Typography>
                      {config.localityGuide.sections.map((sec, si) => (
                        <Accordion key={si} defaultExpanded={si === 0}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">
                              Section {si + 1}: {sec.h2.trim() || '(untitled)'}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={2}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Section H2"
                                value={sec.h2}
                                onChange={(e) => {
                                  const next = [...config.localityGuide.sections]
                                  next[si] = { ...next[si], h2: e.target.value }
                                  updateLocalityGuide({ sections: next })
                                }}
                              />
                              {(sec.paragraphs.length ? sec.paragraphs : ['']).map((p, pi) => (
                                <TextField
                                  key={pi}
                                  fullWidth
                                  multiline
                                  minRows={2}
                                  size="small"
                                  label={`Paragraph ${pi + 1}`}
                                  value={p}
                                  onChange={(e) => {
                                    const next = [...config.localityGuide.sections]
                                    const paras = [...(next[si].paragraphs.length ? next[si].paragraphs : [''])]
                                    paras[pi] = e.target.value
                                    next[si] = { ...next[si], paragraphs: paras }
                                    updateLocalityGuide({ sections: next })
                                  }}
                                />
                              ))}
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    const next = [...config.localityGuide.sections]
                                    next[si] = {
                                      ...next[si],
                                      paragraphs: [...next[si].paragraphs, ''],
                                    }
                                    updateLocalityGuide({ sections: next })
                                  }}
                                >
                                  Add paragraph in section
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    const next = config.localityGuide.sections.filter((_, j) => j !== si)
                                    updateLocalityGuide({ sections: next.length ? next : [emptyLocalityGuideSection()] })
                                  }}
                                >
                                  Remove section
                                </Button>
                              </Stack>
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() =>
                          updateLocalityGuide({
                            sections: [...config.localityGuide.sections, emptyLocalityGuideSection()],
                          })
                        }
                      >
                        Add section
                      </Button>
                      <Typography variant="subtitle2" color="text.secondary">
                        Key takeaways (bullets)
                      </Typography>
                      {(config.localityGuide.takeaways.length ? config.localityGuide.takeaways : ['']).map((t, i) => (
                        <TextField
                          key={i}
                          fullWidth
                          size="small"
                          value={t}
                          onChange={(e) => {
                            const base = config.localityGuide.takeaways.length
                              ? [...config.localityGuide.takeaways]
                              : ['']
                            base[i] = e.target.value
                            updateLocalityGuide({ takeaways: base })
                          }}
                        />
                      ))}
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => updateLocalityGuide({ takeaways: [...config.localityGuide.takeaways, ''] })}
                      >
                        Add takeaway
                      </Button>
                      <TextField
                        fullWidth
                        label="JSON-LD primary name (optional)"
                        value={config.localityGuide.jsonLdBrandServiceName}
                        onChange={(e) => updateLocalityGuide({ jsonLdBrandServiceName: e.target.value })}
                        helperText="Overrides Service/LocalBusiness name in structured data when set."
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.localityGuide.useFaqsForSchema}
                            onChange={(e) => updateLocalityGuide({ useFaqsForSchema: e.target.checked })}
                          />
                        }
                        label="Emit FAQPage schema from the FAQs tab on this record"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.localityGuide.showInboundLinkStrip}
                            onChange={(e) => updateLocalityGuide({ showInboundLinkStrip: e.target.checked })}
                          />
                        }
                        label="Show Related links (FAQs tab → related links) above the guide"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={config.localityGuide.showBookingCtaStrip}
                            onChange={(e) => updateLocalityGuide({ showBookingCtaStrip: e.target.checked })}
                          />
                        }
                        label="Show call + book CTA strip"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>

            <TabPanel value="closing" sx={{ px: 0 }}>
              <Stack spacing={2}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Closing content
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="Closing paragraph(s)"
                      value={config.closingParagraph}
                      onChange={(e) => updateConfig({ closingParagraph: e.target.value })}
                    />
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      Lead magnet (footer / aside — URL often configured on consumer app)
                    </Typography>
                    <TextField
                      fullWidth
                      label="Headline"
                      value={config.leadMagnet.headline}
                      onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, headline: e.target.value } })
                      }
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description"
                      value={config.leadMagnet.description}
                      onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, description: e.target.value } })
                      }
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="CTA label"
                      value={config.leadMagnet.ctaLabel}
                      onChange={(e) =>
                        updateConfig({ leadMagnet: { ...config.leadMagnet, ctaLabel: e.target.value } })
                      }
                    />
                  </CardContent>
                </Card>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                      JSON-LD (optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Prefer generating FAQPage / LocalBusiness on the consumer site from structured fields. Use this
                      only if you need a fixed snippet; validate JSON before publishing.
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={config.jsonLdExtra}
                      onChange={(e) => updateConfig({ jsonLdExtra: e.target.value })}
                      placeholder='{"@context":"https://schema.org",...}'
                    />
                  </CardContent>
                </Card>
              </Stack>
            </TabPanel>
          </TabContext>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} /> : <CampaignIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            Save all
          </Button>
        </Stack>
      )}
    </Box>
  )
}
