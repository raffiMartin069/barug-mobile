import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'

const ThemedFileInput = ({ style = null, placeholder = 'Select a file', ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const [selectedFile, setSelectedFile] = useState(null)

  const handlePickFile = async () => {
  try {
    const res = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const file = res.assets[0]
      setSelectedFile(file)
    }
  } catch (error) {
    console.error('File pick cancelled or failed:', error)
  }
  }

  // const handleRemoveFile = () => {
  //   setSelectedFile(null) // Clear local state
  //   onRemove()            // Notify parent about removal
  // }
  
  return (
    <View>
        <TouchableOpacity
        style={styles.textContainer}
        onPress={handlePickFile}
        {...props}
      >
        <Text
          style={[
            { color: selectedFile ? theme.text : theme.placeholder },
            styles.text,
          ]}
          numberOfLines={1}
        >
          {selectedFile ? selectedFile.name : placeholder}
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <TouchableOpacity
          // onPress={handleRemoveFile}
          style={styles.iconContainer}
        >
          <Ionicons
            name="remove-circle-outline"
            size={20}
            color={theme.icon}
          />
        </TouchableOpacity>
      )}
    </View>
  )
}

export default ThemedFileInput

const styles = StyleSheet.create({
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderColor: 'black',
    borderBottomWidth: 2,
    paddingHorizontal: 12,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 15,
  },
  text: {
    fontSize: 16,
  },
  iconContainer: {
    paddingHorizontal: 5,
  },
})