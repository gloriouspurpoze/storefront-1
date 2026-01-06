import React from 'react'
import { Button, ButtonProps, CircularProgress } from '@mui/material'

interface LoadingButtonProps extends Omit<ButtonProps, 'disabled'> {
  loading?: boolean
  loadingText?: string
  disabled?: boolean
}

export function LoadingButton({ 
  loading = false, 
  loadingText = 'Loading...', 
  disabled = false,
  children,
  ...props 
}: LoadingButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : props.startIcon}
    >
      {loading ? loadingText : children}
    </Button>
  )
}
