'use client'

import type { ComponentProps } from 'react'
import { ShippingPolicyModal } from '@/components/ShippingPolicyModal'

type ModalProps = ComponentProps<typeof ShippingPolicyModal>

/** Luxe-styled shipping policy modal (checkout gate + cart link). */
export function LuxeEssenceShippingPolicyModal(props: Omit<ModalProps, 'tone'>) {
  return <ShippingPolicyModal {...props} tone="luxe" />
}
