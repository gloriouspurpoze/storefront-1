import { store } from '../store'
import { addToast } from '../store/slices/uiSlice'

export type AppToastAction = {
  label: string
  onClick: () => void
}

/** Non-blocking feedback (replaces window.alert) using the global snackbar stack. */
export function appToast(
  message: string,
  severity: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 5000,
  action?: AppToastAction,
) {
  store.dispatch(addToast({ message, severity, duration, action }))
}
