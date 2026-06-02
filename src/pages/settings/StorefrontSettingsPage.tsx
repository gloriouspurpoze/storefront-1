import React from 'react'
import { Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { StorefrontStudioPanel } from '../../components/storefront/StorefrontStudioPanel'
import { useAppSelector } from '../../store/hooks'

/**
 * Tenant-admin self-serve storefront customization (no feature-flag locks UI).
 */
export function StorefrontSettingsPage() {
  const user = useAppSelector((s) => s.auth.user)
  const tenantId = user?.tenant?.id ?? ''
  const tenantSlug = user?.tenant?.slug ?? 'tenant'

  if (!tenantId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Your account is not linked to an organization. Contact your platform operator.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <PageHeader
        title="Storefront"
        subtitle="Customize your public website — branding, SEO, homepage layout, and themes."
        icon={<Sparkles className="h-8 w-8" />}
      />
      <StorefrontStudioPanel tenantId={tenantId} tenantSlug={tenantSlug} isSuperAdmin={false} />
    </div>
  )
}
