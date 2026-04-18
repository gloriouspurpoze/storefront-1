import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Debounced search input synced to `?q=` */
export function useCrmSearchParam(debounceMs = 400) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [qInput, setQInput] = useState(urlQ)

  useEffect(() => {
    setQInput(urlQ)
  }, [urlQ])

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = qInput.trim()
      if (next === urlQ) return
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (next) p.set('q', next)
          else p.delete('q')
          return p
        },
        { replace: true }
      )
    }, debounceMs)
    return () => window.clearTimeout(id)
  }, [qInput, urlQ, debounceMs, setSearchParams])

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (value && value !== 'all' && value !== '') p.set(key, value)
          else p.delete(key)
          return p
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  return { qInput, setQInput, urlQ, searchParams, setSearchParams, setParam }
}
