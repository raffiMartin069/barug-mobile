import Spacer from '@/components/Spacer'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Link } from 'expo-router'
import React from 'react'
import { StyleSheet } from 'react-native'

const VerifyEmail = () => {
  return (
    <ThemedView>
        <ThemedCard>
            <ThemedText title={true}>Verify your email address</ThemedText>
            <Spacer height={10}/>
            <ThemedText subtitle={true}>
                We’ve sent a verification email to your address. 
                Please check your inbox or spam folder and click the link to verify your account.
            </ThemedText>
            <Spacer height={10}/>
            <ThemedText subtitle={true}>
                Didn’t receive the email? {"\u00A0"}
                <Link href='/'>
                    <ThemedText link={true}>
                        Resend Verification
                    </ThemedText>
                </Link>
            </ThemedText>
        </ThemedCard>
    </ThemedView>
  )
}

export default VerifyEmail

const styles = StyleSheet.create({})