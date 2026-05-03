import { useCallback, useEffect, useState } from 'react'
import { crmApi } from '../services/api/crm.api'
import { crmService } from '../services/api/crm.service'

export type CrmFieldMatrix = Record<string, Record<string, { read: boolean; write: boolean }>>

/**
 * Field-level read/write matrix from backend when REACT_APP_CRM_USE_API=true.
 * When using local CRM storage, all fields are treated as readable/writable for UI (demo).
 */
export function useCrmFieldAccess() {
  const [fields, setFields] = useState<CrmFieldMatrix | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!crmService.isApiEnabled()) {
      setLoaded(true)
      return
    }
    let cancelled = false
    crmApi
      .getFieldAccess()
      .then((r) => {
        if (!cancelled) setFields(r.fields)
      })
      .catch(() => {
        if (!cancelled) setFields(null)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canReadField = useCallback(
    (entity: string, field: string) => {
      if (!crmService.isApiEnabled() || !fields) return true
      return fields[entity]?.[field]?.read !== false
    },
    [fields]
  )

  const canWriteField = useCallback(
    (entity: string, field: string) => {
      if (!crmService.isApiEnabled() || !fields) return true
      // Only explicit write: false denies; missing rules default to writable (matches typical CRM policy seeds).
      return fields[entity]?.[field]?.write !== false
    },
    [fields]
  )

  return { fields, loaded, canReadField, canWriteField, isApi: crmService.isApiEnabled() }
}
