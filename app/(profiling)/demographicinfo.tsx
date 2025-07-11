import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const DemographicInfo = () => {
  const [civilStatus, setCivilStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');

  const router = useRouter()

  const handleSubmit = () => {
    router.push('/socioeconomicinfo')
  }

  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedText style={styles.text} title={true}>Demographic Information</ThemedText>

                <Spacer height={20}/>

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

export default DemographicInfo

const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
    }
})