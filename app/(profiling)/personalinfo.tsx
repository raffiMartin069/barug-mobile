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
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const PersonalInfo = () => {
  const params = useSearchParams()

  const [fname, setFname] = useState('')
  const [mname, setMname] = useState('')
  const [lname, setLname] = useState('')
  const [suffix, setSuffix] = useState('')
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('')
  const [civilStatus, setCivilStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');
  const [haddress, setHAddress] = useState('')
  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (params.get('street') || params.get('puroksitio') || params.get('brgy') || params.get('city') ) {
        const fullAddress = `${params.get('street') ?? ''}, ${params.get('puroksitio') ?? ''}, ${params.get('brgy') ?? ''}, ${params.get('city') ?? ''}`
        setHAddress(fullAddress)
    }
  })

  const router = useRouter()

  const handleSubmit = () => {
    router.push('/createhousehold')
  }

  const handleHomeAddress = () => {
    router.push({
        pathname: '/mapaddress',
        params: {
            returnTo: '/residentaddress',
        }
    })
  }

  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
            <View>

                <ThemedText style={styles.text} title={true}>Personal Information</ThemedText>

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
                    value={civilStatus}
                    setValue={setCivilStatus}
                    placeholder='Civil Status'
                    order={0}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={nationality}
                    setValue={setNationality}
                    placeholder='Nationality'
                    order={1}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={religion}
                    setValue={setReligion}
                    placeholder='Religion'
                    order={2}
                />

                <Spacer height={10}/>

                <Pressable onPress={handleHomeAddress}>
                    <ThemedTextInput
                        placeholder='Home Address'
                        value={haddress}
                        onChangeText={setHAddress}
                        editable={false}
                        pointerEvents="none"
                    />
                </Pressable>

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
            </View>

            <Spacer height={15}/>
            
            <View>
                <ThemedButton onPress={handleSubmit}>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>
            

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
    link: {
        textAlign: 'right',
    },
})