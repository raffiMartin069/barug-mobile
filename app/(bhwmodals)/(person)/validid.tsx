import NiceModal, { type ModalVariant } from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { ocr_idTypeOptions } from '@/constants/formoptions'
import { Ionicons } from '@expo/vector-icons'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native'

import { supabase } from '@/constants/supabase'
import { fetchResidentPlus } from '@/services/profile'
import { uploadToStorage } from '@/services/storage'

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

const EDGE_FN = 'verify-id'

const ValidId = () => {
  // Selected files
  const [frontId, setFrontId] = useState<Picked | null>(null)
  const [backId, setBackId] = useState<Picked | null>(null)
  const [selfie, setSelfie] = useState<Picked | null>(null)

  // Form fields
  const [idType, setIdType] = useState<string>('')

  // Profile/session
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [details, setDetails] = useState<any | null>(null)

  // Image preview modal
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  // Submit state
  const [submitting, setSubmitting] = useState(false)

  // NiceModal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMsg, setModalMsg] = useState<string | undefined>()
  const [modalVariant, setModalVariant] = useState<ModalVariant>('info')

  // ====== FETCH PROFILE ======
  useEffect(() => {
    let live = true
    ;(async () => {
      setLoadingProfile(true)
      try {
        const { details } = await fetchResidentPlus()
        if (!live) return
        setDetails(details)
      } catch (e) {
        // swallow; we show modal on submit if missing
      } finally {
        if (live) setLoadingProfile(false)
      }
    })()
    return () => { live = false }
  }, [])

  // Derived: personId + profileName
  const personId: string | null = useMemo(
    () => (details?.person_id ? String(details.supabase_uid) : null),
    [details]
  )
  const profileName: string = useMemo(() => {
    const parts = [details?.first_name, details?.middle_name, details?.last_name, details?.suffix]
      .filter(Boolean).join(' ').trim()
    return parts || '—'
  }, [details])

  // ==== UI helpers (image preview) ====
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

  // ==== Normalizer ====
  const normalizeIdType = (value: string) =>
    value.toLowerCase().replace(/’|'/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')

  // ==== Edge Function submit ====
  const submitForVerification = async (args: {
    personId: string
    profileName: string
    idType: string
    frontId: Picked
    backId: Picked
    selfie: Picked
  }) => {
    const { personId, profileName, idType, frontId, backId, selfie } = args

    const base = `person/${personId}`

    // Upload all three; send STORAGE PATHS to the function
    const [front, back, sshot] = await Promise.all([
      uploadToStorage(frontId, `${base}/front.jpg`),
      uploadToStorage(backId, `${base}/back.jpg`),
      uploadToStorage(selfie, `${base}/selfie.jpg`),
    ])

    const body = {
      person_id: personId,
      id_type: normalizeIdType(idType),
      front_path: front.path,
      back_path: back.path,
      selfie_path: sshot.path,
      profile_name: profileName,
    }

    const { data, error } = await supabase.functions.invoke(EDGE_FN, { body })
    if (error) throw error
    return data as { status: 'PASSED' | 'FAILED'; verification_id: string; error?: string; checks_failed?: string[] }
  }

  // ----- NiceModal helper -----
  function showModal(title: string, message?: string, variant: ModalVariant = 'info') {
    setModalTitle(title)
    setModalMsg(message)
    setModalVariant(variant)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    // Guards via NiceModal
    if (!idType) {
      showModal('Missing ID Type', 'Please select the ID type.', 'warn')
      return
    }
    if (!frontId || !backId || !selfie) {
      showModal('Incomplete', 'Please upload the front, back, and a selfie with your ID.', 'warn')
      return
    }
    if (loadingProfile) {
      showModal('Please wait', 'We are still loading your profile.', 'info')
      return
    }
    if (!personId || !profileName || profileName === '—') {
      showModal('Profile Missing', 'We could not detect your profile. Please ensure your name is set.', 'warn')
      return
    }

    try {
      setSubmitting(true)
      const res = await submitForVerification({
        personId,
        profileName,
        idType,
        frontId,
        backId,
        selfie,
      })

      if (res.status === 'PASSED') {
        showModal('Verified', 'Your ID was verified successfully.', 'success')
      } else {
        const reason =
          Array.isArray(res?.checks_failed) && res.checks_failed.length
            ? `\n\nChecks failed: ${res.checks_failed.join(', ')}`
            : undefined
        showModal('Verification failed', `Name or ID type did not match the uploaded ID.${reason ?? ''}`, 'error')
      }
    } catch (e: any) {
      showModal('Error', e?.message || 'Something went wrong.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ===== Small card-like thumbnail render =====
  const renderPreview = (file: Picked | null) => {
    if (!file) return null
    const thumbSrc =
      file?.uri ||
      (file?.base64 ? `data:${file?.mimeType || 'image/*'};base64,${file.base64}` : undefined)
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
    <ThemedView safe>
      <ThemedAppBar title="Valid ID" showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>
        <View style={styles.container}>
          {/* Who are we verifying for */}
          {loadingProfile ? (
            <View style={{ paddingVertical: 6 }}>
              <ActivityIndicator />
              <ThemedText style={{ textAlign: 'center', marginTop: 6 }}>Loading profile…</ThemedText>
            </View>
          ) : (
            !!profileName && (
              <ThemedText style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
                Verifying for: <ThemedText style={{ fontWeight: '700' }}>{profileName}</ThemedText> (ID: {personId})
              </ThemedText>
            )
          )}

          {/* Instructions */}
          <View style={styles.headerBlock}>
            <ThemedText style={styles.headerTitle}>
              PROVIDE A <ThemedText style={styles.headerTitleEm}>CLEAR & VALID</ThemedText> IMAGE OF YOUR ID
            </ThemedText>
            <ThemedText style={styles.headerNote}>Scanned copies are sharper and easier to verify than photos.</ThemedText>

            <TouchableOpacity onPress={() => setPreviewOpen(true)} activeOpacity={0.85} style={styles.infoBanner}>
              <View style={styles.infoBannerLeft}>
                <Ionicons name="information-circle-outline" size={22} color="#6d2932" />
                <ThemedText style={styles.infoBannerText}>How to scan your ID properly?</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6d2932" />
            </TouchableOpacity>
          </View>

          <Spacer height={16} />

          {/* ID Type */}
          <ThemedDropdown items={ocr_idTypeOptions} value={idType} setValue={setIdType} placeholder="ID Type" order={0} />

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

          {/* Submit */}
          <View style={styles.buttons}>
            <ThemedButton onPress={handleSubmit} disabled={submitting || loadingProfile}>
              {submitting ? (
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <ActivityIndicator />
                  <ThemedText btn>Verifying…</ThemedText>
                </View>
              ) : (
                <ThemedText btn>Submit</ThemedText>
              )}
            </ThemedButton>
          </View>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Full-screen image preview modal */}
      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={closePreview}>
        <Pressable style={styles.modalBackdrop} onPress={closePreview}>
          <View style={styles.modalInner}>
            {previewSrc && <Image source={{ uri: previewSrc }} style={styles.fullImage} resizeMode="contain" />}
            <ThemedText style={styles.tapToClose}>Tap anywhere to close</ThemedText>
          </View>
        </Pressable>
      </Modal>

      {/* NiceModal */}
      <NiceModal
        visible={modalOpen}
        title={modalTitle}
        message={modalMsg}
        variant={modalVariant}
        onPrimary={() => setModalOpen(false)}
        onClose={() => setModalOpen(false)}
      />
    </ThemedView>
  )
}

export default ValidId

const styles = StyleSheet.create({
  container: { paddingHorizontal: 10, paddingBottom: 24 },
  headerBlock: { backgroundColor: '#f9f4f2', padding: 12, borderRadius: 12, marginBottom: 8 },
  headerTitle: { fontSize: 14, fontWeight: '700', marginBottom: 1, alignItems: 'center', paddingLeft: 17 },
  headerTitleEm: { fontSize: 14, fontWeight: '800' },
  headerNote: { fontSize: 12, opacity: 0.85, marginBottom: 10, paddingLeft: 7 },
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
  infoBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBannerText: { fontSize: 13, fontWeight: '600', color: '#6d2932' },
  buttons: { gap: 10 },
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
  previewImage: { width: 280, height: 170, borderRadius: 12 },
  previewLabel: { marginTop: 10, fontSize: 13, fontWeight: '500', textAlign: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalInner: { width: '100%', maxWidth: 720, alignItems: 'center' },
  fullImage: { width: '100%', height: '80%', borderRadius: 12 },
  tapToClose: { marginTop: 12, fontSize: 13, color: '#fff', opacity: 0.8 },
})
