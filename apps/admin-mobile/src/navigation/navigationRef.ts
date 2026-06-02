import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList } from '@/navigation/types'

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigationRef.navigate(name as any, params as any)
  }
}
