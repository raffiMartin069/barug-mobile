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

  // ---------- helpers ----------
  const getUri = (file: Picked) => {
    if (!file) return null
    if (file.base64) {
      const mt = file?.mimeType || file?.type || 'image/jpeg'
      return `data:${mt};base64,${file.base64}`
    }
    return file?.uri || file?.path || null
  }

  const deriveNameFromUri = (uri?: string | null) => {
    if (!uri) return undefined
    try {
      // Try to extract last path segment for file-ish uris
      const clean = decodeURIComponent(uri)
      const parts = clean.split(/[\/\\]/)
      const last = parts[parts.length - 1] || ''
      if (last && last.includes('.')) return last
      // content:// or data: fallback
      if (clean.startsWith('content://')) return 'selected-image.jpg'
      if (clean.startsWith('data:')) return 'inline-image.jpg'
      return last || 'image.jpg'
    } catch {
      return 'image.jpg'
    }
  }

  const getDisplayName = (file: Picked) => {
    if (!file) return undefined
    return file.name || (file as any).fileName || deriveNameFromUri(getUri(file))
  }

  const openViewer = (file: Picked) => {
    const u = getUri(file)
    if (!u) return
    setViewerSrc(u)
    setViewerOpen(true)
  }

  const handleFileSelected = (slot: 'front' | 'back' | 'selfie', file: any | null) => {
    // Ensure we always keep a name for display
    const withName = file
      ? {
          ...file,
          name: file?.name || file?.fileName || deriveNameFromUri(file?.uri || file?.path),
        }
      : null
    if (slot === 'front') setFrontId(withName)
    if (slot === 'back') setBackId(withName)
    if (slot === 'selfie') setSelfieId(withName)
  }

  const handleRemoveFile = (slot: 'front' | 'back' | 'selfie') => {
    if (slot === 'front') setFrontId(null)
    if (slot === 'back') setBackId(null)
    if (slot === 'selfie') setSelfieId(null)
  }

  const frontUri = useMemo(() => getUri(frontId), [frontId])
  const backUri  = useMemo(() => getUri(backId), [backId])
  const selfieUri= useMemo(() => getUri(selfieId), [selfieId])

  // ---------- prefill from store ----------
  useEffect(() => {
    if (validId) {
      setIdType(validId.id_type_id ? String(validId.id_type_id) : '')
      if (validId.id_front_uri) {
        setFrontId({
          uri: validId.id_front_uri,
          name: validId.id_front_name || deriveNameFromUri(validId.id_front_uri),
        })
      }
      if (validId.id_back_uri) {
        setBackId({
          uri: validId.id_back_uri,
          name: validId.id_back_name || deriveNameFromUri(validId.id_back_uri),
        })
      }
      if (validId.id_selfie_uri) {
        setSelfieId({
          uri: validId.id_selfie_uri,
          name: validId.id_selfie_name || deriveNameFromUri(validId.id_selfie_uri),
        })
      }
    }
  }, [validId])

  // ---------- save ----------
  const saveAndContinue = () => {
    if (!frontUri || !selfieUri) {
      Alert.alert('Upload required', 'Please upload at least the Front ID and a Selfie holding the ID.')
      return
    }

    setValidId({
      id_type_id: idType ? parseInt(idType) : null,
      id_number: null, // add an input later if needed

      id_front_uri: frontUri,
      id_front_name: getDisplayName(frontId),

      id_back_uri: backUri ?? null,
      id_back_name: backUri ? getDisplayName(backId) : null,

      id_selfie_uri: selfieUri,
      id_selfie_name: getDisplayName(selfieId),
    })

    router.push('/reviewinputs')
  }

  // const skipAndContinue = () => {
  //   setValidId({
  //     id_type_id: null,
  //     id_number: null,
  //     id_front_uri: null,
  //     id_front_name: null,
  //     id_back_uri: null,
  //     id_back_name: null,
  //     id_selfie_uri: null,
  //     id_selfie_name: null,
  //   })
  //   router.push('/reviewinputs')
  // }

  const Preview = ({ file }: { file: Picked }) => {
    const uri = getUri(file)
    if (!uri) return null
    return (
      <View style={styles.previewWrap}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => openViewer(file)}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        </TouchableOpacity>
        <ThemedText style={styles.tapHint}>
          {'Tap image to view'}
        </ThemedText>
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
  tapHint: { fontSize: 12, opacity: 0.7, textAlign: 'center', marginTop: 6 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  viewerFrame: { width: '100%', maxWidth: 900, aspectRatio: 3/4, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  viewerImage: { width: '100%', height: '100%' },
})