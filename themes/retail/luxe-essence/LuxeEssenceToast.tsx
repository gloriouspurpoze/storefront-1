'use client'

export function LuxeEssenceToast({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <div className="le-toast show" role="status" aria-live="polite">
      {message}
    </div>
  )
}
