'use client'

import { useEffect, useMemo, useState } from 'react'
import type { StorefrontConfig } from '@/lib/storefront-api'
import {
  getEnabledPaymentMethods,
  STOREFRONT_PAYMENT_METHOD_LABELS,
  STOREFRONT_PAYMENT_SUBMIT_LABELS,
  type StorefrontPaymentMethod,
} from '@/lib/storefrontPaymentMethods'

/** Shared payment-method state for any theme checkout (online / COD / pay at restaurant). */
export function useStorefrontPaymentMethod(config: StorefrontConfig | null | undefined) {
  const methods = useMemo(() => getEnabledPaymentMethods(config ?? null), [config])
  const [method, setMethod] = useState<StorefrontPaymentMethod>(methods[0] ?? 'razorpay')

  useEffect(() => {
    if (!methods.includes(method)) setMethod(methods[0] ?? 'razorpay')
  }, [method, methods])

  return {
    methods,
    method,
    setMethod,
    submitLabel: STOREFRONT_PAYMENT_SUBMIT_LABELS[method],
  }
}

/** Radio list; renders nothing when only one method is enabled. */
export function PaymentMethodPicker({
  methods,
  value,
  onChange,
  name = 'sf-payment-method',
}: {
  methods: StorefrontPaymentMethod[]
  value: StorefrontPaymentMethod
  onChange: (m: StorefrontPaymentMethod) => void
  name?: string
}) {
  if (methods.length < 2) return null
  return (
    <fieldset style={{ border: 0, padding: 0, margin: '16px 0 0', minWidth: 0 }}>
      <legend style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, padding: 0 }}>Payment</legend>
      <div style={{ display: 'grid', gap: 8 }}>
        {methods.map((m) => {
          const active = value === m
          return (
            <label
              key={m}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                border: `1px solid ${active ? 'var(--site-brand, currentColor)' : 'rgba(128,128,128,0.35)'}`,
              }}
            >
              <input
                type="radio"
                name={name}
                value={m}
                checked={active}
                onChange={() => onChange(m)}
                style={{ accentColor: 'var(--site-brand, currentColor)' }}
              />
              <span>{STOREFRONT_PAYMENT_METHOD_LABELS[m]}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
