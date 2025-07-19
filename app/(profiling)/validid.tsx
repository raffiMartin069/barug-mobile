import ThemedButton from '@/components/ThemedButton'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, Text } from 'react-native'

const ValidId = () => {
  const [selectedFile, setSelectedFile] = useState(null)

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
    <ThemedView style={styles.container}>
      <Text style={styles.label}>Upload a Valid ID:</Text>

      <ThemedFileInput
        placeholder="Select a valid ID"
      />

      {selectedFile && (
        <Text style={styles.filename}>
          Selected File: {selectedFile.name}
        </Text>
      )}

      <ThemedButton onPress={handleSubmit}>
        <ThemedText btn={true}>Submit</ThemedText>
      </ThemedButton>
    </ThemedView>
  )
}

export default ValidId

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  filename: {
    marginTop: 10,
    fontStyle: 'italic',
  },
})
