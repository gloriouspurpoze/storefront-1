import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { isValid as isValidDate } from 'date-fns'
import type { CatalogService } from '@profixer/api-client'
import type { AppUser } from '@profixer/types'
import { QueryState } from '@/components/common/QueryState'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { safeFormat } from '@/lib/datetime'
import type { OpsStackParamList } from '@/navigation/types'
import {
  useAdminCreateBookingMutation,
  useCreateCustomerMutation,
  useGetCatalogServicesQuery,
  useLazySearchCustomersQuery,
} from '@/store/api/phase2Api'
import { palette, radius, spacing } from '@/theme'

type Step = 1 | 2 | 3 | 4

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function idempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Format a Date into the `YYYY-MM-DDTHH:mm` local string the form expects. */
function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`
}

function quickSchedule(kind: 'in1h' | 'tmrwAM' | 'tmrwPM'): string {
  const d = new Date()
  if (kind === 'in1h') {
    d.setHours(d.getHours() + 1, 0, 0, 0)
  } else if (kind === 'tmrwAM') {
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
  } else {
    d.setDate(d.getDate() + 1)
    d.setHours(14, 0, 0, 0)
  }
  return toLocalInput(d)
}

const SCHEDULE_CHIPS: Array<{ key: 'in1h' | 'tmrwAM' | 'tmrwPM'; label: string }> = [
  { key: 'in1h', label: 'In 1 hour' },
  { key: 'tmrwAM', label: 'Tomorrow 9 AM' },
  { key: 'tmrwPM', label: 'Tomorrow 2 PM' },
]

export function CreateBookingWizardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<OpsStackParamList>>()
  const [step, setStep] = useState<Step>(1)
  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<AppUser | null>(null)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  // Inline "create customer" form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [ncFirst, setNcFirst] = useState('')
  const [ncLast, setNcLast] = useState('')
  const [ncEmail, setNcEmail] = useState('')
  const [ncPhone, setNcPhone] = useState('')

  const [selectedService, setSelectedService] = useState<CatalogService | null>(null)
  const [serviceQuery, setServiceQuery] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [scheduledLocal, setScheduledLocal] = useState('')
  const [addrLine, setAddrLine] = useState('')
  const [addrCity, setAddrCity] = useState('')
  const [addrState, setAddrState] = useState('')
  const [addrZip, setAddrZip] = useState('')
  const [addrPhone, setAddrPhone] = useState('')
  const [notes, setNotes] = useState('')

  const { data: catalog, isLoading: catalogLoading } = useGetCatalogServicesQuery()
  const [searchCustomers, { data: customerHits, isFetching: searching }] =
    useLazySearchCustomersQuery()
  const [createCustomer, { isLoading: creatingCustomer }] = useCreateCustomerMutation()
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
      setAddrPhone((prev) => prev || selectedCustomer.phone || '')
    }
  }, [selectedCustomer])

  const qty = Math.max(1, quantity)
  const unitPrice = selectedService?.base_price ?? 0
  const lineSubtotal = Math.round(unitPrice * qty * 100) / 100
  const gstPercent = selectedService?.gst_percentage ?? 18
  const gstApplied = true
  const gstAmount = gstApplied ? Math.round(lineSubtotal * (gstPercent / 100) * 100) / 100 : 0
  const totalAmount = Math.round((lineSubtotal + gstAmount) * 100) / 100

  const filteredCatalog = useMemo(() => {
    const list = catalog ?? []
    const q = serviceQuery.trim().toLowerCase()
    if (!q) return list
    return list.filter((s) => s.name?.toLowerCase().includes(q))
  }, [catalog, serviceQuery])

  const noCustomerResults =
    customerQuery.trim().length >= 2 && !searching && (customerHits?.length ?? 0) === 0

  const schedulePreview = useMemo(() => {
    if (!scheduledLocal.trim()) return ''
    const d = new Date(scheduledLocal)
    if (!isValidDate(d)) return 'invalid'
    return safeFormat(d, "EEE, dd MMM yyyy 'at' h:mm a", '')
  }, [scheduledLocal])

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return !!selectedCustomer
      case 2:
        return !!selectedService && unitPrice > 0
      case 3:
        return (
          schedulePreview !== '' &&
          schedulePreview !== 'invalid' &&
          addrLine.trim().length > 0 &&
          addrCity.trim().length > 0 &&
          addrPhone.trim().length > 0
        )
      default:
        return true
    }
  }, [step, selectedCustomer, selectedService, unitPrice, schedulePreview, addrLine, addrCity, addrPhone])

  const resetNewCustomerForm = useCallback(() => {
    setNcFirst('')
    setNcLast('')
    setNcEmail('')
    setNcPhone('')
  }, [])

  const submitNewCustomer = useCallback(async () => {
    const fn = ncFirst.trim()
    const ln = ncLast.trim()
    const email = ncEmail.trim()
    const phone = ncPhone.trim()
    if (fn.length < 2 || ln.length < 2) {
      Alert.alert('Invalid name', 'First and last name must be at least 2 characters.')
      return
    }
    if (!EMAIL_RE.test(email)) {
      Alert.alert('Invalid email', 'Enter a valid email address.')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid phone', 'Enter at least 10 digits (India numbers auto-prefix +91).')
      return
    }
    try {
      const { user, password } = await createCustomer({
        firstName: fn,
        lastName: ln,
        email,
        phone,
      }).unwrap()
      setSelectedCustomer(user)
      setCreatedPassword(password)
      setShowCreateForm(false)
      setCustomerQuery('')
      resetNewCustomerForm()
      Alert.alert(
        'Customer created',
        `${user.firstName} ${user.lastName} is selected.\n\nTemporary password:\n${password}\n\nShare this with the customer securely.`,
      )
    } catch (e) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Could not create customer'
      Alert.alert('Error', msg)
    }
  }, [ncFirst, ncLast, ncEmail, ncPhone, createCustomer, resetNewCustomerForm])

  const openCreateForm = useCallback(() => {
    // Pre-fill from whatever the user already typed in the search box.
    const q = customerQuery.trim()
    if (q) {
      if (EMAIL_RE.test(q)) setNcEmail(q)
      else if (/\d/.test(q)) setNcPhone(q)
      else {
        const [first, ...rest] = q.split(/\s+/)
        setNcFirst(first ?? '')
        setNcLast(rest.join(' '))
      }
    }
    setShowCreateForm(true)
  }, [customerQuery])

  const submit = useCallback(async () => {
    if (!selectedCustomer || !selectedService) return
    const scheduledDate = new Date(scheduledLocal)
    if (!isValidDate(scheduledDate)) {
      Alert.alert('Invalid date', 'Enter schedule as YYYY-MM-DDTHH:mm (local time).')
      return
    }
    const scheduledIso = scheduledDate.toISOString()
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
          onPress: () => navigation.replace('BookingDetail', { id: bid }),
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
                      {done ? (
                        <Icon name="check" size={15} color={palette.onPrimary} />
                      ) : (
                        <Text
                          variant="caption"
                          color={active ? 'onPrimary' : 'mute'}
                          style={styles.stepNumber}
                        >
                          {n}
                        </Text>
                      )}
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
                      <View style={[styles.stepLine, n < step && styles.stepLineDone]} />
                    ) : null}
                  </View>
                )
              })}
            </View>

            {/* STEP 1 — CUSTOMER */}
            {step === 1 ? (
              <View style={styles.section}>
                <Text variant="displaySm" color="ink">
                  Who's the customer?
                </Text>

                {selectedCustomer ? (
                  <Card variant="content" padding="lg" style={styles.selectedCard}>
                    <View style={styles.selectedRow}>
                      <View style={styles.avatar}>
                        <Icon name="user" size={20} color={palette.primary} />
                      </View>
                      <View style={styles.flex}>
                        <Text variant="bodyMdStrong" color="ink">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </Text>
                        <Text variant="bodySm" color="body">
                          {selectedCustomer.email}
                        </Text>
                        {selectedCustomer.phone ? (
                          <Text variant="caption" color="mute">
                            {selectedCustomer.phone}
                          </Text>
                        ) : null}
                      </View>
                      <Pressable
                        hitSlop={10}
                        onPress={() => {
                          setSelectedCustomer(null)
                          setCreatedPassword(null)
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Change customer"
                      >
                        <Text variant="bodySmStrong" color="primary">
                          Change
                        </Text>
                      </Pressable>
                    </View>
                    {createdPassword ? (
                      <View style={styles.passwordNote}>
                        <Icon name="shield" size={14} color={palette.success} />
                        <Text variant="caption" color="body" style={styles.flex}>
                          Temp password{' '}
                          <Text variant="bodySmStrong" color="ink">
                            {createdPassword}
                          </Text>{' '}
                          — share securely.
                        </Text>
                      </View>
                    ) : null}
                  </Card>
                ) : null}

                {!selectedCustomer && !showCreateForm ? (
                  <>
                    <Input
                      label="Find customer"
                      placeholder="Name, email, or phone"
                      value={customerQuery}
                      onChangeText={setCustomerQuery}
                      autoCapitalize="none"
                      surface="canvas"
                      rightSlot={<Icon name="search" size={18} color={palette.mute} />}
                    />

                    {customerQuery.trim().length >= 2 ? (
                      <QueryState isLoading={searching} isError={false}>
                        {noCustomerResults ? (
                          <Card variant="soft" padding="lg" style={styles.emptyCard}>
                            <Text variant="bodyMdStrong" color="ink">
                              No customer found
                            </Text>
                            <Text variant="bodySm" color="body" style={styles.emptyText}>
                              “{customerQuery.trim()}” isn't in your directory yet. Create them to
                              continue.
                            </Text>
                            <Button
                              label="Create new customer"
                              iconLeft="plus"
                              onPress={openCreateForm}
                            />
                          </Card>
                        ) : (
                          <View style={styles.pickList}>
                            {(customerHits ?? []).map((item) => (
                              <Pressable
                                key={item.id}
                                style={styles.pickRow}
                                onPress={() => setSelectedCustomer(item)}
                              >
                                <View style={styles.avatarSm}>
                                  <Icon name="user" size={16} color={palette.primary} />
                                </View>
                                <View style={styles.flex}>
                                  <Text variant="bodyMdStrong" color="ink">
                                    {item.firstName} {item.lastName}
                                  </Text>
                                  <Text variant="caption" color="body">
                                    {item.email}
                                    {item.phone ? ` · ${item.phone}` : ''}
                                  </Text>
                                </View>
                                <Icon name="chevron-right" size={18} color={palette.mute} />
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </QueryState>
                    ) : (
                      <Pressable
                        style={styles.addCustomerRow}
                        onPress={openCreateForm}
                        accessibilityRole="button"
                      >
                        <View style={styles.avatarSm}>
                          <Icon name="plus" size={16} color={palette.primary} />
                        </View>
                        <Text variant="bodyMdStrong" color="primary">
                          Add a new customer
                        </Text>
                      </Pressable>
                    )}
                  </>
                ) : null}

                {/* Inline create-customer form */}
                {!selectedCustomer && showCreateForm ? (
                  <Card variant="content" padding="lg" style={styles.section}>
                    <View style={styles.formHeader}>
                      <Text variant="bodyMdStrong" color="ink">
                        New customer
                      </Text>
                      <Pressable
                        hitSlop={10}
                        onPress={() => {
                          setShowCreateForm(false)
                          resetNewCustomerForm()
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                      >
                        <Icon name="x" size={18} color={palette.mute} />
                      </Pressable>
                    </View>
                    <View style={styles.nameRow}>
                      <View style={styles.flex}>
                        <Input
                          label="First name"
                          value={ncFirst}
                          onChangeText={setNcFirst}
                          surface="softer"
                        />
                      </View>
                      <View style={styles.flex}>
                        <Input
                          label="Last name"
                          value={ncLast}
                          onChangeText={setNcLast}
                          surface="softer"
                        />
                      </View>
                    </View>
                    <Input
                      label="Email"
                      value={ncEmail}
                      onChangeText={setNcEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      surface="softer"
                    />
                    <Input
                      label="Phone"
                      value={ncPhone}
                      onChangeText={setNcPhone}
                      keyboardType="phone-pad"
                      surface="softer"
                      helperText="India numbers auto-prefix +91. A temporary password is generated automatically."
                    />
                    <Button
                      label="Create & select"
                      iconLeft="check"
                      loading={creatingCustomer}
                      onPress={() => void submitNewCustomer()}
                    />
                  </Card>
                ) : null}
              </View>
            ) : null}

            {/* STEP 2 — SERVICE */}
            {step === 2 ? (
              <View style={styles.section}>
                <Text variant="displaySm" color="ink">
                  Pick a service
                </Text>
                <Input
                  placeholder="Search services"
                  value={serviceQuery}
                  onChangeText={setServiceQuery}
                  autoCapitalize="none"
                  surface="canvas"
                  rightSlot={<Icon name="search" size={18} color={palette.mute} />}
                />

                {/* Quantity stepper */}
                <View style={styles.qtyRow}>
                  <Text variant="bodySmStrong" color="hairlineMid">
                    Quantity
                  </Text>
                  <View style={styles.stepperControls}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease quantity"
                    >
                      <Text variant="displaySm" color="ink">
                        −
                      </Text>
                    </Pressable>
                    <Text variant="bodyMdStrong" color="ink" style={styles.qtyValue}>
                      {qty}
                    </Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() => setQuantity((q) => q + 1)}
                      accessibilityRole="button"
                      accessibilityLabel="Increase quantity"
                    >
                      <Text variant="displaySm" color="ink">
                        +
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <QueryState
                  isLoading={catalogLoading}
                  isError={false}
                  isEmpty={!catalogLoading && filteredCatalog.length === 0}
                  emptyTitle="No services"
                  emptyDescription="No services match your search."
                >
                  <View style={styles.pickList}>
                    {filteredCatalog.map((item) => {
                      const active = selectedService?.id === item.id
                      return (
                        <Pressable
                          key={item.id}
                          style={[styles.pickRow, active && styles.pickActive]}
                          onPress={() => setSelectedService(item)}
                        >
                          <View style={styles.flex}>
                            <Text variant="bodyMdStrong" color="ink">
                              {item.name}
                            </Text>
                            <Text variant="caption" color="body">
                              ₹{(item.base_price ?? 0).toLocaleString('en-IN')} · GST{' '}
                              {item.gst_percentage ?? 18}%
                            </Text>
                          </View>
                          {active ? (
                            <View style={styles.checkDot}>
                              <Icon name="check" size={14} color={palette.onPrimary} />
                            </View>
                          ) : (
                            <Icon name="chevron-right" size={18} color={palette.mute} />
                          )}
                        </Pressable>
                      )
                    })}
                  </View>
                </QueryState>
              </View>
            ) : null}

            {/* STEP 3 — SCHEDULE & ADDRESS */}
            {step === 3 ? (
              <View style={styles.section}>
                <Text variant="displaySm" color="ink">
                  Schedule & address
                </Text>

                <View style={styles.chipRow}>
                  {SCHEDULE_CHIPS.map((chip) => (
                    <Pressable
                      key={chip.key}
                      style={styles.chip}
                      onPress={() => setScheduledLocal(quickSchedule(chip.key))}
                      accessibilityRole="button"
                    >
                      <Icon name="clock" size={14} color={palette.primary} />
                      <Text variant="caption" color="primary">
                        {chip.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Input
                  label="Schedule (YYYY-MM-DDTHH:mm)"
                  placeholder="2026-06-05T14:30"
                  value={scheduledLocal}
                  onChangeText={setScheduledLocal}
                  autoCapitalize="none"
                  surface="canvas"
                  error={schedulePreview === 'invalid' ? 'Enter a valid date & time.' : undefined}
                  helperText={
                    schedulePreview && schedulePreview !== 'invalid' ? schedulePreview : undefined
                  }
                />

                <Input label="Address line" value={addrLine} onChangeText={setAddrLine} surface="canvas" />
                <View style={styles.nameRow}>
                  <View style={styles.flex}>
                    <Input label="City" value={addrCity} onChangeText={setAddrCity} surface="canvas" />
                  </View>
                  <View style={styles.flex}>
                    <Input label="State" value={addrState} onChangeText={setAddrState} surface="canvas" />
                  </View>
                </View>
                <View style={styles.nameRow}>
                  <View style={styles.flex}>
                    <Input
                      label="PIN"
                      value={addrZip}
                      onChangeText={setAddrZip}
                      keyboardType="number-pad"
                      surface="canvas"
                    />
                  </View>
                  <View style={styles.flex}>
                    <Input
                      label="Phone"
                      value={addrPhone}
                      onChangeText={setAddrPhone}
                      keyboardType="phone-pad"
                      surface="canvas"
                    />
                  </View>
                </View>
                <Input
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  surface="canvas"
                />
              </View>
            ) : null}

            {/* STEP 4 — REVIEW */}
            {step === 4 ? (
              <View style={styles.section}>
                <Text variant="displaySm" color="ink">
                  Review & confirm
                </Text>

                <Card variant="content" padding="lg" style={styles.reviewCard}>
                  <ReviewRow
                    icon="user"
                    label="Customer"
                    value={`${selectedCustomer?.firstName ?? ''} ${selectedCustomer?.lastName ?? ''}`.trim()}
                    sub={selectedCustomer?.email}
                  />
                  <View style={styles.divider} />
                  <ReviewRow
                    icon="briefcase"
                    label="Service"
                    value={`${selectedService?.name ?? ''} × ${qty}`}
                  />
                  <View style={styles.divider} />
                  <ReviewRow
                    icon="calendar"
                    label="Schedule"
                    value={schedulePreview && schedulePreview !== 'invalid' ? schedulePreview : '—'}
                  />
                  <View style={styles.divider} />
                  <ReviewRow
                    icon="map-pin"
                    label="Address"
                    value={[addrLine, addrCity, addrState].filter(Boolean).join(', ') || '—'}
                    sub={addrPhone || undefined}
                  />
                </Card>

                <Card variant="soft" padding="lg" style={styles.totalsCard}>
                  <View style={styles.totalRow}>
                    <Text variant="bodySm" color="body">
                      Subtotal
                    </Text>
                    <Text variant="bodySm" color="ink">
                      ₹{lineSubtotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text variant="bodySm" color="body">
                      GST ({gstPercent}%)
                    </Text>
                    <Text variant="bodySm" color="ink">
                      ₹{gstAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalRow}>
                    <Text variant="bodyMdStrong" color="ink">
                      Total
                    </Text>
                    <Text variant="displaySm" color="ink">
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text variant="caption" color="mute">
                    Payment: Cash on completion
                  </Text>
                </Card>
              </View>
            ) : null}
          </ScrollView>

          {/* Sticky footer nav */}
          <View style={styles.footer}>
            {step > 1 ? (
              <View style={styles.footerBack}>
                <Button
                  label="Back"
                  variant="secondary"
                  iconLeft="chevron-left"
                  onPress={() => setStep((s) => (s - 1) as Step)}
                />
              </View>
            ) : null}
            <View style={styles.footerNext}>
              {step < 4 ? (
                <Button
                  label="Next"
                  iconRight="arrow-right"
                  disabled={!canNext}
                  onPress={() => setStep((s) => (s + 1) as Step)}
                />
              ) : (
                <Button
                  label="Create booking"
                  iconLeft="check"
                  loading={submitting}
                  onPress={() => void submit()}
                />
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Screen>
    </PermissionGate>
  )
}

function ReviewRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: 'user' | 'briefcase' | 'calendar' | 'map-pin'
  label: string
  value: string
  sub?: string
}) {
  return (
    <View style={styles.reviewRow}>
      <View style={styles.avatarSm}>
        <Icon name={icon} size={16} color={palette.primary} />
      </View>
      <View style={styles.flex}>
        <Text variant="caption" color="mute">
          {label}
        </Text>
        <Text variant="bodyMdStrong" color="ink">
          {value || '—'}
        </Text>
        {sub ? (
          <Text variant="caption" color="body">
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const STEP_DOT_SIZE = 28

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: spacing.xxxl, gap: spacing.lg },
  section: { gap: spacing.md },
  selectedCard: { gap: spacing.md },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.successSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  emptyCard: { gap: spacing.md, alignItems: 'flex-start' },
  emptyText: { marginBottom: spacing.xs },
  pickList: { gap: spacing.sm },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    backgroundColor: palette.canvas,
  },
  pickActive: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.canvas,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.surfacePressed,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: palette.canvasSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { minWidth: 28, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.primarySoft,
  },
  reviewCard: { gap: spacing.md },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.surfacePressed,
  },
  totalsCard: { gap: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.surfacePressed,
    backgroundColor: palette.canvasSoft,
  },
  footerBack: { flex: 1 },
  footerNext: { flex: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  stepWrap: { flex: 1, alignItems: 'center', position: 'relative' },
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
  stepDotActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  stepDotDone: { backgroundColor: palette.success, borderColor: palette.success },
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
