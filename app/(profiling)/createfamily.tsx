import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDivider from '@/components/ThemedDivider'
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
  const [fams, setFam] = useState ([
    {famnum: '', famhead: '', hhheadrel: '', nhts: 'no', indigent: 'no', incomesource: '', fammnthlyincome: '', hhtype: ''}
  ])

  const createFamily = () => {
    setFam([...fams, {famnum: '', famhead: '', hhheadrel: '', nhts: 'no', indigent: 'no', incomesource: '', fammnthlyincome: '', hhtype: ''}])
  }

  const updateField = (index, field, value) => {
    const updatedFam = [...fams]
    updatedFam[index][field] = value
    setFam(updatedFam)
  }

  const removeField = (index) => {
    const updatedFam = fams.filter((_, i) => i !== index)
    setFam(updatedFam)
  }

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

                {fams.map((fam, index) => (
                    <View key={index}>
                    
                        <ThemedTextInput
                            placeholder='Family Number'
                            value={fam.famnum}
                            onChangeText={(value) => updateField(index, 'famnum', value)}
                            showClearButton={fams.length > 1}
                            onRemove={() => removeField(index)}
                        />

                        <Spacer height={10}/>

                        <ThemedTextInput
                            placeholder='Family Head'
                            value={fam.famhead}
                            onChangeText={(value) => updateField(index, 'famhead', value)}
                        />

                        <Spacer height={10}/>

                        <ThemedDropdown
                            items={[]}
                            value={fam.hhheadrel}
                            setValue={(value) => updateField(index, 'hhheadrel', value)}
                            placeholder='Relationship to Household Head'
                            order={0}
                        />
                        
                        <Spacer height={15}/>

                        <View style={{flexDirection: 'row', gap: 10,}}>
                            <View style={{ flex: 1 }}>
                                <ThemedText subtitle={true}>NHTS Status</ThemedText>

                                <ThemedRadioButton
                                    value={fam.nhts}
                                    onChange={(value) => updateField(index, 'nhts', value)}
                                    options={[
                                    { label: 'Yes', value: 'yes' },
                                    { label: 'No', value: 'no' },
                                    ]}
                                />
                            </View>

                            <View style={{ flex: 1 }}>
                                <ThemedText subtitle={true}>Indigent Status</ThemedText>

                                <ThemedRadioButton
                                    value={fam.indigent}
                                    onChange={(value) => updateField(index, 'indigent', value)}
                                    options={[
                                    { label: 'Yes', value: 'yes' },
                                    { label: 'No', value: 'no' },
                                    ]}
                                />
                            </View>
                        </View>

                        <ThemedTextInput
                            placeholder='Source of Income'
                            value={fam.incomesource}
                            onChangeText={(value) => updateField(index, 'incomesource', value)}
                        />

                        <Spacer height={10}/>

                        <ThemedDropdown
                            items={[]}
                            value={fam.fammnthlyincome}
                            setValue={(value) => updateField(index, 'fammnthlyincome', value)}
                            placeholder='Family Monthly Income'
                            order={1}
                        />

                        <Spacer height={10}/>

                        <ThemedDropdown
                            items={[]}
                            value={fam.hhtype }
                            setValue={(value) => updateField(index, 'hhtype', value)}
                            placeholder='Household Type'
                            order={2}
                        />
                        
                        <Spacer/>

                        <ThemedDivider/>

                    </View>
                ))}

                <Spacer height={10}/>

                <ThemedButton style={{ borderWidth: 0 }} submit={false} onPress={createFamily}>
                    <ThemedText non_btn>+ Add another family unit</ThemedText>
                </ThemedButton>

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