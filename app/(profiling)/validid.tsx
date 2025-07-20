import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { idTypeOptions } from '@/constants/formoptions'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const ValidId = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [idType, setIdType] = useState('')
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
      // router.push('/reviewinputs')
      router.push({
        pathname: '/reviewinputs',
        params: {
          ...Object.fromEntries(params.entries()),
          idType,
          validIdUri: selectedFile?.uri ?? '',
        }
      })
    }
  }

  return (
    <ThemedView safe={true}>
      <ThemedAppBar
        title='Valid ID'
        showNotif={false}
        showProfile={false}
      />
      <ThemedProgressBar
            step={3}
            totalStep={3}
        />
      <ThemedKeyboardAwareScrollView>
        <View>

          <ThemedDropdown
            items={idTypeOptions}
            value={idType}
            setValue={setIdType}
            placeholder={'ID Type'}
            order={0}
          />

          <Spacer height={15}/>
          
          <ThemedText subtitle={true}>Upload a Valid ID:</ThemedText>

          <ThemedFileInput
            placeholder="Select a valid ID"
            selectedFile={selectedFile}
            onFileSelected={handleFileSelected}
            onFileRemoved={handleRemoveFile}
          />
        </View>

        <Spacer height={15}/>
        
        <View>
          <ThemedButton submit={false}>
            <ThemedText non_btn={true}>Skip</ThemedText>
          </ThemedButton>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn={true}>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default ValidId

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
})
