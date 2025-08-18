import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet } from 'react-native'

const ChooseRole = () => {
  const [role, setRole] = useState('resident')
  const router = useRouter()

  const handleSubmit = () => {
    if (role === 'resident') {
      router.push('/choose-verification') // <-- new screen
    } else {
      router.push('/personalinfo')        // <-- adjust to your actual business flow
    }
  }
  return (
    <ThemedView>
      <ThemedCard>
        <ThemedText subtitle={true}>Choose Role</ThemedText>
        <Spacer height={5} />
        <ThemedText>
          If you’re a business owner but also live in Barangay Sto. Niño, please select <ThemedText style={styles.bold}>Resident</ThemedText>.
        </ThemedText>
        <Spacer height={10} />
        <ThemedRadioButton
          value={role}
          onChange={setRole}
          options={[
            { label: 'Resident', value: 'resident' },
            { label: 'Business Owner', value: 'businessowner' },
          ]}
        />
        <ThemedButton onPress={handleSubmit}>
          <ThemedText btn={true}>Continue</ThemedText>
        </ThemedButton>
      </ThemedCard>
    </ThemedView>
  )
}

export default ChooseRole

const styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
})