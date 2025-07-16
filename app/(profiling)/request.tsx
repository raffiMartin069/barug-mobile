import ThemedMap from '@/components/ThemedMap'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet } from 'react-native'

const Request = () => {
  return (
    <ThemedView safe={true} style={{ flex: 1 }}>
        <ThemedMap
          route={'/residentaddress'}
        />
    </ThemedView>
  )
}

export default Request

const styles = StyleSheet.create({})