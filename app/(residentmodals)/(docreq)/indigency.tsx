import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'

const Indigency = () => {
  const [name, setName] = useState('')
  
  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>

            <ThemedTextInput
                placeholder='Full Name'
                value={name}
                onChangeText={setName}
            />
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default Indigency

const styles = StyleSheet.create({})