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
import { RELATIONSHIPS } from '@/constants/relationships'
import { useFamilies } from '@/hooks/useFamilies'
import { useHouseholds } from '@/hooks/useHouseholds'
import { useDropdownValueStore } from '@/store/dropdownValueStore'
import { useTextSearch } from '@/store/textStore'
import { FamilyMembership } from '@/types/family_membership'
import { AuthTokenUtil } from '@/utilities/authTokenUtility'
import { MembershipException } from '@/utilities/exceptions/membership_exceptions'
import { FamilyMembershipValidator } from '@/utilities/membership_validators'
import React, { useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'

const JoinHouseFam = () => {
  const [resYrs, setResYrs] = useState()
  const householdSearchText = useTextSearch((state: { searchTexts: Record<string, string> }) => state.searchTexts["households"] || "")
  const household_id = useDropdownValueStore((state: { householdId: string }) => state.householdId)
  const [householRelation, setHouseholdRelation] = useState<string>("")
  const [familyRelation, setFamilyRelation] = useState<string>("")
  const familyId = useDropdownValueStore((state: { familyId: string }) => state.familyId)
  const households = useHouseholds(householdSearchText) || []
  const families = useFamilies(household_id) || []

  const joinFamilyHandler = async (data: FamilyMembership) => {
    try {
      const token = await AuthTokenUtil.getToken();
      if (!token) throw new Error("No authentication token found");
      FamilyMembershipValidator.validate(data)
      const result = await APICall.post('/api/v1/residents/family-membership/', data, token);
      console.info('Request for joining family is successful! ', JSON.stringify(result));
    } catch (error) {
      if (error instanceof MembershipException) {
        Alert.alert("Something went wrong.", error.message)
        return;
      }
      console.warn("Error joining family:", error)
      const message = error?.response?.data?.error || error
      Alert.alert("Something went wrong.", message)
    }
  }
  
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
            items={RELATIONSHIPS}
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
            items={RELATIONSHIPS}
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