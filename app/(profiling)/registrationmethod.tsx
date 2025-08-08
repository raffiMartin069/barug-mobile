import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'

const RegistrationMethod = () => {
  const [method, setMethod] = useState('online')

  return (
    <ThemedView>
        <ThemedCard>
            <ThemedText subtitle={true}>Registration Method</ThemedText>
            <Spacer height={10}/>

            <ThemedRadioButton
                value={method}
                onChange={setMethod}
                options={[
                    {label: 'Online', value: 'online'},
                    {label: 'BHW Field Visit', value: 'bhw'},
                ]}
            />
            <ThemedButton>
                <ThemedText btn={true}>Continue</ThemedText>
            </ThemedButton>
        </ThemedCard>
    </ThemedView>
  )
}

export default RegistrationMethod

const styles = StyleSheet.create({})