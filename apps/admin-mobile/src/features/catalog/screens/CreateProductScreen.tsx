import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { CreateProductPayload } from '@profixer/api-client'
import { ListMeta } from '@/components/common/ListMeta'
import { SelectField } from '@/components/common/SelectField'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { slugify } from '@/lib/slug'
import type { MoreStackParamList } from '@/navigation/types'
import {
  useCreateProductMutation,
  useGetAdminCategoriesQuery,
  useGetProductDetailQuery,
  useGetProductVendorsQuery,
  useUpdateProductMutation,
} from '@/store/api/catalogAdminApi'
import { spacing } from '@/theme'

export function CreateProductScreen() {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<MoreStackParamList, 'CreateProduct'>>()
  const editId = route.params?.id
  const isEdit = !!editId

  const { data: categories = [], isLoading: catLoading } = useGetAdminCategoriesQuery({
    categoryType: 'product',
  })
  const { data: vendors = [], isLoading: vendorLoading } = useGetProductVendorsQuery()
  const { data: detail, isLoading: detailLoading } = useGetProductDetailQuery(editId ?? '', {
    skip: !editId,
  })
  const [createProduct, { isLoading: creating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation()
  const isLoading = creating || updating

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [sku, setSku] = useState('')
  const [stock, setStock] = useState('')
  const [lowStock, setLowStock] = useState('')
  const [image, setImage] = useState('')

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit product' : 'New product' })
  }, [isEdit, navigation])

  const hydrated = useRef(false)
  useEffect(() => {
    if (!detail || hydrated.current) return
    hydrated.current = true
    setName(detail.name)
    setCategoryId(detail.category_id ?? '')
    setVendorId(detail.vendor_id ?? '')
    setShortDescription(detail.short_description ?? '')
    setDescription(detail.description)
    setPrice(detail.price ? String(detail.price) : '')
    setOriginalPrice(detail.original_price != null ? String(detail.original_price) : '')
    setSku(detail.sku ?? '')
    setStock(String(detail.stock_quantity ?? ''))
    setLowStock(detail.low_stock_threshold != null ? String(detail.low_stock_threshold) : '')
    setImage(detail.imageUrl ?? '')
  }, [detail])

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.name })),
    [categories],
  )
  const vendorOptions = useMemo(
    () => vendors.map((v) => ({ id: v.id, label: v.legalName ? `${v.name} (${v.legalName})` : v.name })),
    [vendors],
  )

  const buildPayload = (): CreateProductPayload => {
    const trimmedImage = image.trim()
    return {
      category_id: categoryId,
      name: name.trim(),
      description: description.trim(),
      short_description: shortDescription.trim() || undefined,
      slug: slugify(name),
      price: price.trim() ? Number(price) : 0,
      original_price: originalPrice.trim() ? Number(originalPrice) : undefined,
      sku: sku.trim(),
      stock_quantity: stock.trim() ? Number(stock) : 0,
      low_stock_threshold: lowStock.trim() ? Number(lowStock) : undefined,
      images: trimmedImage ? [{ url: trimmedImage, is_primary: true, order: 0 }] : undefined,
      vendor_id: vendorId || undefined,
      is_active: true,
    }
  }

  const submit = async (draft: boolean) => {
    if (!name.trim() || !categoryId) {
      Alert.alert('Missing fields', 'Product name and category are required.')
      return
    }
    if (!draft) {
      if (!description.trim() || !sku.trim()) {
        Alert.alert('Missing fields', 'Description and SKU are required to publish.')
        return
      }
      if (!price.trim() || Number(price) <= 0) {
        Alert.alert('Invalid price', 'Enter a price greater than 0 to publish.')
        return
      }
      if (!image.trim()) {
        Alert.alert('Image required', 'Add at least one image URL to publish.')
        return
      }
    }
    try {
      if (isEdit && editId) {
        const result = await updateProduct({ id: editId, payload: buildPayload() }).unwrap()
        Alert.alert('Product updated', `"${result.name}" was saved.`, [
          { text: 'Done', onPress: () => navigation.goBack() },
        ])
      } else {
        const result = await createProduct({ payload: buildPayload(), draft }).unwrap()
        Alert.alert(
          draft ? 'Draft saved' : 'Product published',
          `"${result.name}" was ${draft ? 'saved as a draft' : 'published'}.`,
          [{ text: 'Done', onPress: () => navigation.goBack() }],
        )
      }
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not save product'
      Alert.alert('Error', msg)
    }
  }

  return (
    <PermissionGate webPath={isEdit ? '/products/edit' : '/products/add'}>
      <Screen surface="soft">
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <ListMeta text={isEdit ? 'Edit product' : 'New product'} hint={detailLoading ? 'Loading…' : undefined} />

          <Input
            label="Product name"
            placeholder="e.g. Cordless drill 18V"
            value={name}
            onChangeText={setName}
            surface="canvas"
          />
          <SelectField
            label="Category"
            placeholder={catLoading ? 'Loading…' : 'Select a category'}
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            sheetTitle="Product category"
          />
          <SelectField
            label="Vendor"
            placeholder={vendorLoading ? 'Loading…' : 'Select a vendor'}
            value={vendorId}
            options={vendorOptions}
            onChange={setVendorId}
            sheetTitle="Vendor"
          />

          <Input
            label="Price (₹)"
            placeholder="0"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            surface="canvas"
          />
          <Input
            label="Original price (₹, optional)"
            placeholder="0"
            value={originalPrice}
            onChangeText={setOriginalPrice}
            keyboardType="decimal-pad"
            surface="canvas"
          />
          <Input label="SKU" placeholder="e.g. DRL-18V-001" value={sku} onChangeText={setSku} autoCapitalize="characters" surface="canvas" />
          <Input
            label="Stock quantity"
            placeholder="0"
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
            surface="canvas"
          />
          <Input
            label="Low stock threshold (optional)"
            placeholder="0"
            value={lowStock}
            onChangeText={setLowStock}
            keyboardType="number-pad"
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
            label="Image URL"
            placeholder="https://…"
            value={image}
            onChangeText={setImage}
            autoCapitalize="none"
            keyboardType="url"
            surface="canvas"
          />

          <View style={styles.actions}>
            <Button
              label={isEdit ? 'Save changes' : 'Publish product'}
              loading={isLoading}
              onPress={() => void submit(false)}
            />
            {!isEdit ? (
              <Button
                label="Save as draft"
                variant="secondary"
                loading={isLoading}
                onPress={() => void submit(true)}
              />
            ) : null}
          </View>
        </ScrollView>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xxxl },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
})
