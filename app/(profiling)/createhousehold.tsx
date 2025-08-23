import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { HOUSE_OWNERSHIP } from '@/constants/houseOwnership'
import { HOUSE_TYPE } from '@/constants/houseTypes'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, useColorScheme, View } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'

const CreateHousehold = () => {
  const params = useSearchParams()

  const [householdnum, setHouseholdNum] = useState('')
  const [hAddress, setHAddress] = useState('')
  const [hhhead, setHhHead] = useState('')
  const [housetype, setHouseType] = useState('')
  const [houseownership, setHouseOwnership] = useState('')
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const router = useRouter()

  const handleSubmit = () => {
    router.push('/createfamily')
  }

  useEffect(() => {
    if (params.get('hnum') || params.get('street') || params.get('puroksitio') || params.get('brgy') || params.get('city')) {
      const fullAddress = `${params.get('hnum') ?? ''} ${params.get('street') ?? ''}, ${params.get('puroksitio') ?? ''}, ${params.get('brgy') ?? ''}, ${params.get('city') ?? ''}`
      setHAddress(fullAddress)
    }
  })

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: {
        returnTo: '/homeaddress',
      }
    })
  }


  return (
    <ThemedView safe={true}>
      <ThemedAppBar
        title='Create Household'
        showNotif={false}
        showProfile={false}
      />
      <ThemedKeyboardAwareScrollView>
        <View>

          <ThemedTextInput
            placeholder='House Number'
            value={householdnum}
            onChangeText={setHouseholdNum}
          />

          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder='Home Address'
              value={hAddress}
              onChangeText={setHAddress}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Household Head'
            value={hhhead}
            onChangeText={setHhHead}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={HOUSE_TYPE}
            value={housetype}
            setValue={setHouseType}
            placeholder='House Type'
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={HOUSE_OWNERSHIP}
            value={houseownership}
            setValue={setHouseOwnership}
            placeholder='House Ownership'
            order={1}
          />

          <Spacer height={10} />

          <TextInput
            editable
            multiline
            numberOfLines={5}
            maxLength={150}
            placeholder='(Optional) - Enter request message.'
            style={{
              backgroundColor: 'white',
              borderColor: theme.text,
              borderWidth: 0,
              borderBottomWidth: 2,
              borderRadius: 0,
              paddingHorizontal: 15,
            }}
          ></TextInput>

          <Spacer height={15} />

          <View>
            <ThemedButton onPress={handleSubmit}>
              <ThemedText btn={true}>Continue</ThemedText>
            </ThemedButton>
          </View>

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