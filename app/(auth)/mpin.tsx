import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native'

const CIRCLE = 70;
const MPIN_LEN = 4;
const ROLES = ['Resident', 'Barangay Health Worker', 'Business Owner']

const Mpin = () => {
  const [role, setRole] = useState('Resident')
  const [pin, setPin] = useState('');
  const [open, setOpen] = useState(false)

  const keys = useMemo(
    () => [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      'blank', '0', 'back',
    ],
    []
  )

  const pushDigit = (d: string) => {
    if (pin.length >= MPIN_LEN) return
    setPin(prev => prev + d)
  }

  const popDigit = () => setPin(prev => prev.slice(0, -1))

  const selectRole = (r: string) => {
    setRole(r)
    setOpen(false)
  }

  return (
    <ThemedView safe>
      {/* Backdrop to close dropdown & block keypad taps */}
      {open && <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />}

      <Image
        source={require('@/assets/images/icon-.png')}
        style={styles.image}
      />

      <ThemedText style={{textAlign: 'center'}} title>Barangay Sto. Niño</ThemedText>

      <Spacer height={10} />

      <View style={styles.header}>
        <ThemedText style={{fontStyle: 'italic'}}>For privacy and security, never share your MPIN.</ThemedText>

        <Spacer height={10} />

        <ThemedText style={styles.text}>Mobile Number - Full Name</ThemedText>
        <ThemedText style={styles.text}>Enter your MPIN</ThemedText>
      </View>

      <View style={styles.dots}>
        {Array.from({length: MPIN_LEN}).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < pin.length  && styles.dotFilled]}
          />
        ))}
      </View>

      <View style={styles.pad}>
        {keys.map((k, i) => {
          if (k === 'blank') return <View key={i} style={styles.keyBlank} />
          if (k === 'back' ) {
            return (
              <Pressable key={i} onPress={popDigit} style={({pressed}) => [styles.key, pressed && styles.keyPressed]}>
                <Ionicons name='backspace-outline' size={20} color={'#fff'}/>
              </Pressable>
            )
          }
          return (
            <Pressable 
              key={i} 
              onPress={() => pushDigit(k)} 
              style={({pressed}) => [styles.key, pressed && styles.keyPressed]}
            >
              <ThemedText btn>{k}</ThemedText>
            </Pressable>
          )
        })}
      </View>

      <Spacer />

      <View style={styles.footerRow}>
        {/* Dropdown */}
        <View style={styles.dropdownWrap}>
          <Pressable
            onPress={() => setOpen(o => !o)}
            style={({ pressed }) => [styles.dropdownBtn, pressed && styles.dropdownPressed]}
          >
            <ThemedText style={styles.dropdownText}>{role}</ThemedText>
            <Ionicons
              name={open ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={'#310101'}
            />
          </Pressable>

          {open && (
            <View style={styles.dropdownMenu}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r}
                  onPress={() => selectRole(r)}
                  style={styles.dropdownItem}
                >
                  <ThemedText style={[
                    styles.dropdownItemText,
                    role === r && styles.dropdownItemTextActive
                  ]}>
                    {r}
                  </ThemedText>
                  {role === r && <Ionicons name="checkmark" size={16} color={'#310101'} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Link href={'/'} style={styles.forgot}>
          <ThemedText link>Forgot MPIN?</ThemedText>
        </Link>
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
    fontSize: 16,
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
    marginTop: 10,
    alignSelf: 'center',
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 20,
    position: 'relative', // stacking context for Android
    zIndex: 0,
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
    fontSize: 18,
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
  forgot : {
    fontWeight: '700', 
    textAlign: 'right', 
    padding: 20,
  },

  /* Bottom row */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 8,
    position: 'relative',
    zIndex: 200,
  },

  /* Dropdown styles */
  dropdownWrap: {
    position: 'relative',
    minWidth: 180,
    zIndex: 50, // above keypad
  },
  dropdownBtn: {
    borderWidth: 1,
    borderColor: '#d8d8d8',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  dropdownPressed: {
    opacity: 0.85,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#310101',
    flex: 1,
  },
  // open upward to avoid bottom overlap
  dropdownMenu: {
    position: 'absolute',
    bottom: 48, // ⬅ open upward from button
    left: 0,
    right: 0,
    maxHeight: 220,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e7e7e7',
    paddingVertical: 6,
    elevation: 12,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#222',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#310101',
  },

  /* Backdrop for closing dropdown & blocking taps */
  backdrop: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    backgroundColor: 'transparent',
    zIndex: 40,
  },
})
