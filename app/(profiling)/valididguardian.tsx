import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { idTypeOptions, relationshipOptions } from '@/constants/formOptions'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const ValidIdGuardian = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [idType, setIdType] = useState('')
  const [relationship, setRelationship] = useState('')
  const [guardian, setGuardian] = useState('')
  const [reason, setReason] = useState('')
  const router = useRouter()
  const params = useSearchParams()

  const handleFileSelected = (file) => {
    console.log('Selected file:', file)
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    console.log('File cleared')
    setSelectedFile(null)
  }

  const handleSubmit = () => {
    if (selectedFile) {
      console.log('Uploading file:', selectedFile.uri)
      router.push({
        pathname: '/reviewinputs',
        params: {
          ...Object.fromEntries(params.entries()),
          idType,
          validIdUri: selectedFile?.uri ?? '',
        }
      })
      // TODO: Upload the file to your API
    } else {
      console.log('No file selected.')
    }
  }

  return (
    <ThemedView safe={true}>
      <ThemedAppBar
        title="Parent / Guardian's Valid ID"
        showNotif={false}
        showProfile={false}
      />

      <ThemedProgressBar
        step={2}
        totalStep={2}
      />
      
      <ThemedKeyboardAwareScrollView>
        <View>

          <ThemedTextInput
            placeholder="Parent / Guardian's Name"
            value={guardian}
            onChangeText={setGuardian}
          />
          <ThemedDropdown
            items={relationshipOptions}
            value={relationship}
            setValue={setRelationship}
            placeholder={'Relationship to Parent / Guardian'}
            order={0}
          />

          <ThemedDropdown
            items={idTypeOptions}
            value={idType}
            setValue={setIdType}
            placeholder={'ID Type'}
            order={1}
          />

          <Spacer height={15}/>
          
          <ThemedText subtitle={true}>Upload a Valid ID:</ThemedText>

          <ThemedFileInput
            placeholder="Select a valid ID"
            selectedFile={selectedFile}
            onFileSelected={handleFileSelected}
            onFileRemoved={handleRemoveFile}
          />

          <ThemedDropdown
            items={[]}
            value={reason}
            setValue={setReason}
            placeholder={'Reason'}
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

export default ValidIdGuardian

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
})
