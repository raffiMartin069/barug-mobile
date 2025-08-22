import React, { useState } from 'react';
import { Text, View, Alert } from 'react-native';
import { Link } from 'expo-router';

import apiClient from '@/api/apiClient';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedSearchableDropdown from '@/components/ThemedSearchableDropdown';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';

import { RELATIONSHIPS } from '@/constants/relationships';

import { useFamilies } from '@/hooks/useFamilies';
import { useHouseholds } from '@/hooks/useHouseholds';

import { useDropdownValueStore } from '@/store/dropdownValueStore';
import { useTextSearch } from '@/store/textStore';

import { FamilyMembership } from '@/types/family_membership';

import { MembershipException } from '@/utilities/exceptions/membership_exceptions';
import { FamilyMembershipValidator } from '@/utilities/membership_validators';

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
      /**
     * If something goes wrong when joining a family, is it because of this logic.
     * Currently I am unable to test the new JWT because it was not yet pushed in the 
     * servers develop branch. Once it will be available then I will be able to check
     * of how this endpoint behaves especially when handling JWT.
     *
     * I will leave this for now and revisit it later once the new JWT is available for testing.
     */
      FamilyMembershipValidator.validate(data)
      const result = await apiClient.post('/v1/residents/family-membership/', data);
      console.info('Request for joining family is successful! ', JSON.stringify(result.data));
      Alert.alert("Success", "You have successfully joined the family unit.")
    } catch (error) {
      if (error instanceof MembershipException) {
        Alert.alert("Something went wrong.", error.message)
        return;
      }
      console.warn("Error joining family - Join Family Handler: ", error)
      const message = error?.response?.data?.error || error.message || "Unknown error"
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
          <Text style={{ fontWeight: 'semibold', fontSize: 25, paddingVertical: 16 }}>Select Household</Text>
          <ThemedSearchableDropdown
            searchplaceholder={'Search Household Number / Household Head'}
            dropdwonplaceholder={'Select your respective household'}
            data={households}
            searchKey="households"
            dropdownType="household"
          />

          <ThemedDropdown
            placeholder={'Select Household Head Relationship'}
            items={RELATIONSHIPS}
            value={householRelation}
            order={1}
            setValue={(val: string) => setHouseholdRelation(val)}
          />

          <Spacer height={15} />

          <Link href="./createhousehold">
            <Text style={{ color: '#310101', textDecorationLine: 'underline' }}>Create a new household</Text>
          </Link>

          <Spacer height={50} />

          <Text style={{ fontWeight: 'semibold', fontSize: 25, paddingVertical: 16 }}>Select Family</Text>
          <ThemedSearchableDropdown
            searchplaceholder={'Search Family Number / Family Head'}
            dropdwonplaceholder={'Select your respective family unit'}
            data={families}
            order={2}
            searchKey="families"
            dropdownType="family"
          />

          <ThemedDropdown
            placeholder={'Select Family Head Relationship'}
            items={RELATIONSHIPS}
            value={familyRelation}
            setValue={(val: string) => { setFamilyRelation(val) }}
            order={3}
          />

          <Spacer height={15} />

          <Link href="./createfamily">
            <Text style={{ color: '#310101', textDecorationLine: 'underline' }}>Create a new family</Text>
          </Link>

          <Spacer height={50} />

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