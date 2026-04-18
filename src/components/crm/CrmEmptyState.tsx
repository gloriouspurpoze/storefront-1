import React from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Inbox as InboxIcon } from '@mui/icons-material'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function CrmEmptyState({ title, description, actionLabel, onAction }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        textAlign: 'center',
        minHeight: 280,
      }}
    >
      <InboxIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mb: 2 }}>
          {description}
        </Typography>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  )
}
