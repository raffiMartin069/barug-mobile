import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native'
import ThemedText from './ThemedText'

type Props = {
  style?: any
  label: string
  filled?: boolean
  onPress?: () => void
  removable?: boolean
  onRemove?: () => void
}

const ThemedChip = ({
  style = null,
  label,
  filled = true,
  onPress,
  removable = false,
  onRemove,
  ...props
}: Props) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <View style={[styles.base, filled ? styles.filled : styles.outlined, style]}>
      {removable && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={{ marginRight: 10 }}
        >
          <Ionicons
            name="close-outline"
            size={16}
            color={filled ? '#fff' : '#EF4444'}
          />
        </Pressable>
      )}

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.labelContainer, pressed && { opacity: 0.8 }]}
      >
        <ThemedText
          style={[styles.text, filled ? styles.textFilled : styles.textOutlined]}
        >
          {label}
        </ThemedText>
      </Pressable>
    </View>
  )
}

export default ThemedChip

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filled: {
    backgroundColor: '#310101',
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#310101',
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '600',
  },
  textFilled: {
    color: '#fff',
  },
  textOutlined: {
    color: '#310101',
  },
})