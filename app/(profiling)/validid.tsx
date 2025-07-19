import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const ValidId = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [idType, setIdType] = useState('')

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
      // TODO: Upload the file to your API
    } else {
      console.log('No file selected.')
    }
  }

  return (
    <ThemedView safe={true}>
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText style={styles.text} title={true}>Valid ID</ThemedText>

          <Spacer height={20}/>

          <ThemedDropdown
            items={[]}
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
            <ThemedText btn={true}>Submit</ThemedText>
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
