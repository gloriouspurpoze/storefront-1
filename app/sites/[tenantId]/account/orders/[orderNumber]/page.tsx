import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { loadTenantFromRequest } from '@/lib/load-tenant'
import { fetchStorefrontConfig } from '@/lib/storefront-api'
import { OrderDetail } from '@/components/account/OrderDetail'

export const dynamic = 'force-dynamic'

type Params = Promise<{ orderNumber: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { orderNumber } = await params
  return { title: `Order ${decodeURIComponent(orderNumber)}`, robots: { index: false } }
}

export default async function AccountOrderDetailPage({ params }: { params: Params }) {
  const { orderNumber } = await params
  const tenant = await loadTenantFromRequest()
  if (!tenant) notFound()

  const [config, h] = await Promise.all([fetchStorefrontConfig(tenant.id), headers()])
  const branding = config?.branding ?? {}

  return (
    <OrderDetail
      tenantId={tenant.id}
      orderNumber={decodeURIComponent(orderNumber)}
      storeName={branding.siteName || tenant.name}
      storeContact={{
        phone: branding.contactPhone,
        email: branding.contactEmail,
        whatsapp: branding.socials?.whatsapp || branding.contactPhone,
      }}
      productLinks={h.get('x-tenant-vertical') === 'retail'}
    />
  )
}
