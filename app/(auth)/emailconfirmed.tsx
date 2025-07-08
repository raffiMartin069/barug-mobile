import Spacer from '@/components/Spacer'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Link } from 'expo-router'
import React from 'react'

const emailconfirmed = () => {
  return (
    <ThemedView>
        <ThemedCard>
            <ThemedText title={true}>Email Address Verification</ThemedText>

            <Spacer height={10}/>

            <ThemedText subtitle={true}>
                Your email address has been verified successfully! You may now
                <Link href='/login'>
                    <ThemedText link={true}>{"\u00A0"} login.</ThemedText>
                </Link>
            </ThemedText>
        </ThemedCard>
    </ThemedView>
  )
}

export default emailconfirmed