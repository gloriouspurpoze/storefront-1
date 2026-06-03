import { useEffect, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { CategoryType } from '@profixer/api-client'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import {
  useCreateCategoryMutation,
  useGetCategoryDetailQuery,
  useUpdateCategoryMutation,
} from '@/store/api/catalogAdminApi'
import { spacing } from '@/theme'

const CATEGORY_TYPES: { id: CategoryType; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'service', label: 'Service' },
  { id: 'both', label: 'Both' },
]

export function CreateCategoryScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<MoreStackParamList, 'CreateCategory'>>()
  const editId = route.params?.id
  const isEdit = !!editId

  const { data: detail, isLoading: detailLoading } = useGetCategoryDetailQuery(editId ?? '', {
    skip: !editId,
  })
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation()
  const isLoading = creating || updating

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryType, setCategoryType] = useState<CategoryType>('product')
  const [sortOrder, setSortOrder] = useState('')
  const [image, setImage] = useState('')

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit category' : 'New category' })
  }, [isEdit, navigation])

  const hydrated = useRef(false)
  useEffect(() => {
    if (!detail || hydrated.current) return
    hydrated.current = true
    setName(detail.name)
    setDescription(detail.description ?? '')
    setCategoryType(detail.categoryType)
    setSortOrder(detail.sortOrder != null ? String(detail.sortOrder) : '')
    setImage(detail.image ?? '')
  }, [detail])

  const submit = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Invalid name', 'Category name must be at least 2 characters.')
      return
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      categoryType,
      sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined,
      image: image.trim() || undefined,
    }
    try {
      if (isEdit && editId) {
        const result = await updateCategory({ id: editId, payload }).unwrap()
        Alert.alert('Category updated', `"${result.name}" was saved.`, [
          { text: 'Done', onPress: () => navigation.goBack() },
        ])
      } else {
        const result = await createCategory({ ...payload, status: 'active' }).unwrap()
        Alert.alert('Category created', `"${result.name}" was created.`, [
          { text: 'Done', onPress: () => navigation.goBack() },
        ])
      }
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not save category'
      Alert.alert('Error', msg)
    }
  }

  return (
    <PermissionGate permission={isEdit ? 'edit_categories' : 'create_categories'}>
      <Screen surface="soft">
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <ListMeta text={isEdit ? 'Edit category' : 'New catalog category'} hint={detailLoading ? 'Loading…' : undefined} />

          <Input
            label="Category name"
            placeholder="e.g. Home appliances"
            value={name}
            onChangeText={setName}
            surface="canvas"
          />

          <View style={styles.field}>
            <Text variant="bodySmStrong" color="hairlineMid">
              Applies to
            </Text>
            <FilterChips options={CATEGORY_TYPES} value={categoryType} onChange={setCategoryType} />
          </View>

          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.multiline}
            surface="canvas"
          />
          <Input
            label="Sort order (optional)"
            placeholder="0"
            value={sortOrder}
            onChangeText={setSortOrder}
            keyboardType="number-pad"
            surface="canvas"
          />
          <Input
            label="Image URL (optional)"
            placeholder="https://…"
            value={image}
            onChangeText={setImage}
            autoCapitalize="none"
            keyboardType="url"
            surface="canvas"
          />

          <View style={styles.actions}>
            <Button
              label={isEdit ? 'Save changes' : 'Create category'}
              loading={isLoading}
              onPress={() => void submit()}
            />
            <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xxxl },
  field: { gap: spacing.xs },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
})
