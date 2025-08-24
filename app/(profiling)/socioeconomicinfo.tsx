import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useProfilingWizard } from '@/store/profilingWizard'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import {
  educAttainmentOptions,
  empStatOptions,
  govProgOptions,
  mnthlyPerosonalIncomeOptions, // keeping your current import name
} from '../../constants/formoptions'

const SocioeconomicInfo = () => {
  const router = useRouter()
  const { socio, setSocio } = useProfilingWizard()

  const [educattainment, setEducAttainment] = useState('')
  const [employmentstat, setEmploymentStat] = useState('')
  const [occupation, setOccupation] = useState('')
  const [mnthlypersonalincome, setMnthlyPersonalIncome] = useState('')
  const [govprogrm, setGovProgram] = useState('')
  const [govProgramOther, setGovProgramOther] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 🔁 Prefill from store if user navigates back here
  useEffect(() => {
    if (socio) {
      setEducAttainment(socio.educ_attainment_id ? String(socio.educ_attainment_id) : '')
      setEmploymentStat(socio.employment_status_id ? String(socio.employment_status_id) : '')
      setOccupation(socio.occupation ?? '')
      setMnthlyPersonalIncome(socio.monthly_personal_income_id ? String(socio.monthly_personal_income_id) : '')
      setGovProgram(socio.gov_program_id ? String(socio.gov_program_id) : '')
      setGovProgramOther(socio.gov_program_other ?? '')
    }
  }, [socio])

  const selectedGovProg = useMemo(
    () => govProgOptions.find(o => String(o.value) === String(govprogrm)),
    [govprogrm]
  )
  const requiresOtherGovProg = !!selectedGovProg && /other/i.test(selectedGovProg.label || '')

  // Compute errors once and use it for both UI + alert
  const computeErrors = () => {
    const e: Record<string, string> = {}
    if (!educattainment) e.educattainment = 'Please select your educational attainment.'
    if (!employmentstat) e.employmentstat = 'Please select your employment status.'
    if (!mnthlypersonalincome) e.mnthlypersonalincome = 'Please select your monthly personal income.'
    if (occupation && occupation.trim().length < 2) e.occupation = 'If provided, occupation must be at least 2 characters.'
    if (requiresOtherGovProg && !govProgramOther.trim()) e.govProgramOther = 'Please specify the government program.'
    return e
  }

  const handleSubmit = () => {
    const e = computeErrors()
    setErrors(e)
    if (Object.keys(e).length > 0) {
      const firstError = Object.values(e)[0]
      if (firstError) Alert.alert('Fix required fields', firstError)
      return
    }

    // ✅ Save to store (convert to numbers where applicable)
    setSocio({
      educ_attainment_id: educattainment ? parseInt(educattainment) : null,
      employment_status_id: employmentstat ? parseInt(employmentstat) : null,
      occupation: occupation.trim() || null,
      monthly_personal_income_id: mnthlypersonalincome ? parseInt(mnthlypersonalincome) : null,
      gov_program_id: govprogrm ? parseInt(govprogrm) : 7,
      gov_program_other: requiresOtherGovProg ? govProgramOther.trim() : null,

    })

    // 👉 Move to the next step
    router.push('/validid')
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Socioeconomic Information' showNotif={false} showProfile={false} />
      <ThemedProgressBar step={2} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedDropdown
            items={educAttainmentOptions}
            value={educattainment}
            setValue={(v: string) => { setEducAttainment(v); setErrors(prev => ({ ...prev, educattainment: '' })) }}
            placeholder='Educational Attainment *'
            order={0}
          />
          {errors.educattainment ? <ThemedText style={styles.error}>{errors.educattainment}</ThemedText> : null}

          <Spacer height={10}/>

          <ThemedDropdown
            items={empStatOptions}
            value={employmentstat}
            setValue={(v: string) => { setEmploymentStat(v); setErrors(prev => ({ ...prev, employmentstat: '' })) }}
            placeholder='Employment Status *'
            order={1}
          />
          {errors.employmentstat ? <ThemedText style={styles.error}>{errors.employmentstat}</ThemedText> : null}

          <Spacer height={10}/>

          <ThemedTextInput
            placeholder='Occupation (optional)'
            value={occupation}
            onChangeText={(t: string) => {
              setOccupation(t)
              if (!t || t.trim().length >= 2) setErrors(prev => ({ ...prev, occupation: '' }))
            }}
          />
          {errors.occupation ? <ThemedText style={styles.error}>{errors.occupation}</ThemedText> : null}

          <Spacer height={10}/>

          <ThemedDropdown
            items={mnthlyPerosonalIncomeOptions}
            value={mnthlypersonalincome}
            setValue={(v: string) => { setMnthlyPersonalIncome(v); setErrors(prev => ({ ...prev, mnthlypersonalincome: '' })) }}
            placeholder='Monthly Personal Income *'
            order={2}
          />
          {errors.mnthlypersonalincome ? <ThemedText style={styles.error}>{errors.mnthlypersonalincome}</ThemedText> : null}

          <Spacer height={10}/>

          <ThemedDropdown
            items={govProgOptions}
            value={govprogrm}
            setValue={(v: string) => { setGovProgram(v); setErrors(prev => ({ ...prev, govprogrm: '', govProgramOther: '' })) }}
            placeholder='Government Program (optional)'
            order={3}
          />

          {requiresOtherGovProg && (
            <>
              <Spacer height={10}/>
              <ThemedTextInput
                placeholder='Please specify the government program *'
                value={govProgramOther}
                onChangeText={(t: string) => {
                  setGovProgramOther(t)
                  if (t.trim()) setErrors(prev => ({ ...prev, govProgramOther: '' }))
                }}
              />
              {errors.govProgramOther ? <ThemedText style={styles.error}>{errors.govProgramOther}</ThemedText> : null}
            </>
          )}
        </View>

        <Spacer height={15}/>

        <View>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default SocioeconomicInfo

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
  error: { color: '#d00', marginTop: 6, fontSize: 12 },
})
