import ThemedText from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import React from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'

type Props = {
  visible: boolean
  title?: string
  children?: React.ReactNode
  onClose?: () => void
  footer?: React.ReactNode
}

const CenteredModal = ({ visible, title, children, onClose, footer }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
          <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}

          {onClose ? (
            <Pressable style={styles.closeBtn} onPress={onClose} accessibilityRole="button">
              <ThemedText style={styles.closeText}>Close</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

export default CenteredModal

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '92%',
    maxWidth: 820,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  content: {
    paddingBottom: 8,
  },
  footer: {
    marginTop: 12,
  },
  closeBtn: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
  },
})
