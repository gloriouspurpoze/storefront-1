import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ListMeta } from '@/components/common/ListMeta'
import { Screen } from '@/components/layout/Screen'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PermissionGate } from '@/navigation/guards/PermissionGate'
import { useCreateCrmContactMutation } from '@/store/api/phase2Api'
import { spacing } from '@/theme'

export function CrmContactFormScreen() {
  const navigation = useNavigation()
  const [createContact, { isLoading }] = useCreateCrmContactMutation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [locality, setLocality] = useState('')
  const [notes, setNotes] = useState('')

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Missing fields', 'First name, last name, and email are required.')
      return
    }
    try {
      await createContact({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        locality: locality.trim() || undefined,
        notes: notes.trim() || undefined,
        lifecycle: 'inquiry',
      }).unwrap()
      navigation.goBack()
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : 'Could not save contact'
      Alert.alert('Error', msg)
    }
  }

  return (
    <PermissionGate webPath="/crm">
      <Screen surface="soft">
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <ListMeta text="CRM lead capture" />
          <Input label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" surface="canvas" />
          <Input label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" surface="canvas" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            surface="canvas"
          />
          <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" surface="canvas" />
          <Input label="Locality / area" value={locality} onChangeText={setLocality} surface="canvas" />
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={styles.notes}
            surface="canvas"
          />
          <View style={styles.actions}>
            <Button label="Save contact" loading={isLoading} onPress={() => void submit()} />
            <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </Screen>
    </PermissionGate>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md, paddingBottom: spacing.xxxl },
  notes: { minHeight: 88, textAlignVertical: 'top' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
})
