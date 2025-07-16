import ThemedMap from '@/components/ThemedMapAddress'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet } from 'react-native'

const Request = () => {
  return (
    <ThemedView safe={true} style={{ flex: 1 }}>
        <ThemedMap
          route={'/homeaddress'}
        />
    </ThemedView>
  )
}

export default Request

const styles = StyleSheet.create({})