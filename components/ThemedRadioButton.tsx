import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'

const ThemedRadioButton = ({ style = null, options = [], value, onChange, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <View style={[styles.container, style]}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={styles.optionContainer}
          onPress={() => onChange(option.value)}
          activeOpacity={1}
        >
          <View style={[
            styles.outerCircle,
            {
              borderColor: value === option.value ? theme.text : theme.text,
            }
          ]}>
            {value === option.value && (
              <View style={[
                styles.innerCircle,
                { backgroundColor: theme.link }
              ]} />
            )}
          </View>
          <Text style={[styles.label, { color: theme.text }]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

export default ThemedRadioButton

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  outerCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  innerCircle: {
    height: 10,
    width: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 14,
  },
})