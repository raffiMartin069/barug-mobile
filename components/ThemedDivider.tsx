import React from 'react'
import { StyleSheet, View } from 'react-native'

const ThemedDivider = () => {
  return (
    <View
        style={styles.divider}
    />
  )
}

export default ThemedDivider

const styles = StyleSheet.create({
     divider: {
        height: 1,
        backgroundColor: '#ccc',
    },
})