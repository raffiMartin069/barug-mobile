import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { Image, Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

const MobileNum = () => {
  const [mobnum, setMobNum] = useState('')

  return (
    <ThemedView safe>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedCard>
                <Image
                    source={require('@/assets/images/icon-.png')}
                    style={styles.image}
                />

                <Spacer />

                <ThemedText style={styles.text} title>Barangay Sto. Niño</ThemedText>

                <Spacer height={10} />

                <ThemedText style={{fontStyle: 'italic'}}>Please enter the mobile number you provided during the official profiling.</ThemedText>

                <Spacer />

                <ThemedText>Enter your mobile number</ThemedText>

                <View style={styles.inputContainer}>
                    <ThemedText>+63</ThemedText>

                    <ThemedTextInput
                        placeholder="9XXXXXXXXX"
                        value={mobnum}
                        onChangeText={setMobNum}
                        keyboardType='numeric'
                        maxLength={10}
                    />
                </View>

                <Spacer />

                <ThemedText>By tapping next, we'll collect your mobile number's network information to be able to send you a One-Time Password (OTP)</ThemedText>

                <Spacer height={10}/>

                <ThemedButton>
                    <ThemedText btn>Next</ThemedText>
                </ThemedButton>

            </ThemedCard>
        </TouchableWithoutFeedback>
    </ThemedView>
  )
}

export default MobileNum

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 70,
        alignSelf: 'center',
    },
    text: {
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 20,
    },
})