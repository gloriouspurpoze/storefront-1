import { setApiUnauthorizedHandler } from '@/services/createMobileClient'
import { store } from '@/store'
import { logout } from '@/store/slices/authSlice'

export function bootstrapApi() {
  setApiUnauthorizedHandler(() => {
    store.dispatch(logout())
  })
}
