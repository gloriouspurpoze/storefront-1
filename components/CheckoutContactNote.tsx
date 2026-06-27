'use client'

import type { ReactNode } from 'react'

export function SignedInCheckoutNote({
  email,
  children,
  className,
}: {
  email: string
  children?: ReactNode
  className?: string
}) {
  return (
    <p
      className={
        className ??
        'rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600'
      }
    >
      {children ?? (
        <>
          Signed in — order confirmation will be sent to{' '}
          <span className="font-medium text-neutral-800">{email}</span>.
        </>
      )}
    </p>
  )
}

/** Hidden email for form-based checkout when the signed-in note is shown instead. */
export function LockedEmailField({ email }: { email: string }) {
  return <input type="hidden" name="email" value={email} />
}
