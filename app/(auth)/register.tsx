import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import React, { useState } from 'react';
import { Image, Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native';

const register = () => {
  const [fname, setFname] = useState('')
  const [mname, setMname] = useState('')
  const [lname, setLname] = useState('')
  const [suffix, setSuffix] = useState('')
  const [dob, setDob] = useState('')
  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')

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

                <ThemedText style={styles.text} subtitle={true}>Register to access barangay services.</ThemedText>
                
                <Spacer height={20}/>

                <ThemedTextInput
                    placeholder='First Name'
                    value={fname}
                    onChangeText={setFname}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Middle Name'
                    value={mname}
                    onChangeText={setMname}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Last Name'
                    value={lname}
                    onChangeText={setLname}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Suffix'
                    value={suffix}
                    onChangeText={setSuffix}
                />

                <Spacer height={10}/>

                <ThemedDatePicker
                    placeholder='Date of Birth'
                    value={dob}
                    onChangeText={setDob}
                />

                <Spacer height={10}/>
                
                <ThemedTextInput
                    placeholder='Mobile Number'
                    value={mobnum}
                    onChangeText={setMobNum}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Email Address'
                    value={email}
                    onChangeText={setEmail}
                />

                <Spacer height={15}/>

                <ThemedButton>
                    <ThemedText btn={true}>REGISTER</ThemedText>
                </ThemedButton>
            </ThemedCard>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default register

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 70,
        alignSelf: 'center',
    },
    text:{
        textAlign: 'center',
    },
})