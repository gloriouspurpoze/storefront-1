import React, { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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
} from '@mui/material'
import Grid from '@mui/material/GridLegacy'
import { Palette as PaletteIcon } from '@mui/icons-material'
import { PageHeader } from '../../components/common/PageHeader'
import { publicSiteThemeService } from '../../services/api/publicSiteTheme.service'
import {
  DEFAULT_PUBLIC_SITE_THEME,
  type PublicSiteThemeTokens,
  type SiteRadiusPreset,
  type SiteSpacingDensity,
} from '../../types/publicSiteTheme.types'

const FONT_PRESETS = [
  { label: 'Inter + DM Sans', heading: '"DM Sans", system-ui, sans-serif', body: '"Inter", system-ui, sans-serif' },
  { label: 'System UI', heading: 'system-ui, sans-serif', body: 'system-ui, sans-serif' },
  { label: 'Georgia editorial', heading: 'Georgia, serif', body: 'system-ui, sans-serif' },
]

const THEME_PRESETS: { name: string; patch: Partial<PublicSiteThemeTokens> }[] = [
  {
    name: 'ProFixer default',
    patch: {},
  },
  {
    name: 'Emerald marketplace',
    patch: {
      primaryColor: '#047857',
      accentColor: '#0f766e',
      backgroundColor: '#f8fafc',
      surfaceColor: '#ffffff',
    },
  },
  {
    name: 'Bold contrast',
    patch: {
      primaryColor: '#b45309',
      accentColor: '#ea580c',
      backgroundColor: '#0f172a',
      surfaceColor: '#1e293b',
      textColor: '#f8fafc',
      mutedTextColor: '#94a3b8',
    },
  },
]

export default function SiteAppearancePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [source, setSource] = useState<'api' | 'local' | 'default'>('default')
  const [theme, setTheme] = useState<PublicSiteThemeTokens>({ ...DEFAULT_PUBLIC_SITE_THEME })
  const [saveHint, setSaveHint] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const r = await publicSiteThemeService.getTheme()
      if (!cancelled) {
        setTheme(r.theme)
        setSource(r.source)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const applyPreset = (patch: Partial<PublicSiteThemeTokens>) => {
    setTheme({ ...DEFAULT_PUBLIC_SITE_THEME, ...patch })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveHint(null)
    const res = await publicSiteThemeService.saveTheme(theme)
    setSaving(false)
    if (res.ok) {
      setSource(res.source)
      setSaveHint(
        res.source === 'api'
          ? 'Saved to API.'
          : res.error
            ? `Saved locally (${res.error}).`
            : 'Saved locally (API route optional).',
      )
    } else {
      setSaveHint(res.error || 'Save failed.')
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <PageHeader
        title="Site appearance"
        subtitle="Public-site design tokens (colors, type, radius, spacing). Storefront should read these from your API when available."
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" size="small" component={RouterLink} to="/cms/homepage">
              Homepage sections
            </Button>
            <Button variant="contained" size="small" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
              Save tokens
            </Button>
          </Stack>
        }
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Alert severity="info" sx={{ mb: 3 }}>
            Backend endpoint <strong>/cms/public-site-theme</strong> is optional. Without it, tokens persist per tenant in
            this browser so teams can prototype; wire the same JSON to profixer.in or your SSR theme injector.
          </Alert>

          {saveHint && (
            <Alert severity={saveHint.includes('failed') ? 'error' : 'success'} sx={{ mb: 2 }}>
              {saveHint}
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Loaded from: <strong>{source}</strong>
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">Quick presets</Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {THEME_PRESETS.map((p) => (
                  <Button key={p.name} size="small" variant="outlined" onClick={() => applyPreset(p.patch)}>
                    {p.name}
                  </Button>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tokens
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Primary"
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme((t) => ({ ...t, primaryColor: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Accent"
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme((t) => ({ ...t, accentColor: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Background"
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme((t) => ({ ...t, backgroundColor: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Surface"
                    type="color"
                    value={theme.surfaceColor}
                    onChange={(e) => setTheme((t) => ({ ...t, surfaceColor: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Text"
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => setTheme((t) => ({ ...t, textColor: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Muted text"
                    type="color"
                    value={theme.mutedTextColor}
                    onChange={(e) => setTheme((t) => ({ ...t, mutedTextColor: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Typography presets
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {FONT_PRESETS.map((fp) => (
                      <Button
                        key={fp.label}
                        size="small"
                        variant="outlined"
                        onClick={() => setTheme((t) => ({ ...t, fontHeading: fp.heading, fontBody: fp.body }))}
                      >
                        {fp.label}
                      </Button>
                    ))}
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Font stack — headings"
                        value={theme.fontHeading}
                        onChange={(e) => setTheme((t) => ({ ...t, fontHeading: e.target.value }))}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Font stack — body"
                        value={theme.fontBody}
                        onChange={(e) => setTheme((t) => ({ ...t, fontBody: e.target.value }))}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="radius-label">Corner radius</InputLabel>
                    <Select
                      labelId="radius-label"
                      label="Corner radius"
                      value={theme.borderRadius}
                      onChange={(e) =>
                        setTheme((t) => ({ ...t, borderRadius: e.target.value as SiteRadiusPreset }))
                      }
                    >
                      <MenuItem value="sm">Small</MenuItem>
                      <MenuItem value="md">Medium</MenuItem>
                      <MenuItem value="lg">Large</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="spacing-label">Section spacing</InputLabel>
                    <Select
                      labelId="spacing-label"
                      label="Section spacing"
                      value={theme.sectionSpacing}
                      onChange={(e) =>
                        setTheme((t) => ({
                          ...t,
                          sectionSpacing: e.target.value as SiteSpacingDensity,
                        }))
                      }
                    >
                      <MenuItem value="compact">Compact</MenuItem>
                      <MenuItem value="comfortable">Comfortable</MenuItem>
                      <MenuItem value="spacious">Spacious</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Live preview (approximate)
                  </Typography>
                  <Box
                    sx={{
                      borderRadius:
                        theme.borderRadius === 'sm' ? 1 : theme.borderRadius === 'lg' ? 3 : 2,
                      p:
                        theme.sectionSpacing === 'compact'
                          ? 2
                          : theme.sectionSpacing === 'spacious'
                            ? 5
                            : 3,
                      bgcolor: theme.surfaceColor,
                      color: theme.textColor,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.accentColor}18)`,
                    }}
                  >
                    <Typography sx={{ fontFamily: theme.fontHeading, fontWeight: 700, fontSize: '1.25rem' }}>
                      Section headline
                    </Typography>
                    <Typography sx={{ fontFamily: theme.fontBody, color: theme.mutedTextColor, mt: 1 }}>
                      Body copy uses your muted and surface tokens.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}
