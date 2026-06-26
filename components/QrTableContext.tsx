'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const SESSION_KEY = 'pf_qr_table'

/** Persist table context from `?t=` (QR table menu scans). */
export function QrTableContext({ tenantId }: { tenantId: string }) {
  const params = useSearchParams()
  const table = params.get('t') ?? params.get('table')

  useEffect(() => {
    if (!table?.trim()) return
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          tenantId,
          tableLabel: table.trim(),
          capturedAt: new Date().toISOString(),
        }),
      )
    } catch {
      /* private browsing */
    }
  }, [table, tenantId])

  if (!table?.trim()) return null

  return (
    <div
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
      role="status"
    >
      Ordering for <strong>Table {table}</strong>
    </div>
  )
}

export function readQrTableContext(tenantId: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { tenantId?: string; tableLabel?: string }
    if (parsed.tenantId !== tenantId) return null
    return parsed.tableLabel ?? null
  } catch {
    return null
  }
}
