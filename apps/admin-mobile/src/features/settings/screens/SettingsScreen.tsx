import { Alert } from 'react-native'
import { Button } from '@/components/ui/Button'
import { ListMeta } from '@/components/common/ListMeta'
import { Screen } from '@/components/layout/Screen'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { logoutUser } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'

export function SettingsScreen() {
  const dispatch = useAppDispatch()

  return (
    <PermissionGate webPath="/settings">
      <Screen scroll>
        <ListMeta text="Account & session" />
        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => {
            Alert.alert('Sign out', 'End this session on this device?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => dispatch(logoutUser()) },
            ])
          }}
        />
      </Screen>
    </PermissionGate>
  )
}
