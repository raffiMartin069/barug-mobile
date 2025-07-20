import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const ResidentAddress = () => {
  const params = useSearchParams()
  const street = params.get("street") ?? "";
  const brgy = params.get("brgy") ?? "";
  const city = params.get("city") ?? "";

  const [streetState, setStreet] = useState(street)
  const [puroksitio, setPurokSitio] = useState('')
  const [brgyState, setBrgy] = useState(brgy)
  const [cityState, setCity] = useState(city)

  const router = useRouter()

  const submitAddress = () => {
    router.push({
        pathname: '/personalinfo',
        params: {
            street: streetState,
            puroksitio: puroksitio,
            brgy: brgyState,
            city: cityState,
        },
    })
  }

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
            title='Home Address'
            showNotif={false}
            showProfile={false}
        />
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedTextInput
                    placeholder='Street'
                    value={streetState}
                    onChangeText={setStreet}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='Purok or Sitio'
                    value={puroksitio}
                    onChangeText={setPurokSitio}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='Barangay'
                    value={brgyState}
                    onChangeText={setBrgy}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='City'
                    value={cityState}
                    onChangeText={setCity}
                />
            </View>
            <Spacer height={15}/>
            <View>
                <ThemedButton onPress={submitAddress}>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default ResidentAddress

const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
    },
})