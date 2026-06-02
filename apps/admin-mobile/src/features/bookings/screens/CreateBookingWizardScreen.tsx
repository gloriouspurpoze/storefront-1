import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { CatalogService } from '@profixer/api-client'
import type { AppUser } from '@profixer/types'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import type { OpsStackParamList } from '@/navigation/types'
import {
  useAdminCreateBookingMutation,
  useGetCatalogServicesQuery,
  useLazySearchCustomersQuery,
} from '@/store/api/phase2Api'
import { palette, radius, spacing } from '@/theme'

type Step = 1 | 2 | 3 | 4

function idempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function CreateBookingWizardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const [step, setStep] = useState<Step>(1)
  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<AppUser | null>(null)
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null)
  const [quantity, setQuantity] = useState('1')
  const [scheduledLocal, setScheduledLocal] = useState('')
  const [addrLine, setAddrLine] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrState, setAddrState] = useState('')
  const [addrZip, setAddrZip] = useState('')
  const [addrPhone, setAddrPhone] = useState('')
  const [notes, setNotes] = useState('')

  const { data: catalog, isLoading: catalogLoading } = useGetCatalogServicesQuery()
  const [searchCustomers, { data: customerHits, isFetching: searching }] = useLazySearchCustomersQuery()
  const [createBooking, { isLoading: submitting }] = useAdminCreateBookingMutation()

  useEffect(() => {
    if (customerQuery.trim().length < 2) return
    const t = setTimeout(() => {
      void searchCustomers(customerQuery.trim())
    }, 320)
    return () => clearTimeout(t)
  }, [customerQuery, searchCustomers])

  useEffect(() => {
    if (selectedCustomer) {
      setAddrPhone(selectedCustomer.phone ?? '')
    }
  }, [selectedCustomer])

  const qty = Math.max(1, parseInt(quantity, 10) || 1)
  const unitPrice = selectedService?.base_price ?? 0
  const lineSubtotal = Math.round(unitPrice * qty * 100) / 100
  const gstPercent = selectedService?.gst_percentage ?? 18
  const gstApplied = true
  const gstAmount = gstApplied ? Math.round(lineSubtotal * (gstPercent / 100) * 100) / 100 : 0
  const totalAmount = Math.round((lineSubtotal + gstAmount) * 100) / 100

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return !!selectedCustomer
      case 2:
        return !!selectedService && unitPrice > 0
      case 3:
        return (
          scheduledLocal.trim().length > 0 &&
          addrLine.trim().length > 0 &&
          addrCity.trim().length > 0 &&
          addrPhone.trim().length > 0
        )
      default:
        return true
    }
  }, [step, selectedCustomer, selectedService, unitPrice, scheduledLocal, addrLine, addrCity, addrPhone])

  const submit = useCallback(async () => {
    if (!selectedCustomer || !selectedService) return
    let scheduledIso: string
    try {
      scheduledIso = new Date(scheduledLocal).toISOString()
    } catch {
      Alert.alert('Invalid date', 'Enter schedule as YYYY-MM-DDTHH:mm (local time).')
      return
    }
    try {
      const result = await createBooking({
        customerId: selectedCustomer.id,
        skipAutoAssign: true,
        scheduled_time: scheduledIso,
        notes: notes.trim() || undefined,
        services: [
          {
            serviceId: selectedService.id,
            quantity: qty,
            price: unitPrice,
            name: selectedService.name,
          },
        ],
        posPricing: {
          lineSubtotal,
          manualDiscount: 0,
          couponDiscount: 0,
          gstPercent,
          gstApplied,
        },
        address: {
          firstName: selectedCustomer.firstName ?? '',
          lastName: selectedCustomer.lastName ?? '',
          address: addrLine.trim(),
          city: addrCity.trim(),
          state: addrState.trim() || '—',
          zipCode: addrZip.trim() || '000000',
          country: 'India',
          phone: addrPhone.trim(),
        },
        totalAmount,
        paymentMethod: 'cash',
        checkoutIdempotencyKey: idempotencyKey(),
      }).unwrap()
      const bid = String(result.booking.id || result.booking._id || '')
      Alert.alert('Booking created', result.message ?? 'Job registered successfully.', [
        {
          text: 'View booking',
          onPress: () => {
            navigation.replace('BookingDetail', { id: bid })
          },
        },
      ])
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not create booking'
      Alert.alert('Error', msg)
    }
  }, [
    selectedCustomer,
    selectedService,
    scheduledLocal,
    notes,
    qty,
    unitPrice,
    lineSubtotal,
    gstPercent,
    totalAmount,
    addrLine,
    addrCity,
    addrState,
    addrZip,
    addrPhone,
    createBooking,
    navigation,
    gstApplied,
  ])

  const STEP_LABELS = ['Customer', 'Service', 'Schedule', 'Review']

  return (
    <PermissionGate webPath="/operations/pos">
      <Screen surface="soft">
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Stepper */}
          <View style={styles.stepper}>
            {STEP_LABELS.map((label, idx) => {
              const n = (idx + 1) as Step
              const done = n < step
              const active = n === step
              return (
                <View key={label} style={styles.stepWrap}>
                  <View
                    style={[
                      styles.stepDot,
                      active && styles.stepDotActive,
                      done && styles.stepDotDone,
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={active || done ? 'onPrimary' : 'mute'}
                      style={styles.stepNumber}
                    >
                      {n}
                    </Text>
                  </View>
                  <Text
                    variant="caption"
                    color={active ? 'ink' : 'body'}
                    style={styles.stepLabel}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  {idx < STEP_LABELS.length - 1 ? (
                    <View
                      style={[styles.stepLine, n < step && styles.stepLineDone]}
                    />
                  ) : null}
                </View>
              )
            })}
          </View>

          {step === 1 ? (
            <View style={styles.section}>
              <Text variant="displaySm" color="ink">
                Who's the customer?
              </Text>
              <Input
                label="Find customer"
                placeholder="Name, email, or phone"
                value={customerQuery}
                onChangeText={setCustomerQuery}
                autoCapitalize="none"
                surface="canvas"
              />
              {selectedCustomer ? (
                <Card variant="content" padding="md">
                  <Text variant="bodyMdStrong" color="ink">
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </Text>
                  <Text variant="bodySm" color="body">
                    {selectedCustomer.email}
                  </Text>
                </Card>
              ) : null}
              {customerQuery.trim().length >= 2 ? (
                <QueryState isLoading={searching} isError={false}>
                  <FlatList
                    data={customerHits ?? []}
                    scrollEnabled={false}
                    keyExtractor={(u) => u.id}
                    renderItem={({ item }) => {
                      const active = selectedCustomer?.id === item.id
                      return (
                        <Pressable
                          style={[styles.pickRow, active && styles.pickActive]}
                          onPress={() => setSelectedCustomer(item)}
                        >
                          <Text variant="bodyMdStrong" color="ink">
                            {item.firstName} {item.lastName}
                          </Text>
                          <Text variant="caption" color="body">
                            {item.email}
                          </Text>
                        </Pressable>
                      )
                    }}
                  />
                </QueryState>
              ) : (
                <Text variant="caption" color="body">
                  Type at least 2 characters to search customers.
                </Text>
              )}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.section}>
              <Text variant="displaySm" color="ink">
                Pick a service
              </Text>
              <QueryState isLoading={catalogLoading} isError={false}>
                <Input
                  label="Quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  surface="canvas"
                />
                <FlatList
                  data={catalog ?? []}
                  scrollEnabled={false}
                  keyExtractor={(s) => s.id}
                  renderItem={({ item }) => {
                    const active = selectedService?.id === item.id
                    return (
                      <Pressable
                        style={[styles.pickRow, active && styles.pickActive]}
                        onPress={() => setSelectedService(item)}
                      >
                        <Text variant="bodyMdStrong" color="ink">
                          {item.name}
                        </Text>
                        <Text variant="caption" color="body">
                          ₹{(item.base_price ?? 0).toLocaleString('en-IN')}
                        </Text>
                      </Pressable>
                    )
                  }}
                />
              </QueryState>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.section}>
              <Text variant="displaySm" color="ink">
                Schedule & address
              </Text>
              <Input
                label="Schedule (YYYY-MM-DDTHH:mm)"
                placeholder="2026-06-03T14:30"
                value={scheduledLocal}
                onChangeText={setScheduledLocal}
                autoCapitalize="none"
                surface="canvas"
              />
              <Input label="Address line" value={addrLine} onChangeText={setAddrLine} surface="canvas" />
              <Input label="City" value={addrCity} onChangeText={setAddrCity} surface="canvas" />
              <Input label="State" value={addrState} onChangeText={setAddrState} surface="canvas" />
              <Input label="PIN" value={addrZip} onChangeText={setAddrZip} keyboardType="number-pad" surface="canvas" />
              <Input label="Phone" value={addrPhone} onChangeText={setAddrPhone} keyboardType="phone-pad" surface="canvas" />
              <Input label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={2} surface="canvas" />
            </View>
          ) : null}

          {step === 4 ? (
            <Card variant="content" padding="lg" style={styles.section}>
              <Text variant="bodyMdStrong" color="ink">
                Review
              </Text>
              <Text variant="bodySm" color="body">
                Customer: {selectedCustomer?.firstName} {selectedCustomer?.lastName}
              </Text>
              <Text variant="bodySm" color="body">
                Service: {selectedService?.name} × {qty}
              </Text>
              <Text variant="bodySm" color="body">
                Subtotal: ₹{lineSubtotal.toLocaleString('en-IN')}
              </Text>
              <Text variant="bodySm" color="body">
                GST ({gstPercent}%): ₹{gstAmount.toLocaleString('en-IN')}
              </Text>
              <Text variant="bodyMdStrong" color="ink">
                Total: ₹{totalAmount.toLocaleString('en-IN')}
              </Text>
            </Card>
          ) : null}

          <View style={styles.nav}>
            {step > 1 ? (
              <Button
                label="Back"
                variant="secondary"
                onPress={() => setStep((s) => (s - 1) as Step)}
              />
            ) : null}
            {step < 4 ? (
              <Button
                label="Next"
                disabled={!canNext}
                onPress={() => setStep((s) => (s + 1) as Step)}
              />
            ) : (
              <Button label="Create booking" loading={submitting} onPress={() => void submit()} />
            )}
          </View>
        </ScrollView>
      </Screen>
    </PermissionGate>
  )
}

const STEP_DOT_SIZE = 28

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxxl, gap: spacing.lg },
  section: { gap: spacing.md },
  pickRow: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    backgroundColor: palette.canvas,
    marginBottom: spacing.sm,
  },
  pickActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  nav: { gap: spacing.sm, marginTop: spacing.lg },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  stepWrap: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepDot: {
    width: STEP_DOT_SIZE,
    height: STEP_DOT_SIZE,
    borderRadius: STEP_DOT_SIZE / 2,
    backgroundColor: palette.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  stepDotActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  stepDotDone: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  stepNumber: { lineHeight: STEP_DOT_SIZE },
  stepLabel: { marginTop: spacing.xxs, textAlign: 'center' },
  stepLine: {
    position: 'absolute',
    top: STEP_DOT_SIZE / 2 - 1,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: palette.surfacePressed,
    zIndex: 0,
  },
  stepLineDone: { backgroundColor: palette.success },
})
