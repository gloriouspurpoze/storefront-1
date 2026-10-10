import type { ReactNode } from 'react'
import { STORE_ROOT_METADATA, STORE_ROOT_VIEWPORT, StoreRootLayout } from '@/components/root/StoreRootLayout'

/** Root layout (see `components/root/StoreRootLayout.tsx` for why there are several). */
export const metadata = STORE_ROOT_METADATA
export const viewport = STORE_ROOT_VIEWPORT

export default function RootLayout({ children }: { children: ReactNode }) {
  return <StoreRootLayout>{children}</StoreRootLayout>
}
