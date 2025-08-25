import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { documentOptions } from '@/constants/formoptions'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Clearance from './(docreq)/clearance'
import Death from './(docreq)/death'
import GoodMoral from './(docreq)/goodmoral'
import Indigency from './(docreq)/indigency'
import LowIncome from './(docreq)/lowincome'
import Residency from './(docreq)/residency'

const DOC_COMPONENTS: Record<string, React.FC> = {
  brgy_clearance: Clearance,
  cert_residency: Residency,
  cert_indigency: Indigency,
  cert_lowincome: LowIncome,
  cert_goodmoral: GoodMoral,
  cert_death: Death,
}

const RequestDoc = () => {
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
            <ThemedButton>
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