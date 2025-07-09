import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Link } from 'expo-router'
import React, { useState } from 'react'
import { Image, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView>

            <ThemedCard>
                <Image
                    source={require('@/assets/images/icon-.png')}
                    style={styles.image}
                />
                
                <Spacer height={20}/>

                <ThemedText style={styles.text} title={true}>Barangay Sto. Niño</ThemedText>

                <ThemedText style={styles.text} subtitle={true}>Log in to access barangay services.</ThemedText>

                <Spacer height={20}/>

                <ThemedTextInput
                    placeholder='Email or Username'
                    value={email}
                    onChangeText={setEmail}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Spacer height={15}/>
                
                <Link href='/forgotpassword'>
                    <ThemedText style={styles.link} link={true}>
                        Forgot Password?
                    </ThemedText>
                </Link>

                <ThemedButton>
                    <ThemedText btn={true}>LOG IN</ThemedText>
                </ThemedButton>

                <ThemedText style={styles.link}>
                    Don't have an account?
                    <Link href='/personalinfo'>
                        <ThemedText link={true}> Register</ThemedText>
                    </Link>
                </ThemedText>
            </ThemedCard>

        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Login

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 70,
        alignSelf: 'center',
    },
    text:{
        textAlign: 'center',
    },
    link: {
        textAlign: 'right',
    },
})