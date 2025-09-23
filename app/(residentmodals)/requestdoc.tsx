// /(resident)/(tabs)/requestdoc.tsx
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
  attachAuthorizationLetter,
  computeExemptionAmount,
  getResidentFullProfile,
  peso,
  type DocType,
  type Purpose,
  type BusinessLite,
} from '@/services/documentRequest'

/* ---------------- Types ---------------- */
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
  government_programs?: string[] | null
  is_student?: boolean | null
  employment_status?: string | null
}

type Picked = { uri?: string; name?: string; type?: string; size?: number | null }
type IconKey = 'success' | 'error' | 'info'

/** Purpose row extended with fee flags + fee_item_id (from v2 RPC) */
type PurposeWithFeeFlags = Purpose & {
  fee_item_id?: number
  current_amount: number
  exempt_ftj?: boolean
  exempt_senior?: boolean
  exempt_pwd?: boolean
  exempt_indigent?: boolean
  exempt_student?: boolean
}

/* ---------------- Consts ---------------- */
const SUBMIT_BAR_HEIGHT = 88
const BRAND = '#310101'
const BUSINESS_DOC_NAME = 'BARANGAY BUSINESS CLEARANCE'
const ICONS: Record<IconKey, any> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
}

/* ---------------- Helpers ---------------- */
const computeAge = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}
const isSenior = (age: number | null) => (age ?? -1) >= 60

function guessExt(mime?: string) {
  if (!mime) return '.jpg'
  if (mime.includes('pdf')) return '.pdf'
  if (mime.includes('png')) return '.png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'
  return '.jpg'
}

const programSet = (arr?: string[] | null) =>
  new Set((arr || []).map(s => String(s).toUpperCase()))

function mapToPersonMinimal(details: any): PersonMinimal {
  const fullName = details?.full_name ?? details?.details?.full_name ?? null

  const first_name =
    details?.first_name ?? details?.details?.first_name ?? (fullName || '')

  const middle_name =
    details?.middle_name ?? details?.details?.middle_name ?? null

  const last_name =
    details?.last_name ?? details?.details?.last_name ?? ''

  const composedAddress = [
    details?.haddress ?? details?.street_name ?? details?.street,
    details?.purok_sitio_name ?? details?.purok_sitio,
    details?.barangay_name ?? details?.barangay,
    details?.city_name ?? details?.city,
  ].filter(Boolean).join(', ')
  const address =
    composedAddress || details?.address || details?.details?.address || undefined

  const mobile_number =
    details?.mobile_num ??
    details?.mobile_number ??
    details?.mobile ??
    details?.contact_no ??
    details?.contact_number ??
    details?.details?.mobile_num ??
    null

  const rawEmp =
    details?.employment_status ?? details?.details?.employment_status ?? null

  const inferredStudent =
    (typeof details?.is_student === 'boolean' ? details.is_student
      : (typeof details?.details?.is_student === 'boolean' ? details.details.is_student
        : (String(rawEmp || '').toUpperCase() === 'STUDENT')))

  const govProgName =
    details?.gov_mem_prog_name ??
    details?.gov_program ??
    details?.government_program_name ??
    details?.government_program ??
    details?.gov_mem_prog ??
    details?.details?.gov_mem_prog_name ??
    (typeof details?.gov_mem_prog_id === 'number' ? `ID: ${details.gov_mem_prog_id}` : null)

  const government_programs: string[] | null =
    details?.government_programs ??
    details?.details?.government_programs ??
    null

  return {
    person_id: Number(details?.person_id ?? details?.details?.person_id ?? 0),
    first_name,
    middle_name,
    last_name,
    suffix: details?.suffix ?? details?.details?.suffix ?? null,
    sex: details?.sex ?? details?.details?.sex ?? null,
    birth_date: details?.birthdate ?? details?.details?.birthdate ?? null,
    mobile_number,
    email: details?.email ?? details?.details?.email ?? null,
    address,
    government_program: govProgName,
    government_programs,
    is_student: inferredStudent,
    employment_status: rawEmp,
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

function StatChip({ label, tone = 'neutral' as 'neutral' | 'ok' | 'warn' }) {
  const toneStyle =
    tone === 'ok' ? styles.chipOk :
      tone === 'warn' ? styles.chipWarn : styles.chipNeutral
  return (
    <View style={[styles.chip, toneStyle]}>
      <ThemedText small style={{ fontWeight: '700' }}>{label}</ThemedText>
    </View>
  )
}

/** Client-side hint (for banner chips only) */
function computeWaiverApplies(subject: PersonMinimal | null, purpose?: PurposeWithFeeFlags | null) {
  if (!subject || !purpose) return { applies: false, reasons: [] as string[] }
  const age = computeAge(subject.birth_date)
  const senior = isSenior(age)
  const student = !!(subject.is_student || (subject.employment_status || '').toUpperCase() === 'STUDENT')
  const progs = programSet(subject.government_programs)
  const hasFTJ = progs.has('FIRST TIME JOBSEEKER')
  const hasPWD = progs.has('PWD')
  const hasIND = progs.has('INDIGENT') || progs.has('NHTS')
  const f = {
    ftj: !!purpose.exempt_ftj, sen: !!purpose.exempt_senior,
    pwd: !!purpose.exempt_pwd, ind: !!purpose.exempt_indigent, stu: !!purpose.exempt_student,
  }
  const reasons: string[] = []
  if (f.sen && senior) reasons.push('Senior (60+)')
  if (f.stu && student) reasons.push('Student')
  if (f.ftj && hasFTJ) reasons.push('First Time Jobseeker')
  if (f.pwd && hasPWD) reasons.push('PWD')
  if (f.ind && hasIND) reasons.push('Indigent/NHTS')
  return { applies: reasons.length > 0, reasons }
}

function FeeRow({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <View style={styles.feeRow}>
      <View>
        <ThemedText muted>{title}</ThemedText>
        {!!sub && <ThemedText small muted>{sub}</ThemedText>}
      </View>
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

/* ---------------- Screen ---------------- */
export default function RequestDoc() {
  const router = useRouter()

  // target
  const [forWhom, setForWhom] = useState<'SELF' | 'OTHER'>('SELF')
  const [otherPerson, setOtherPerson] = useState<{ id: number | null; display: string | null }>({ id: null, display: null })
  const [otherPersonFull, setOtherPersonFull] = useState<PersonSearchRequest | null>(null)
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

  const [purposes, setPurposes] = useState<PurposeWithFeeFlags[]>([])
  const [purposeId, setPurposeId] = useState<number | null>(null)

  const [businesses, setBusinesses] = useState<BusinessLite[]>([])
  const [businessId, setBusinessId] = useState<number | null>(null)

  // qty/notes
  const [quantity, setQuantity] = useState<number>(1)
  const [purposeNotes, setPurposeNotes] = useState<string>('')

  // waiver preview (server-backed)
  const [exemptUnit, setExemptUnit] = useState<number>(0)
  const [waiverSource, setWaiverSource] = useState<'server' | 'ui' | null>(null)
  const [checkingWaiver, setCheckingWaiver] = useState<boolean>(false)

  // ui state
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState<{ visible: boolean; icon?: IconKey; title?: string; message?: string; primaryText?: string; onPrimary?: () => void }>({ visible: false })
  const showModal = (opts: Partial<typeof modal>) => setModal(p => ({ ...p, visible: true, ...opts }))
  const hideModal = () => setModal(p => ({ ...p, visible: false }))

  /* ---------- NEW: helper to detect business doc type ----------- */
  const isBusinessDocTypeName = (name?: string | null) => {
    const n = String(name || '').toUpperCase().trim()
    return n === BUSINESS_DOC_NAME || n.includes('BUSINESS CLEARANCE') || n.includes('BARANGAY BUSINESS')
  }

  // load lookups
  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const types = await getDocumentTypes()
        if (!live) return
        // EXCLUDE Barangay Business Clearance for residents
        setDocTypes((types || []).filter(t => !isBusinessDocTypeName(t.document_type_name)))
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
        const p = await getPurposesByDocumentType(documentTypeId) as any
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

  // DEFENSIVE: also filter when mapping to dropdown items
  const documentItems = useMemo(
    () =>
      docTypes
        .filter(dt => !isBusinessDocTypeName(dt.document_type_name))
        .map(dt => ({ label: dt.document_type_name, value: dt.document_type_id })),
    [docTypes]
  )
  const purposeItems = useMemo(
    () => purposes.map(p => ({ label: `${p.purpose_label}  •  ${peso(p.current_amount)}`, value: p.document_purpose_id })), [purposes]
  )
  const businessItems = useMemo(
    () => businesses.map(b => ({ label: b.business_name, value: b.business_id })), [businesses]
  )

  // Subject (SELF or OTHER)
  const subject: PersonMinimal | null = useMemo(() => {
    if (forWhom === 'SELF') return me
    return otherPersonFull ? mapToPersonMinimal(otherPersonFull as any) : null
  }, [forWhom, me, otherPersonFull])

  // Heuristic banner info
  const waiverHint = useMemo(() => computeWaiverApplies(subject, selectedPurpose), [subject, selectedPurpose])

  // SERVER: check waiver per-unit
  useEffect(() => {
    let live = true
    ;(async () => {
      setExemptUnit(0)
      setWaiverSource(null)
      if (!selectedPurpose || !subject?.person_id) return
      const feeItemId = Number(selectedPurpose.fee_item_id || 0)
      if (!feeItemId) {
        setWaiverSource(waiverHint.applies ? 'ui' : null)
        return
      }
      try {
        setCheckingWaiver(true)
        const ex = await computeExemptionAmount(
          subject.person_id,
          feeItemId,
          selectedPurpose.default_details ?? {}
        )
        if (!live) return
        setExemptUnit(Number(ex) || 0)
        setWaiverSource('server')
      } catch (e) {
        if (!live) return
        setExemptUnit(waiverHint.applies ? Number(selectedPurpose.current_amount || 0) : 0)
        setWaiverSource('ui')
      } finally {
        if (live) setCheckingWaiver(false)
      }
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject?.person_id, selectedPurpose?.document_purpose_id])

  // totals
  const unit = Number(selectedPurpose?.current_amount || 0)
  const qty = Math.max(1, Number(quantity || 1))
  const netUnit = Math.max(0, unit - (waiverSource ? exemptUnit : 0))
  const netTotal = netUnit * qty
  const estimatedDisplay = useMemo(() => checkingWaiver ? 'Checking…' : peso(netTotal), [netTotal, checkingWaiver])

  // validation
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
          quantity: qty,
          offense_no: selectedPurpose.default_offense_no ?? null,
          details: {
            purpose_code: (selectedPurpose as any).purpose_code,
            ...(authUploadPath ? { auth_letter_path: authUploadPath } : {}),
          },
        }],
      }

      const newId = await createDocumentRequest(payload as any)

      if (forWhom === 'OTHER' && authUploadPath) {
        await attachAuthorizationLetter({ doc_request_id: newId, file_path: authUploadPath })
      }

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
    const amount =
      netUnit === 0
        ? '₱0.00 (waived)'
        : `${peso(netUnit)} × ${qty} = ${peso(netTotal)}`
    return purp ? `${doc} • ${purp} • ${amount}` : `${doc}`
  }, [docTypes, documentTypeId, selectedPurpose, netUnit, netTotal, qty])

  /* ---------------- Render ---------------- */
  return (
    <ThemedView safe>
      <ThemedAppBar title="Request a Document" showNotif={false} showProfile={false} />

      {/* Progress */}
      <View style={styles.stepper}>
        {['Requester', 'Who is this for?', 'Document', 'Purpose & copies'].map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={styles.stepDot} />
            <ThemedText small muted numberOfLines={1} style={{ maxWidth: 98 }}>{s}</ThemedText>
            {i < 3 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>

      <ThemedKeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SUBMIT_BAR_HEIGHT + 28 }}
        enableOnAndroid extraScrollHeight={24} keyboardShouldPersistTaps="handled"
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

        {/* Who is this for? */}
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
                onSelect={async (p) => {
                  const id = Number(p.person_id)
                  setOtherPerson({ id, display: p.full_name })
                  setOtherPersonFull(p)
                  try {
                    const full = await getResidentFullProfile(id)
                    if (full) setOtherPersonFull(full as any)
                  } catch (e) {
                    console.log('[getResidentFullProfile] failed:', e)
                  }
                }}
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
              {!otherPerson.id && <ThemedText small style={styles.errorText}>Please choose a person.</ThemedText>}

              {otherPerson.id && (
                <>
                  <Spacer height={8} />
                  <Row label="Selected person" value={`${otherPerson.display} (ID: ${otherPerson.id})`} />
                  <Spacer height={12} />
                  <ThemedText weight="600">Authorization Letter</ThemedText>
                  <Spacer height={6} />
                  <AttachmentPicker
                    value={authLetter}
                    onChange={setAuthLetter}
                    placeholder="Upload a signed authorization letter (JPG/PNG)"
                  />
                </>
              )}
            </>
          )}
        </ThemedCard>

        {/* Subject Details */}
        <Spacer height={12} />
        <ThemedCard>
          <View style={[styles.cardHeaderRow, { marginBottom: 6 }]}>
            <RowTitle icon="id-card-outline" title="Subject Details" />
            {subject && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {/* SHOW ONLY WHEN TRUE */}
                {isSenior(computeAge(subject?.birth_date)) && (
                  <StatChip label="Senior (60+)" tone="ok" />
                )}
                {subject?.is_student && (
                  <StatChip label="Student" tone="ok" />
                )}
              </View>
            )}
          </View>

          {!subject ? (
            <ThemedText muted>
              {forWhom === 'SELF' ? 'Loading…' : 'Pick a person above to see their details.'}
            </ThemedText>
          ) : (
            <View style={styles.detailsWrap}>
              <Row label="Name" value={niceName(subject)} />
              <Row label="Mobile" value={subject.mobile_number || '—'} />
              <Row label="Birthdate" value={subject.birth_date || '—'} />
              <Row label="Address" value={subject.address || '—'} multiline />
              {!!subject.government_program && <Row label="Gov’t Program" value={subject.government_program} />}
              <Row label="Resident ID" value={subject.person_id} />
            </View>
          )}

          {/* Waiver guidance */}
          <Spacer height={10} />
          {selectedPurpose ? (
            (waiverHint.applies || (waiverSource === 'server' && exemptUnit > 0)) ? (
              <View style={styles.bannerOk}>
                <Ionicons name="pricetag-outline" size={18} color="#065f46" />
                <ThemedText style={styles.bannerText}>
                  Likely <ThemedText weight="800">WAIVED</ThemedText> for this document.
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {waiverHint.reasons.map(r => <StatChip key={r} label={r} tone="ok" />)}
                </View>
                <ThemedText small muted style={{ marginTop: 6 }}>
                  Treasurer will validate during review.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.bannerNeutral}>
                <Ionicons name="information-circle-outline" size={18} color="#334155" />
                <ThemedText style={styles.bannerText}>No automatic waiver detected for this purpose.</ThemedText>
              </View>
            )
          ) : (
            <View style={styles.bannerNeutral}>
              <Ionicons name="help-buoy-outline" size={18} color="#334155" />
              <ThemedText style={styles.bannerText}>Select a purpose to see waiver guidance.</ThemedText>
            </View>
          )}
        </ThemedCard>

        {/* Document & Purpose */}
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
          <FeeRow
            title="Estimated Fee"
            value={estimatedDisplay}
            sub={
              selectedPurpose
                ? (waiverSource
                    ? (netUnit === 0
                        ? `Base ${peso(unit)} × ${qty} − Waiver ${peso(exemptUnit)} × ${qty} = ₱0.00`
                        : `Base ${peso(unit)} − Waiver ${peso(exemptUnit)} = ${peso(netUnit)} • Qty ${qty}`)
                    : `Base ${peso(unit)} × ${qty}`)
                : undefined
            }
          />

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

          {/* Business picker (won't appear since doc type is excluded, but kept for safety if reused elsewhere) */}
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
          <ThemedText small muted>Final amount is confirmed by Treasurer. Waiver preview follows barangay policy.</ThemedText>
        </ThemedCard>
      </ThemedKeyboardAwareScrollView>

      {/* sticky footer */}
      <View style={styles.fadeTop} />
      <View style={styles.submitBar}>
        <View>
          <ThemedText small muted>Total Estimated Fee</ThemedText>
          <ThemedText weight="800" style={{ fontSize: 18 }}>{estimatedDisplay}</ThemedText>
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

function RowTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.iconPill}><Ionicons name={icon} size={16} color={BRAND} /></View>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
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

/* ---------------- Styles ---------------- */
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

  summaryChip: {
    marginHorizontal: 16, marginTop: 6, marginBottom: 2,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
    flexDirection: 'row', alignItems: 'center'
  },

  hintText: { marginTop: 6, color: '#6b7280' },
  errorText: { color: '#C0392B', marginTop: 6 },

  iconPill: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(49,1,1,0.08)', alignItems: 'center', justifyContent: 'center' },

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

  // Chips / banners
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1 },
  chipOk: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  chipWarn: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
  chipNeutral: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },

  bannerOk: {
    borderWidth: 1, borderColor: '#86efac', backgroundColor: '#f0fdf4',
    borderRadius: 12, padding: 10, marginTop: 4,
  },
  bannerNeutral: {
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    borderRadius: 12, padding: 10, marginTop: 4,
  },
  bannerText: { marginLeft: 6 },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalMsg: { textAlign: 'center', opacity: 0.8, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },
})
