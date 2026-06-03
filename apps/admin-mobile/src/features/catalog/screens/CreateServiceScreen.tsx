import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { CreatePlatformServicePayload, ServiceType } from '@profixer/api-client'
import { FilterChips } from '@/components/common/FilterChips'
import { ListMeta } from '@/components/common/ListMeta'
import { SelectField } from '@/components/common/SelectField'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { MoreStackParamList } from '@/navigation/types'
import {
  useCreatePlatformServiceMutation,
  useGetAdminCategoriesQuery,
  useGetServiceDetailQuery,
  useUpdatePlatformServiceMutation,
} from '@/store/api/catalogAdminApi'
import { spacing } from '@/theme'

const SERVICE_TYPES: { id: ServiceType; label: string }[] = [
  { id: 'fixed', label: 'Fixed price' },
  { id: 'hourly', label: 'Hourly' },
  { id: 'consultation', label: 'Consultation' },
]

export function CreateServiceScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<MoreStackParamList, 'CreateService'>>()
  const editId = route.params?.id
  const isEdit = !!editId

  const { data: categories = [], isLoading: catLoading } = useGetAdminCategoriesQuery({
    categoryType: 'service',
  })
  const { data: detail, isLoading: detailLoading } = useGetServiceDetailQuery(editId ?? '', {
    skip: !editId,
  })
  const [createService, { isLoading: creating }] = useCreatePlatformServiceMutation()
  const [updateService, { isLoading: updating }] = useUpdatePlatformServiceMutation()
  const isLoading = creating || updating

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [category, setCategory] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('fixed')
  const [price, setPrice] = useState('')
  const [gst, setGst] = useState('18')
  const [duration, setDuration] = useState('')
  const [image, setImage] = useState('')

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit service' : 'New service' })
  }, [isEdit, navigation])

  const hydrated = useRef(false)
  useEffect(() => {
    if (!detail || hydrated.current) return
    hydrated.current = true
    setName(detail.name)
    setDescription(detail.description)
    setShortDescription(detail.short_description ?? '')
    setCategory(detail.category ?? '')
    setServiceType(detail.service_type)
    setPrice(
      String(
        (detail.service_type === 'hourly'
          ? detail.hourly_rate
          : detail.service_type === 'consultation'
            ? detail.consultation_fee
            : detail.base_price) ?? '',
      ),
    )
    setGst(detail.gst_percentage != null ? String(detail.gst_percentage) : '18')
    setDuration(detail.duration ?? '')
    setImage(detail.image ?? '')
  }, [detail])

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  )

  const priceLabel =
    serviceType === 'hourly'
      ? 'Hourly rate (₹)'
      : serviceType === 'consultation'
        ? 'Consultation fee (₹)'
        : 'Base price (₹)'

  const buildPayload = (): CreatePlatformServicePayload => {
    const priceNum = price.trim() ? Number(price) : undefined
    return {
      name: name.trim(),
      description: description.trim(),
      short_description: shortDescription.trim() || undefined,
      category: category || undefined,
      service_type: serviceType,
      base_price: serviceType === 'fixed' ? priceNum : undefined,
      hourly_rate: serviceType === 'hourly' ? priceNum : undefined,
      consultation_fee: serviceType === 'consultation' ? priceNum : undefined,
      gst_percentage: gst.trim() ? Number(gst) : undefined,
      duration: duration.trim() || undefined,
      image: image.trim() || undefined,
    }
  }

  const submit = async (draft: boolean) => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'A service name is required.')
      return
    }
    if (!draft && (!description.trim() || !category)) {
      Alert.alert('Missing fields', 'Category and description are required to publish.')
      return
    }
    try {
      if (isEdit && editId) {
        const result = await updateService({
          id: editId,
          payload: { ...buildPayload(), status: draft ? 'draft' : 'published' },
        }).unwrap()
        Alert.alert('Service updated', `"${result.name}" was saved.`, [
          { text: 'Done', onPress: () => navigation.goBack() },
        ])
      } else {
        const result = await createService({ payload: buildPayload(), draft }).unwrap()
        Alert.alert(
          draft ? 'Draft saved' : 'Service published',
          `"${result.name}" was ${draft ? 'saved as a draft' : 'published'}.`,
          [{ text: 'Done', onPress: () => navigation.goBack() }],
        )
      }
    } catch (e) {
      Alert.alert('Error', extractMessage(e, 'Could not save service'))
    }
  }

  return (
    <PermissionGate webPath={isEdit ? '/platform-services/edit' : '/platform-services/create'}>
      <Screen surface="soft">
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <ListMeta text={isEdit ? 'Edit platform service' : 'New platform service'} hint={detailLoading ? 'Loading…' : undefined} />

          <Input
            label="Service name"
            placeholder="e.g. Deep home cleaning"
            value={name}
            onChangeText={setName}
            surface="canvas"
          />
          <SelectField
            label="Category"
            placeholder={catLoading ? 'Loading…' : 'Select a category'}
            value={category}
            options={categoryOptions}
            onChange={setCategory}
            sheetTitle="Service category"
          />

          <View style={styles.field}>
            <Text variant="bodySmStrong" color="hairlineMid">
              Pricing model
            </Text>
            <FilterChips options={SERVICE_TYPES} value={serviceType} onChange={setServiceType} />
          </View>

          <Input
            label={priceLabel}
            placeholder="0"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            surface="canvas"
          />
          <Input
            label="GST %"
            value={gst}
            onChangeText={setGst}
            keyboardType="decimal-pad"
            surface="canvas"
          />
          <Input
            label="Duration"
            placeholder="e.g. 2 hours"
            value={duration}
            onChangeText={setDuration}
            surface="canvas"
          />
          <Input
            label="Short description"
            value={shortDescription}
            onChangeText={setShortDescription}
            surface="canvas"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.multiline}
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
              label={isEdit ? 'Save & publish' : 'Publish service'}
              loading={isLoading}
              onPress={() => void submit(false)}
            />
            <Button
              label="Save as draft"
              variant="secondary"
              loading={isLoading}
              onPress={() => void submit(true)}
            />
          </View>
        </ScrollView>
      </Screen>
    </PermissionGate>
  )
}

function extractMessage(e: unknown, fallback: string): string {
  return e && typeof e === 'object' && 'message' in e
    ? String((e as { message: string }).message)
    : fallback
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xxxl },
  field: { gap: spacing.xs },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
})
