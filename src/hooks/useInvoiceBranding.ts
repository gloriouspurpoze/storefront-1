import { useCallback, useState } from 'react'
import {
  loadInvoiceBranding,
  saveInvoiceBranding,
  DEFAULT_INVOICE_BRANDING,
  type InvoiceBranding,
} from '../lib/invoiceBranding'

/**
 * Loads branding from localStorage on mount. Call {@link refresh} after saving elsewhere if needed.
 */
export function useInvoiceBranding() {
  const [branding, setBranding] = useState<InvoiceBranding>(() => loadInvoiceBranding())

  const refresh = useCallback(() => {
    setBranding(loadInvoiceBranding())
  }, [])

  const replace = useCallback((next: InvoiceBranding) => {
    saveInvoiceBranding(next)
    setBranding(loadInvoiceBranding())
  }, [])

  const reset = useCallback(() => {
    saveInvoiceBranding(DEFAULT_INVOICE_BRANDING)
    setBranding({ ...DEFAULT_INVOICE_BRANDING })
  }, [])

  return { branding, replace, reset, refresh }
}
