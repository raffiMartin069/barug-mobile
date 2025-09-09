// app/(resident)/SocioeconomicInfo.tsx
import NiceModal from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { educAttainmentOptions, empStatOptions, govProgOptions, mnthlyPerosonalIncomeOptions } from '@/constants/formoptions'
import { useResidentFormStore } from '@/store/forms'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

/** Toggle which fields are required vs optional here */
const REQUIRED = {
  educattainment: false,
  employmentstat: true,
  occupation: false,
  mnthlypersonalincome: true,
  govprogrm: false,
} as const

/** Human labels for modal messages */
const LABELS: Record<keyof typeof REQUIRED, string> = {
  educattainment: 'Educational Attainment',
  employmentstat: 'Employment Status',
  occupation: 'Occupation',
  mnthlypersonalincome: 'Monthly Personal Income',
  govprogrm: 'Government Program',
}

const SocioeconomicInfo = () => {
  const router = useRouter()

  const {
    educattainment,
    employmentstat,
    occupation,
    mnthlypersonalincome,
    govprogrm,
    setMany,
  } = useResidentFormStore()

  // --- Modal state ---
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message?: string
    variant?: 'info' | 'success' | 'warn' | 'error'
  }>({ visible: false, title: '' })

  const closeModal = () => setModal(m => ({ ...m, visible: false }))

  // --- Adapters that mimic React.useState's setter signature ---
  const setEduc = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(educattainment) : updater
    setMany({ educattainment: String(next) })
  }
  const setEmp = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(employmentstat) : updater
    setMany({ employmentstat: String(next) })
  }
  const setIncome = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(mnthlypersonalincome) : updater
    setMany({ mnthlypersonalincome: String(next) })
  }
  const setGov = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(govprogrm) : updater
    setMany({ govprogrm: String(next) })
  }
  const setOcc = (v: string) => setMany({ occupation: v })

  const handleSubmit = () => {
    const isEmpty = (v?: string | null) => !v || String(v).trim() === ''

    const missing: string[] = []
    if (REQUIRED.educattainment && isEmpty(educattainment)) missing.push(LABELS.educattainment)
    if (REQUIRED.employmentstat && isEmpty(employmentstat)) missing.push(LABELS.employmentstat)
    if (REQUIRED.occupation && isEmpty(occupation)) missing.push(LABELS.occupation)
    if (REQUIRED.mnthlypersonalincome && isEmpty(mnthlypersonalincome)) missing.push(LABELS.mnthlypersonalincome)
    if (REQUIRED.govprogrm && isEmpty(govprogrm)) missing.push(LABELS.govprogrm)

    if (missing.length) {
      setModal({
        visible: true,
        title: 'Required Field',
        message: `Missing: ${missing.join(', ')}`,
        variant: 'error',
      })
      return
    }

    router.push({ pathname: '/reviewinputsprofile' })
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Socioeconomic Information' showNotif={false} showProfile={false} />
      <ThemedProgressBar step={4} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedDropdown
            items={educAttainmentOptions}
            value={educattainment}
            setValue={setEduc}
            placeholder={`Educational Attainment${REQUIRED.educattainment ? ' *' : ''}`}
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={empStatOptions}
            value={employmentstat}
            setValue={setEmp}
            placeholder={`Employment Status${REQUIRED.employmentstat ? ' *' : ''}`}
            order={1}
          />

          <Spacer height={10} />

          <ThemedTextInput
            placeholder={`Occupation${REQUIRED.occupation ? ' *' : ''}`}
            value={occupation}
            onChangeText={setOcc}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={mnthlyPerosonalIncomeOptions}
            value={mnthlypersonalincome}
            setValue={setIncome}
            placeholder={`Monthly Personal Income${REQUIRED.mnthlypersonalincome ? ' *' : ''}`}
            order={2}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={govProgOptions}
            value={govprogrm}
            setValue={setGov}
            placeholder={`Government Program${REQUIRED.govprogrm ? ' *' : ''}`}
            order={3}
          />
        </View>

        <Spacer height={15} />

        <View>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      <NiceModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant ?? 'info'}
        onPrimary={closeModal}
        onClose={closeModal}
      />
    </ThemedView>
  )
}

export default SocioeconomicInfo

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
})
