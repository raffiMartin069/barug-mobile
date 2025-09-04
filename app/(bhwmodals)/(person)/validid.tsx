import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { idTypeOptions } from '@/constants/formoptions'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
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
}

const ValidId = () => {
  const [frontId, setFrontId] = useState<Picked | null>(null)
  const [backId, setBackId] = useState<Picked | null>(null)
  const [selfie, setSelfie] = useState<Picked | null>(null)
  const [idType, setIdType] = useState<string>('')

  // full-screen preview modal (for uploaded images)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  // info modal (how to scan)
  const [infoOpen, setInfoOpen] = useState(false)

  const openPreview = (file?: Picked | null) => {
    const src =
      file?.uri ||
      (file?.base64 ? `data:${file?.mimeType || 'image/*'};base64,${file.base64}` : undefined)
    if (src) {
      setPreviewSrc(src)
      setPreviewOpen(true)
    }
  }

  const closePreview = () => {
    setPreviewOpen(false)
    setPreviewSrc(null)
  }

  const handleSubmit = () => {
    if (!idType) {
      Alert.alert('Missing ID Type', 'Please select the ID type.')
      return
    }
    if (!frontId || !backId || !selfie) {
      Alert.alert('Incomplete', 'Please upload Front, Back, and a Selfie with your ID.')
      return
    }
    console.log('Submitting payload:', { idType, frontId, backId, selfie })
    Alert.alert('Success', 'Your ID images were captured. Continue to next step.')
  }

  // centered, bigger, card-style preview
  const renderPreview = (file: Picked | null) => {
    if (!file) return null
    const thumbSrc =
      file.uri ||
      (file.base64 ? `data:${file.mimeType || 'image/*'};base64,${file.base64}` : undefined)
    if (!thumbSrc) return null

    return (
      <Pressable onPress={() => openPreview(file)} style={styles.previewCard}>
        <Image source={{ uri: thumbSrc }} style={styles.previewImage} resizeMode="cover" />
        <ThemedText style={styles.previewLabel} numberOfLines={1}>
          {file.fileName || file.name || 'Selected'}
        </ThemedText>
      </Pressable>
    )
  }

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Valid ID" showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>
        <View style={styles.container}>
          {/* ===== Instruction banner ===== */}
          <View style={styles.headerBlock}>
            <ThemedText style={styles.headerTitle}>
              PROVIDE A <ThemedText style={styles.headerTitleEm}>CLEAR & VALID</ThemedText> IMAGE OF YOUR ID
            </ThemedText>
            <ThemedText style={styles.headerNote}>
              Scanned copies are sharper and easier to verify than photos.
            </ThemedText>

            <TouchableOpacity
              onPress={() => setInfoOpen(true)}
              activeOpacity={0.85}
              style={styles.infoBanner}
            >
              <View style={styles.infoBannerLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#6d2932" />
                <ThemedText style={styles.infoBannerText}>How to scan your ID properly?</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6d2932" />
            </TouchableOpacity>
          </View>
      
          <Spacer height={16} />

          {/* ===== ID Type (no extra help icon) ===== */}
          <ThemedDropdown
            items={idTypeOptions}
            value={idType}
            setValue={setIdType}
            placeholder="ID Type"
            order={0}
          />

          <Spacer height={16} />

          <ThemedText subtitle>Upload a Valid ID:</ThemedText>

          <ThemedFileInput
            placeholder="Front of the ID"
            selectedFile={frontId}
            onFileSelected={(f: Picked) => setFrontId(f)}
            onFileRemoved={() => setFrontId(null)}
          />
          {renderPreview(frontId)}

          <Spacer height={12} />

          <ThemedFileInput
            placeholder="Back of the ID"
            selectedFile={backId}
            onFileSelected={(f: Picked) => setBackId(f)}
            onFileRemoved={() => setBackId(null)}
          />
          {renderPreview(backId)}

          <Spacer height={16} />

          <ThemedText subtitle>Upload a Selfie Holding the Valid ID:</ThemedText>

          <ThemedFileInput
            placeholder="Selfie Holding the ID"
            selectedFile={selfie}
            onFileSelected={(f: Picked) => setSelfie(f)}
            onFileRemoved={() => setSelfie(null)}
          />
          {renderPreview(selfie)}

          <Spacer height={20} />

          <View style={styles.buttons}>
            {/* <ThemedButton submit={false} onPress={() => Alert.alert('Skipped')}>
              <ThemedText non_btn>Skip</ThemedText>
            </ThemedButton> */}
            <ThemedButton onPress={handleSubmit}>
              <ThemedText btn>Submit</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* ===== Full-screen image preview modal ===== */}
      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={closePreview}>
        <Pressable style={styles.modalBackdrop} onPress={closePreview}>
          <View style={styles.modalInner}>
            {previewSrc && <Image source={{ uri: previewSrc }} style={styles.fullImage} resizeMode="contain" />}
            <ThemedText style={styles.tapToClose}>Tap anywhere to close</ThemedText>
          </View>
        </Pressable>
      </Modal>

      {/* ===== Info modal (short steps) ===== */}
      <Modal visible={infoOpen} transparent animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.infoBackdrop}>
          <View style={styles.infoCard}>
            <ThemedText style={styles.infoTitle}>How to Scan Your ID</ThemedText>
            <ThemedText style={styles.infoText}>
              For best results, scan your ID instead of taking a photo.
            </ThemedText>

            {/* Sample scanned images */}
            <Image
              source={require('@/assets/images/scanned_front_id_sample.jpg')}
              style={styles.sampleImage}
              resizeMode="contain"
            />
            <Image
              source={require('@/assets/images/scanned_back_id_sample.jpg')}
              style={styles.sampleImage}
              resizeMode="contain"
            />
            <ThemedText style={styles.creditsText}>
              Sample courtesy of Philippine Statistics Authority
            </ThemedText>

            <ThemedText style={styles.infoSubtitle}>Quick Steps</ThemedText>
            <ThemedText style={styles.infoText}>
              1. Install a scanner app like CamScanner.{'\n'}
              2. Scan the front and back of your ID.{'\n'}
              3. Save and upload the scanned copies here.
            </ThemedText>

            <Spacer height={16} />
            <ThemedButton onPress={() => setInfoOpen(false)}>
              <ThemedText btn>Got it</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </Modal>
    </ThemedView>
  )
}

export default ValidId

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingBottom: 24,
  },

  // ---- Instruction banner ----
  headerBlock: {
    backgroundColor: '#f9f4f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
    alignItems: 'center',
    paddingLeft: 17
  },
  headerTitleEm: {
    fontSize: 14,
    fontWeight: '800',
  },
  headerNote: {
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 10,
    paddingLeft: 7
  },
  infoBanner: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6d9d6',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6d2932',
  },

  // ---- Buttons ----
  buttons: {
    gap: 10,
  },

  // ---- Image previews ----
  previewCard: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6d0606ff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  previewImage: {
    width: 280,
    height: 170,
    borderRadius: 12,
  },
  previewLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ---- Full-screen preview modal ----
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalInner: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
    borderRadius: 12,
  },
  tapToClose: {
    marginTop: 12,
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
  },

  // ---- Info modal ----
  infoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
  },
  sampleImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  creditsText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
})
