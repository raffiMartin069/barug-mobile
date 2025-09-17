import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'

import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { uploadAuthLetter } from '@/services/letterStorage'
import { useAccountRole } from '@/store/useAccountRole'
import type { PersonSearchRequest } from '@/types/householdHead'

import {
  getDocumentTypes,
  getPurposesByDocumentType,
  getBusinessesOwnedByPerson,
  createDocumentRequest,
  peso,
  type DocType,
  type Purpose,
  type BusinessLite,
} from '@/services/documentRequest'

type PersonMinimal = {
  person_id: number
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  sex?: string | null
  birth_date?: string | null
  mobile_number?: string | null
  email?: string | null
  address?: string | null
  government_program?: string | null
}

type Picked = {
  uri?: string
  name?: string
  type?: string
  size?: number | null
}

const SUBMIT_BAR_HEIGHT = 88
const BRAND = '#310101'
const BUSINESS_DOC_NAME = 'BARANGAY BUSINESS CLEARANCE'

// ---- helpers ----
const dbg = (...a: any[]) => console.log('[REQDOC]', ...a)
const compactUri = (u?: string) => (u ? (u.length > 48 ? u.slice(0, 45) + '...' : u) : u)
const summarizePicked = (p?: Picked | null) =>
  p ? ({ name: p.name, type: p.type, size: p.size, uri: compactUri(p.uri) }) : null

type IconKey = 'success' | 'error' | 'info'
const ICONS: Record<IconKey, any> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
}

export default function RequestDoc() {
  const router = useRouter()

  // target
  const [forWhom, setForWhom] = useState<'SELF' | 'OTHER'>('SELF')
  const [otherPerson, setOtherPerson] = useState<{ id: number | null; display: string | null }>({ id: null, display: null })
  const [authLetter, setAuthLetter] = useState<Picked | null>(null)

  // requester
  const roleStore = useAccountRole()
  const role = roleStore.currentRole ?? 'resident'
  const cached = roleStore.getProfile(role)
  const [loadingMe, setLoadingMe] = useState<boolean>(!cached)
  const [me, setMe] = useState<PersonMinimal | null>(cached ? mapToPersonMinimal(cached) : null)
  const [expandRequester, setExpandRequester] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      const fresh = await roleStore.ensureLoaded('resident')
      if (!live) return
      const details = fresh ?? cached
      setMe(details ? mapToPersonMinimal(details) : null)
      setLoadingMe(false)
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleStore.ensureLoaded])

  // lookups
  const { results: searchResults, search } = usePersonSearchByKey()
  const [searchText, setSearchText] = useState('')

  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [documentTypeId, setDocumentTypeId] = useState<number | null>(null)

  const [purposes, setPurposes] = useState<Purpose[]>([])
  const [purposeId, setPurposeId] = useState<number | null>(null)

  const [businesses, setBusinesses] = useState<BusinessLite[]>([])
  const [businessId, setBusinessId] = useState<number | null>(null)

  // qty/notes
  const [quantity, setQuantity] = useState<number>(1)
  const [purposeNotes, setPurposeNotes] = useState<string>('')

  // ui state
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState<{
    visible: boolean
    icon?: IconKey
    title?: string
    message?: string
    primaryText?: string
    onPrimary?: () => void
  }>({ visible: false })
  const showModal = (opts: Partial<typeof modal>) => setModal(p => ({ ...p, visible: true, ...opts }))
  const hideModal = () => setModal(p => ({ ...p, visible: false }))

  // load lookups
  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const types = await getDocumentTypes()
        if (!live) return
        setDocTypes(types)
      } catch (e) { console.log('[getDocumentTypes] failed:', e) }
    })()
    return () => { live = false }
  }, [])

  useEffect(() => {
    let live = true
    ;(async () => {
      setPurposes([]); setPurposeId(null); setBusinessId(null)
      if (!documentTypeId) return
      try {
        const p = await getPurposesByDocumentType(documentTypeId)
        if (!live) return
        setPurposes(p)
      } catch (e) { console.log('[getPurposesByDocumentType] failed:', e) }
    })()
    return () => { live = false }
  }, [documentTypeId])

  useEffect(() => {
    let live = true
    ;(async () => {
      const name = docTypes.find(d => d.document_type_id === documentTypeId)?.document_type_name
      const isBusiness = name === BUSINESS_DOC_NAME
      setBusinesses([]); setBusinessId(null)
      if (!isBusiness || !me?.person_id) return
      try {
        const list = await getBusinessesOwnedByPerson(me.person_id)
        if (!live) return
        setBusinesses(list)
      } catch (e) { console.log('[getBusinessesOwnedByPerson] failed:', e) }
    })()
    return () => { live = false }
  }, [documentTypeId, docTypes, me?.person_id])

  // derived
  const selectedPurpose = useMemo(
    () => purposes.find(p => p.document_purpose_id === (purposeId ?? -1)),
    [purposes, purposeId]
  )
  const offenseNo = selectedPurpose?.default_offense_no ?? null

  const documentItems = useMemo(
    () => docTypes.map(dt => ({ label: dt.document_type_name, value: dt.document_type_id })),
    [docTypes]
  )
  const purposeItems = useMemo(
    () => purposes.map(p => ({ label: `${p.purpose_label}  •  ${peso(p.current_amount)}`, value: p.document_purpose_id })),
    [purposes]
  )
  const businessItems = useMemo(
    () => businesses.map(b => ({ label: b.business_name, value: b.business_id })),
    [businesses]
  )

  const estimatedFee = useMemo(() => {
    const unit = Number(selectedPurpose?.current_amount || 0)
    return peso(Math.max(0, unit * (quantity || 1)))
  }, [selectedPurpose, quantity])

  const inlineError = useMemo(() => {
    if (!documentTypeId) return 'Please select a document.'
    if (!purposeId) return 'Please select a purpose.'
    const chosenDocName = docTypes.find(d => d.document_type_id === documentTypeId)?.document_type_name
    if (chosenDocName === BUSINESS_DOC_NAME && !businessId) return 'Please choose the business.'
    if (forWhom === 'OTHER') {
      if (!otherPerson.id) return 'Please choose the person you are requesting for.'
      if (!authLetter?.uri) return 'Please upload an authorization letter.'
    }
    if (!quantity || quantity < 1) return 'Quantity must be at least 1.'
    return ''
  }, [documentTypeId, purposeId, businessId, forWhom, otherPerson.id, authLetter, quantity, docTypes])

  const niceName = (p?: PersonMinimal | null) =>
    p ? [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(' ') : '—'

  // submit
  const handleSubmit = async () => {
    const err = inlineError
    if (err) {
      showModal({ icon: 'error', title: 'Missing info', message: err, primaryText: 'OK' })
      return
    }

    setSubmitting(true)
    let authUploadPath: string | null = null

    if (forWhom === 'OTHER' && authLetter?.uri) {
      try {
        const fileName = authLetter.name || `auth_${Date.now()}${guessExt(authLetter.type)}`
        const { path } = await uploadAuthLetter(authLetter.uri!, fileName, { personId: Number(me?.person_id) || undefined, upsert: true })
        authUploadPath = path
      } catch {
        setSubmitting(false)
        showModal({ icon: 'error', title: 'Upload failed', message: 'Please try uploading the authorization letter again.' })
        return
      }
    }

    try {
      const requesterId = Number(me?.person_id)
      const subjectId = forWhom === 'SELF' ? requesterId : Number(otherPerson.id)
      if (!requesterId || !subjectId || !selectedPurpose) throw new Error('Could not resolve IDs or purpose.')

      const payload = {
        requested_by: requesterId,
        on_behalf_of: subjectId === requesterId ? null : subjectId,
        is_on_behalf: subjectId !== requesterId,
        business_id: docTypes.find(d => d.document_type_id === documentTypeId)?.document_type_name === BUSINESS_DOC_NAME ? businessId : null,
        purpose_notes: purposeNotes || null,
        lines: [{
          document_purpose_id: selectedPurpose.document_purpose_id,
          quantity,
          offense_no: offenseNo,
          details: {
            purpose_code: selectedPurpose.purpose_code,
            ...(authUploadPath ? { auth_letter_path: authUploadPath } : {}),
          },
        }],
      }

      const res = await createDocumentRequest(payload as any)
      const newId: number = typeof res === 'number' ? res : (res?.doc_request_id ?? res)

      setSubmitting(false)
      showModal({
        icon: 'success',
        title: 'Request submitted',
        message: 'We’ll notify you when the Treasurer reviews your request.',
        primaryText: 'View Receipt',
        onPrimary: () => {
          hideModal()
          router.replace({ pathname: '/(residentmodals)/receipt', params: { id: String(newId) } })
        },
      })
    } catch (e: any) {
      setSubmitting(false)
      showModal({ icon: 'error', title: 'Submission failed', message: e?.message ?? 'Unable to submit request right now.' })
    }
  }

  const summaryText = useMemo(() => {
    const doc = docTypes.find(d => d.document_type_id === documentTypeId)?.document_type_name
    const purp = selectedPurpose?.purpose_label
    if (!doc) return 'Choose a document'
    return purp ? `${doc} • ${purp} • ${estimatedFee}` : `${doc}`
  }, [docTypes, documentTypeId, selectedPurpose, estimatedFee])

  return (
    <ThemedView safe>
      <ThemedAppBar title="Request a Document" showNotif={false} showProfile={false} />
      <View style={styles.stepper}>
        {['Choose document','Purpose & copies','Who is this for?','Attach letter (if needed)'].map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={styles.stepDot} />
            <ThemedText small muted numberOfLines={1} style={{ maxWidth: 90 }}>{s}</ThemedText>
            {i < 3 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>

      <ThemedKeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SUBMIT_BAR_HEIGHT + 28 }}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        {/* Summary chip */}
        <View style={styles.summaryChip}>
          <Ionicons name="document-text-outline" size={16} color={BRAND} />
          <ThemedText style={{ marginLeft: 6 }} weight="700">{summaryText}</ThemedText>
        </View>

        {/* Requester */}
        <ThemedCard style={{ marginTop: 10 }}>
          <View style={styles.cardHeaderRow}>
            <RowTitle icon="person-outline" title="Requester Details" />
            <TouchableOpacity onPress={() => setExpandRequester(v => !v)}>
              <ThemedText small weight="600" style={{ opacity: 0.7 }}>
                {expandRequester ? 'Collapse' : 'View'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {loadingMe ? (
            <View style={[styles.loadingRow, { marginTop: 6 }]}>
              <ActivityIndicator />
              <Spacer width={8} />
              <ThemedText muted>Loading your profile…</ThemedText>
            </View>
          ) : me ? (
            <View style={styles.detailsWrap}>
              <Row label="Name" value={niceName(me)} />
              <Row label="Mobile" value={me.mobile_number || '—'} />
              {expandRequester && (
                <>
                  <Row label="Sex" value={me.sex || '—'} />
                  <Row label="Birthdate" value={me.birth_date || '—'} />
                  <Row label="Email" value={me.email || '—'} />
                  <Row label="Address" value={me.address || '—'} multiline />
                  <Row label="Gov’t Program" value={me.government_program || '—'} />
                  <Row label="Resident ID" value={me.person_id} />
                </>
              )}
            </View>
          ) : (
            <ThemedText muted>Couldn’t load your details. You can still proceed.</ThemedText>
          )}
        </ThemedCard>

        {/* Doc & Purpose */}
        <Spacer height={12} />
        <ThemedCard>
          <RowTitle icon="document-text-outline" title="Document & Purpose" />
          <Spacer height={8} />

          <ThemedDropdown
            items={documentItems}
            value={documentTypeId}
            setValue={(v: number) => setDocumentTypeId(v)}
            placeholder="Select Document Type"
            order={0}
          />
          {!documentTypeId && <ThemedText small style={styles.hintText}>Choose a document to load its purposes and fees.</ThemedText>}
          {(!documentTypeId && inlineError) && <ThemedText small style={styles.errorText}>Please select a document.</ThemedText>}

          <Spacer height={10} />

          <ThemedDropdown
            items={purposeItems}
            value={purposeId}
            setValue={(v: number) => setPurposeId(v)}
            placeholder={documentTypeId ? 'Select Purpose' : 'Select a document first'}
            order={1}
          />
          {!!documentTypeId && !purposeItems.length && <ThemedText small muted>Loading purposes…</ThemedText>}
          {(!purposeId && inlineError) && <ThemedText small style={styles.errorText}>Please select a purpose.</ThemedText>}

          <Spacer height={12} />
          <FeeRow title="Estimated Fee" value={estimatedFee} />

          <Spacer height={12} />
          <ThemedText weight="600">Copies</ThemedText>
          <Spacer height={6} />
          <QuantityPicker value={quantity} onChange={setQuantity} />

          <Spacer height={12} />
          <ThemedText weight="600">Notes to Treasurer/Clerk (optional)</ThemedText>
          <Spacer height={6} />
          <ThemedTextInput
            value={purposeNotes}
            onChangeText={setPurposeNotes}
            placeholder="E.g., need before Friday"
            multiline
          />

          {/* Business picker */}
          {docTypes.find(d => d.document_type_id === documentTypeId)?.document_type_name === BUSINESS_DOC_NAME && (
            <>
              <Spacer height={12} />
              <ThemedText weight="600">Business (required)</ThemedText>
              <Spacer height={6} />
              <ThemedDropdown
                items={businessItems}
                value={businessId}
                setValue={(v: number) => setBusinessId(v)}
                placeholder={businessItems.length ? 'Select business' : 'No businesses found'}
                order={2}
              />
              {(!businessId && inlineError) && <ThemedText small style={styles.errorText}>Please choose the business.</ThemedText>}
            </>
          )}

          <Spacer height={6} />
          <ThemedText small muted>Final amount may include surcharges or waivers as applied by the Treasurer.</ThemedText>
        </ThemedCard>

        {/* For whom */}
        <Spacer height={12} />
        <ThemedCard>
          <RowTitle icon="people-outline" title="Who is this for?" />
          <Spacer height={8} />
          <ThemedRadioButton
            options={[{ label: 'For myself', value: 'SELF' }, { label: 'For someone else', value: 'OTHER' }]}
            value={forWhom}
            onChange={setForWhom as any}
          />

          {forWhom === 'OTHER' && (
            <>
              <Spacer height={10} />
              <ThemedText weight="600">Find the person</ThemedText>
              <Spacer height={6} />
              <ThemedSearchSelect<PersonSearchRequest>
                items={searchResults}
                getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
                getSubLabel={(p) => p.address}
                inputValue={searchText}
                onInputValueChange={(t) => { setSearchText(t); search(t) }}
                placeholder="Search by name, resident ID, address…"
                emptyText="No matches"
                onSelect={(p) => setOtherPerson({ id: Number(p.person_id), display: p.full_name })}
                fillOnSelect={false}
                filter={(p, q) => {
                  const query = q.toLowerCase()
                  return (
                    p.full_name.toLowerCase().includes(query) ||
                    (p.person_code || '').toLowerCase().includes(query) ||
                    (p.address || '').toLowerCase().includes(query)
                  )
                }}
              />
              {!otherPerson.id && inlineError && <ThemedText small style={styles.errorText}>Please choose a person.</ThemedText>}

              {otherPerson.id && (
                <>
                  <Spacer height={8} />
                  <Row label="Selected person" value={`${otherPerson.display} (ID: ${otherPerson.id})`} />
                </>
              )}

              <Spacer height={14} />
              <ThemedText weight="600">Authorization Letter</ThemedText>
              <Spacer height={6} />
              <AttachmentPicker
                value={authLetter}
                onChange={setAuthLetter}
                placeholder="Upload a signed authorization letter (JPG/PNG/PDF)"
              />
              {(!authLetter?.uri && inlineError) && <ThemedText small style={styles.errorText}>Authorization letter is required.</ThemedText>}

              <Spacer height={6} />
              <InfoHint text="On-behalf requests must match allowed kinship in the database. Invalid relationships will be rejected." />
            </>
          )}
        </ThemedCard>
      </ThemedKeyboardAwareScrollView>

      {/* sticky footer */}
      <View style={styles.fadeTop} />
      <View style={styles.submitBar}>
        <View>
          <ThemedText small muted>Total Estimated Fee</ThemedText>
          <ThemedText weight="800" style={{ fontSize: 18 }}>{estimatedFee}</ThemedText>
        </View>
        <ThemedButton onPress={handleSubmit} disabled={!!inlineError || submitting} loading={submitting}>
          <ThemedText btn>Submit Request</ThemedText>
        </ThemedButton>
      </View>

      {/* modal */}
      <Modal visible={modal.visible} transparent animationType="fade" onRequestClose={hideModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.iconWrap}>
              <Ionicons name={(ICONS[(modal.icon || 'info') as IconKey] as any) || 'information-circle'} size={34} color="#fff" />
            </View>
            {!!modal.title && <ThemedText style={styles.modalTitle} title>{modal.title}</ThemedText>}
            {!!modal.message && <ThemedText style={styles.modalMsg}>{modal.message}</ThemedText>}
            <Pressable style={styles.modalBtn} onPress={() => { modal.onPrimary ? modal.onPrimary() : hideModal() }}>
              <ThemedText btn>{modal.primaryText || 'OK'}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ThemedView>
  )
}

/* ---------- mini components ---------- */
function RowTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.iconPill}><Ionicons name={icon} size={16} color={BRAND} /></View>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  )
}

function InfoHint({ text }: { text: string }) {
  return (
    <View style={styles.hintPill}>
      <Ionicons name="information-circle-outline" size={16} color={BRAND} />
      <ThemedText small style={{ marginLeft: 6 }}>{text}</ThemedText>
    </View>
  )
}

/* ---------- helpers ---------- */
function guessExt(mime?: string) {
  if (!mime) return '.jpg'
  if (mime.includes('pdf')) return '.pdf'
  if (mime.includes('png')) return '.png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'
  return '.jpg'
}

function mapToPersonMinimal(details: any): PersonMinimal {
  const fullAddress =
    [
      details?.haddress ?? details?.street_name ?? details?.street,
      details?.purok_sitio_name ?? details?.purok_sitio,
      details?.barangay_name ?? details?.barangay,
      details?.city_name ?? details?.city,
    ].filter(Boolean).join(', ') || undefined

  const govProgName =
    details?.gov_mem_prog_name ??
    details?.gov_program ??
    details?.government_program_name ??
    details?.government_program ??
    details?.gov_mem_prog ??
    details?.details?.gov_mem_prog_name ??
    (typeof details?.gov_mem_prog_id === 'number' ? `ID: ${details.gov_mem_prog_id}` : null)

  return {
    person_id: Number(details?.person_id ?? details?.details?.person_id ?? 0),
    first_name: details?.first_name ?? details?.details?.first_name ?? '',
    middle_name: details?.middle_name ?? details?.details?.middle_name ?? null,
    last_name: details?.last_name ?? details?.details?.last_name ?? '',
    suffix: details?.suffix ?? details?.details?.suffix ?? null,
    sex: details?.sex ?? details?.details?.sex ?? null,
    birth_date: details?.birthdate ?? details?.details?.birthdate ?? null,
    mobile_number: details?.mobile_num ?? details?.mobile_number ?? details?.details?.mobile_num ?? null,
    email: details?.email ?? details?.details?.email ?? null,
    address: fullAddress,
    government_program: govProgName,
  }
}

const Row = ({ label, value, multiline }: { label: string; value?: string | number | null; multiline?: boolean }) => {
  const display = value === null || value === undefined || value === '' ? '—' : String(value)
  return (
    <View style={[styles.row, multiline && { alignItems: 'flex-start' }]}>
      <ThemedText muted style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={[styles.rowValue, multiline && { flexShrink: 1 }]}>{display}</ThemedText>
    </View>
  )
}

function QuantityPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <ThemedButton variant="ghost" onPress={() => onChange(Math.max(1, (value || 1) - 1))}>
        <ThemedText btn>-</ThemedText>
      </ThemedButton>
      <ThemedText style={{ minWidth: 36, textAlign: 'center', fontSize: 18 }} weight="800">{value}</ThemedText>
      <ThemedButton onPress={() => onChange((value || 1) + 1)}>
        <ThemedText btn>+</ThemedText>
      </ThemedButton>
    </View>
  )
}

function FeeRow({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.feeRow}>
      <ThemedText muted>{title}</ThemedText>
      <ThemedText weight="800" style={{ fontSize: 16 }}>{value}</ThemedText>
    </View>
  )
}

function AttachmentPicker({
  value, onChange, placeholder,
}: { value: Picked | null; onChange: (v: Picked | null) => void; placeholder?: string }) {
  const pickFromFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ multiple: false, copyToCacheDirectory: true, type: ['image/*', 'application/pdf'] })
      if (res.canceled) return
      const a = res.assets?.[0]; if (!a) return
      onChange({ uri: a.uri, name: a.name ?? `file_${Date.now()}`, type: a.mimeType ?? undefined, size: typeof a.size === 'number' ? a.size : null })
    } catch { Alert.alert('Could not open file picker.') }
  }
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required.'); return }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
      if (res.canceled) return
      const a = res.assets?.[0]; if (!a) return
      onChange({ uri: a.uri, name: a.fileName ?? `photo_${Date.now()}.jpg`, type: a.mimeType ?? 'image/jpeg', size: typeof a.fileSize === 'number' ? a.fileSize : null })
    } catch { Alert.alert('Could not open camera.') }
  }
  const clear = () => onChange(null)
  const isImage = value?.type?.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(value?.name || '')
  const isPdf = value?.type === 'application/pdf' || /\.pdf$/i.test(value?.name || '')
  return (
    <View>
      {!value?.uri ? (
        <TouchableOpacity style={styles.dropzone} onPress={pickFromFiles} activeOpacity={0.9}>
          <ThemedText weight="700">Tap to upload</ThemedText>
          <ThemedText small muted style={{ marginTop: 2 }}>{placeholder || 'Pick a file from your device'}</ThemedText>
          <Spacer height={10} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ThemedButton variant="ghost" onPress={pickFromFiles}><ThemedText btn>Choose File</ThemedText></ThemedButton>
            <ThemedButton variant="ghost" onPress={takePhoto}><ThemedText btn>Take Photo</ThemedText></ThemedButton>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.attachmentCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.previewBox}>
              {isImage ? (
                <Image source={{ uri: value.uri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} contentFit="cover" cachePolicy="memory-disk" />
              ) : (
                <View style={styles.pdfBadge}><ThemedText weight="700">PDF</ThemedText></View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText numberOfLines={1} weight="600">{value.name || 'attachment'}</ThemedText>
              <ThemedText small muted>{value.type || 'Unknown type'}</ThemedText>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                {isPdf && <ThemedButton variant="ghost" onPress={() => Linking.openURL(value.uri!)}><ThemedText btn>View</ThemedText></ThemedButton>}
                <ThemedButton variant="ghost" onPress={pickFromFiles}><ThemedText btn>Replace</ThemedText></ThemedButton>
                <ThemedButton variant="ghost" onPress={clear}><ThemedText btn>Remove</ThemedText></ThemedButton>
              </View>
            </View>
          </View>
          <ThemedText small muted style={{ marginTop: 8 }}>Max ~10 MB. Accepted: JPG, PNG, PDF.</ThemedText>
        </View>
      )}
    </View>
  )
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  detailsWrap: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  rowLabel: { width: 120, color: '#6b7280' },
  rowValue: { flex: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginRight: 6 },
  stepLine: { width: 28, height: 2, backgroundColor: 'rgba(49,1,1,0.25)', marginHorizontal: 8, borderRadius: 1 },

  summaryChip: { marginHorizontal: 16, marginTop: 6, marginBottom: 2, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa', flexDirection: 'row', alignItems: 'center' },

  hintText: { marginTop: 6, color: '#6b7280' },
  errorText: { color: '#C0392B', marginTop: 6 },

  iconPill: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(49,1,1,0.08)', alignItems: 'center', justifyContent: 'center' },
  hintPill: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 10, backgroundColor: 'rgba(49,1,1,0.06)' },

  feeRow: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fafafa',
  },

  dropzone: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db', padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#fcfcfc' },
  attachmentCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#fff' },
  previewBox: { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', backgroundColor: '#f3f4f6' },
  pdfBadge: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  fadeTop: { position: 'absolute', left: 0, right: 0, bottom: SUBMIT_BAR_HEIGHT, height: 14, backgroundColor: 'transparent' },
  submitBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SUBMIT_BAR_HEIGHT,
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalMsg: { textAlign: 'center', opacity: 0.8, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },
})
