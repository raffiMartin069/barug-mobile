import { APICall } from '@/api/api'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchableDropdown from '@/components/ThemedSearchableDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useDropdownValueStore } from '@/store/dropdownValueStore'
import { useTextSearch } from '@/store/textStore'
import { FamilyMembership } from '@/types/family_membership'
import { AuthTokenUtil } from '@/utilities/authTokenUtility'
import { MembershipException } from '@/utilities/exceptions/membership_exceptions'
import { FamilyMembershipValidator } from '@/utilities/membership_validators'
import React, { use, useEffect, useState } from 'react'
import { StyleSheet, View, Text, Alert } from 'react-native'

type Household = {
  id: string
  head: string
}

type Family = {
  id: string
  head: string
}



const JoinHouseFam = () => {
  const residents = [
    { label: "Juan Dela Cruz", value: "1234-1" },
    { label: "Maria Santos", value: "5678-1" },
    { label: "Juan Dela Cruz", value: "1234-2" },
    { label: "Maria Santos", value: "5678-2" },
  ]

  const relationships = [
    { label: "Household Head", value: "1" },
    { label: "Family Head", value: "2" },
    { label: "Spouse", value: "3" },
    { label: "Son", value: "4" },
    { label: "Daughter", value: "5" },
    { label: "Parent", value: "6" },
    { label: "Sibling", value: "7" },
    { label: "Grandchild", value: "8" },
    { label: "Grandparent", value: "9" },
    { label: "Nephew", value: "10" },
    { label: "Niece", value: "11" },
    { label: "Uncle", value: "12" },
    { label: "Aunt", value: "13" },
    { label: "Cousin", value: "14" },
    { label: "In-Law", value: "15" },
    { label: "Boarder", value: "16" },
    { label: "Renter", value: "17" },
    { label: "Domestic Helper", value: "18" },
    { label: "Other Relative", value: "19" },
    { label: "Non-Relative", value: "20" },
  ]
  const [res, setRes] = useState()
  const [resYrs, setResYrs] = useState()
  const householdSearchText = useTextSearch((state) => state.searchTexts["households"] || "")
  const familySearchText = useTextSearch((state) => state.searchTexts["families"] || "")
  const household_id = useDropdownValueStore((state) => state.householdId)
  const [households, setHouseholds] = useState<Household[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [householRelation, setHouseholdRelation] = useState<string>("")
  const [familyRelation, setFamilyRelation] = useState<string>("")
  const [joinFamily, setJoinFamily] = useState<FamilyMembership>({})
  const familyId = useDropdownValueStore((state) => state.familyId)
  

  const joinFamilyHandler = async (data: FamilyMembership) => {
    try {
      const token = await AuthTokenUtil.getToken();
      if (!token) throw new Error("No authentication token found");
      FamilyMembershipValidator.validate(data)
      const result = await APICall.post('/api/v1/residents/family-membership/', data, token);
      console.info('Request for joining family is successful! ', JSON.stringify(result));
    } catch (error) {
      if (error instanceof MembershipException) {
        Alert.alert(error.message)
        return;
      }
      console.warn("Error joining family:", error)
      const message = error?.response?.data?.error || error
      Alert.alert(message)
    }
  }

  useEffect(() => {
    const fetchFamily = async (val: string) => {
      try {
        const token = await AuthTokenUtil.getToken();
        const result = await APICall.get('/api/v1/residents/fetch/families/', { q: val }, token)
        console.info('Request for fetching family data is successful!')
        return result
      } catch (error) {
        console.warn("Error fetching family data");
        const message = error?.response?.data?.error || "Something went wrong"
        console.error(message)
        Alert.alert("Something went wrong, please contact Barangay Support for more information.")
      }
    }
    (async () => {
      if (!household_id) return;
      const res = await fetchFamily(household_id)
      const mapped = res.message.family_data.map((family) => ({
        label: `${family.person.first_name} ${family.person.middle_name ? family.person.middle_name : ''} ${family.person.last_name}`,
        value: family.family_id
      }))
      setFamilies(mapped)
    })();
  }, [household_id])

  useEffect(() => {
    const trimmed = householdSearchText.trim();
    console.log("Household Search Text:", trimmed);
    if (!trimmed) {
      setHouseholds([]);
      setFamilies([]);
      useDropdownValueStore.getState().setHouseholdId("");
      useDropdownValueStore.getState().setFamilyId("");
      return
    };
    const fetchHousehold = async (text: string) => {
      try {
        const token = await AuthTokenUtil.getToken();
        const result = await APICall.get('/api/v1/residents/households/search/', { q: text }, token)
        console.info('Request for fetching household data is successful!')
        return result
      } catch (error) {
        console.warn("Error fetching household data");
        const message = error?.response?.data?.error || "Something went wrong"
        console.error(message)
        Alert.alert("Something went wrong, please contact Barangay Support for more information.")
      }
    }
    (async () => {
      const result = await fetchHousehold(trimmed)
      if (!result) return
      const mapped = result.message.map((household) => ({
        label: household.household_head_name,
        value: household.household_id
      }))
      setHouseholds(mapped)
    })()

  }, [householdSearchText])


  return (
    <ThemedView safe={true}>
      <ThemedAppBar
        title='Join Household & Family Unit'
        showNotif={false}
        showProfile={false}
      />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedSearchableDropdown
            searchplaceholder={'Search Household Number / Household Head'}
            dropdwonplaceholder={'Select your respective household'}
            data={households}
            searchKey="households"
            dropdownType="household"
          />

          <Spacer />

          <ThemedDropdown
            placeholder={'Select Household Head Relationship'}
            items={relationships}
            value={householRelation}
            order={1}
            setValue={(val: string) => setHouseholdRelation(val)}
          />

          <Spacer />

          <ThemedSearchableDropdown
            searchplaceholder={'Search Family Number / Family Head'}
            dropdwonplaceholder={'Select your respective family unit'}
            data={families}
            order={2}
            searchKey="families"
            dropdownType="family"
          />

          <Spacer />

          <ThemedDropdown
            placeholder={'Select Family Head Relationship'}
            items={relationships}
            value={familyRelation}
            setValue={(val: string) => { setFamilyRelation(val) }}
            order={3}
          />

          <Spacer />

          <ThemedTextInput
            placeholder='Years of Residency'
            value={resYrs}
            onChangeText={setResYrs}
            keyboardType='numeric'
          />
        </View>

        <View>
          <ThemedButton
            onPress={() => {
              const familyMembership: FamilyMembership = {
                household_id: household_id,
                family_id: familyId,
                household_head_relationship: householRelation,
                family_head_relationship: familyRelation,
                years_of_residency: parseInt(resYrs || "0", 10),
              }
              console.log("Joining Family Membership:", familyMembership)
              joinFamilyHandler(familyMembership)
            }}
          >
            <ThemedText btn={true}>Join</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView >
  )
}

export default JoinHouseFam

const styles = StyleSheet.create({})