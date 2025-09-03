// app/(auth)/mpin.tsx
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native'
import { supabase } from '../../constants/supabase'

const CIRCLE = 78
const MPIN_LEN = 4

const Mpin = () => {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)

  const keys = useMemo(
    () => [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      'blank', '0', 'back',
    ],
    []
  )

  const pushDigit = async (d: string) => {
    if (pin.length >= MPIN_LEN) return
    const newPin = pin + d
    setPin(newPin)

    // Auto-verify once PIN length is complete
    if (newPin.length === MPIN_LEN) {
      setBusy(true)
      try {
        const { data, error } = await supabase.rpc('verify_mpin', { p_pin: newPin })
        if (error) return Alert.alert('Unlock failed', error.message)
        if (!data) {
          setPin('')
          return Alert.alert('Incorrect MPIN')
        }
        router.replace('/(resident)/(tabs)/residenthome')
      } finally {
        setBusy(false)
      }
    }
  }

  const popDigit = () => setPin(prev => prev.slice(0, -1))

  const forgot = async () => {
    await supabase.auth.signOut()
    router.replace('/(auth)/phone')
  }

  const goToLogin = () => {
    router.replace('/(auth)/phone')
  }

  return (
    <ThemedView safe>
      <Image
        source={require('@/assets/images/icon-.png')}
        style={styles.image}
      />

      <ThemedText style={{ textAlign: 'center' }} title>
        Barangay Sto. Niño
      </ThemedText>

      <Spacer />

      <View style={styles.header}>
        <ThemedText style={styles.text}>Enter your MPIN</ThemedText>
      </View>

      {/* Dots for PIN */}
      <View style={styles.dots}>
        {Array.from({ length: MPIN_LEN }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length && styles.dotFilled]}
          />
        ))}
      </View>

      {/* Busy indicator */}
      {busy && (
        <ActivityIndicator style={{ marginVertical: 10 }} color="#310101" />
      )}

      {/* Keypad */}
      <View style={styles.pad}>
        {keys.map((k, i) => {
          if (k === 'blank') return <View key={i} style={styles.keyBlank} />
          if (k === 'back') {
            return (
              <Pressable
                key={i}
                onPress={popDigit}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Ionicons name="backspace-outline" size={20} color={'#fff'} />
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

      <Spacer />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <Pressable onPress={forgot}>
          <ThemedText style={styles.forgot}>Forgot MPIN?</ThemedText>
        </Pressable>
        <Pressable onPress={goToLogin}>
          <ThemedText style={styles.forgot}>Go to Login</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  )
}

export default Mpin

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 70,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#310101',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#310101',
  },
  pad: {
    marginTop: 12,
    alignSelf: 'center',
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 20,
  },
  keyBlank: {
    width: CIRCLE,
    height: CIRCLE,
    marginVertical: 10,
    opacity: 0,
  },
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
  keyPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  forgot: {
    fontWeight: '700',
    textAlign: 'center',
    padding: 10,
  },
})
