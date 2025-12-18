import React, { useEffect, useRef } from 'react'
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type BottomSheetProps = {
  visible: boolean
  onClose: () => void
  /** Absolute height for the sheet. If provided, overrides heightPercent. */
  height?: number
  /** Percent of screen height (0..1). Default: 0.82 */
  heightPercent?: number
  children: React.ReactNode
}

const SCREEN_HEIGHT = Dimensions.get('window').height

const ThemedBottomSheet = ({
  visible,
  onClose,
  height,
  heightPercent = 0.7,
  children,
}: BottomSheetProps) => {
  const insets = useSafeAreaInsets()
  const targetHeight = height ?? Math.round(SCREEN_HEIGHT * heightPercent)

  const translateY = useRef(new Animated.Value(targetHeight)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: targetHeight, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible, targetHeight, translateY, backdropOpacity])

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              height: targetHeight,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Content respects safe area */}
          <View style={[styles.content, { paddingBottom: insets.bottom || 12 }]}>
            {children}
          </View>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    zIndex: 2,
  },
  handleWrap: { alignItems: 'center', paddingTop: 8 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1' },
  content: { flex: 1, padding: 16 },
})
