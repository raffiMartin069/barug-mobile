import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { indigentOptions, nhtsOptions } from '@/constants/formoptions'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

type Option = { label: string; value: string }

const UpdateFamInfo = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id?: string
    familyNum?: string
    familyHeadName?: string
    // editable fields (optional prefill)
    relationshipToHh?: string
    householdType?: string
    nhts?: 'yes' | 'no'
    indigent?: 'yes' | 'no'
    sourceIncome?: string
    monthlyIncome?: string
  }>()

  // --- Context (read-only) ---
  const familyNum = params.familyNum ?? params.id ?? ''
  const familyHeadName = params.familyHeadName ?? '—'

  // --- Editable fields (prefill if provided) ---
  const [hhheadrel, setHhheadrel] = useState<string>(params.relationshipToHh ?? '')
  const [hhtype, setHhType] = useState<string>(params.householdType ?? '')
  const [nhts, setNhts] = useState<'yes' | 'no'>(params.nhts === 'yes' || params.nhts === 'no' ? params.nhts : 'no')
  const [indigent, setIndigent] = useState<'yes' | 'no'>(params.indigent === 'yes' || params.indigent === 'no' ? params.indigent : 'no')
  const [incomesource, setIncomeSource] = useState<string>(params.sourceIncome ?? '')
  const [fammnthlyincome, setFamMonthlyIncome] = useState<string>(params.monthlyIncome ?? '')

  // --- Dropdown options (stub; replace with your data) ---
  const relationshipOptions: Option[] = useMemo(
    () => [
      { label: 'Head', value: 'HEAD' },
      { label: 'Spouse', value: 'SPOUSE' },
      { label: 'Child', value: 'CHILD' },
      { label: 'Parent', value: 'PARENT' },
      { label: 'Sibling', value: 'SIBLING' },
      { label: 'Relative', value: 'RELATIVE' },
      { label: 'Other', value: 'OTHER' },
    ],
    []
  )

  const householdTypeOptions: Option[] = useMemo(
    () => [
      { label: 'Nuclear', value: 'NUCLEAR' },
      { label: 'Extended', value: 'EXTENDED' },
      { label: 'Single Parent', value: 'SINGLE_PARENT' },
      { label: 'Others', value: 'OTHERS' },
    ],
    []
  )

  const familyMonthlyIncomeItems: Option[] = useMemo(
    () => [
      { label: '₱0 - ₱5,000', value: '0-5000' },
      { label: '₱5,001 - ₱8,000', value: '5001-8000' },
      { label: '₱8,001 - ₱12,000', value: '8001-12000' },
      { label: '₱12,001 - ₱20,000', value: '12001-20000' },
      { label: '₱20,001+', value: '20001+' },
    ],
    []
  )

  const canSubmit =
    !!hhheadrel && !!hhtype && !!incomesource && !!fammnthlyincome

  const onSubmit = () => {
    // TODO: Call your update mutation here:
    // {
    //   familyId: params.id ?? familyNum,
    //   relationshipToHh: hhheadrel,
    //   householdType: hhtype,
    //   nhts,
    //   indigent,
    //   sourceIncome: incomesource,
    //   monthlyIncome: fammnthlyincome
    // }
    router.back()
  }

  return (
    <ThemedView safe>
      <ThemedAppBar
        title="Update Family Information"
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          {/* --- Context: Family Number & Family Head (text only) --- */}
          <ThemedText style={styles.label}>Family Number</ThemedText>
          <ThemedText style={styles.value}>{familyNum || '—'}</ThemedText>

          <Spacer height={10} />

          <ThemedText style={styles.label}>Family Head</ThemedText>
          <ThemedText style={styles.value}>{familyHeadName}</ThemedText>

          <Spacer height={14} />

          {/* --- Editable fields (same structure as CreateFamily, without changing Family # / Head) --- */}
          <ThemedDropdown
            items={relationshipOptions}
            value={hhheadrel}
            setValue={setHhheadrel}
            placeholder="Relationship to Household Head"
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={householdTypeOptions}
            value={hhtype}
            setValue={setHhType}
            placeholder="Household Type"
            order={1}
          />

          <Spacer height={15} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <ThemedText subtitle={true}>NHTS Status</ThemedText>
              <ThemedRadioButton
                value={nhts}
                onChange={setNhts}
                options={nhtsOptions}
              />
            </View>

            <View style={{ flex: 1 }}>
              <ThemedText subtitle={true}>Indigent Status</ThemedText>
              <ThemedRadioButton
                value={indigent}
                onChange={setIndigent}
                options={indigentOptions}
              />
            </View>
          </View>

          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Source of Income"
            value={incomesource}
            onChangeText={setIncomeSource}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={familyMonthlyIncomeItems}
            value={fammnthlyincome}
            setValue={setFamMonthlyIncome}
            placeholder="Family Monthly Income"
            order={2}
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

export default UpdateFamInfo

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
