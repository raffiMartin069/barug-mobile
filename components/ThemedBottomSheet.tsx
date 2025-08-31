import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native'

type BottomSheetProps = {
  visible: boolean
  onClose: () => void
  height?: number // default 80% of screen
  children: React.ReactNode
}

const SCREEN_HEIGHT = Dimensions.get('window').height

const ThemedBottomSheet = ({ visible, onClose, height, children }: BottomSheetProps) => {
  const sheetHeight = height ?? Math.floor(SCREEN_HEIGHT * 0.82)
  const translateY = useRef(new Animated.Value(sheetHeight)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: sheetHeight, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, sheetHeight, translateY, backdropOpacity])

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>

        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, transform: [{ translateY }] },
          ]}
        >
          {/* Drag handle (decorative) */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  )
}

export default ThemedBottomSheet

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 8 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  content: { flex: 1, padding: 16 },
})
