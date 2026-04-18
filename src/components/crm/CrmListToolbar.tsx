import React from 'react'
import { InputAdornment, Stack, TextField } from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'

type Props = {
  searchPlaceholder?: string
  qInput: string
  onQChange: (value: string) => void
  children?: React.ReactNode
}

export function CrmListToolbar({
  searchPlaceholder = 'Search…',
  qInput,
  onQChange,
  children,
}: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{ mb: 2 }}
      useFlexGap
    >
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={qInput}
        onChange={(e) => onQChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ minWidth: { xs: '100%', sm: 260 }, flex: { sm: '0 1 320px' } }}
      />
      {children}
    </Stack>
  )
}
