import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Typography,
  Box,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { Search as SearchIcon, SubdirectoryArrowRight as JumpIcon } from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { QUICK_NAV_ITEMS, type QuickNavGroup } from '../../config/app-routes'
import { useCommandPalette } from '../../contexts/command-palette-context'

const GROUP_ORDER: QuickNavGroup[] = [
  'Overview',
  'CRM',
  'Catalog',
  'E-commerce',
  'Bazaar',
  'Operations',
  'Content & marketing',
  'Users & communication',
  'System',
  'Provider',
  'Professional',
]

function normalize(s: string) {
  return s.toLowerCase().trim()
}

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const jumpHint =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
      ? '⌘K'
      : 'Ctrl+K'

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const filtered = useMemo(() => {
    const q = normalize(query)
    if (!q) return QUICK_NAV_ITEMS
    return QUICK_NAV_ITEMS.filter((item) => {
      if (normalize(item.label).includes(q) || normalize(item.path).includes(q)) return true
      if (item.keywords && normalize(item.keywords).includes(q)) return true
      if (normalize(item.group).includes(q)) return true
      return false
    })
  }, [query])

  const grouped = useMemo(() => {
    const map = new Map<QuickNavGroup, typeof filtered>()
    for (const item of filtered) {
      const arr = map.get(item.group) || []
      arr.push(item)
      map.set(item.group, arr)
    }
    return GROUP_ORDER.filter((g) => map.get(g)?.length).map((g) => ({
      group: g,
      items: map.get(g)!,
    }))
  }, [filtered])

  const handleSelect = (path: string) => {
    if (path !== location.pathname) navigate(path)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-labelledby="command-palette-title"
      PaperProps={{
        sx: {
          mt: { xs: 0, sm: 8 },
          borderRadius: { xs: 0, sm: 2 },
        },
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 0 }} id="command-palette-title">
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Quick navigation
        </Typography>
        <TextField
          fullWidth
          autoFocus
          placeholder="Jump to page…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Chip
                  size="small"
                  label={jumpHint}
                  variant="outlined"
                  sx={{ height: 22, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }}
                />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <DialogContent sx={{ pt: 1, pb: 2, maxHeight: { xs: '70vh', sm: 420 } }}>
        {grouped.length === 0 ? (
          <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
            No matching pages. Try a different search.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ py: 0 }}>
            {grouped.map(({ group, items }) => (
              <Box key={group}>
                <ListSubheader
                  sx={{
                    py: 1,
                    lineHeight: 1.2,
                    typography: 'caption',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'text.secondary',
                  }}
                >
                  {group}
                </ListSubheader>
                {items.map((item) => (
                  <ListItemButton
                    key={`${item.group}-${item.path}`}
                    onClick={() => handleSelect(item.path)}
                    selected={location.pathname === item.path}
                    sx={{ borderRadius: 1, mb: 0.25 }}
                  >
                    <JumpIcon sx={{ mr: 1.5, fontSize: 18, color: 'text.secondary', opacity: 0.8 }} />
                    <ListItemText
                      primary={item.label}
                      secondary={item.path}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption', sx: { fontFamily: 'monospace' } }}
                    />
                  </ListItemButton>
                ))}
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}
