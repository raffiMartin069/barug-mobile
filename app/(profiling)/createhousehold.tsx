import React, { useState } from 'react'
import { Pressable, TextInput, useColorScheme, View, Text } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'

import { useDynamicURL } from '@/store/dynamicApiUrlStore'
import useDynamicRouteStore from '@/store/dynamicRouteStore'
import { householdCreationStore } from '@/store/householdCreationStore'
import { HOUSE_OWNERSHIP } from '@/constants/houseOwnership'
import { HOUSE_TYPE } from '@/constants/houseTypes'

import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown_'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'


const CreateHousehold = () => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const router = useRouter()

  const setRoute = useDynamicRouteStore((state: { setCurrentRoute: (route: string) => void }) => state.setCurrentRoute)

  const setHouseType = householdCreationStore((state: { setHouseType: (houseType: string) => void }) => state.setHouseType);
  const setHouseOwnership = householdCreationStore((state: { setHouseOwnership: (houseOwnership: string) => void }) => state.setHouseOwnership);
  const setMessage = householdCreationStore((state: { setMessage: (message: string) => void }) => state.setMessage);
  const setUrl = useDynamicURL((state: { setUrl: (newUrl: string ) => void}) => state.setUrl);

  const [addressErrorMessage, setAddressErrorMessage] = useState('')
  const [houseTypeErrorMessage, setHouseTypeErrorMessage] = useState('')
  const [houseOwnershipErrorMessage, setHouseOwnershipErrorMessage] = useState('')

  const address = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state);
  const houseType = householdCreationStore((state: { houseType: string }) => state.houseType);
  const houseOwnership = householdCreationStore((state: { houseOwnership: string }) => state.houseOwnership);
  const message = householdCreationStore((state: { message: string }) => state.message);

  const fullAddr = [address.houseNumber, address.street, address.sitio, address.barangay, address.city].filter(Boolean).join(' ');


  const validateFields = () => {
  const errors: Record<string, string> = {};

  if (!address.houseNumber) errors.address = 'House number is required';
  else if (!address.street) errors.address = 'Street is required';
  else if (!address.sitio) errors.address = 'Sitio is required';
  else if (!address.barangay) errors.address = 'Barangay is required';
  else if (!address.city) errors.address = 'City is required';

  if (!houseType) errors.houseType = 'House type is required';
  if (!houseOwnership) errors.houseOwnership = 'House ownership is required';

  setAddressErrorMessage(errors.address ?? '');
  setHouseTypeErrorMessage(errors.houseType ?? '');
  setHouseOwnershipErrorMessage(errors.houseOwnership ?? '');

  return Object.keys(errors).length === 0;
};

  const handleSubmit = () => {
    router.push('/familyCreationSummary')
  }

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
        <View style={{ gap: 25 }}>

          <View>
            <ThemedText>Home Address</ThemedText>
            <Pressable onPress={handleHomeAddress}>
              <ThemedTextInput
                placeholder='Press to open map'
                value={fullAddr ? fullAddr : ''}
                onChangeText={(val) => { }}
                editable={false}
                pointerEvents="none"
              />
            </Pressable>
            <Text style={{ fontSize: 12, color: 'red', margin: 5 }}>{addressErrorMessage}</Text>
          </View>

          <View>
            <ThemedText>House Type</ThemedText>
            <ThemedDropdown
              items={HOUSE_TYPE}
              value={houseType}
              setValue={setHouseType}
              placeholder='Press to show house types'
              order={0}
            />
            <Text style={{ fontSize: 12, color: 'red', margin: 5 }}>{houseTypeErrorMessage}</Text>
          </View>


          <View>
            <ThemedText>House Ownership</ThemedText>
            <ThemedDropdown
              items={HOUSE_OWNERSHIP}
              value={houseOwnership}
              setValue={setHouseOwnership}
              placeholder='Press to show house ownership'
              order={1}
            />
            <Text style={{ fontSize: 12, color: 'red', margin: 5 }}>{houseOwnershipErrorMessage}</Text>
          </View>


          <View>
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
          </View>


          <View>
            <ThemedButton onPress={() => {
              const isValid = validateFields();
              console.log(isValid);
              if(!isValid) return;
              setAddressErrorMessage('');
              setHouseTypeErrorMessage('');
              setHouseOwnershipErrorMessage('');
              setUrl('api/v1')
              handleSubmit();
            }}>
              <ThemedText btn={true}>Proceed To Summary</ThemedText>
            </ThemedButton>
          </View>

        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default CreateHousehold