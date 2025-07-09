import { Colors } from '@/constants/Colors'
import React from 'react'
import { Pressable, StyleSheet, useColorScheme } from 'react-native'

const ThemedButton = ({ style = null, submit = true, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <Pressable
      style={({ pressed }) => [
        submit ? styles.submit : styles.non_submit, 
        pressed && styles.pressed, 
        style,
      ]}
      {...props}
    />
  )
}

export default ThemedButton

const styles = StyleSheet.create({
  submit: {
    color: '#fff',
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 12,
    marginVertical: 5,
  },
  non_submit: {
    color: Colors.primary,
    backgroundColor: '#fff',
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    marginVertical: 5,
  },
  pressed: {
    opacity: 0.5
  },
})