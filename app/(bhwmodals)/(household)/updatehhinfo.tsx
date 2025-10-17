import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

type Option = { label: string; value: string }

const UpdateHhInfo = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id?: string
    householdNum?: string
    householdHeadName?: string
    address?: string
    houseType?: string
    houseOwnership?: string
  }>()

  // Context / read-only
  const householdNum = params.householdNum ?? params.id ?? ''
  const householdHeadName = params.householdHeadName ?? '—'

  // Editable fields (prefill from params if provided)
  const [hAddress, setHAddress] = useState(params.address ?? '')
  const [housetype, setHouseType] = useState<string>(params.houseType ?? '')
  const [houseownership, setHouseOwnership] = useState<string>(params.houseOwnership ?? '')

  // Dropdown options (stub—replace with your data)
  const houseTypeItems: Option[] = useMemo(
    () => [
      { label: 'Concrete', value: 'CONCRETE' },
      { label: 'Wooden', value: 'WOODEN' },
      { label: 'Mixed', value: 'MIXED' },
      { label: 'Makeshift', value: 'MAKESHIFT' },
    ],
    []
  )

  const houseOwnershipItems: Option[] = useMemo(
    () => [
      { label: 'Owned', value: 'OWNED' },
      { label: 'Renting', value: 'RENTING' },
      { label: 'Living with Relatives', value: 'WITH_RELATIVES' },
      { label: 'Government Housing', value: 'GOV_HOUSING' },
    ],
    []
  )

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: { returnTo: '/homeaddress' }, // keep your existing flow
    })
  }

  const canSubmit = !!hAddress && !!housetype && !!houseownership

  const onSubmit = () => {
    // TODO: call your update mutation:
    // {
    //   householdId: params.id ?? householdNum,
    //   address: hAddress,
    //   houseType: housetype,
    //   houseOwnership: houseownership
    // }
    router.back()
  }

  return (
    <ThemedView safe>
      <ThemedAppBar
        title="Update Household Information"
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          {/* --- Context: Household Number & Head (text only) --- */}
          <ThemedText style={styles.label}>Household Number</ThemedText>
          <ThemedText style={styles.value}>{householdNum || '—'}</ThemedText>

          <Spacer height={10} />

          <ThemedText style={styles.label}>Household Head</ThemedText>
          <ThemedText style={styles.value}>{householdHeadName}</ThemedText>

          <Spacer height={14} />

          {/* --- Editable fields (same as CreateHousehold minus head picker) --- */}
          <ThemedText style={styles.label}>Home Address</ThemedText>
          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder="Home Address"
              value={hAddress}
              onChangeText={setHAddress}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          <Spacer height={10} />

          <ThemedDropdown
            items={houseTypeItems}
            value={housetype}
            setValue={setHouseType}
            placeholder="House Type"
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={houseOwnershipItems}
            value={houseownership}
            setValue={setHouseOwnership}
            placeholder="House Ownership"
            order={1}
          />
        </View>

        <Spacer height={15} />

        <View>
          <ThemedButton disabled={!canSubmit} onPress={onSubmit}>
            <ThemedText btn>Save Changes</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default UpdateHhInfo

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
})
