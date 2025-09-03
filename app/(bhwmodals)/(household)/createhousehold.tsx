import React, { useMemo, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown_'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'

import { houseOwnership } from '@/constants/houseOwnership'
import { houseType } from '@/constants/houseType'

import { HouseholdCreation as repo } from '@/repository/householCreation'

import { HouseholdCreationService } from '@/services/householdCreation'
import { PersonSearchService } from '@/services/personSearch'

import { useGeolocationStore } from '@/store/geolocationStore'
import { useHouseholdCreationStore } from '@/store/householCrreationStore'

import { GeolocationType } from '@/types/geolocation'
import { HouseholdCreation } from '@/types/householdCreation'
import { HouseholdCreationRequest } from '@/types/request/householdCreationRequest'

type Hhead = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

const HHHEAD: Hhead[] = []

const CreateHousehold = () => {
  const router = useRouter()

  const [headSearchText, setHeadSearchText] = useState('')
  const residentItems = useMemo(() => HHHEAD, [])

  const setHouseholdNumber = useHouseholdCreationStore((state: HouseholdCreation) => state.setHouseholdNumber)
  const setHouseholdHead = useHouseholdCreationStore((state: HouseholdCreation) => state.setHouseholdHead)
  const setHouseType = useHouseholdCreationStore((state: HouseholdCreation) => state.setHouseType)
  const setHouseOwnership = useHouseholdCreationStore((state: HouseholdCreation) => state.setHouseOwnership) 

  const householdNumber = useHouseholdCreationStore((state: HouseholdCreation) => state.householdNumber)
  const householdHead = useHouseholdCreationStore((state: HouseholdCreation) => state.householdHead)
  const houseHoldType = useHouseholdCreationStore((state: HouseholdCreation) => state.houseType)
  const houseHoldOwnership = useHouseholdCreationStore((state: HouseholdCreation) => state.houseOwnership)

  const houseNumber = useGeolocationStore((state: GeolocationType) => state.houseNumber)
  const street = useGeolocationStore((state: GeolocationType) => state.street)
  const purok = useGeolocationStore((state: GeolocationType) => state.purokSitio)
  const barangay = useGeolocationStore((state: GeolocationType) => state.barangay)
  const city = useGeolocationStore((state: GeolocationType) => state.city)

  const address = useGeolocationStore((state: GeolocationType) => state.getFullAddress())

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: {
        returnTo: '/homeaddress',
      }
    }) 
  }

  const handlePersonSearch = async () => {
    if (!headSearchText) return;
    const search = new PersonSearchService(headSearchText);
    const result = await search.execute();
    console.log(result)
    result.forEach((person) => {
      if (!HHHEAD.some(existing => existing.person_id === person.person_id)) {
      HHHEAD.push(person);
    }
    });
  }

  const handleSave = async () => {
    const service = new HouseholdCreationService(new repo());
    const data: HouseholdCreationRequest = {
      p_house_type_id: houseHoldType,
      p_house_ownership_id: houseHoldOwnership,
      p_city: city,
      p_barangay: barangay,
      p_sitio_purok: purok,
      p_street: street,
      p_added_by_id: "1",
      p_household_num: householdNumber,
      p_house_num: houseNumber,
      p_household_head_id: householdHead,
    }

    try {
      const result = await service.execute(data);
      Alert.alert('Success', `Household created successfully ${result}`)
    } catch(err) {
      Alert.alert('Something went wrong', `Household creation failed: ${err.message}`)
    }
  }

  return (
    <ThemedView safe>
      <ThemedAppBar
        title='Register Household'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput
            placeholder='Household Number'
            value={householdNumber}
            onChangeText={setHouseholdNumber}
          />

          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder='Home Address'
              value={address}
              onChangeText={() => {}}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          <Spacer height={10} />

          <ThemedSearchSelect<Hhead>
            items={residentItems}
            getLabel={(p) =>
              p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
            }
            getSubLabel={(p) => p.address}
            inputValue={headSearchText}
            onInputValueChange={(t) => {
              setHeadSearchText(t)
              handlePersonSearch()
              // setHeadSearchText(t)
              // if (!t) setHhHead('')
            }}
            placeholder='Search Household Head (Name / Resident ID)'
            filter={(p, q) => {
              const query = q.toLowerCase()
              return (
                p.full_name.toLowerCase().includes(query) ||
                (p.person_code || '').toLowerCase().includes(query) ||
                (p.address || '').toLowerCase().includes(query) ||
                query.includes(p.full_name.toLowerCase()) ||
                (p.person_code && query.includes(p.person_code.toLowerCase()))
              )
            }}
            onSelect={(p) => {
              setHouseholdHead(p.person_id)
              setHeadSearchText(
                p.person_code
                  ? `${p.full_name} · ${p.person_code}`
                  : p.full_name
              )
            }}
          />

          <ThemedDropdown
            items={houseType}
            value={houseHoldType}
            setValue={setHouseType}
            placeholder={'House Type'}
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={houseOwnership}
            value={houseHoldOwnership}
            setValue={setHouseOwnership}
            placeholder={'House Ownership'}
            order={1}
          />
        </View>

        <Spacer height={15} />

        <View>
          <ThemedButton onPress={handleSave}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default CreateHousehold

const styles = StyleSheet.create({})