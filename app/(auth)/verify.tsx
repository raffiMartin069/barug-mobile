// app/(auth)/verify.tsx
import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
import { supabase } from '@/constants/supabase'
import { useNiceModal } from '@/hooks/NiceModalProvider'
import { sendOtp, verifyOtp } from '@/services/auth'

const RESEND_SECONDS = 30
const PRIMARY = '#310101'

export default function Verify() {
  const { showModal, hideModal } = useNiceModal()

  const params = useLocalSearchParams<{ phone?: string | string[] }>()
  const phone = useMemo(
    () => (Array.isArray(params.phone) ? params.phone[0] : params.phone) ?? '',
    [params.phone]
  )

  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [focused, setFocused] = useState<number | null>(null)
  const inputs = useRef<Array<TextInput | null>>([])

  const focusNext = (i: number) => inputs.current[i + 1]?.focus()
  const focusPrev = (i: number) => inputs.current[i - 1]?.focus()

  const handleChange = (text: string, i: number) => {
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

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, i: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (code[i]) {
        const next = [...code]; next[i] = ''; setCode(next); return
      }
      if (i > 0) {
        const next = [...code]; next[i - 1] = ''; setCode(next); focusPrev(i)
      }
    }
  }

  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setResendIn(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const otp = code.join('')
  const ready = /^\d{6}$/.test(otp)

  const verify = async () => {
    if (busy || !ready) return
    setBusy(true)
    try {
      await verifyOtp(String(phone), otp) // <-- uses services/auth.ts

      // proceed with your post-auth flow
      const { data: me, error: meErr } = await supabase.rpc('me_profile')
      if (meErr) {
        showModal({ title: 'Error', message: meErr.message, variant: 'error' })
        return
      }

      if (!me?.mpin_set) {
        router.replace('/(auth)/setup-mpin')
      } else {
        router.replace('/(auth)/enter-mpin')
      }
    } catch (e: any) {
      const msg = e?.message ?? 'Invalid or expired code'
      showModal({ title: 'Verification failed', message: msg, variant: 'warn' })
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!phone || resendIn > 0) return
    try {
      await sendOtp(String(phone)) // <-- uses services/auth.ts
      setResendIn(RESEND_SECONDS)
      showModal({ title: 'OTP sent', message: 'We’ve re-sent the code to your phone.', variant: 'success' })
      setTimeout(hideModal, 600)
    } catch (e: any) {
      showModal({ title: 'Failed to resend', message: e?.message ?? 'Something went wrong.', variant: 'error' })
    }
  }

  const maskedPhone = useMemo(() => {
    const d = String(phone).replace(/\D/g, '')
    if (d.length < 6) return phone || ''
    const head = d.slice(0, 5), tail = d.slice(-3)
    return `+${head}****${tail}`
  }, [phone])

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView safe style={{ justifyContent: 'center', flex: 1, padding: 20 }}>
        <ThemedCard style={styles.card}>
          <ThemedText title style={styles.title}>Verify your number</ThemedText>
          <ThemedText style={styles.subtitle}>Enter the 6-digit code we sent to:</ThemedText>
          <Spacer height={6} />
          <ThemedText style={styles.maskedNumber}>{maskedPhone}</ThemedText>

          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r }}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                  focused === i ? styles.otpBoxFocused : null,
                ]}
                keyboardType="number-pad"
                maxLength={1}
                autoFocus={i === 0}
                value={digit}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                onFocus={() => setFocused(i)}
                onBlur={() => setFocused(null)}
                textAlign="center"
                returnKeyType="done"
              />
            ))}
          </View>

          <Spacer height={16} />
          <ThemedButton disabled={!ready || busy} onPress={verify}>
            {busy ? <ActivityIndicator color="#fff" /> : <ThemedText btn>Verify &amp; Continue</ThemedText>}
          </ThemedButton>

          <Spacer height={14} />
          <View style={styles.resendRow}>
            <ThemedText style={styles.resendText}>Didn’t get the code?</ThemedText>
            <View style={[styles.resendChip, resendIn > 0 && styles.resendChipDisabled]}>
              <ThemedText
                style={[styles.resendChipText, resendIn > 0 && { opacity: 0.6 }]}
                onPress={resend}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend OTP'}
              </ThemedText>
            </View>
          </View>
        </ThemedCard>
      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 360,
    padding: 22,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#6b7280' },
  maskedNumber: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  otpRow: {
    marginTop: 18,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  otpBoxFilled: { borderColor: PRIMARY },
  otpBoxFocused: { borderColor: PRIMARY, transform: [{ scale: 1.04 }] },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  resendText: { color: '#6b7280' },
  resendChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resendChipDisabled: { backgroundColor: '#f3f4f6' },
  resendChipText: { fontWeight: '700', color: PRIMARY },
})
