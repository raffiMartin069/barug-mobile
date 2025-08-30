// app/(auth)/enter-mpin.tsx
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { supabase } from '../../constants/supabase'
import { markUnlocked } from '../../hooks/sessionUnlock'

const CIRCLE = 78
const MPIN_LEN = 4
const ATTEMPT_LIMIT = 5
const LOCK_SECONDS = 60
const LOCK_KEY = 'mpin_lock_until_ts'

// ----- Reusable modal (now with 2 buttons) -----
type ModalVariant = 'info' | 'success' | 'warn' | 'error'
const NiceModal = ({
  visible,
  title,
  message,
  variant = 'info',
  onClose,
  primaryText = 'OK',
  onPrimary,
  secondaryText,
  onSecondary,
}: {
  visible: boolean
  title: string
  message?: string
  variant?: ModalVariant
  onClose: () => void
  primaryText?: string
  onPrimary?: () => void
  secondaryText?: string
  onSecondary?: () => void
}) => {
  const palette = {
    info: { bg: '#28527a', icon: 'information-circle' as const },
    success: { bg: '#237a57', icon: 'checkmark-circle' as const },
    warn: { bg: '#441010ff', icon: 'alert-circle' as const },
    error: { bg: '#7a2323', icon: 'close-circle' as const },
  }[variant]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={mstyles.backdrop}>
        <View style={mstyles.card}>
          <View style={[mstyles.iconWrap, { backgroundColor: palette.bg }]}>
            <Ionicons name={palette.icon} size={28} color="#fff" />
          </View>
          <ThemedText title style={mstyles.modalTitle}>{title}</ThemedText>
          {!!message && <ThemedText style={mstyles.modalMsg}>{message}</ThemedText>}

          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            {secondaryText ? (
              <Pressable
                onPress={() => { onSecondary?.(); onClose(); }}
                style={({ pressed }) => [mstyles.secondaryBtn, pressed && { opacity: 0.9 }]}
              >
                <ThemedText style={{ fontWeight: '700', color: '#310101' }}>{secondaryText}</ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => { onPrimary?.(); onClose(); }}
              style={({ pressed }) => [mstyles.primaryBtn, pressed && { opacity: 0.9 }]}
            >
              <ThemedText btn>{primaryText}</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function maskPH(phone?: string) {
  if (!phone) return ''
  const cleaned = String(phone)
  const m = cleaned.match(/^\+?63(\d{2})\d{6}(\d{2})$/)
  if (m) return `+63 ${m[1]}•••••• ${m[2]}`
  const last2 = cleaned.slice(-2)
  return `•••••• ${last2}`
}

const Mpin = () => {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const attemptsRef = useRef(0)
  const [lockedUntil, setLockedUntil] = useState<number>(0)
  const [tick, setTick] = useState(0)

  // phone chip state
  const [phone, setPhone] = useState<string>('')
  const [loadingPhone, setLoadingPhone] = useState<boolean>(true)

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMsg, setModalMsg] = useState('')
  const [modalVariant, setModalVariant] = useState<ModalVariant>('info')
  const [modalPrimary, setModalPrimary] = useState<(() => void) | undefined>(undefined)
  const [modalSecondary, setModalSecondary] = useState<(() => void) | undefined>(undefined)
  const [modalPrimaryText, setModalPrimaryText] = useState('Got it')
  const [modalSecondaryText, setModalSecondaryText] = useState<string | undefined>(undefined)

  const isLocked = lockedUntil > Date.now()
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))

  // fetch registered phone once
  useEffect(() => {
    let alive = true
    const run = async () => {
      setLoadingPhone(true)
      try {
        const { data } = await supabase.rpc('me_profile')
        if (!alive) return
        if (data?.contact_number) setPhone(String(data.contact_number))
      } finally {
        if (alive) setLoadingPhone(false)
      }
    }
    run()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const rawLoad = async () => {
      const raw = await AsyncStorage.getItem(LOCK_KEY)
      const ts = raw ? parseInt(raw, 10) : 0
      if (ts && ts > Date.now()) setLockedUntil(ts)
      else if (ts) await AsyncStorage.removeItem(LOCK_KEY)
    }
    rawLoad()
  }, [])

  useEffect(() => {
    if (!isLocked) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [isLocked])

  useEffect(() => {
    if (!isLocked && lockedUntil) {
      AsyncStorage.removeItem(LOCK_KEY).catch(() => {})
      setLockedUntil(0)
      attemptsRef.current = 0
    }
  }, [isLocked, lockedUntil])

  const keys = useMemo(() => ['1','2','3','4','5','6','7','8','9','blank','0','back'], [])

  const openModal = (
    title: string,
    message = '',
    variant: ModalVariant = 'info',
    opts?: { primaryText?: string; onPrimary?: () => void; secondaryText?: string; onSecondary?: () => void }
  ) => {
    setModalTitle(title)
    setModalMsg(message)
    setModalVariant(variant)
    setModalPrimary(() => opts?.onPrimary)
    setModalSecondary(() => opts?.onSecondary)
    setModalPrimaryText(opts?.primaryText ?? 'Got it')
    setModalSecondaryText(opts?.secondaryText)
    setModalOpen(true)
  }

  const verifyNow = async (value: string) => {
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('verify_mpin', { p_pin: value })
      if (error) {
        setPin('')
        openModal('Unlock failed', error.message, 'error')
        return
      }
      if (!data) {
        attemptsRef.current += 1
        const remaining = Math.max(0, ATTEMPT_LIMIT - attemptsRef.current)
        setPin('')
        if (remaining <= 0) {
          const until = Date.now() + LOCK_SECONDS * 1000
          setLockedUntil(until)
          await AsyncStorage.setItem(LOCK_KEY, String(until))
          attemptsRef.current = 0
          openModal('Too many attempts', `You’re temporarily locked. Try again in ${LOCK_SECONDS} seconds.`, 'warn')
          return
        }
        openModal('Incorrect MPIN', `You still have ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} left before a temporary lock.`, 'warn')
        return
      }

      // ✅ Success
      markUnlocked()
      attemptsRef.current = 0
      setPin('')
      openModal('Unlocked', 'Welcome back!', 'success')
      setTimeout(() => {
        setModalOpen(false)
        router.replace('/(resident)/(tabs)/residenthome')
      }, 600)
    } finally {
      setBusy(false)
    }
  }

  const pushDigit = async (d: string) => {
    if (busy || isLocked) return
    if (!/^\d$/.test(d)) return
    if (pin.length >= MPIN_LEN) return
    const newPin = pin + d
    setPin(newPin)
    if (newPin.length === MPIN_LEN) await verifyNow(newPin)
  }

  const popDigit = () => {
    if (busy || isLocked) return
    setPin(prev => prev.slice(0, -1))
  }

  // Confirm flows
  const confirmForgot = () => {
    openModal(
      'Verify via OTP',
      'We’ll sign you out and send an OTP to your registered number to reset your MPIN. Continue?',
      'warn',
      {
        primaryText: 'Continue',
        onPrimary: () => router.push('/(auth)/forgot-mpin'),
        secondaryText: 'Cancel',
      }
    )
  }

  const confirmUseAnother = () => {
    openModal(
      'Use another number',
      'Signing in with a different number will log you out of this session. Do you want to sign out now?',
      'warn',
      {
        primaryText: 'Sign out',
        onPrimary: async () => {
          await supabase.auth.signOut()
          router.replace('/(auth)/phone')
        },
        secondaryText: 'Cancel',
      }
    )
  }

  const masked = maskPH(phone)

  return (
    <ThemedView safe>
      <Image source={require('@/assets/images/icon-.png')} style={styles.image} />
      <ThemedText style={{ textAlign: 'center' }} title>Barangay Sto. Niño</ThemedText>

      {/* Registered phone chip */}
      <View style={styles.phoneRow}>
        <View style={styles.phoneChip}>
          <Ionicons name="call-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={styles.phoneChipText}>
            {loadingPhone ? 'Fetching phone…' : (masked ? `Registered: ${masked}` : 'No phone on file')}
          </ThemedText>
        </View>
      </View>

      <Spacer />

      <View style={styles.header}>
        <ThemedText style={styles.text}>{isLocked ? 'Locked' : 'Enter your MPIN'}</ThemedText>
        {isLocked && <ThemedText style={{ marginTop: 6, opacity: 0.8 }}>Try again in {secondsLeft}s</ThemedText>}
      </View>

      <View style={styles.dots}>
        {Array.from({ length: MPIN_LEN }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, (busy || isLocked) && styles.dotDim]} />
        ))}
      </View>

      {busy && <ActivityIndicator style={{ marginVertical: 10 }} color="#310101" />}

      <View style={[styles.pad, (busy || isLocked) && { opacity: 0.4 }]}>
        {keys.map((k, i) => {
          if (k === 'blank') return <View key={i} style={styles.keyBlank} />
          if (k === 'back') {
            return (
              <Pressable key={i} onPress={popDigit} disabled={busy || isLocked}
                style={({ pressed }) => [styles.key, pressed && !isLocked && !busy && styles.keyPressed]}>
                <Ionicons name="backspace-outline" size={20} color={'#fff'} />
              </Pressable>
            )
          }
          return (
            <Pressable key={i} onPress={() => pushDigit(k)} disabled={busy || isLocked}
              style={({ pressed }) => [styles.key, pressed && !isLocked && !busy && styles.keyPressed]}>
              <ThemedText btn>{k}</ThemedText>
            </Pressable>
          )
        })}
      </View>

      <Spacer />

      <View style={styles.actionsRow}>
        <Pressable onPress={confirmForgot} disabled={busy}>
          <ThemedText style={styles.link}>Forgot MPIN?</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.push('/(auth)/change-mpin')} disabled={busy}>
          <ThemedText style={styles.link}>Change MPIN</ThemedText>
        </Pressable>
        <Pressable onPress={confirmUseAnother} disabled={busy}>
          <ThemedText style={styles.link}>Use another number</ThemedText>
        </Pressable>
      </View>

      {/* Pretty alerts / confirms */}
      <NiceModal
        visible={modalOpen}
        title={modalTitle}
        message={modalMsg}
        variant={modalVariant}
        onClose={() => setModalOpen(false)}
        primaryText={modalPrimaryText}
        onPrimary={modalPrimary}
        secondaryText={modalSecondaryText}
        onSecondary={modalSecondary}
      />
    </ThemedView>
  )
}

export default Mpin

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },

  phoneRow: { alignItems: 'center', marginTop: 12 },
  phoneChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#310101', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  phoneChipText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  header: { alignItems: 'center', marginTop: 8 },
  text: { fontSize: 18, fontWeight: '600' },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 24, marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 999, borderWidth: 2, borderColor: '#310101', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#310101' },
  dotDim: { opacity: 0.5 },

  pad: { marginTop: 12, alignSelf: 'center', width: '90%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 20 },
  keyBlank: { width: CIRCLE, height: CIRCLE, marginVertical: 10, opacity: 0 },
  key: {
    width: CIRCLE,
    height: CIRCLE,
    marginVertical: 10,
    borderRadius: CIRCLE / 2,
    backgroundColor: '#310101',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  keyPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, gap: 10 },
  link: { fontWeight: '700', textAlign: 'center', padding: 10 },
})

const mstyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    gap: 10,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  modalTitle: { textAlign: 'center' },
  modalMsg: { textAlign: 'center', opacity: 0.9, marginBottom: 6 },
  primaryBtn: { flex: 1, borderRadius: 12, backgroundColor: '#310101', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#310101', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
})
