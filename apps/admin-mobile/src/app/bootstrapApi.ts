import { setApiUnauthorizedHandler, setTenantIdResolver } from '@/services/createMobileClient'
import { store } from '@/store'
import { logout } from '@/store/slices/authSlice'

export function bootstrapApi() {
  setTenantIdResolver(() => store.getState().tenant.tenantId ?? null)

  setApiUnauthorizedHandler(() => {
    store.dispatch(logout())
  })
}
