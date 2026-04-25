import { useSyncExternalStore } from 'react'

/**
 * @param query CSS media query, e.g. '(min-width: 900px)' for MUI "md" style breakpoint
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query)
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
      }
      ;(mq as { addListener: (cb: () => void) => void }).addListener(onChange)
      return () => (mq as { removeListener: (cb: () => void) => void }).removeListener(onChange)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}

export const muiMdUp = '(min-width: 900px)'
