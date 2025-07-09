import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import React, { useState } from 'react';
import { Image, Keyboard, ScrollView, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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

  return (
    <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
    >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
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

                    <Spacer height={10}/>
                    
                    <ThemedDropdown
                        items={[]}
                        value={selectedValue}
                        setValue={setSelectedValue}
                        placeholder="Civil Status"
                    />

                    <Spacer height={10}/>

                    <ThemedDropdown
                        items={[]}
                        value={selectedValue}
                        setValue={setSelectedValue}
                        placeholder="Nationality"
                    />

                    <Spacer height={10}/>

                    <ThemedDropdown
                        items={[]}
                        value={selectedValue}
                        setValue={setSelectedValue}
                        placeholder="Religion"
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

                    <ThemedButton>
                        <ThemedText btn={true}>REGISTER</ThemedText>
                    </ThemedButton>
                </ThemedView>
            </ScrollView>
        </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
    
  )
}

export default PersonalInfo

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        paddingVertical: 30,
        backgroundColor: 'white',
    },
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