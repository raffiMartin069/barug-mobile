import Spacer from '@/components/Spacer'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Link } from 'expo-router'
import React from 'react'
import { Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native'

const ConfirmEmail = () => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView safe>
            <ThemedCard>
                <ThemedText title>Verify your email address</ThemedText>

                <Spacer />

                <ThemedText subtitle>
                    We’ve sent a verification email to your address. 
                    Please check your inbox or spam folder and click the link to verify your account.
                </ThemedText>

                <Spacer />

                <ThemedText>
                    Didn’t receive the email? {"\u00A0"}
                    <Link href={'/'}>
                        <ThemedText link>Resend Verification</ThemedText>
                    </Link>
                </ThemedText>
            </ThemedCard>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default ConfirmEmail

const styles = StyleSheet.create({})