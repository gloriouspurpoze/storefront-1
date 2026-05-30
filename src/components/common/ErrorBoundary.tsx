import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Home, RefreshCw } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'
import { cn } from '../../lib/utils'

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
        <div
          // DESIGN.md: cloud as alternating band surface; canvas in dark mode falls back to ink
          className={cn(
            'flex min-h-screen items-center justify-center',
            'bg-cloud p-3 dark:bg-ink-deep',
          )}
        >
          <Card className="max-w-md text-center shadow-floating">
            <CardContent className="p-8">
              <h1 className="mb-2 text-xl font-semibold text-destructive">Something went wrong</h1>
              <p className="mb-6 text-sm text-muted-foreground">
                {process.env.NODE_ENV === 'development'
                  ? this.state.error.message
                  : 'An unexpected error occurred. Please try again.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  onClick={this.handleRetry}
                  leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
                >
                  Try again
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={this.handleGoHome}
                  leftIcon={<Home className="h-4 w-4" aria-hidden />}
                >
                  Go to dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}
