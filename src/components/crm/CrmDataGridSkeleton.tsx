import React from 'react'
import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material'

export function CrmDataGridSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={40} />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={36} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

export function CrmPipelineSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Box key={i} sx={{ minWidth: 260, flex: '0 0 auto' }}>
          <Skeleton variant="rounded" height={420} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
    </Box>
  )
}
