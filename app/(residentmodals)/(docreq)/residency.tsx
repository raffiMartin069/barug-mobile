import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'

const Residency = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [residency, setResidency] = useState('')

  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>

            <ThemedTextInput
                placeholder='Full Name'
                value={name}
                onChangeText={setName}
            />

            <ThemedTextInput
                placeholder='Age'
                value={age}
                onChangeText={setAge}
            />

            <ThemedTextInput
                placeholder='Home Address'
                value={address}
                onChangeText={setAddress}
            />

            <ThemedTextInput
                placeholder='Years of Residency'
                value={residency}
                onChangeText={setResidency}
            />

            

        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default Residency

const styles = StyleSheet.create({})