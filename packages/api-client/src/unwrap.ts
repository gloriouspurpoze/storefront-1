/** Normalize `{ success, data }` envelopes and bare payloads. */
export function unwrapApiData<T>(raw: unknown): T {
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    if ('success' in r) {
      if (r.success === false) {
        throw new Error(typeof r.message === 'string' ? r.message : 'Request failed')
      }
      if ('data' in r && r.data !== undefined) {
        return r.data as T
      }
    }
    if ('data' in r && r.data !== undefined && !Array.isArray(raw)) {
      return r.data as T
    }
  }
  return raw as T
}

export function unwrapList<T>(raw: unknown, key: string): T[] {
  const data = unwrapApiData<unknown>(raw)
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>)[key])) {
    return (data as Record<string, T[]>)[key]
  }
  return []
}
