import { Colors } from '@/constants/Colors'
import React from 'react'
import { Pressable, StyleSheet, useColorScheme } from 'react-native'
import ThemedText from './ThemedText'

const ThemedButton = ({ style = null, submit = true, label = '', children = null, ...props }) => {
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
    >
      {label ? (
        <ThemedText btn={submit} non_btn={!submit}>
          {label}
        </ThemedText>
      ) : (
        children
      )}
    </Pressable>
  )
}

export default ThemedButton

const styles = StyleSheet.create({
  submit: {
    color: '#fff',
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 24,
    marginVertical: 5,
  },
  non_submit: {
    color: Colors.primary,
    backgroundColor: '#fff',
    padding: 10,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 24,
    marginVertical: 5,
  },
  pressed: {
    opacity: 0.5
  },
})