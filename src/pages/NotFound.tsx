import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, ChevronLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

/**
 * 404 Not Found page for unmatched routes.
 * Industry standard: always have a catch-all route so users see a clear message instead of a blank layout.
 */
export function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border text-center">
        <CardContent className="p-6">
          <h1 className="mb-1 text-3xl font-bold text-muted-foreground">404</h1>
          <h2 className="mb-1 text-lg font-semibold">Page not found</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="default" onClick={() => navigate(-1)} className="gap-1.5">
              <ChevronLeft className="h-4 w-4" />
              Go back
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="gap-1.5">
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound
