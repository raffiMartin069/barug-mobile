import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { TouchableWithoutFeedback } from 'react-native'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  return (
    <TouchableWithoutFeedback>
        <ThemedView>
            <ThemedCard>

                <ThemedText title={true}>Forgot Password</ThemedText>

                <Spacer height={10}/>

                <ThemedText subtitle={true}>
                    Please enter the email address associated with your account.
                    We will send you a link to reset your password.
                </ThemedText>

                <Spacer height={15}/>

                <ThemedTextInput
                    placeholder='Enter your email address'
                    value={email}
                    onChangeText={setEmail}
                />

                <Spacer height={5}/>

                <ThemedButton>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </ThemedCard>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default ForgotPassword