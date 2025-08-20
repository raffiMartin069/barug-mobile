import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchableDropdown from '@/components/ThemedSearchableDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const JoinHouseFam = () => {
  const residents = [
    { "label": "Juan Dela Cruz", "value": "1234" },
    { "label": "Maria Santos", "value": "5678" },
    { "label": "Juan Dela Cruz", "value": "1234" },
    { "label": "Maria Santos", "value": "5678" },
    { "label": "Juan Dela Cruz", "value": "1234" },
    { "label": "Maria Santos", "value": "5678" },
    { "label": "Juan Dela Cruz", "value": "1234" },
    { "label": "Maria Santos", "value": "5678" },
  ]

  const [resYrs, setResYrs] = useState()
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
            data={residents}
          />

          <Spacer/>

          <ThemedSearchableDropdown
            searchplaceholder={'Search Family Number / Family Head'}
            dropdwonplaceholder={'Select your respective family unit'}
            data={residents}
            order={1}
          />

          <Spacer/>

          <ThemedTextInput
            placeholder='Years of Residency'
            value={resYrs}
            onChangeText={setResYrs}
            keyboardType= 'numeric'
          />
        </View>

        <View>
          <ThemedButton>
            <ThemedText btn={true}>Join</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default JoinHouseFam

const styles = StyleSheet.create({})