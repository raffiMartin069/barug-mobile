import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, Text, useColorScheme, View } from 'react-native'

const ThemedPill = ({style = null, label, bgColor, textColor, size, ...props}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const sizeStyles =
    size === 'sm'
      ? { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 }
      : size === 'lg'
      ? { paddingHorizontal: 14, paddingVertical: 8, fontSize: 14 }
      : { paddingHorizontal: 12, paddingVertical: 6, fontSize: 13 }

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bgColor, paddingHorizontal: sizeStyles.paddingHorizontal, paddingVertical: sizeStyles.paddingVertical },
        style,
      ]}
      accessibilityRole="text"
      {...props}
    >
      <Text
        style={[
          styles.pillText,
          { color: textColor, fontSize: sizeStyles.fontSize }
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  )
}

export default ThemedPill

const styles = StyleSheet.create({
    pill: {
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    pillText: {
        fontWeight: '700',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
})