import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Button, Typography, Paper } from '@mui/material'
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Catches JavaScript errors in the component tree and displays a fallback UI.
 * Industry standard for production apps to avoid blank screen on render errors.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo)
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'grey.50',
          }}
        >
          <Paper elevation={2} sx={{ maxWidth: 480, p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="error">
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {process.env.NODE_ENV === 'development'
                ? this.state.error.message
                : 'An unexpected error occurred. Please try again.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleRetry}>
                Try again
              </Button>
              <Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleGoHome}>
                Go to dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      )
    }
    return this.props.children
  }
}
