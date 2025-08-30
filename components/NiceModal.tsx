// components/NiceModal.tsx
import ThemedText from '@/components/ThemedText'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

export type ModalVariant = 'info' | 'success' | 'warn' | 'error'

export type NiceModalProps = {
  visible: boolean
  title: string
  message?: string
  variant?: ModalVariant
  primaryText?: string
  secondaryText?: string
  onPrimary?: () => void
  onSecondary?: () => void
  onClose?: () => void
  dismissible?: boolean
}

export default function NiceModal({
  visible,
  title,
  message,
  variant = 'info',
  primaryText = 'OK',
  secondaryText,
  onPrimary,
  onSecondary,
  onClose,
  dismissible = true,
}: NiceModalProps) {
  const palette = {
    info: { bg: '#28527a', icon: 'information-circle' as const },
    success: { bg: '#441010ff', icon: 'checkmark-circle' as const },
    warn: { bg: '#441010ff', icon: 'alert-circle' as const },
    error: { bg: '#7a2323', icon: 'close-circle' as const },
  }[variant]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <View style={s.card}>
          <View style={[s.iconWrap, { backgroundColor: palette.bg }]}>
            <Ionicons name={palette.icon} size={28} color="#fff" />
          </View>

          <ThemedText title style={s.title}>{title}</ThemedText>
          {!!message && <ThemedText style={s.msg}>{message}</ThemedText>}

          <View style={s.row}>
            {secondaryText ? (
              <Pressable
                onPress={onSecondary}
                style={({ pressed }) => [s.btnGhost, pressed && { opacity: 0.85 }]}
              >
                <ThemedText style={{ fontWeight: '700' }}>{secondaryText}</ThemedText>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onPrimary ?? onClose}
              style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
            >
              <ThemedText btn>{primaryText}</ThemedText>
            </Pressable>
          </View>

          {dismissible && !secondaryText && !onPrimary ? (
            <Pressable onPress={onClose} style={s.tapToCloseHit} />
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%', borderRadius: 20, backgroundColor: '#fff', padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { textAlign: 'center', marginBottom: 6 },
  msg: { textAlign: 'center', opacity: 0.9, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  btn: { flex: 1, borderRadius: 12, backgroundColor: '#310101', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#310101', paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  tapToCloseHit: { height: 1, width: 1 }, // keeps layout simple; closing handled by primary
})
