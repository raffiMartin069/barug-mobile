// app/(auth)/setup-mpin.tsx
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { supabase } from '../../constants/supabase'

const LOCAL_MPIN_NOT_SET = 'local_mpin_not_set'
const CIRCLE = 78
const MPIN_LEN = 4
const BRAND = '#310101'

// mask PH number → "+63 9X•••••• XX"
function maskPH(phone?: string) {
  if (!phone) return ''
  const cleaned = String(phone)
  const m = cleaned.match(/^\+?63(\d{2})\d{6}(\d{2})$/)
  if (m) return `+63 ${m[1]}•••••• ${m[2]}`
  // generic fallback: keep last 2
  const last2 = cleaned.replace(/\D/g, '').slice(-2)
  return last2 ? `•••••• ${last2}` : ''
}

export default function SetupMPIN() {
  const [stage, setStage] = useState<'a' | 'b'>('a')
  const [pinA, setPinA] = useState('')
  const [pinB, setPinB] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  // Registered phone chip
  const [phone, setPhone] = useState<string>('')
  const [loadingPhone, setLoadingPhone] = useState<boolean>(true)
  const masked = useMemo(() => maskPH(phone), [phone])

  const keys = useMemo(() => ['1','2','3','4','5','6','7','8','9','check','0','back'], [])

  const currentPin = stage === 'a' ? pinA : pinB
  const setCurrentPin = stage === 'a' ? setPinA : setPinB

  // Fetch registered phone once
  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoadingPhone(true)
      try {
        const { data } = await supabase.rpc('me_profile')
        if (!alive) return
        if (data?.contact_number) setPhone(String(data.contact_number))
      } finally {
        if (alive) setLoadingPhone(false)
      }
    })()
    return () => { alive = false }
  }, [])

  const pushDigit = (d: string) => {
    if (busy) return
    if (!/^\d$/.test(d)) return
    if (currentPin.length >= MPIN_LEN) return
    setCurrentPin(prev => prev + d)
  }

  const popDigit = () => { if (!busy) setCurrentPin(prev => prev.slice(0, -1)) }

  const goToEnterMpin = () => router.replace('/(auth)/enter-mpin')

  useEffect(() => {
    if (!done) return
    const t = setTimeout(goToEnterMpin, 600)
    return () => clearTimeout(t)
  }, [done])

  const onCheck = async () => {
    if (busy) return
    if (currentPin.length !== MPIN_LEN) return Alert.alert('MPIN must be 4 digits')

    if (stage === 'a') { setStage('b'); return }

    if (pinA !== pinB) {
      setPinB('')
      return Alert.alert('MPINs do not match')
    }

    setBusy(true)
    try {
      const { error } = await supabase.rpc('set_mpin', { p_pin: pinA })
      if (error) return Alert.alert('Failed to set MPIN', error.message)

      // Clear local "not set" override if any (from forgot flow)
      await AsyncStorage.removeItem(LOCAL_MPIN_NOT_SET).catch(() => {})

      // Poll briefly until me_profile reflects mpin_set=true
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.rpc('me_profile')
        if (data?.mpin_set) break
        await new Promise(r => setTimeout(r, 150))
      }

      setDone(true)
      // ✅ Always require Enter MPIN next (even right after setup)
      goToEnterMpin()
    } finally {
      setBusy(false)
    }
  }

  return (
    <ThemedView safe>
      <Image source={require('@/assets/images/icon-.png')} style={styles.image} />
      <ThemedText style={{ textAlign: 'center' }} title>Barangay Sto. Niño</ThemedText>

      {/* Registered phone chip */}
      <View style={styles.phoneRow}>
        <View style={styles.phoneChip}>
          <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={styles.phoneChipText}>
            {loadingPhone ? 'Fetching phone…' : (masked ? `Registered: ${masked}` : 'No phone on file')}
          </ThemedText>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color={BRAND} />
        <ThemedText style={styles.infoText}>
          Before you can proceed, please set up your 4-digit MPIN.
        </ThemedText>
      </View>
      <Spacer />

      <View style={styles.header}>
        <ThemedText style={styles.titleText}>Set your MPIN</ThemedText>
        <ThemedText style={styles.subtitleText}>
          {stage === 'a' ? 'Enter 4-digit MPIN' : 'Confirm MPIN'}
        </ThemedText>
      </View>

      <View style={styles.dots}>
        {Array.from({ length: MPIN_LEN }).map((_, i) => (
          <View key={i} style={styles.dotWrapper}>
            {i < currentPin.length
              ? <View style={[styles.dot, styles.dotFilled]} />
              : <ThemedText style={styles.placeholder}>-</ThemedText>
            }
          </View>
        ))}
      </View>

      {busy && <ActivityIndicator style={{ marginVertical: 10 }} color={BRAND} />}

      <View style={[styles.pad, busy && { opacity: 0.7 }]}>
        {keys.map((k, i) => {
          if (k === 'back') {
            return (
              <Pressable key={i} onPress={popDigit} disabled={busy}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
                <Ionicons name="backspace-outline" size={20} color="#fff" />
              </Pressable>
            )
          }
          if (k === 'check') {
            return (
              <Pressable key={i} onPress={onCheck} disabled={busy}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed, styles.primaryKey]}>
                <Ionicons name="checkmark" size={24} color="#fff" />
              </Pressable>
            )
          }
          return (
            <Pressable key={i} onPress={() => pushDigit(k)} disabled={busy}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
              <ThemedText btn>{k}</ThemedText>
            </Pressable>
          )
        })}
      </View>

      <Modal visible={done} transparent animationType="fade" onRequestClose={goToEnterMpin}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.checkMark}><Ionicons name="checkmark" size={30} color="#fff" /></View>
            <ThemedText style={styles.modalTitle} title>MPIN set successfully</ThemedText>
            <ThemedText style={styles.modalSub}>Please enter it once to unlock.</ThemedText>
            <Pressable style={styles.modalBtn} onPress={goToEnterMpin}><ThemedText btn>Continue</ThemedText></Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },

  // phone chip
  phoneRow: { alignItems: 'center', marginTop: 10 },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  phoneChipText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  header: { alignItems: 'center' },
  titleText: { fontSize: 18, fontWeight: '700' },
  subtitleText: { fontSize: 14, opacity: 0.8, marginTop: 4 },

  infoBox: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F9F4F4',
    borderWidth: 1,
    borderColor: '#E8DADA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, opacity: 0.9 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 24, marginBottom: 8 },
  dotWrapper: { width: 16, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 999, borderWidth: 2, borderColor: BRAND, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: BRAND },
  placeholder: { fontSize: 18, fontWeight: '700', color: BRAND },

  pad: { marginTop: 12, alignSelf: 'center', width: '90%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 20 },
  key: {
    width: CIRCLE,
    height: CIRCLE,
    marginVertical: 10,
    borderRadius: CIRCLE / 2,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  primaryKey: {},
  keyPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  checkMark: { width: 56, height: 56, borderRadius: 28, marginBottom: 10, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalSub: { textAlign: 'center', opacity: 0.7, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },
})
