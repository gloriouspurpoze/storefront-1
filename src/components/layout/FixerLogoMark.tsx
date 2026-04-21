import React from 'react'
import { Box, SxProps, Theme } from '@mui/material'

interface FixerLogoMarkProps {
  size?: number
  sx?: SxProps<Theme>
}

/** Compact wordmark + mark for sidebar and auth — SVG scales cleanly at any density */
export function FixerLogoMark({ size = 44, sx }: FixerLogoMarkProps) {
  return (
    <Box
      component="svg"
      viewBox="0 0 44 44"
      role="img"
      aria-label="Fixer"
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 2,
        ...sx,
      }}
    >
      <defs>
        <linearGradient id="fixerLogoFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="44" height="44" rx="10" fill="url(#fixerLogoFill)" />
      {/* Letter F monogram */}
      <path
        fill="#fff"
        d="M14 12h14.5v3.25H17.75v4.1h9v3.25h-9V32H14V12z"
      />
    </Box>
  )
}
