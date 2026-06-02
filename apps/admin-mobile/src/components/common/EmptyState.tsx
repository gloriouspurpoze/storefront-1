import { StyleSheet, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { palette, radius, spacing } from '@/theme'

type ActionProp = {
  label: string
  onPress: () => void
  iconLeft?: IconName
}

type Props = {
  title: string
  description?: string
  icon?: IconName
  /** Primary CTA — usually "Refresh" or "Create". */
  action?: ActionProp
  /** Secondary CTA — usually a soft action ("Refresh" while primary is "New"). */
  secondaryAction?: ActionProp
}

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  secondaryAction,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <Icon name={icon} size={28} color={palette.body} />
      </View>
      <Text variant="bodyMdStrong" color="ink" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="bodySm" color="body" align="center">
          {description}
        </Text>
      ) : null}
      {action ? (
        <View style={styles.actions}>
          <Button
            label={action.label}
            iconLeft={action.iconLeft}
            onPress={action.onPress}
            block={false}
          />
          {secondaryAction ? (
            <Button
              label={secondaryAction.label}
              variant="secondary"
              iconLeft={secondaryAction.iconLeft}
              onPress={secondaryAction.onPress}
              block={false}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.sm,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: palette.canvasSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
})
