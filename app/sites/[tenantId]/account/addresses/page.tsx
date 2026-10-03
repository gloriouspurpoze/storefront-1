import { loadTenantFromRequest } from '@/lib/load-tenant'
import { AddressBook } from '@/components/account/AddressBook'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const tenant = await loadTenantFromRequest()
  return {
    title: 'Saved addresses',
    description: tenant ? `Delivery addresses for ${tenant.name}` : 'Saved addresses',
  }
}

export default function AccountAddressesPage() {
  return <AddressBook />
}
