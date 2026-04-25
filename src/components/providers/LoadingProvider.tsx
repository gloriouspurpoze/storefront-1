import React from 'react'
import { Loader2 } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'

export function LoadingProvider() {
  const { isLoading, loadingMessage } = useAppSelector((state) => state.ui)

  if (!isLoading) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-3 bg-black/50 text-white"
      role="alert"
      aria-busy
      aria-live="polite"
    >
      <Loader2 className="h-14 w-14 animate-spin" aria-hidden />
      <p className="text-center text-base font-medium">{loadingMessage}</p>
    </div>
  )
}
