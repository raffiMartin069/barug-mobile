import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const HomeAddress = () => {
  const [hnum, setHNum] = useState('')
  const [street, setStreet] = useState('')
  const [puroksitio, setPurokSitio] = useState('')
  const [brgy, setBrgy] = useState('')
  const [city, setCity] = useState('')

  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedText>Home Address</ThemedText>
                <ThemedTextInput
                    placeholder='House Number'
                    value={hnum}
                    onChangeText={setHNum}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='Street'
                    value={street}
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
                    value={brgy}
                    onChangeText={setBrgy}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='City'
                    value={city}
                    onChangeText={setCity}
                />
            </View>
            <Spacer height={15}/>
            <View>
                <ThemedButton>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default HomeAddress

const styles = StyleSheet.create({})