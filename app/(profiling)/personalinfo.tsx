import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet } from 'react-native';

const PersonalInfo = () => {
  const [fname, setFname] = useState('')
  const [mname, setMname] = useState('')
  const [lname, setLname] = useState('')
  const [suffix, setSuffix] = useState('')
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')
  const [selectedValue, setSelectedValue] = useState(null);

  const router = useRouter()

  const handleSubmit = () => {
    router.push('/emailsent')
  }

  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
        
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

            <Spacer height={10}/>
            
            <ThemedDropdown
                items={[]}
                value={selectedValue}
                setValue={setSelectedValue}
                placeholder='Civil Status'
                order={0}
            />

            <Spacer height={10}/>

            <ThemedDropdown
                items={[]}
                value={selectedValue}
                setValue={setSelectedValue}
                placeholder='Nationality'
                order={1}
            />

            <Spacer height={10}/>

            <ThemedDropdown
                items={[]}
                value={selectedValue}
                setValue={setSelectedValue}
                placeholder='Religion'
                order={2}
            />

            <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Home Address'
                    value={address}
                    onChangeText={setAddress}
                />

            <Spacer height={10}/>
            
            <ThemedTextInput
                placeholder='Mobile Number'
                value={mobnum}
                onChangeText={setMobNum}
                keyboardType='numeric'
            />

            <Spacer height={10}/>

            <ThemedTextInput
                placeholder='Email Address'
                value={email}
                onChangeText={setEmail}
            />

            <Spacer height={15}/>

            <ThemedButton onPress={handleSubmit}>
                <ThemedText btn={true}>Register</ThemedText>
            </ThemedButton>

        </ThemedKeyboardAwareScrollView>  
    </ThemedView>  
  )
}

export default PersonalInfo

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