import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, TouchableWithoutFeedback } from 'react-native'

const Otp = () => {
  const [code, setCode] = useState('')

  return (
    <ThemedView safe>
        <TouchableWithoutFeedback>
            <ThemedCard>
                <ThemedText>We send a 6-digit authentication code to your registered mobile number</ThemedText>
                <ThemedText>+63945****160</ThemedText>
                <ThemedText>Please enter the authentication code</ThemedText>
                <ThemedTextInput
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autofocus
                />
            </ThemedCard>
        </TouchableWithoutFeedback>
    </ThemedView>
  )
}

export default Otp

const styles = StyleSheet.create({})