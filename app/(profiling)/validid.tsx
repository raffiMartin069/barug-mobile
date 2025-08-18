// app/(profiling)/validid.tsx
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
import { useProfilingWizard } from '@/store/profilingWizard'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Image, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native'

type Picked = {
  uri?: string
  path?: string
  name?: string
  fileName?: string
  mimeType?: string
  type?: string
  base64?: string
  width?: number
  height?: number
} | null

const ValidId = () => {
  const router = useRouter()
  const { validId, setValidId } = useProfilingWizard()

  const [idType, setIdType] = useState('')
  const [frontId, setFrontId] = useState<Picked>(null)
  const [backId, setBackId] = useState<Picked>(null)
  const [selfieId, setSelfieId] = useState<Picked>(null)

  // viewer
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)

  // 🔁 Prefill from store if user navigates back here
  useEffect(() => {
    if (validId) {
      setIdType(validId.id_type_id ? String(validId.id_type_id) : '')
      if (validId.id_front_uri) setFrontId({ uri: validId.id_front_uri })
      if (validId.id_back_uri) setBackId({ uri: validId.id_back_uri })
      if (validId.id_selfie_uri) setSelfieId({ uri: validId.id_selfie_uri })
    }
  }, [validId])

  const getUri = (file: Picked) => {
    if (!file) return null
    if (file.base64) {
      const mt = file.mimeType || file.type || 'image/jpeg'
      return `data:${mt};base64,${file.base64}`
    }
    return file.uri || file.path || null
  }

  const openViewer = (file: Picked) => {
    const u = getUri(file)
    if (!u) return
    setViewerSrc(u)
    setViewerOpen(true)
  }

  const handleFileSelected = (slot: 'front' | 'back' | 'selfie', file: any | null) => {
    if (slot === 'front') setFrontId(file)
    if (slot === 'back') setBackId(file)
    if (slot === 'selfie') setSelfieId(file)
  }

  const handleRemoveFile = (slot: 'front' | 'back' | 'selfie') => {
    if (slot === 'front') setFrontId(null)
    if (slot === 'back') setBackId(null)
    if (slot === 'selfie') setSelfieId(null)
  }

  const frontUri = useMemo(() => getUri(frontId), [frontId])
  const backUri  = useMemo(() => getUri(backId), [backId])
  const selfieUri= useMemo(() => getUri(selfieId), [selfieId])

  const saveAndContinue = () => {
    if (!frontUri || !selfieUri) {
      Alert.alert('Upload required', 'Please upload at least the Front ID and a Selfie holding the ID.')
      return
    }
    setValidId({
      id_type_id: idType ? parseInt(idType) : null,
      id_number: null,                 // you can add an input if needed
      id_front_uri: frontUri,
      id_back_uri: backUri ?? null,
      id_selfie_uri: selfieUri,
    })
    router.push('/reviewinputs')
  }

  const skipAndContinue = () => {
    // "Skip" means pass none
    setValidId({
      id_type_id: null,
      id_number: null,
      id_front_uri: null,
      id_back_uri: null,
      id_selfie_uri: null,
    })
    router.push('/reviewinputs')
  }

  const Preview = ({ file }: { file: Picked }) => {
    const uri = getUri(file)
    if (!uri) return null
    return (
      <View style={styles.previewWrap}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => openViewer(file)}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        </TouchableOpacity>
        <ThemedText style={styles.tapHint}>Tap image to view</ThemedText>
      </View>
    )
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Valid ID' showNotif={false} showProfile={false} />
      <ThemedProgressBar step={3} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedDropdown
            items={idTypeOptions}
            value={idType}
            setValue={setIdType}
            placeholder='ID Type'
            order={0}
          />

          <Spacer height={15} />

          <ThemedText subtitle>Upload a Valid ID:</ThemedText>

          {/* Front */}
          <ThemedFileInput
            placeholder="Front of the ID"
            selectedFile={frontId}
            onFileSelected={(file) => handleFileSelected('front', file)}
            onFileRemoved={() => handleRemoveFile('front')}
          />
          <Preview file={frontId} />

          <Spacer height={10} />

          {/* Back */}
          <ThemedFileInput
            placeholder="Back of the ID (optional)"
            selectedFile={backId}
            onFileSelected={(file) => handleFileSelected('back', file)}
            onFileRemoved={() => handleRemoveFile('back')}
          />
          <Preview file={backId} />

          <Spacer height={15} />

          <ThemedText subtitle>Upload a Selfie Holding the Valid ID:</ThemedText>

          {/* Selfie */}
          <ThemedFileInput
            placeholder="Selfie Holding the ID"
            selectedFile={selfieId}
            onFileSelected={(file) => handleFileSelected('selfie', file)}
            onFileRemoved={() => handleRemoveFile('selfie')}
          />
          <Preview file={selfieId} />
        </View>

        <Spacer height={15} />

        <View>
          {/* Skip = pass none */}
          {/* <ThemedButton submit={false} onPress={skipAndContinue}>
            <ThemedText non_btn>Skip</ThemedText>
          </ThemedButton> */}

          <ThemedButton onPress={saveAndContinue}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Fullscreen viewer */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerBackdrop} onPress={() => setViewerOpen(false)} />
          <View style={styles.viewerFrame}>
            {viewerSrc ? <Image source={{ uri: viewerSrc }} style={styles.viewerImage} resizeMode="contain" /> : null}
          </View>
          <ThemedButton onPress={() => setViewerOpen(false)}>
            <ThemedText btn>Close</ThemedText>
          </ThemedButton>
        </View>
      </Modal>
    </ThemedView>
  )
}

export default ValidId

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
  previewWrap: { marginTop: 8, marginBottom: 4 },
  preview: { width: '100%', height: 180, borderRadius: 12 },
  tapHint: { fontSize: 12, opacity: 0.7, textAlign: 'center', marginTop: 2 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  viewerFrame: { width: '100%', maxWidth: 900, aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  viewerImage: { width: '100%', height: '100%' },
})
