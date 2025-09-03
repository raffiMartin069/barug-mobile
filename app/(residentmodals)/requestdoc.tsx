import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { documentOptions } from '@/constants/formOptions'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import ClearanceAdult from './(docreq)/clearanceadult'
import ClearanceMinor from './(docreq)/clearanceminor'
import Death from './(docreq)/death'
import IndigencyAdult from './(docreq)/indigencyadult'
import IndigencyMinor from './(docreq)/indigencyminor'
import LowIncomeAdult from './(docreq)/lowincomeadult'
import LowIncomeMinor from './(docreq)/lowincomeminor'
import ResidencyAdult from './(docreq)/residencyadult'
import ResidencyMinor from './(docreq)/residencyminor'

const DOC_COMPONENTS: Record<string, React.FC> = {
  // Barangay Clearance
  brgy_clearance_adult: ClearanceAdult,
  brgy_clearance_minor: ClearanceMinor,

  // Barangay Death Certificate
  cert_death: Death,

  // Certificate of Indigency
  cert_indigency_adult: IndigencyAdult,
  cert_indigency_minor: IndigencyMinor,

  // Certificate of Low Income
  cert_lowincome_adult: LowIncomeAdult,
  cert_lowincome_minor: LowIncomeMinor,

  // Certificate of Residency
  cert_residency_adult: ResidencyAdult,
  cert_residency_minor: ResidencyMinor,
};



const RequestDoc = () => {
  const router = useRouter()

  const [document, setDocument] = useState('')
  const SelectedDocument = useMemo(() => DOC_COMPONENTS[document] ?? null, [document])

  return (
    <ThemedView safe={true}>

      <ThemedAppBar
        title='Request a Document'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText>Please fill out the form below to request a document from the barangay office.</ThemedText>
            <Spacer height={15}/>

            <ThemedDropdown
              items={documentOptions}
              value={document}
              setValue={(v: string) => setDocument(v)}
              placeholder={'Select Document Type'}
              order={0}
            />

            {SelectedDocument ? <SelectedDocument /> : null}

            <Spacer height={15}/>
        </View>

        <View>
            <ThemedButton onPress={() => router.push('/receipt')}>
              <ThemedText btn={true}>Submit</ThemedText>
            </ThemedButton>
        </View>

      </ThemedKeyboardAwareScrollView>

    </ThemedView>
  )
}

export default RequestDoc

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
})