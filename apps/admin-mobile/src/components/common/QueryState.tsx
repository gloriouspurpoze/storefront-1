import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { EmptyState } from '@/components/common/EmptyState'
import type { IconName } from '@/components/ui/Icon'
import { palette, spacing } from '@/theme'

type EmptyAction = {
  label: string
  onPress: () => void
  iconLeft?: IconName
}

type Props = {
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: IconName
  emptyAction?: EmptyAction
  emptySecondaryAction?: EmptyAction
  onRetry?: () => void
  children: React.ReactNode
}

export function QueryState({
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  emptyTitle = 'Nothing here',
  emptyDescription,
  emptyIcon,
  emptyAction,
  emptySecondaryAction,
  onRetry,
  children,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    )
  }
  if (isError) {
    return (
      <View style={styles.center}>
        <Text variant="bodyMdStrong" color="danger" align="center">
          {errorMessage ?? 'Something went wrong'}
        </Text>
        {onRetry ? (
          <Button label="Retry" variant="subtle" iconLeft="refresh" onPress={onRetry} block={false} />
        ) : null}
      </View>
    )
  }
  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        action={emptyAction}
        secondaryAction={emptySecondaryAction}
      />
    )
  }
  return <>{children}</>
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
})
