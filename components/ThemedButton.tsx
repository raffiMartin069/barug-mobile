import { Colors } from '@/constants/Colors'
import React from 'react'
import { Pressable, StyleSheet, useColorScheme } from 'react-native'

const ThemedButton = ({ style = null, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      {...props}
    />
  )
}

export default ThemedButton

const styles = StyleSheet.create({
  btn: {
    color: '#fff',
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
  },
  pressed: {
    opacity: 0.5
  },
})