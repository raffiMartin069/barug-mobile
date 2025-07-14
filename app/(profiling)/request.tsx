import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, TouchableWithoutFeedback } from 'react-native'

const request = () => {
  return (
    <TouchableWithoutFeedback>
        <ThemedView>
            <ThemedCard>
                <ThemedText></ThemedText>
            </ThemedCard>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default request

const styles = StyleSheet.create({})