// app/(settings)/change-mpin.tsx
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native'
import { supabase } from '../../constants/supabase'

const CIRCLE = 78
const MPIN_LEN = 4
const BRAND = '#310101'

type Step = 'old' | 'new' | 'confirm'
type IconKey = 'success' | 'error' | 'info'

const ICONS: Record<IconKey, string> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
}

export default function ChangeMpin() {
  const [step, setStep] = useState<Step>('old')
  const [pin, setPin] = useState('')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [busy, setBusy] = useState(false)

  const [modal, setModal] = useState<{
    visible: boolean
    title?: string
    message?: string
    icon?: IconKey
    onPrimary?: () => void
    primaryText?: string
  }>({ visible: false })

  const keys = useMemo(() => ['1','2','3','4','5','6','7','8','9','blank','0','back'], [])

  const headerText =
    step === 'old' ? 'Verify current MPIN'
    : step === 'new' ? 'Enter new 4-digit MPIN'
    : 'Confirm new MPIN'

  const showModal = (opts: Partial<typeof modal>) => setModal(prev => ({ ...prev, visible: true, ...opts }))
  const hideModal = () => setModal(prev => ({ ...prev, visible: false }))

  const resetAll = () => { setStep('old'); setPin(''); setOldPin(''); setNewPin('') }

  const afterSuccess = () => { hideModal(); router.back() }

  const handleLengthReached = async (buf: string) => {
    if (buf.length !== MPIN_LEN || busy) return
    if (step === 'old') {
      setBusy(true)
      try {
        const { data, error } = await supabase.rpc('verify_mpin', { p_pin: buf })
        if (error) { setPin(''); return showModal({ icon: 'error', title: 'Verification failed', message: error.message, primaryText: 'OK', onPrimary: hideModal }) }
        if (!data) { setPin(''); return showModal({ icon: 'error', title: 'Incorrect MPIN', message: 'Your current MPIN is not correct. Please try again.', primaryText: 'Try Again', onPrimary: hideModal }) }
        setOldPin(buf); setPin(''); setStep('new')
      } finally { setBusy(false) }
      return
    }

    if (step === 'new') { setNewPin(buf); setPin(''); setStep('confirm'); return }

    if (buf !== newPin) {
      setPin('')
      return showModal({
        icon: 'error', title: 'MPINs do not match', message: 'The confirmation MPIN does not match the new MPIN.',
        primaryText: 'Retry', onPrimary: () => { hideModal(); setPin(''); setStep('new') },
      })
    }

    setBusy(true)
    try {
      const { error } = await supabase.rpc('change_mpin', { p_old: oldPin, p_new: newPin })
      if (error) { setPin(''); return showModal({ icon: 'error', title: 'Failed to change MPIN', message: error.message, primaryText: 'OK', onPrimary: hideModal }) }
      setPin(''); setOldPin(''); setNewPin('')
      showModal({ icon: 'success', title: 'MPIN changed', message: 'Your MPIN was updated successfully.', primaryText: 'Done', onPrimary: afterSuccess })
    } finally { setBusy(false) }
  }

  const pushDigit = (d: string) => {
    if (busy) return
    if (!/^\d$/.test(d)) return
    if (pin.length >= MPIN_LEN) return
    const next = pin + d
    setPin(next)
    if (next.length === MPIN_LEN) handleLengthReached(next)
  }

  const popDigit = () => { if (!busy) setPin(prev => prev.slice(0, -1)) }

  return (
    <ThemedView safe>
      <Image source={require('@/assets/images/icon-.png')} style={styles.image} />
      <ThemedText style={{ textAlign: 'center' }} title>Barangay Sto. Niño</ThemedText>
      <Spacer />

      <View style={styles.header}>
        <ThemedText style={styles.text}>{headerText}</ThemedText>
        {step === 'old' && <ThemedText style={{ marginTop: 6, opacity: 0.8 }}>For your security, please confirm your current MPIN first.</ThemedText>}
      </View>

      <View style={styles.dots}>
        {Array.from({ length: MPIN_LEN }).map((_, i) => (
          <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, busy && styles.dotDim]} />
        ))}
      </View>

      {busy && <ActivityIndicator style={{ marginVertical: 10 }} color={BRAND} />}

      <View style={[styles.pad, busy && { opacity: 0.4 }]}>
        {keys.map((k, i) => {
          if (k === 'blank') return <View key={i} style={styles.keyBlank} />
          if (k === 'back') {
            return (
              <Pressable key={i} onPress={popDigit} disabled={busy} style={({ pressed }) => [styles.key, pressed && !busy && styles.keyPressed]}>
                <Ionicons name="backspace-outline" size={20} color="#fff" />
              </Pressable>
            )
          }
          return (
            <Pressable key={i} onPress={() => pushDigit(k)} disabled={busy} style={({ pressed }) => [styles.key, pressed && !busy && styles.keyPressed]}>
              <ThemedText btn>{k}</ThemedText>
            </Pressable>
          )
        })}
      </View>

      <Spacer />

      <View style={styles.actionsRow}>
        <Pressable onPress={() => !busy && resetAll()} disabled={busy}><ThemedText style={styles.link}>Start Over</ThemedText></Pressable>
      </View>

      <Modal visible={modal.visible} transparent animationType="fade" onRequestClose={hideModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.iconWrap}><Ionicons name={(ICONS[(modal.icon || 'info') as IconKey] as any) || 'information-circle'} size={34} color="#fff" /></View>
            {!!modal.title && <ThemedText style={styles.modalTitle} title>{modal.title}</ThemedText>}
            {!!modal.message && <ThemedText style={styles.modalMsg}>{modal.message}</ThemedText>}
            <Pressable style={styles.modalBtn} onPress={() => { if (modal.onPrimary) modal.onPrimary(); else hideModal() }}>
              <ThemedText btn>{modal.primaryText || 'OK'}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },
  header: { alignItems: 'center' },
  text: { fontSize: 18, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 24, marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 999, borderWidth: 2, borderColor: BRAND, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: BRAND },
  dotDim: { opacity: 0.5 },
  pad: { marginTop: 12, alignSelf: 'center', width: '90%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 20 },
  keyBlank: { width: CIRCLE, height: CIRCLE, marginVertical: 10, opacity: 0 },
  key: { width: CIRCLE, height: CIRCLE, marginVertical: 10, borderRadius: CIRCLE / 2, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  keyPressed: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20 },
  link: { fontWeight: '700', textAlign: 'center', padding: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalMsg: { textAlign: 'center', opacity: 0.8, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },
})
