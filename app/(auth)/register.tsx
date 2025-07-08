import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedRadioButton from '@/components/ThemedRadioButton';
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
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('')
  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')
  const [selectedValue, setSelectedValue] = useState(null);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>
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

            <ThemedText subtitle={true}>Sex</ThemedText>
            
            <ThemedRadioButton
                value={gender}
                onChange={setGender}
                options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                ]}
            />
            <Spacer height={10}/>

            <ThemedDatePicker
                value={dob}
                mode={'date'}
                onChange={setDob}
                placeholder='Date of Birth'
                maximumDate={new Date()}
            />
            
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

            <ThemedDropdown
                items={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
                ]}
                value={selectedValue}
                setValue={setSelectedValue}
                placeholder="Select gender"
            />

            <ThemedButton>
                <ThemedText btn={true}>REGISTER</ThemedText>
            </ThemedButton>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default register

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    image: {
        width: '100%',
        height: 70,
        alignSelf: 'center',
    },
    text:{
        textAlign: 'center',
    },
})