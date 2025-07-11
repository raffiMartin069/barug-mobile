import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const CreateFamily = () => {
  const [famnum, setFamNum] = useState('')
  const [famhead, setFamHead] = useState('')
  const [hhheadrel, setHhHeadRel] = useState('')
  const [nhts, setNhts] = useState('')
  const [indigent, setIndigent] = useState('')
  const [incomesource, setIncomeSource] = useState('')
  const [fammnthlyincome, setFamMnthlyIncome] = useState('')
  const [hhtype, setHhType] = useState('')

  const router = useRouter()

  const handleSubmit = () => {
    router.push('/addmember')
  }
  
  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedText style={styles.text} title={true}>Create Family</ThemedText>
                
                <Spacer height={20}/>

                <ThemedTextInput
                    placeholder='Family Number'
                    value={famnum}
                    onChangeText={setFamNum}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Family Head'
                    value={famhead}
                    onChangeText={setFamHead}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={hhheadrel}
                    setValue={setHhHeadRel}
                    placeholder='Relationship to Household Head'
                    order={0}
                />
                
                <Spacer height={15}/>

                <ThemedText subtitle={true}>NHTS Status</ThemedText>

                <ThemedRadioButton
                    value={nhts}
                    onChange={setNhts}
                    options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                    ]}
                />

                <Spacer height={10}/>

                <ThemedText subtitle={true}>Indigent Status</ThemedText>

                <ThemedRadioButton
                    value={indigent}
                    onChange={setIndigent}
                    options={[
                    { label: 'Yes', value: 'yes' },
                    { label: 'No', value: 'no' },
                    ]}
                />

                <ThemedTextInput
                    placeholder='Source of Income'
                    value={incomesource}
                    onChangeText={setIncomeSource}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={fammnthlyincome}
                    setValue={setFamMnthlyIncome}
                    placeholder='Family Monthly Income'
                    order={1}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={hhtype}
                    setValue={setHhType}
                    placeholder='Household Type'
                    order={2}
                />
            </View>

            <Spacer height={15}/>

            <View>
                <ThemedButton onPress={handleSubmit}>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default CreateFamily

const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
    },
})