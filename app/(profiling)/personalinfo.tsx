// @/app/resident/PersonalInfo.tsx  (path for example)
// This version:
//  - Removes local useState: reads & writes from Zustand store instead
//  - Syncs search params from map → store via setAddress
//  - Keeps your UI structure intact
//  - Leaves submission/navigation the same (you can rely on store in next step)

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
import { useRegistrationStore } from '@/store/registrationStore'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useEffect, useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { civilStatusOptions, genderOptions, nationalityOptions, religionOptions } from '../../constants/formOptions'

const PersonalInfo = () => {
  const params = useSearchParams()
  const router = useRouter()

  // --- Pull *fields + actions* from the store ---
  const {
    fname, mname, lname, suffix, gender, dob,
    civilStatus, nationality, religion,
    haddress, street, puroksitio, brgy, city,
    mobnum, email, password, cpassword,
    setField, setAddress,
  } = useRegistrationStore()

  // --- React-style setters for dropdowns that expect `setValue(fnOrValue)` ---
  const setCivilStatusState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().civilStatus
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
      setField('civilStatus', next)
    }
  }, [setField])

  const setNationalityState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().nationality
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
      setField('nationality', next)
    }
  }, [setField])

  const setReligionState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().religion
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
      setField('religion', next)
    }
  }, [setField])

  // --- If you want suffix normalized (e.g., uppercase), do it here ---
  const setSuffixState = (v: string) => setField('suffix', (v || '').toUpperCase())

  // --- Pull address params (from map flow) and write once to the store ---
  useEffect(() => {
    const streetParam = params.get('street') ?? ''
    const purokParam = params.get('puroksitio') ?? ''
    const brgyParam = params.get('brgy') ?? ''
    const cityParam = params.get('city') ?? ''

    if (streetParam || purokParam || brgyParam || cityParam) {
      // setAddress updates street/purok/brgy/city and recomputes haddress
      setAddress({ street: streetParam, puroksitio: purokParam, brgy: brgyParam, city: cityParam })
    }
  }, [params, setAddress])

  // --- Navigation handlers ---
  const handleSubmit = () => {
    // At this point all fields are already in the store.
    // You can either:
    //  1) Push with params (backwards-compatible with your older step-2 screen), or
    //  2) Push without params and let step-2 read everything from the store.
    // We'll keep your current approach to avoid breaking existing code.
    router.push({
      pathname: '/socioeconomicinfo',
      params: {
        fname, mname, lname, suffix, gender, dob,
        civilStatus, nationality, religion,
        haddress, street, purokSitio: puroksitio, brgy, city,
        mobnum, email, password, cpassword,
      },
    })
  }

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: { returnTo: '/residentaddress' },
    })
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Personal Information' showNotif={false} showProfile={false} />

      <ThemedProgressBar step={1} totalStep={2} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput
            placeholder='First Name'
            value={fname}
            onChangeText={(v) => setField('fname', v)}
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Middle Name'
            value={mname}
            onChangeText={(v) => setField('mname', v)}
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Last Name'
            value={lname}
            onChangeText={(v) => setField('lname', v)}
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Suffix'
            value={suffix}
            onChangeText={setSuffixState}
          />
          <Spacer height={10} />

          <ThemedText subtitle>Sex</ThemedText>
          <ThemedRadioButton
            value={gender}
            onChange={(v) => setField('gender', v as 'male' | 'female')}
            options={genderOptions}
          />
          <Spacer height={10} />

          <ThemedDatePicker
            value={dob}
            mode='date'
            onChange={(v: string) => setField('dob', v)}
            placeholder='Date of Birth'
            maximumDate={new Date()}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={civilStatusOptions}
            value={civilStatus}
            setValue={setCivilStatusState}
            placeholder='Civil Status'
            order={0}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={nationalityOptions}
            value={nationality}
            setValue={setNationalityState}
            placeholder='Nationality'
            order={1}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={religionOptions}
            value={religion}
            setValue={setReligionState}
            placeholder='Religion'
            order={2}
          />
          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder='Home Address'
              multiline
              numberOfLines={2}
              value={haddress}
              onChangeText={(v) => setField('haddress', v)}
              editable={false}        // display-only: we set via map selection
              pointerEvents='none'     // prevents focus highlight on press
            />
          </Pressable>

          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Mobile Number'
            value={mobnum}
            onChangeText={(v) => setField('mobnum', v)}
            keyboardType='numeric'
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Email Address'
            value={email}
            onChangeText={(v) => setField('email', v)}
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Password'
            value={password}
            onChangeText={(v) => setField('password', v)}
            secureTextEntry
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder='Confirm Password'
            value={cpassword}
            onChangeText={(v) => setField('cpassword', v)}
            secureTextEntry
          />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default PersonalInfo

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },
  text: { textAlign: 'center' },
  link: { textAlign: 'right' },
})
