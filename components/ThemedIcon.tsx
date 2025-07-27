import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, useColorScheme, View } from 'react-native'

const ThemedIcon = ({style = null, name, size = 20, iconColor = '#fff', shape = 'round', containerSize = 60, bgColor = '#fff', isFloating = false, ...props}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <View 
        style={[
            styles.container,
            {
            width: containerSize,
            height: containerSize,
            backgroundColor: bgColor,
            borderRadius: shape === 'round' ? containerSize / 2 : 8,
            },
            isFloating && styles.fab,
            style,]}
    >
      <Ionicons
        name={name} size={size} color={iconColor}
      />
    </View>
  )
}

export default ThemedIcon

const styles = StyleSheet.create({
    container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
})