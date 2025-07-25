import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedProgressBar from '@/components/ThemedProgressBar';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { civilStatusOptions, genderOptions, nationalityOptions, religionOptions } from '../../constants/formoptions';

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
  const [street, setStreet] = useState('');
  const [purokSitio, setPurokSitio] = useState('');
  const [brgy, setBrgy] = useState('');
  const [city, setCity] = useState('');
  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cpassword, setCPassword] = useState('')

  useEffect(() => {
    const streetParam = params.get('street') ?? '';
    const purokParam = params.get('puroksitio') ?? '';
    const brgyParam = params.get('brgy') ?? '';
    const cityParam = params.get('city') ?? '';

    if (streetParam || purokParam || brgyParam || cityParam) {
        const fullAddress = `${streetParam}, ${purokParam}, ${brgyParam}, ${cityParam}`;
        setStreet(streetParam);
        setPurokSitio(purokParam);
        setBrgy(brgyParam);
        setCity(cityParam);
        setHAddress(fullAddress);
    }
  }, [params])

  const router = useRouter()

  const handleSubmit = () => {
    router.push({
        pathname: '/socioeconomicinfo',
        params: {
            fname,
            mname,
            lname,
            suffix,
            gender,
            dob,
            civilStatus,
            nationality,
            religion,
            haddress,
            street,
            purokSitio,
            brgy,
            city,
            mobnum,
            email,
            password,
            cpassword,
        }
    })
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
        <ThemedAppBar
            title='Personal Information'
            showNotif={false}
            showProfile={false}
        />
        
        <ThemedProgressBar
            step={1}
            totalStep={3}
        />
        
        <ThemedKeyboardAwareScrollView>
            <View>

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
                    options={genderOptions}
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
                    items={civilStatusOptions}
                    value={civilStatus}
                    setValue={setCivilStatus}
                    placeholder='Civil Status'
                    order={0}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={nationalityOptions}
                    value={nationality}
                    setValue={setNationality}
                    placeholder='Nationality'
                    order={1}
                />

                <Spacer height={10}/>
                
                <ThemedDropdown
                    items={religionOptions}
                    value={religion}
                    setValue={setReligion}
                    placeholder='Religion'
                    order={2}
                />

                <Spacer height={10}/>

                <Pressable onPress={handleHomeAddress}>
                    <ThemedTextInput
                        placeholder='Home Address'
                        multiline={true}
                        numberOfLines={2}
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

                <Spacer height={10}/>         

                <ThemedTextInput
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Spacer height={10}/>         

                <ThemedTextInput
                    placeholder='Confirm Password'
                    value={cpassword}
                    onChangeText={setCPassword}
                    secureTextEntry
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