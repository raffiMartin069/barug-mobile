// app/(auth)/verify.tsx
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TouchableWithoutFeedback,
  View,
} from 'react-native'

import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'

import { supabase } from '../../constants/supabase'

const RESEND_SECONDS = 30

export default function Verify() {
  const params = useLocalSearchParams<{ phone?: string | string[] }>()
  const phone = useMemo(
    () => (Array.isArray(params.phone) ? params.phone[0] : params.phone) ?? '',
    [params.phone]
  )

  // ----- OTP UI state (ported from otp.tsx) -----
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const inputs = useRef<Array<TextInput | null>>([])

  const focusNext = (i: number) => inputs.current[i + 1]?.focus()
  const focusPrev = (i: number) => inputs.current[i - 1]?.focus()

  const handleChange = (text: string, i: number) => {
    // Handle paste of multiple digits
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, 6).split('')
      const next = [...code]
      for (let k = 0; k < 6; k++) next[k] = digits[k] ?? next[k]
      setCode(next)
      const last = Math.min(digits.length - 1, 5)
      if (last >= i) inputs.current[last]?.focus()
      return
    }
    const next = [...code]
    next[i] = text.replace(/\D/g, '').slice(0, 1)
    setCode(next)
    if (next[i] && i < 5) focusNext(i)
  }

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    i: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (code[i]) {
        const next = [...code]
        next[i] = ''
        setCode(next)
        return
      }
      if (i > 0) {
        const next = [...code]
        next[i - 1] = ''
        setCode(next)
        focusPrev(i)
      }
    }
  }

  // ----- Verify / resend logic (kept from your verify.tsx) -----
  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(
      () => setResendIn((s) => (s > 0 ? s - 1 : 0)),
      1000
    )
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const otp = code.join('')
  const ready = /^\d{6}$/.test(otp)

  const verify = async () => {
    if (busy) return
    if (!ready) return Alert.alert('Invalid code', 'Enter the 6-digit code.')
    setBusy(true)
    try {
      const { error: otpErr } = await supabase.auth.verifyOtp({
        phone: String(phone),
        token: otp,
        type: 'sms',
      })
      if (otpErr) {
        Alert.alert('Invalid / expired code', otpErr.message)
        return
      }

      // Link by phone (choose PH/US linker as in your original)
      const digits = String(phone).replace(/\D/g, '')
      const linker =
        digits.startsWith('63') || digits.startsWith('09') || digits.startsWith('9')
          ? 'link_test_person_by_phone'
          : 'link_test_person_by_temp_number'
      const { error: linkErr } = await supabase.rpc(linker, { p_phone: phone })
      if (linkErr) {
        Alert.alert('Account not found', linkErr.message)
        return
      }

      // Decide next
      const { data: me, error: meErr } = await supabase.rpc('me_profile')
      if (meErr) {
        Alert.alert('Error', meErr.message)
        return
      }
      if (!me?.mpin_set) {
        router.replace({ pathname: '/(auth)/setup-mpin' })
      } else {
        router.replace({ pathname: '/(resident)/(tabs)/residenthome' })
      }
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!phone || resendIn > 0) return
    await supabase.auth.signInWithOtp({
      phone: String(phone),
      options: { channel: 'sms' },
    })
    setResendIn(RESEND_SECONDS)
  }

  const maskedPhone = useMemo(() => {
    const d = String(phone).replace(/\D/g, '')
    if (d.length < 6) return phone || ''
    // show +63XXX****XXX format
    const head = d.slice(0, 5)
    const tail = d.slice(-3)
    return `+${head}****${tail}`
  }, [phone])

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView safe>
        <ThemedCard>
          <ThemedText>
            We sent a 6-digit authentication code to your registered mobile number
          </ThemedText>

          <Spacer />

          <ThemedText style={styles.maskedNumber}>{maskedPhone}</ThemedText>

          <Spacer />

          <ThemedText>Please enter the authentication code</ThemedText>

          <View style={styles.otpContainer}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  inputs.current[i] = r
                }}
                style={styles.otpInput}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={1}
                autoFocus={i === 0}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                textAlign="center"
                returnKeyType="done"
                importantForAutofill="yes"
                autoComplete="one-time-code"
              />
            ))}
          </View>

          <Spacer />

          <ThemedText style={{ textAlign: 'center' }}>
            Didn&apos;t get the code?{' '}
            <ThemedText link onPress={resend}>
              {resendIn > 0 ? `Resend in ${resendIn}s` : 'Tap here to resend'}
            </ThemedText>
          </ThemedText>

          <Spacer height={10} />

          <ThemedButton disabled={!ready || busy} onPress={verify}>
            {busy ? (
              <ActivityIndicator />
            ) : (
              <ThemedText btn>Verify &amp; Continue</ThemedText>
            )}
          </ThemedButton>
        </ThemedCard>
      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  maskedNumber: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700', // must be a string
  },
  otpInput: {
    borderBottomWidth: 2,
    borderColor: '#000',
    fontSize: 20,
    paddingVertical: 10,
    width: 44,
  },
})
