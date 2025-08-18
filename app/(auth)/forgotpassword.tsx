import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { TouchableWithoutFeedback, Alert } from 'react-native'
import { requestPasswordReset } from '@/api/authApi'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.')
      return
    }

    setLoading(true)

    try {
      await requestPasswordReset(email)
      router.push({ pathname: '/emailsent', params: { email } });
    } catch (err: any) {
      console.error('Reset error:', err)
      Alert.alert('Error', err.message || 'Could not send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback>
      <ThemedView>
        <ThemedCard>
          <ThemedText title={true}>Forgot Password</ThemedText>

          <Spacer height={10} />

          <ThemedText subtitle={true}>
            Please enter the email address associated with your account.
            We will send you a link to reset your password.
          </ThemedText>

          <Spacer height={15} />

          <ThemedTextInput
            placeholder='Enter your email address'
            value={email}
            onChangeText={setEmail}
          />

          <Spacer height={15} />

          <ThemedButton onPress={handleSubmit} disabled={loading}>
            <ThemedText btn={true}>
              {loading ? 'Processing...' : 'Continue'}
            </ThemedText>
          </ThemedButton>
        </ThemedCard>
      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default ForgotPassword
