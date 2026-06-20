import { Suspense } from 'react'
import { LoginClient } from '@/components/account/LoginClient'
import { loadTenantFromRequest } from '@/lib/load-tenant'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Sign in',
    description: tenant ? `Sign in to ${tenant.name}` : 'Sign in',
  }
}

export default function AccountLoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
      <LoginClient />
    </Suspense>
  )
}
