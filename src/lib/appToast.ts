import { store } from '../store'
import { addToast } from '../store/slices/uiSlice'

/** Non-blocking feedback (replaces window.alert) using the global MUI snackbar stack. */
export function appToast(
  message: string,
  severity: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 5000
) {
  store.dispatch(addToast({ message, severity, duration }))
}
