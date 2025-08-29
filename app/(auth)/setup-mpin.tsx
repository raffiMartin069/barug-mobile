// app/(auth)/setup-mpin.tsx
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { supabase } from '../../constants/supabase'

const CIRCLE = 78
const MPIN_LEN = 4
const BRAND = '#310101'

export default function SetupMPIN() {
  const [stage, setStage] = useState<'a' | 'b'>('a')
  const [pinA, setPinA] = useState('')
  const [pinB, setPinB] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false) // 👈 success modal

  const keys = useMemo(
    () => ['1','2','3','4','5','6','7','8','9','check','0','back'],
    []
  )

  const currentPin = stage === 'a' ? pinA : pinB
  const setCurrentPin = stage === 'a' ? setPinA : setPinB

  const pushDigit = (d: string) => {
    if (busy) return
    if (currentPin.length >= MPIN_LEN) return
    setCurrentPin(prev => prev + d)
  }

  const popDigit = () => {
    if (busy) return
    setCurrentPin(prev => prev.slice(0, -1))
  }

  const proceedToHome = () =>
    router.replace('/(resident)/(tabs)/residenthome')

  // Auto-close modal → route after a short beat
  useEffect(() => {
    if (!done) return
    const t = setTimeout(proceedToHome, 1200)
    return () => clearTimeout(t)
  }, [done])

  const onCheck = async () => {
    if (busy) return
    if (currentPin.length !== MPIN_LEN) {
      return Alert.alert('MPIN must be 4 digits')
    }

    if (stage === 'a') {
      setStage('b') // go to confirm
      return
    }

    if (pinA !== pinB) {
      setPinB('')
      return Alert.alert('MPINs do not match')
    }

    setBusy(true)
    try {
      const { error } = await supabase.rpc('set_mpin', { p_pin: pinA })
      if (error) return Alert.alert('Failed to set MPIN', error.message)
      setDone(true) // 👈 show success modal
    } finally {
      setBusy(false)
    }
  }

  return (
    <ThemedView safe>
      <Image source={require('@/assets/images/icon-.png')} style={styles.image} />

      <ThemedText style={{ textAlign: 'center' }} title>
        Barangay Sto. Niño
      </ThemedText>

      <Spacer />

      <View style={styles.header}>
        <ThemedText style={styles.titleText}>Set your MPIN</ThemedText>
        <ThemedText style={styles.subtitleText}>
          {stage === 'a' ? 'Enter 4-digit MPIN' : 'Confirm MPIN'}
        </ThemedText>
      </View>

      {/* Dots with -- fallback */}
      <View style={styles.dots}>
        {Array.from({ length: MPIN_LEN }).map((_, i) => (
          <View key={i} style={styles.dotWrapper}>
            {i < currentPin.length ? (
              <View style={[styles.dot, styles.dotFilled]} />
            ) : (
              <ThemedText style={styles.placeholder}>-</ThemedText>
            )}
          </View>
        ))}
      </View>

      {busy && <ActivityIndicator style={{ marginVertical: 10 }} color={BRAND} />}

      {/* Keypad */}
      <View style={styles.pad}>
        {keys.map((k, i) => {
          if (k === 'back') {
            return (
              <Pressable
                key={i}
                onPress={popDigit}
                disabled={busy}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Ionicons name="backspace-outline" size={20} color="#fff" />
              </Pressable>
            )
          }
          if (k === 'check') {
            return (
              <Pressable
                key={i}
                onPress={onCheck}
                disabled={busy}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed, styles.primaryKey]}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </Pressable>
            )
          }
          return (
            <Pressable
              key={i}
              onPress={() => pushDigit(k)}
              disabled={busy}
              style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            >
              <ThemedText btn>{k}</ThemedText>
            </Pressable>
          )
        })}
      </View>

      {/* ✅ Success Modal */}
      <Modal
        visible={done}
        transparent
        animationType="fade"
        onRequestClose={proceedToHome}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.checkMark}>
              <Ionicons name="checkmark" size={30} color="#fff" />
            </View>
            <ThemedText style={styles.modalTitle} title>
              MPIN set successfully
            </ThemedText>
            <ThemedText style={styles.modalSub}>
              You can now use your MPIN to sign in quickly.
            </ThemedText>

            <Pressable style={styles.modalBtn} onPress={proceedToHome}>
              <ThemedText btn>Continue</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 70,
    alignSelf: 'center',
  },
  header: { alignItems: 'center' },
  titleText: { fontSize: 18, fontWeight: '700' },
  subtitleText: { fontSize: 14, opacity: 0.8, marginTop: 4 },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 24,
    marginBottom: 8,
  },
  dotWrapper: { width: 16, alignItems: 'center' },
  dot: {
    width: 12, height: 12, borderRadius: 999,
    borderWidth: 2, borderColor: BRAND, backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: BRAND },
  placeholder: { fontSize: 18, fontWeight: '700', color: BRAND },

  pad: {
    marginTop: 12,
    alignSelf: 'center',
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 20,
  },
  key: {
    width: CIRCLE, height: CIRCLE, marginVertical: 10,
    borderRadius: CIRCLE / 2, backgroundColor: BRAND,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  primaryKey: {},
  keyPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },

  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    width: '100%', maxWidth: 380,
    backgroundColor: '#fff', borderRadius: 16,
    padding: 20, alignItems: 'center',
  },
  checkMark: {
    width: 56, height: 56, borderRadius: 28, marginBottom: 10,
    backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalSub: { textAlign: 'center', opacity: 0.7, marginTop: 6, marginBottom: 14 },
  modalBtn: {
    marginTop: 4, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, backgroundColor: BRAND,
  },
})
