import React from 'react'
import { Alert, Box, Button } from '@mui/material'

type Props = {
  loading: boolean
  error: string | null
  onRetry: () => void
  isEmpty: boolean
  empty: React.ReactNode
  skeleton: React.ReactNode
  children: React.ReactNode
}

export function CrmListShell({ loading, error, onRetry, isEmpty, empty, skeleton, children }: Props) {
  if (loading) return <>{skeleton}</>
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    )
  }
  if (isEmpty) return <Box>{empty}</Box>
  return <>{children}</>
}
