import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

type Method = 'online' | 'bhw'

const ChooseVerification = () => {
  const router = useRouter()
  const [method, setMethod] = useState<Method>('online')

  const handleContinue = () => {
    if (method === 'online') {
      router.push({ pathname: '/personalinfo', params: { mode: 'online' } })
    } else {
      // No BHW credential submission here — handled at the final step
      router.push({ pathname: '/field_personalinfo', params: { mode: 'bhw' } })
    }
  }

  return (
    <ThemedView>
      <ThemedCard>
        <ThemedText subtitle>How do you want to continue?</ThemedText>
        <Spacer height={8} />
        <ThemedText>
          Choose your verification method. If a Barangay Health Worker (BHW) is assisting you during a field visit,
          select <ThemedText style={styles.bold}>Field visit by BHW</ThemedText>.
        </ThemedText>

        <Spacer height={12} />
        <ThemedRadioButton
          value={method}
          onChange={(v: Method) => setMethod(v)}
          options={[
            { label: 'Online (self-verification)', value: 'online' },
            { label: 'Field visit by BHW', value: 'bhw' },
          ]}
        />

        {method === 'bhw' && (
          <>
            <Spacer height={12} />
            <View style={styles.noteBox}>
              <ThemedText style={styles.noteTitle}>Reminder for BHW-assisted verification</ThemedText>
              <Spacer height={6} />
              <ThemedText style={styles.noteText}>
                Fill out all required information first. After completing the form, please approach the assisting BHW
                to review and confirm your submission. The BHW will enter their credentials at the final confirmation step.
              </ThemedText>
            </View>
          </>
        )}

        <Spacer height={16} />
        <ThemedButton onPress={handleContinue}>
          <ThemedText btn>Continue</ThemedText>
        </ThemedButton>
      </ThemedCard>
    </ThemedView>
  )
}

export default ChooseVerification

const styles = StyleSheet.create({
  bold: { fontWeight: 'bold' },
  noteBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  noteTitle: {
    fontWeight: 'bold',
  },
  noteText: {
    opacity: 0.9,
    fontSize: 13,
  },
})
