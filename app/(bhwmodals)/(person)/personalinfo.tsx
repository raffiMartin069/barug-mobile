// app/(bhwmodals)/(person)/personal-info.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal' // ✅ use NiceModal
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDatePicker from '@/components/ThemedDatePicker'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import {
  civilStatusOptions,
  genderOptions,
  nationalityOptions,
  religionOptions,
  suffixOptions,
} from '@/constants/formoptions'
import { useResidentFormStore } from '@/store/forms'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

// --- Screen ---
const PersonalInfo = () => {
  const router = useRouter()

  const {
    // personal fields from the store
    fname, mname, lname, suffix,
    gender, dob, civilStatus, nationality, religion,
    mobnum, email,
    setMany,
  } = useResidentFormStore()

  // --- Adapters mimicking setState signatures ---
  const setSuffixAdapt = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(suffix) : updater
    setMany({ suffix: String(next ?? '') }) // store uppercase codes 'JR','SR',''
  }
  const setGenderAdapt = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(gender) : updater
    setMany({ gender: String(next) })
  }
  const setCivilStatusAdapt = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(civilStatus) : updater
    setMany({ civilStatus: String(next) })
  }
  const setNationalityAdapt = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(nationality) : updater
    setMany({ nationality: String(next) })
  }
  const setReligionAdapt = (updater: string | ((curr: string) => string)) => {
    const next = typeof updater === 'function' ? updater(religion) : updater
    setMany({ religion: String(next) })
  }

  // DatePicker may pass a Date/string; store normalized YYYY-MM-DD
  const setDobAdapt = (next: Date | string | undefined) => {
    if (next instanceof Date && !isNaN(next.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0')
      const year = next.getFullYear()
      const month = pad(next.getMonth() + 1)
      const day = pad(next.getDate())
      const formatted = `${year}-${month}-${day}`
      setMany({ dob: formatted })
    } else if (typeof next === 'string') {
      setMany({ dob: next })
    } else {
      setMany({ dob: '' })
    }
  }

  // TextInputs: simple direct setters
  const setFname = (v: string) => setMany({ fname: v })
  const setMname = (v: string) => setMany({ mname: v })
  const setLname = (v: string) => setMany({ lname: v })
  const setMobNum = (v: string) => setMany({ mobnum: v })
  const setEmail = (v: string) => setMany({ email: v })

  // ----------------- Validation (NiceModal) -----------------
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message?: string
    variant?: ModalVariant
  }>({ visible: false, title: '', message: '', variant: 'warn' })

  const openModal = (title: string, message?: string, variant: ModalVariant = 'warn') =>
    setModal({ visible: true, title, message, variant })
  const closeModal = () => setModal((m) => ({ ...m, visible: false }))

  const validateForm = () => {
    if (!fname.trim()) return 'First Name is required'
    if (!lname.trim()) return 'Last Name is required'
    if (!gender) return 'Sex is required'
    if (!dob) return 'Date of Birth is required'
    if (!civilStatus) return 'Civil Status is required'
    if (!nationality) return 'Nationality is required'
    if (!religion) return 'Religion is required'
    if (!mobnum.trim()) return 'Mobile Number is required'
    if (!/^\+63\d{10}$/.test(mobnum)) return 'Mobile Number must be in format +63XXXXXXXXXX'
    if (email.trim() && !/^[^@]+@[^@]+\.[^@]+$/.test(email)) return 'Invalid Email Address'
    return null
  }

  const handleSubmit = () => {
    const error = validateForm()
    if (error) {
      openModal('Validation Error', error, 'warn')
      return
    }
    router.push({ pathname: '/linkparentguardian' })
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="Personal Information" showNotif={false} showProfile={false} />
      <ThemedProgressBar step={1} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput placeholder="First Name *" value={fname} onChangeText={setFname} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Middle Name" value={mname} onChangeText={setMname} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Last Name *" value={lname} onChangeText={setLname} />
          <Spacer height={10} />

          {/* Suffix */}
          <ThemedDropdown
            items={suffixOptions}
            value={suffix}
            setValue={setSuffixAdapt}
            placeholder="Suffix"
            order={0}
          />

          <Spacer height={10} />

          <ThemedText subtitle>Sex</ThemedText>
          <ThemedRadioButton
            value={gender}
            onChange={setGenderAdapt}
            options={genderOptions}
          />

          <Spacer height={10} />
          <ThemedDatePicker
            value={dob ? new Date(dob + 'T00:00:00') : undefined}
            mode="date"
            onChange={setDobAdapt}
            placeholder="Date of Birth *"
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date()}
          />

          <Spacer height={10} />
          <ThemedDropdown
            items={civilStatusOptions}
            value={civilStatus}
            setValue={setCivilStatusAdapt}
            placeholder="Civil Status *"
            order={1}
          />

          <Spacer height={10} />
          <ThemedDropdown
            items={nationalityOptions}
            value={nationality}
            setValue={setNationalityAdapt}
            placeholder="Nationality *"
            order={2}
          />

          <Spacer height={10} />
          <ThemedDropdown
            items={religionOptions}
            value={religion}
            setValue={setReligionAdapt}
            placeholder="Religion *"
            order={3}
          />

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Mobile Number *"
            value={mobnum}
            onChangeText={(val) => {
              // Keep only digits
              let digits = val.replace(/\D/g, '')
              // Strip accidental leading '63'
              if (digits.startsWith('63')) digits = digits.slice(2)
              // Max 10 digits after +63
              if (digits.length > 10) digits = digits.slice(0, 10)
              setMobNum(`+63${digits}`)
            }}
            keyboardType="phone-pad"
          />

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* ✅ NiceModal for validation messages */}
      <NiceModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        primaryText="Got it"
        onPrimary={closeModal}
        onClose={closeModal}
      />
    </ThemedView>
  )
}

export default PersonalInfo

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },
  text: { textAlign: 'center' },
  link: { textAlign: 'right' },
})
