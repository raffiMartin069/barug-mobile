import Spacer from '@/components/Spacer'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Link } from 'expo-router'
import React from 'react'
import { Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native'

const EmailConfirmed = () => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView safe>
            <ThemedCard>
                <ThemedText title>Email Address Confirmation</ThemedText>

                <Spacer />

                <ThemedText>
                    Your email address has been confirmed! You may now
                    <Link href={'/'}>
                        <ThemedText link>{"\u00A0"} login</ThemedText>
                    </Link>
                    {"\u00A0"} to your account.
                </ThemedText>
            </ThemedCard>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default EmailConfirmed

const styles = StyleSheet.create({})