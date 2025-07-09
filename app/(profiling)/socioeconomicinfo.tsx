import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const SocioeconomicInfo = () => {
  const [educattainment, setEducAttainment] = useState('')
  const [employmentstat, setEmploymentStat] = useState('')
  const [occupation, setOccupation] = useState('')
  const [mthlypersonalincome, setMnthlyPersonalIncome] = useState('')
  const [govprogrm, setGovProgram] = useState('')

  return (
    <>
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
            <View>
                
                <ThemedText title={true}>Socioeconomic Information</ThemedText>

                <Spacer height={20}/>

                <ThemedDropdown
                    items={[]}
                    value={educattainment}
                    setValue={setEducAttainment}
                    placeholder='Educational Attainment'
                    order={0}
                />

                <Spacer height={10}/>
                
                <ThemedDropdown
                    items={[]}
                    value={employmentstat}
                    setValue={setEmploymentStat}
                    placeholder='Employment Status'
                    order={1}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Occupation'
                    value={occupation}
                    onChangeText={setOccupation}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Monthly Personal Income'
                    value={mthlypersonalincome}
                    onChangeText={setMnthlyPersonalIncome}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={govprogrm}
                    setValue={setGovProgram}
                    placeholder='Government Program'
                    order={2}
                />
            </View>

            <View style={{ paddingVertical: 15 }}>
                <ThemedButton>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>

        </ThemedKeyboardAwareScrollView>
    </ThemedView>
    </>
    
  )
}

export default SocioeconomicInfo

const styles = StyleSheet.create({

})