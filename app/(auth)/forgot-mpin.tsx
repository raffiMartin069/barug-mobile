// app/(auth)/forgot-mpin.tsx
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useNiceModal } from '@/hooks/NiceModalProvider'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { supabase } from '../../constants/supabase'
import { resetUnlocked } from '../../hooks/sessionUnlock'

type Step = 'confirm' | 'otp' | 'reset'

export default function ForgotMpin() {
  const { showModal, hideModal } = useNiceModal()

  const [phoneHint, setPhoneHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<Step>('confirm')
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState<string>('')

  // resend OTP timer
  const RESEND_SECONDS = 30
  const [resendAt, setResendAt] = useState<number>(0)
  const [tick, setTick] = useState(0)
  const secondsLeft = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000))

  useEffect(() => {
    if (!resendAt) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [resendAt])

  const steps = useMemo(
    () => [
      { key: 'confirm', label: 'Confirm' },
      { key: 'otp', label: 'OTP' },
      { key: 'reset', label: 'Reset' },
    ] as { key: Step; label: string }[],
    []
  )

  const open = (title: string, message = '', variant: 'info'|'success'|'warn'|'error' = 'info') =>
    showModal({ title, message, variant, primaryText: 'Got it' })

  const sendOtp = async () => {
    if (busy) return
    setBusy(true)
    try {
      // 1) fetch the registered number
      const { data, error } = await supabase.rpc('me_profile')
      if (error || !data?.contact_number) {
        open('Can’t send OTP', 'We can’t find your registered phone number.', 'error')
        return
      }
      const ph = String(data.contact_number)

      // 2) optional sanity check: last 2 digits
      if (phoneHint && !ph.endsWith(phoneHint)) {
        open('Phone check failed', 'The last two digits you entered don’t match our records.', 'warn')
        return
      }

      // 3) sign out → re-auth via OTP
      await supabase.auth.signOut()

      const { error: otpErr } = await supabase.auth.signInWithOtp({
        phone: ph,
        options: { channel: 'sms', shouldCreateUser: false },
      })
      if (otpErr) {
        open('Failed to send OTP', otpErr.message, 'error')
        return
      }

      setPhone(ph)
      setStep('otp')
      setResendAt(Date.now() + RESEND_SECONDS * 1000)
      open('OTP sent', 'We’ve sent a 6-digit code to your phone.', 'success')
    } finally {
      setBusy(false)
    }
  }

  const verifyOtp = async () => {
    if (busy) return
    setBusy(true)
    try {
      const { data: sessionData, error: verifyErr } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      } as any)
      if (verifyErr || !sessionData?.session) {
        open('Invalid code', 'Please double-check the 6-digit OTP and try again.', 'warn')
        return
      }
      setStep('reset')
      open('Verified', 'Your identity has been confirmed.', 'success')
    } finally {
      setBusy(false)
    }
  }

  const doReset = async () => {
    if (busy) return
    setBusy(true)
    try {
      // 1) clear MPIN server-side (RPC handles auth & rate limits)
      const { error } = await supabase.rpc('reset_mpin_after_reauth', { p_reason: 'FORGOT' })
      if (error) {
        open('Reset failed', error.message, 'error')
        return
      }

      // 2) lock this app run
      resetUnlocked()

      // 3) wait until backend reflects mpin_set = false (best-effort)
      let cleared = false
      for (let i = 0; i < 15; i++) {
        try {
          const { data } = await supabase.rpc('me_profile')
          if (data && !data.mpin_set) { cleared = true; break }
        } catch {}
        await new Promise(r => setTimeout(r, 150))
      }

      open('MPIN cleared', 'Please set a new MPIN to continue.', 'success')
      setTimeout(() => {
        hideModal()
        router.replace('/(auth)/setup-mpin')
      }, 500)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (secondsLeft > 0 || busy || !phone) return
    await sendOtp()
  }

  const maskedPhone = phone ? phone.replace(/^\+?63(\d{2})\d{6}(\d{2})$/, '+63 $1•••••• $2') : 'your registered number'

  return (
    <ThemedView safe>
      <View style={styles.wrap}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="keypad-outline" size={22} color="#310101" />
          <ThemedText title style={styles.title}>Forgot MPIN</ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>We’ll verify you with an OTP to {maskedPhone}.</ThemedText>

        {/* Stepper */}
        <View style={styles.stepper}>
          {steps.map((s, i) => {
            const active = s.key === step
            return (
              <View key={s.key} style={styles.stepItem}>
                <View style={[styles.stepDot, active && styles.stepDotActive]} />
                <ThemedText style={[styles.stepLabel, active && styles.stepLabelActive]}>{s.label}</ThemedText>
                {i < steps.length - 1 && <View style={styles.stepLine} />}
              </View>
            )
          })}
        </View>

        {/* Card */}
        <View style={styles.card}>
          {step === 'confirm' && (
            <>
              <ThemedText style={styles.cardTitle}>Confirm your phone</ThemedText>
              <ThemedText style={styles.p}>
                Enter the last two digits of your registered phone number.
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g. xxxxxxxxx45"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={2}
                value={phoneHint}
                onChangeText={setPhoneHint}
              />
              <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={sendOtp} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <ThemedText btn>Send OTP</ThemedText>}
              </Pressable>
            </>
          )}

          {step === 'otp' && (
            <>
              <ThemedText style={styles.cardTitle}>Enter the code</ThemedText>
              <ThemedText style={styles.p}>
                We sent a 6-digit code to {maskedPhone}.
              </ThemedText>
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.btn,
                  (busy || otp.length < 6) && styles.btnDisabled,
                  pressed && !(busy || otp.length < 6) && styles.pressed,
                ]}
                onPress={verifyOtp}
                disabled={busy || otp.length < 6}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <ThemedText btn>Verify</ThemedText>}
              </Pressable>

              <Spacer />
              <Pressable onPress={resend} disabled={busy || secondsLeft > 0} style={styles.linkRow}>
                <Ionicons name="refresh-outline" size={16} color={secondsLeft > 0 ? '#9ca3af' : '#310101'} />
                <ThemedText style={[styles.link, secondsLeft > 0 && { color: '#9ca3af' }]}>
                  {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                </ThemedText>
              </Pressable>
            </>
          )}

          {step === 'reset' && (
            <>
              <ThemedText style={styles.cardTitle}>Reset MPIN</ThemedText>
              <ThemedText style={styles.p}>
                Your identity is verified. We’ll clear your MPIN and require setup again.
              </ThemedText>
              <Pressable style={({ pressed }) => [styles.btn, pressed && styles.pressed]} onPress={doReset} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <ThemedText btn>Continue</ThemedText>}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#310101' },
  subtitle: { opacity: 0.8, textAlign: 'center', marginBottom: 14 },

  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e5e7eb' },
  stepDotActive: { backgroundColor: '#310101' },
  stepLabel: { marginLeft: 6, marginRight: 10, color: '#6b7280', fontWeight: '600' },
  stepLabelActive: { color: '#310101' },
  stepLine: { width: 22, height: 2, backgroundColor: '#e5e7eb', marginRight: 10, borderRadius: 2 },

  card: {
    width: '100%',
    maxWidth: 340, // 👈 constrain so it looks neat in center
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: 'stretch',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  p: { opacity: 0.85, marginBottom: 10, textAlign: 'center' },

  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#310101',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  link: { fontWeight: '700', color: '#310101' },
})
