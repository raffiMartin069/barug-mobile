import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const CreateHousehold = () => {
  const [householdnum, setHouseholdNum] = useState('')
  const [housenum, setHouseNum] = useState('')
  const [street, setStreet] = useState('')
  const [puroksitio, setPurokSitio] = useState('')
  const [brgy, setBrgy] = useState('')
  const [city, setCity] = useState('')
  const [hhhead, setHhHead] = useState('')
  const [housetype, setHouseType] = useState('')
  const [houseownership, setHouseOwnership] = useState('')

  const router = useRouter()

  const handleSubmit = () => {
    router.push('/createfamily')
  }


  return (
    <ThemedView safe={true}>
      <ThemedKeyboardAwareScrollView>
        <View>
            <ThemedText style={styles.text} title={true}>Create Household</ThemedText>

            <Spacer height={20}/>
            <ThemedTextInput
              placeholder='Household Number'
              value={householdnum}
              onChangeText={setHouseholdNum}
            />

            <Spacer height={10}/>

            <ThemedTextInput
              placeholder='House Number'
              value={housenum}
              onChangeText={setHouseNum}
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

            <Spacer height={10}/>

            <ThemedTextInput
              placeholder='Household Head'
              value={hhhead}
              onChangeText={setHhHead}
            />

            <Spacer height={10}/>

            <ThemedDropdown
              items={[]}
              value={housetype}
              setValue={setHouseType}
              placeholder='House Type'
              order={0}
            />

            <Spacer height={10}/>

            <ThemedDropdown
              items={[]}
              value={houseownership}
              setValue={setHouseOwnership}
              placeholder='House Ownership'
              order={1}
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

export default CreateHousehold

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
})