import Spacer from '@/components/Spacer'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Link } from 'expo-router'
import React from 'react'

const EmailSent = () => {
  return (
    <ThemedView>
        <ThemedCard>

            <ThemedText title={true}>Check your email</ThemedText>
            
            <Spacer height={10}/>

            <ThemedText subtitle={true}>
                A password reset link has been sent to email@gmail.com.
                Please follow the instructions in the email to set a new password.
            </ThemedText>

            <Spacer height={10}/>
            
            <ThemedText subtitle={true}>
                If the message does not arrive shortly, please check your spam folder or {"\u00A0"}
                <Link href='/'>
                    <ThemedText link={true}>
                        request another email.
                    </ThemedText>
                </Link>
            </ThemedText>
        </ThemedCard>
    </ThemedView>
  )
}

export default EmailSent