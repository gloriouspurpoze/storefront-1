import React from 'react'
import { Link } from 'react-router-dom'
import { ScanLine, ArrowRight } from 'lucide-react'
import { useVerticalPack } from '../../hooks/useVerticalPack'
import { HomeServicePOSPage } from './HomeServicePOSPage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'

/** Routes POS by tenant vertical — home services and salon share the booking API; restaurant uses reservations. */
export function PosEntryPage() {
  const { verticalKey } = useVerticalPack()

  if (verticalKey === 'salon') {
    return <HomeServicePOSPage variant="salon" />
  }

  if (verticalKey === 'restaurant') {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-primary" aria-hidden />
              <CardTitle>POS not configured for restaurant</CardTitle>
            </div>
            <CardDescription>
              Table-service POS (covers, courses, split bills) is not bundled with this vertical yet. Use
              Reservations and the FOH queue for walk-ins, or switch the tenant to home services for field-job
              POS at <code className="rounded bg-muted px-1 text-xs">/operations/pos</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="default" size="sm">
              <Link to="/bookings">
                Open reservations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings/platform-tenants">Tenant vertical settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <HomeServicePOSPage variant="home_services" />
}

export default PosEntryPage
