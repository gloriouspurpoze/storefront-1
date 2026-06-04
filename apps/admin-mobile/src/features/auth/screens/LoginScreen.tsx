import { useRef, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Text } from '@/components/ui/Text'
import { Screen } from '@/components/layout/Screen'
import { clearAuthError, loginUser } from '@/store/slices/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { palette, spacing } from '@/theme'

const isDev = typeof __DEV__ !== 'undefined' && __DEV__

/** Matches fixer-backend seed / web admin super admin account. */
const DEV_DEFAULTS = {
  email: 'superadmin@profixer.in',
  password: 'SuperAdmin@123',
}

export function LoginScreen() {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((s) => s.auth)

  const [email, setEmail] = useState(isDev ? DEV_DEFAULTS.email : '')
  const [password, setPassword] = useState(isDev ? DEV_DEFAULTS.password : '')
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({})

  const passwordRef = useRef<TextInput>(null)

  const emailError = touched.email && !email.trim() ? 'Email is required' : undefined
  const passwordError = touched.password && !password ? 'Password is required' : undefined

  const isValid = email.trim().length > 0 && password.length > 0
  const canSubmit = isValid && !isLoading

  const onSubmit = () => {
    setTouched({ email: true, password: true })
    if (!isValid) return
    dispatch(clearAuthError())
    dispatch(loginUser({ email: email.trim(), password }))
  }

  const fillDevCreds = () => {
    setEmail(DEV_DEFAULTS.email)
    setPassword(DEV_DEFAULTS.password)
    setTouched({})
    dispatch(clearAuthError())
  }

  return (
    <Screen surface="canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandMark}>
            <Icon name="shield" size={28} color={palette.onPrimary} strokeWidth={2.4} />
          </View>

          <View style={styles.header}>
            <Text variant="displayLg" color="ink">
              Welcome back
            </Text>
            <Text variant="bodyLg" color="body">
              Sign in to your Profixer admin account.
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email or username"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              returnKeyType="next"
              value={email}
              onChangeText={(v) => {
                setEmail(v)
                if (error) dispatch(clearAuthError())
              }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              onSubmitEditing={() => passwordRef.current?.focus()}
              error={emailError}
              editable={!isLoading}
              placeholder="you@example.com"
            />

            <PasswordInput
              ref={passwordRef}
              label="Password"
              textContentType="password"
              autoComplete="password"
              returnKeyType="go"
              value={password}
              onChangeText={(v) => {
                setPassword(v)
                if (error) dispatch(clearAuthError())
              }}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              onSubmitEditing={onSubmit}
              error={passwordError}
              editable={!isLoading}
              placeholder="Enter your password"
            />

            {error ? (
              <Card variant="soft" padding="lg" style={styles.errorBox}>
                <View style={styles.errorRow}>
                  <Icon name="alert-circle" size={18} color={palette.danger} />
                  <Text variant="bodySmStrong" color="danger">
                    Sign-in failed
                  </Text>
                </View>
                <Text variant="bodySm" color="body" style={styles.errorBody}>
                  {error}
                </Text>
              </Card>
            ) : null}

            <Button
              label="Sign in"
              loading={isLoading}
              disabled={!canSubmit}
              onPress={onSubmit}
              size="lg"
            />

            {isDev ? (
              <Pressable
                onPress={fillDevCreds}
                disabled={isLoading}
                accessibilityRole="button"
                style={({ pressed }) => [styles.devBtn, pressed && styles.devBtnPressed]}
              >
                <Text variant="bodySmStrong" color="link">
                  Use dev superadmin credentials
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Text variant="caption" color="mute" align="center" style={styles.legal}>
            By continuing you agree to the Profixer admin terms of use.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.xxl,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: spacing.xs },
  form: { gap: spacing.lg },
  errorBox: {
    backgroundColor: palette.dangerSoft,
    gap: spacing.xxs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorBody: {
    paddingLeft: spacing.lg + spacing.xs,
  },
  devBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
  },
  devBtnPressed: {
    backgroundColor: palette.canvasSoft,
  },
  legal: {
    marginTop: spacing.sm,
  },
})
