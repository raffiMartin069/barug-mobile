import { Colors } from '@/constants/Colors'
import React from 'react'
import { Pressable, StyleSheet, useColorScheme } from 'react-native'
import ThemedText from './ThemedText'

const ThemedChip = ({style = null, label, filled = true, onPress, ...props}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  
  return (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [
        styles.base,
        filled ? styles.filled : styles.outlined,
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
        <ThemedText style={[styles.text, filled ? styles.textFilled : styles.textOutlined]}>
            {label}
        </ThemedText>
    </Pressable>
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