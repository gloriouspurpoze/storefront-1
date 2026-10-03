'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { portalRoot } from './portal'
import { IconCheck } from './icons'

type ToastItem = { id: number; message: ReactNode; tone?: 'default' | 'error' }
type ToastApi = { show: (message: ReactNode, tone?: ToastItem['tone']) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const show = useCallback<ToastApi['show']>((message, tone = 'default') => {
    const id = ++seq.current
    setItems((prev) => [...prev.slice(-2), { id, message, tone }])
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200)
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="sf-toast-region" role="status" aria-live="polite">
            {items.map((t) => (
              <div key={t.id} className={cx('sf-toast', t.tone === 'error' && 'sf-toast--error')}>
                {t.tone !== 'error' && <IconCheck size={18} />}
                <span>{t.message}</span>
              </div>
            ))}
          </div>,
          portalRoot(),
        )}
    </ToastContext.Provider>
  )
}

/** No-op outside a provider so components stay usable in every theme shell. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? { show: () => {} }
}
