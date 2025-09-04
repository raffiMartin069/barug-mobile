import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

// In case only the code arrives, we can display the proper name.
const PUROK_NAME_BY_CODE: Record<string, string> = {
  S01: 'KANIPAAN',
  S02: 'PAMPANGO',
  S03: 'LUTAW-LUTAW',
  S04: 'MAUCO',
}

// Optional: if later you need the numeric ID instead of code.
const PUROK_ID_BY_CODE: Record<string, number> = {
  S01: 1,
  S02: 2,
  S03: 3,
  S04: 4,
}

function toTitleCase(str: string) {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const ResidentAddress = () => {
  const params = useSearchParams()

  const streetParam = params.get('street') ?? ''
  const brgyParam   = params.get('brgy') ?? ''
  const cityParam   = params.get('city') ?? ''

// ⬇️ NEW: coordinates coming from the map screen
  const latParam    = params.get('lat') ?? ''   // e.g. "10.29876"
  const lngParam    = params.get('lng') ?? ''   // e.g. "123.90234"

  // These two may be sent by ThemedMapAddress
  const purokCodeParam = params.get('purok_code') ?? ''
  const purokNameParam = params.get('purok_name') ?? ''

  // Derive a display name even if only the code is present
  const initialPurokName = useMemo(() => {
    if (purokNameParam) return purokNameParam
    if (purokCodeParam) return PUROK_NAME_BY_CODE[purokCodeParam] ?? ''
    return ''
  }, [purokCodeParam, purokNameParam])

  const [streetState] = useState(streetParam)
  const [purokName]   = useState(initialPurokName) // what user sees
  const [purokCode]   = useState(purokCodeParam)   // hidden (from map)
  const [brgyState]   = useState(brgyParam)
  const [cityState]   = useState(cityParam)

  const router = useRouter()

  const submitAddress = () => {
    // If you ever want to map to ID:
    // const purok_sitio_id = PUROK_ID_BY_CODE[purokCode] ?? undefined
    console.log("Submitting address with lat:", latParam);
    console.log("Submitting address with lng:", lngParam);

    router.replace({
      pathname: '/personalinfo',
      params: {
        street: streetState,
        brgy: brgyState,
        city: cityState,
        purok_code: purokCode,
        purok_name: purokName,
        lat: latParam,
        lng: lngParam,
        // purok_sitio_id: purok_sitio_id?.toString() ?? '',
      },
    })
  }

  return (
    <ThemedView safe>
      <ThemedAppBar
        title='Home Address sa residentaddress.tsx'
        showNotif={false}
        showProfile={false}
      />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput
            placeholder='Street'
            value={streetState}
            editable={false}
            style={styles.readonly}
          />
          <Spacer height={10}/>

          {/* Purok/Sitio (display name) */}
          <ThemedTextInput
            placeholder='Purok or Sitio'
            value={toTitleCase(purokName)}
            editable={false}
            style={styles.readonly}
          />
          <Spacer height={10}/>

          <ThemedTextInput
            placeholder='Barangay'
            value={brgyState}
            editable={false}
            style={styles.readonly}
          />
          <Spacer height={10}/>

          <ThemedTextInput
            placeholder='City'
            value={cityState}
            editable={false}
            style={styles.readonly}
          />
        </View>

        <Spacer height={15}/>
        <View>
          <ThemedButton onPress={submitAddress}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default ResidentAddress

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
  // Applies to the TextInput (grays text and gives a subtle disabled feel)
  readonly: {
    color: '#8A8A8A',
  },
})
