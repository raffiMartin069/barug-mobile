import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { educAttainmentOptions, empStatOptions, govProgOptions, mnthlyPerosonalIncomeOptions } from '@/constants/formOptions'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const SocioeconomicInfo = () => {
  const [educattainment, setEducAttainment] = useState('')
  const [employmentstat, setEmploymentStat] = useState('')
  const [occupation, setOccupation] = useState('')
  const [mnthlypersonalincome, setMnthlyPersonalIncome] = useState('')
  const [govprogrm, setGovProgram] = useState('')

  const router = useRouter()
  const params = useSearchParams()

  const handleSubmit = () => {
    router.push({
        pathname: '/reviewinputs',
        params: {
            ...Object.fromEntries(params.entries()),
            educattainment,
            employmentstat,
            occupation,
            mnthlypersonalincome,
            govprogrm,
        }
    })
  }

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
            title='Socioeconomic Information'
            showNotif={false}
            showProfile={false}
        />
        <ThemedProgressBar
            step={2}
            totalStep={2}
        />
        <ThemedKeyboardAwareScrollView>
            <View>

                <ThemedDropdown
                    items={educAttainmentOptions}
                    value={educattainment}
                    setValue={setEducAttainment}
                    placeholder='Educational Attainment'
                    order={0}
                />

                <Spacer height={10}/>
                
                <ThemedDropdown
                    items={empStatOptions}
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

                <ThemedDropdown
                    items={mnthlyPerosonalIncomeOptions}
                    value={mnthlypersonalincome}
                    setValue={setMnthlyPersonalIncome}
                    placeholder='Monthly Personal Income'
                    order={2}
                /> 

                <Spacer height={10}/>

                <ThemedDropdown
                    items={govProgOptions}
                    value={govprogrm}
                    setValue={setGovProgram}
                    placeholder='Government Program'
                    order={3}
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

export default SocioeconomicInfo

const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
    },
})