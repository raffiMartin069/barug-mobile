import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const JoinHousehold = () => {
  const [hhnum, setHhnum] = useState()

  return (
    <ThemedView safe={true}>
      <ThemedAppBar
        title='Join a Household'
      />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput
            placeholder='Household Number'
            value={hhnum}
            onChangeText={setHhnum}
          />

          <Spacer height={10}/>

          <ThemedTextInput
            placeholder='Family Number'
            value={hhnum}
            onChangeText={setHhnum}
          />
        </View>
        <View>
          <ThemedButton>
            <ThemedText btn={true}>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default JoinHousehold

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
})