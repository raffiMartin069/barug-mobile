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
import React, { use, useEffect, useState } from 'react'
import { StyleSheet, View, Text } from 'react-native'

type Household = {
  id: string
  head: string
}

type Family = {
  id: string
  head: string
}

type FamilyMembership = {
  householdId: string
  familyId: string
  householdHeadRelationship: string
  familyHeadRelationship: string
  yearsOfResidency: number
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
  const household_id = useDropdownValueStore((state) => state.value)
  const [households, setHouseholds] = useState<Household[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [householRelation, setHouseholdRelation] = useState<string>("")
  const [familyRelation, setFamilyRelation] = useState<string>("")
  const [joinFamily, setJoinFamily] = useState<FamilyMembership>({})
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyODcsInVzZXJuYW1lIjoiam9lbEBnbWFpbC5jb20iLCJyb2xlIjoiUEVSU09OIiwiZXhwIjoxNzU1Njk4MjgzfQ.8XGGafSCBJGIi2OgK9jbs0KuY15RafXgemFWHnutHPo"

  const joinFamilyHandler = (data: FamilyMembership) => {
    console.info('Joining family: ', data)
  }

  useEffect(() => {
    const fetchFamily = async (val: string) => {
      const result = await APICall.get('/api/v1/residents/fetch/families/', { q: val }, token)
      console.info('Request for fetching family data is successful!')
      return result
    }
    (async () => {
      console.info(household_id)
      if (!household_id) return;
      const res = await fetchFamily(household_id)
      const mapped = res.message.family_data.map((family) => ({
        label: `${family.person.first_name} ${family.person.middle_name ? family.person.middle_name : ''} ${family.person.last_name}`,
        value: family.family_id
      }))
      console.log("Mapped Families:", mapped)
      setFamilies(mapped)
      // console.info(families)
    })();

  }, [household_id])

  useEffect(() => {
    const trimmed = householdSearchText.trim();
    console.log("Household Search Text:", trimmed);
    if (!trimmed) return;
    const fetchHousehold = async (text: string) => {
      try {
        const result = await APICall.get('/api/v1/residents/households/search/', { q: text }, token)
        console.info('Request for fetching household data is successful!')
        return result
      } catch (error) {
        console.warn("Error fetching household data");
        console.error(error);
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
                householdId: household_id,
                familyId: families.find((family) => family.value === familyRelation)?.value || "",
                householdHeadRelationship: householRelation,
                familyHeadRelationship: familyRelation,
                yearsOfResidency: parseInt(resYrs || "0", 10),
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