import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

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

import { useGeolocationStore } from '@/store/geolocationStore'
import { useHouseholdCreationStore } from '@/store/householdCreationStore'

import { useHouseholdCreation } from '@/hooks/useHouseholCreation'
import { useNumericInput } from '@/hooks/useNumericInput'
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { useAccountRole } from '@/store/useAccountRole'
import { GeolocationType } from '@/types/geolocation'
import { HouseholdCreation } from '@/types/householdCreation'
import { PersonSearchRequest } from '@/types/householdHead'
import { HouseholdCreationRequest } from '@/types/request/householdCreationRequest'

const CreateHousehold = () => {
  const router = useRouter()

  const [headSearchText, setHeadSearchText] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

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
  const lat = useGeolocationStore((state: GeolocationType) => state.lat)
  const lng = useGeolocationStore((state: GeolocationType) => state.lng)
  const sitioCode = useGeolocationStore((state: GeolocationType) => state.purokSitioCode)

  const { results: residentItems, search } = usePersonSearchByKey()
  const { saveHousehold } = useHouseholdCreation()
  const profile = useAccountRole((s) => s.getProfile('resident'))
  const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!householdNumber) newErrors.householdNumber = 'Household number is required'
    if (!address) newErrors.address = 'Address is required'
    if (!householdHead) newErrors.householdHead = 'Household head is required'
    if (!houseHoldType) newErrors.houseHoldType = 'Household type is required'
    if (!houseHoldOwnership) newErrors.houseHoldOwnership = 'Household ownership is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleHomeAddress = () => {
    router.push({
      pathname: '/hh_mapaddress',
      params: {
        returnTo: '/homeaddress',
      }
    })
  }

  const handleSave = async () => {
    if (!validate()) return
    const data: HouseholdCreationRequest = {
      p_house_type_id: houseHoldType,
      p_house_ownership_id: houseHoldOwnership,
      p_city: city,
      p_barangay: barangay,
      p_sitio_purok: purok,
      p_street: street,
      p_added_by_id: String(addedById ?? '1'),
      p_household_num: householdNumber,
      p_house_num: houseNumber,
      p_household_head_id: householdHead,
      p_latitude: parseFloat(lat) || 0,
      p_longitude: parseFloat(lng) || 0,
    }
    const id = await saveHousehold(data);
    if(id) {
      setHeadSearchText('')
      router.push('/(bhwmodals)/(family)/createfamily')
    }
  }

  useNumericInput(householdNumber, setHouseholdNumber)

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
            keyboardType='numeric'
          />
          {errors.householdNumber && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.householdNumber}</ThemedText>}
          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder='Home Address'
              value={address}
              onChangeText={() => { }}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>
          {errors.address && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.address}</ThemedText>}
          <Spacer height={10} />

          <ThemedSearchSelect<PersonSearchRequest>
            items={residentItems}
            getLabel={(p) =>
              p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
            }
            getSubLabel={(p) => p.address}
            inputValue={headSearchText}
            onInputValueChange={(t) => {
              resetHouseholdheadIfEmpty(t, setHouseholdHead)
              setHeadSearchText(t)
              search(t)
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
          {errors.householdHead && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.householdHead}</ThemedText>}
          <ThemedDropdown
            items={houseType}
            value={houseHoldType}
            setValue={setHouseType}
            placeholder={'House Type'}
            order={0}
          />
          {errors.houseHoldType && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.houseHoldType}</ThemedText>}
          <Spacer height={10} />

          <ThemedDropdown
            items={houseOwnership}
            value={houseHoldOwnership}
            setValue={setHouseOwnership}
            placeholder={'House Ownership'}
            order={1}
          />
          {errors.houseHoldOwnership && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.houseHoldOwnership}</ThemedText>}
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

function resetHouseholdheadIfEmpty(t: string, setHouseholdHead: (value: string) => void) {
  // this will ensure that if the text is empty the value of the household head stays empty or resets to empty
  // if removed, the householhead text will take the previously selected value and treat it as is even if the text is empty
  // please do not remove this function. thanks!
  if (t === '' || t === null || t === undefined || t.length === 0) {
    setHouseholdHead('')
  }
}
