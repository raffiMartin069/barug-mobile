import React, { useState } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import ThemedView from '@/components/ThemedView'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedText from '@/components/ThemedText'
import ThemedImage from '@/components/ThemedImage'
import Spacer from '@/components/Spacer'
import { supabase } from '@/constants/supabase'
import { useAccountRole } from '@/store/useAccountRole'

export default function UploadPicture() {
  const router = useRouter()
  const { getProfile } = useAccountRole()
  const profile = getProfile('resident')
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const pickImage = async () => {
    try {
      console.log('Requesting media library permissions...')
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      console.log('Permission status:', status)
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a picture.')
        return
      }

      console.log('Launching image library...')
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      console.log('Image picker result:', result)
      
      if (!result.canceled && result.assets[0]) {
        console.log('Selected image URI:', result.assets[0].uri)
        setSelectedImage(result.assets[0].uri)
      } else {
        console.log('Image selection canceled or no assets')
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to open image picker')
    }
  }

  const uploadImage = async () => {
    if (!selectedImage || !profile?.person_id) return

    setUploading(true)
    
    try {
      console.log('Starting upload for person_id:', profile.person_id)
      console.log('Selected image URI:', selectedImage)
      
      // Create form data for upload
      const formData = new FormData()
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: `profile_${profile.person_id}.jpg`,
      } as any)

      // Upload to Supabase storage
      const fileName = `profile_${profile.person_id}_${Date.now()}.jpg`
      console.log('Uploading file:', fileName)
      
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, formData)

      if (error) {
        console.error('Storage upload error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Upload successful, data:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

      // Update person_img in database
      console.log('Updating database with person_id:', profile.person_id, 'and URL:', publicUrl)
      
      const { data: updateData, error: updateError } = await supabase
        .from('persons')
        .update({ person_img: publicUrl })
        .eq('person_id', profile.person_id)
        .select()

      console.log('Update response data:', updateData)
      console.log('Update response error:', updateError)

      // Check if there's a real error (not just empty object {})
      if (updateError && Object.keys(updateError).length > 0) {
        console.error('Database update error:', updateError)
        throw new Error('Failed to update profile picture in database')
      }

      // Success: updateError is null/undefined or empty object {}

      console.log('Database updated successfully')
      Alert.alert('Success', 'Profile picture updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ])
      
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      Alert.alert('Error', `Failed to upload picture: ${error.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar title="Upload Picture" showBack />
      
      <View style={styles.container}>
        <Spacer height={32} />
        
        <View style={styles.imageContainer}>
          <ThemedImage
            src={
              selectedImage 
                ? { uri: selectedImage }
                : profile?.person_img 
                ? { uri: profile.person_img }
                : require('@/assets/images/default-image.jpg')
            }
            size={120}
          />
        </View>

        <Spacer height={24} />

        <ThemedButton onPress={pickImage} style={styles.button}>
          <ThemedText btn>Select Picture</ThemedText>
        </ThemedButton>

        <Spacer height={16} />

        {selectedImage && (
          <ThemedButton 
            onPress={uploadImage} 
            disabled={uploading}
            style={[styles.button, { backgroundColor: '#561C24' }]}
          >
            <ThemedText btn style={{ color: '#fff' }}>
              {uploading ? 'Uploading...' : 'Save Picture'}
            </ThemedText>
          </ThemedButton>
        )}

        <Spacer height={16} />

        <ThemedButton onPress={() => router.back()} submit={false} style={styles.button}>
          <ThemedText non_btn>Cancel</ThemedText>
        </ThemedButton>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 300,
  },
})