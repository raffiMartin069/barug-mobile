import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown_'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { HOUSE_OWNERSHIP } from '@/constants/houseOwnership'
import { HOUSE_TYPE } from '@/constants/houseTypes'
import useDynamicRouteStore from '@/store/dynamicRouteStore'
import { householdCreationStore } from '@/store/householdCreationStore'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, useColorScheme, View, Text } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'

const CreateHousehold = () => {
  const params = useSearchParams()

  // const [householdnum, setHouseholdNum] = useState('')
  // const [hAddress, setHAddress] = useState('')
  // const [housetype, setHouseType] = useState('')
  // const [houseownership, setHouseOwnership] = useState('')
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const router = useRouter()

  const [fullAddr, setFullAddr] = useState('')
  
  const setRoute = useDynamicRouteStore((state: { setCurrentRoute: (route: string) => void }) => state.setCurrentRoute)
  
  const setHouseType = householdCreationStore((state: { setHouseType: (houseType: string) => void }) => state.setHouseType);
  const setHouseOwnership = householdCreationStore((state: { setHouseOwnership: (houseOwnership: string) => void }) => state.setHouseOwnership);
  const setMessage = householdCreationStore((state: { setMessage: (message: string) => void }) => state.setMessage);
  
  const [addressErrorMessage, setAddressErrorMessage] = useState('')
  const [houseTypeErrorMessage, setHouseTypeErrorMessage] = useState('')
  const [houseOwnershipErrorMessage, setHouseOwnershipErrorMessage] = useState('')

  const address = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state);
  const houseType = householdCreationStore((state: { houseType: string }) => state.houseType);
  const houseOwnership = householdCreationStore((state: { houseOwnership: string }) => state.houseOwnership);
  const message = householdCreationStore((state: { message: string }) => state.message);

  const addrHandler = () =>  {
    if (address.houseNumber) {
      setFullAddr(`${address.houseNumber} ${address.street} ${address.sitio} ${address.barangay} ${address.city}`);
    }
  }

  useEffect(() => {
    addrHandler();
  }, [address]);

  const handleSubmit = () => {

    if (!address.houseNumber) {
      setAddressErrorMessage('House number is required');
      return;
    }

    if (!address.street) {
      setAddressErrorMessage('Street is required');
      return;
    }

    if (!address.sitio) {
      setAddressErrorMessage('Sitio is required');
      return;
    }

    if (!address.barangay) {
      setAddressErrorMessage('Barangay is required');
      return;
    }

    if (!address.city) {
      setAddressErrorMessage('City is required');
      return;
    }

    if (!houseType) {
      setHouseTypeErrorMessage('House type is required');
      return;
    }

    if (!houseOwnership) {
      setHouseOwnershipErrorMessage('House ownership is required');
      return;
    }

    router.push('/familyCreationSummary')
  }

  // useEffect(() => {
  //   if (params.get('hnum') || params.get('street') || params.get('puroksitio') || params.get('brgy') || params.get('city')) {
  //     const fullAddress = `${params.get('hnum') ?? ''} ${params.get('street') ?? ''}, ${params.get('puroksitio') ?? ''}, ${params.get('brgy') ?? ''}, ${params.get('city') ?? ''}`
  //     setHAddress(fullAddress)
  //   }
  // })

  const handleHomeAddress = () => {
    setRoute('/createhousehold')
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

          {/* <ThemedTextInput
            placeholder='House Number'
            value={householdnum}
            onChangeText={setHouseholdNum}
          /> */}

          <Spacer height={10} />

          <ThemedText>Home Address</ThemedText>
          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder='Press to open map'
              value={fullAddr ? fullAddr : '' }
              onChangeText={addrHandler}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          <Text style={{ fontSize: 12, color: 'red', margin: 5 }}>{addressErrorMessage}</Text>

          <Spacer height={10} />

          {/* 
            Household head field not required as of the moment.
          The user who creates the household will automatically
          be the household head.

            Changes cna be made until the team decides whether to
          to completely remove or not.
          */}
          {/* <ThemedTextInput
            placeholder='Household Head'
            value={hhhead}
            onChangeText={setHhHead}
          /> */}

          <Spacer height={10} />
          
          <ThemedText>House Type</ThemedText>
          <ThemedDropdown
            items={HOUSE_TYPE}
            value={houseType}
            setValue={setHouseType}
            placeholder='Press to show house types'
            order={0}
          />
          <Text style={{ fontSize: 12, color: 'red', margin: 5 }}>{houseTypeErrorMessage}</Text>

          <Spacer height={10} />

          <ThemedText>House Ownership</ThemedText>
          <ThemedDropdown
            items={HOUSE_OWNERSHIP}
            value={houseOwnership}
            setValue={setHouseOwnership}
            placeholder='Press to show house ownership'
            order={1}
          />
          <Text style={{ fontSize: 12, color: 'red', margin: 5 }}>{houseOwnershipErrorMessage}</Text>

          <Spacer height={10} />

          <ThemedText>Household Creation Message</ThemedText>
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
            value={message}
            onChangeText={(val) => {
              setMessage(val)
            }}
          ></TextInput>

          <Spacer height={15} />

          <View>
            <ThemedButton onPress={handleSubmit}>
              <ThemedText btn={true}>Proceed To Summary</ThemedText>
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