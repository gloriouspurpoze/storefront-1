import { Pressable, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { Permission } from '@profixer/types'
import { ScreenHeader } from '@/components/common/ScreenHeader'
import { Screen } from '@/components/layout/Screen'
import { Icon, type IconName } from '@/components/ui/Icon'
import { Text } from '@/components/ui/Text'
import { usePermissions } from '@/hooks/usePermissions'
import type { MoreStackParamList } from '@/navigation/types'
import { palette, radius, spacing } from '@/theme'

type CatalogScreen =
  | 'ServicesList'
  | 'ProductsList'
  | 'CategoriesList'
  | 'CreateService'
  | 'CreateCategory'
  | 'CreateProduct'

type HubItem = {
  id: string
  label: string
  subtitle: string
  icon: IconName
  screen: CatalogScreen
  permission: Permission
}

const BROWSE_ITEMS: HubItem[] = [
  {
    id: 'services',
    label: 'Services',
    subtitle: 'Browse & manage services',
    icon: 'briefcase',
    screen: 'ServicesList',
    permission: 'view_services',
  },
  {
    id: 'products',
    label: 'Products',
    subtitle: 'Browse & manage products',
    icon: 'star',
    screen: 'ProductsList',
    permission: 'view_products',
  },
  {
    id: 'categories',
    label: 'Categories',
    subtitle: 'Browse & manage categories',
    icon: 'tag',
    screen: 'CategoriesList',
    permission: 'view_categories',
  },
]

const CREATE_ITEMS: HubItem[] = [
  {
    id: 'new-service',
    label: 'New service',
    subtitle: 'Publish a platform service',
    icon: 'plus',
    screen: 'CreateService',
    permission: 'create_services',
  },
  {
    id: 'new-category',
    label: 'New category',
    subtitle: 'Product or service category',
    icon: 'plus',
    screen: 'CreateCategory',
    permission: 'create_categories',
  },
  {
    id: 'new-product',
    label: 'New product',
    subtitle: 'Add an e-commerce product',
    icon: 'plus',
    screen: 'CreateProduct',
    permission: 'create_products',
  },
]

export function CatalogHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>()
  const { checkPermission } = usePermissions()

  const browse = BROWSE_ITEMS.filter((item) => checkPermission(item.permission))
  const create = CREATE_ITEMS.filter((item) => checkPermission(item.permission))

  const renderTile = (item: HubItem) => (
    <Pressable
      key={item.id}
      onPress={() => navigation.navigate(item.screen)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.iconBubble}>
        <Icon name={item.icon} size={22} color={palette.primary} />
      </View>
      <Text variant="bodyMdStrong" color="ink">
        {item.label}
      </Text>
      <Text variant="caption" color="body">
        {item.subtitle}
      </Text>
    </Pressable>
  )

  return (
    <Screen scroll surface="canvas">
      <ScreenHeader title="Catalog" subtitle="Browse & create services, categories, products" large />
      {browse.length === 0 && create.length === 0 ? (
        <Text variant="bodyMd" color="body" style={styles.empty}>
          Your role can't access catalog items. Contact an admin or use the web panel.
        </Text>
      ) : (
        <>
          {browse.length > 0 ? (
            <>
              <Text variant="bodySmStrong" color="hairlineMid" style={styles.sectionLabel}>
                Browse
              </Text>
              <View style={styles.grid}>{browse.map(renderTile)}</View>
            </>
          ) : null}
          {create.length > 0 ? (
            <>
              <Text variant="bodySmStrong" color="hairlineMid" style={styles.sectionLabel}>
                Create
              </Text>
              <View style={styles.grid}>{create.map(renderTile)}</View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    backgroundColor: palette.canvas,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  cardPressed: { backgroundColor: palette.canvasSoft },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  empty: { paddingTop: spacing.xl },
})
