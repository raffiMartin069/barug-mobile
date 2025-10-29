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
import * as WebBrowser from 'expo-web-browser'
import * as ExpoLinking from 'expo-linking'
import Constants from 'expo-constants'

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

// NEW: tiny client for PayMongo endpoints
import { startDocCheckout, confirmDocPayment } from '@/services/payments'


// make the auth session handoff work on iOS/Android
WebBrowser.maybeCompleteAuthSession();

// helper to open PayMongo checkout for a doc request
async function startOnlineCheckout(docId: number) {
  console.log('🌐 Starting online checkout for doc ID:', docId)
  const API_BASE = (Constants.expoConfig?.extra as any)?.API_BASE_URL;
  console.log('🔗 API_BASE:', API_BASE)
  if (!API_BASE) throw new Error('Missing API_BASE_URL in app.json "extra".');

  // Deep link back into the app to the Receipt screen
  const returnTo = ExpoLinking.createURL('/(residentmodals)/receipt', {
    queryParams: { id: String(docId) },
  });

  // Your own success page will redirect to `return_to` (below)
  const successUrl = `${API_BASE}/payments/success?doc_id=${docId}&return_to=${encodeURIComponent(returnTo)}`;

  const r = await fetch(`${API_BASE}/payments/api/docs/${docId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success_url: successUrl }),
  });
  const j = await r.json();
  if (!r.ok || !j?.checkout_url) {
    throw new Error(j?.error || `Checkout failed (HTTP ${r.status})`);
  }

  // Open in an auth session. When the success page redirects to `returnTo`,
  // the browser view will auto-close and control returns here.
  const result = await WebBrowser.openAuthSessionAsync(j.checkout_url, returnTo);

  // Extra safety: if the browser closed without handing back a URL,
  // we still try to confirm and navigate.
  if (result.type === 'success' || result.type === 'dismiss') {
    try { await confirmDocPayment(docId, { dev: true }); } catch {}
    // Navigate to receipt (works even if deep link already did it)
    // No-op if you're already there.
  }
}

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
  const first_name = details?.first_name ?? details?.details?.first_name ?? (fullName || '')
  const middle_name = details?.middle_name ?? details?.details?.middle_name ?? null
  const last_name = details?.last_name ?? details?.details?.last_name ?? ''
  const composedAddress = [
    details?.haddress ?? details?.street_name ?? details?.street,
    details?.purok_sitio_name ?? details?.purok_sitio,
    details?.barangay_name ?? details?.barangay,
    details?.city_name ?? details?.city,
  ].filter(Boolean).join(', ')
  const address = composedAddress || details?.address || details?.details?.address || undefined
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
    details?.government_programs ?? details?.details?.government_programs ?? null

  return {
    person_id: Number(details?.person_id ?? details?.details?.person_id ?? 0),
    first_name, middle_name, last_name,
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

  // NEW: pay choice
  const [payChoice, setPayChoice] = useState<'ONLINE' | 'CASH'>('ONLINE')

  // deep-link handler: confirm + go to receipt
  useEffect(() => {
    async function handleUrl(url: string) {
      try {
        const parsed = ExpoLinking.parse(url)
        const path = (parsed.path || '').toLowerCase()
        const qp = (parsed.queryParams || {}) as Record<string, any>
        const docId = Number(qp.doc_id || qp.id || 0)
        if (path.includes('payments') && path.includes('success') && docId > 0) {
          // ask server to finalize (idempotent; DEV can bypass with ?dev=1)
          try { await confirmDocPayment(docId, { dev: true }) } catch {}
          router.replace({ pathname: '/(residentmodals)/receipt', params: { id: String(docId) } })
        }
      } catch { /* ignore */ }
    }
    // foreground events
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url))
    // cold start
    Linking.getInitialURL().then(u => { if (u) handleUrl(u) })
    return () => sub.remove()
  }, [router])

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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [modal, setModal] = useState<{ visible: boolean; icon?: IconKey; title?: string; message?: string; primaryText?: string; onPrimary?: () => void }>({ visible: false })
  const showModal = (opts: Partial<typeof modal>) => setModal(p => ({ ...p, visible: true, ...opts }))
  const hideModal = () => setModal(p => ({ ...p, visible: false }))

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

  const selectedPurpose = useMemo(
    () => purposes.find(p => p.document_purpose_id === (purposeId ?? -1)),
    [purposes, purposeId]
  )
  const offenseNo = selectedPurpose?.default_offense_no ?? null

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

  const subject: PersonMinimal | null = useMemo(() => {
    if (forWhom === 'SELF') return me
    return otherPersonFull ? mapToPersonMinimal(otherPersonFull as any) : null
  }, [forWhom, me, otherPersonFull])

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
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    console.log('🔄 handleConfirmSubmit called')
    console.log('📋 Current state:', {
      payChoice,
      documentTypeId,
      purposeId,
      forWhom,
      otherPersonId: otherPerson.id,
      authLetterUri: authLetter?.uri,
      mePersonId: me?.person_id,
      selectedPurpose: selectedPurpose?.document_purpose_id
    })
    
    setShowConfirmModal(false)
    console.log('✅ Modal closed, starting submission...')

    setSubmitting(true)
    console.log('🚀 Submission started, submitting state set to true')
    let authUploadPath: string | null = null

    if (forWhom === 'OTHER' && authLetter?.uri) {
      console.log('📎 Uploading auth letter...')
      try {
        const fileName = authLetter.name || `auth_${Date.now()}${guessExt(authLetter.type)}`
        const { path } = await uploadAuthLetter(authLetter.uri!, fileName, {
          personId: Number(me?.person_id) || undefined,
          upsert: true,
        })
        authUploadPath = path
        console.log('✅ Auth letter uploaded:', path)
      } catch (e) {
        console.log('❌ Auth letter upload failed:', e)
        setSubmitting(false)
        showModal({ icon: 'error', title: 'Upload failed', message: 'Please try uploading the authorization letter again.' })
        return
      }
    }

    try {
      const requesterId = Number(me?.person_id)
      const subjectId = forWhom === 'SELF' ? requesterId : Number(otherPerson.id)
      console.log('🔍 IDs resolved:', { requesterId, subjectId, selectedPurposeId: selectedPurpose?.document_purpose_id })
      
      if (!requesterId || !subjectId || !selectedPurpose) {
        console.log('❌ Missing required data:', { requesterId, subjectId, selectedPurpose: !!selectedPurpose })
        throw new Error('Could not resolve IDs or purpose.')
      }

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

      console.log('📤 Creating document request with payload:', payload)
      const newId = await createDocumentRequest(payload as any)
      console.log('✅ Document request created with ID:', newId)

      // → ONLINE: start PayMongo, then deep-link back
      if (payChoice === 'ONLINE') {
        console.log('💳 Starting online checkout for doc ID:', newId)
        await startOnlineCheckout(newId)
        console.log('🔄 Online checkout initiated, returning...')
        return // the user will be taken to PayMongo, then to the success page, then back to the app
      }


      // → CASH AT BARANGAY: normal success
      console.log('💰 Cash payment selected, showing success modal')
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
      console.log('❌ Submission failed:', e)
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

      <ThemedKeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SUBMIT_BAR_HEIGHT + 28 }}
        enableOnAndroid extraScrollHeight={24} keyboardShouldPersistTaps="handled"
      >
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
                        ? `Base ${peso(unit)} × ${qty} − Waiver ${peso(exemptUnit)} × ${qty}`
                        : `Base ${peso(unit)} − Waiver ${peso(exemptUnit)} = ${peso(netUnit)}`)
                    : `Base ${peso(unit)} × ${qty}`)
                : undefined
            }
          />

          {/* Payment Method Selection */}
          <Spacer height={16} />
          <ThemedText weight="600" style={{ marginBottom: 12 }}>Payment Method</ThemedText>
          
          <View style={styles.paymentContainer}>
            <TouchableOpacity 
              style={[styles.paymentOption, payChoice === 'ONLINE' && styles.paymentOptionSelected]}
              onPress={() => setPayChoice('ONLINE')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name="card" size={24} color="#00d632" />
              </View>
              <View style={styles.paymentInfo}>
                <ThemedText weight="700" style={styles.paymentTitle}>GCash</ThemedText>
                {/* <ThemedText small style={styles.paymentSubtitle}>Instant & secure</ThemedText> */}
              </View>
              <View style={styles.recommendedBadge}>
                <ThemedText small weight="600" style={{ color: '#059669' }}>RECOMMENDED</ThemedText>
              </View>
              <View style={[styles.paymentRadio, payChoice === 'ONLINE' && styles.paymentRadioSelected]}>
                {payChoice === 'ONLINE' && <View style={styles.paymentRadioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentOption, payChoice === 'CASH' && styles.paymentOptionSelected]}
              onPress={() => setPayChoice('CASH')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentIcon}>
                <Ionicons name="business" size={24} color="#6b7280" />
              </View>
              <View style={styles.paymentInfo}>
                <ThemedText weight="700" style={styles.paymentTitle}>Pay at Office</ThemedText>
                <ThemedText small style={styles.paymentSubtitle}>Visit barangay hall</ThemedText>
              </View>
              <View style={[styles.paymentRadio, payChoice === 'CASH' && styles.paymentRadioSelected]}>
                {payChoice === 'CASH' && <View style={styles.paymentRadioDot} />}
              </View>
            </TouchableOpacity>
          </View>

          <Spacer height={12} />
          {/* <ThemedText weight="600">Copies</ThemedText>
          <Spacer height={6} />
          <QuantityPicker value={quantity} onChange={setQuantity} /> */}

          <Spacer height={12} />
          <ThemedText weight="600">Notes to Treasurer/Clerk (optional)</ThemedText>
          <Spacer height={6} />
          <ThemedTextInput
            value={purposeNotes}
            onChangeText={setPurposeNotes}
            placeholder="E.g., need before Friday"
            multiline
          />

          {/* Safety: Business picker (won’t show because business doc is filtered out) */}
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

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModalCard}>
            {/* Header with gradient background */}
            <View style={styles.confirmHeader}>
              <View style={styles.confirmIconContainer}>
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="shield-checkmark" size={32} color="#fff" />
                </View>
              </View>
              <ThemedText style={styles.confirmTitle}>Review & Confirm</ThemedText>
              <ThemedText style={styles.confirmSubtitle}>Please verify your request details</ThemedText>
            </View>
            
            {/* Details Card */}
            <View style={styles.confirmDetailsCard}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="document-outline" size={18} color="#6366f1" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Document Type</ThemedText>
                  <ThemedText style={styles.detailValue}>{docTypes.find(d => d.document_type_id === documentTypeId)?.document_type_name}</ThemedText>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="flag-outline" size={18} color="#8b5cf6" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Purpose</ThemedText>
                  <ThemedText style={styles.detailValue}>{selectedPurpose?.purpose_label}</ThemedText>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="person-outline" size={18} color="#06b6d4" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Requesting for</ThemedText>
                  <ThemedText style={styles.detailValue}>{forWhom === 'SELF' ? 'Myself' : otherPerson.display}</ThemedText>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name={payChoice === 'ONLINE' ? 'card-outline' : 'business-outline'} size={18} color={payChoice === 'ONLINE' ? '#10b981' : '#f59e0b'} />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Payment Method</ThemedText>
                  <View style={styles.paymentBadgeContainer}>
                    <View style={[styles.paymentBadge, payChoice === 'ONLINE' ? styles.paymentBadgeOnline : styles.paymentBadgeCash]}>
                      <ThemedText style={[styles.paymentBadgeText, payChoice === 'ONLINE' ? styles.paymentBadgeTextOnline : styles.paymentBadgeTextCash]}>
                        {payChoice === 'ONLINE' ? 'GCash' : 'Pay at Office'}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Total Amount Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalIconWrap}>
                <Ionicons name="wallet" size={20} color="#310101" />
              </View>
              <View style={styles.totalContent}>
                <ThemedText style={styles.totalLabel}>Total Amount</ThemedText>
                <ThemedText style={styles.totalValue}>{estimatedDisplay}</ThemedText>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.confirmActions}>
              <Pressable 
                style={[styles.cancelBtn, submitting && styles.cancelBtnDisabled]} 
                onPress={() => setShowConfirmModal(false)} 
                disabled={submitting}
              >
                <ThemedText style={[styles.cancelBtnText, submitting && styles.cancelBtnTextDisabled]}>Cancel</ThemedText>
              </Pressable>
              
              <Pressable 
                style={[styles.proceedBtn, submitting && styles.proceedBtnLoading]} 
                onPress={handleConfirmSubmit} 
                disabled={submitting}
              >
                {submitting ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <ThemedText style={styles.proceedBtnText}>Processing...</ThemedText>
                  </View>
                ) : (
                  <View style={styles.proceedContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <ThemedText style={styles.proceedBtnText}>Proceed</ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  // Confirmation Modal Styles
  confirmModalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    margin: 20,
    maxWidth: 380,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    overflow: 'hidden',
  },
  confirmHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    position: 'relative',
  },
  confirmIconContainer: {
    marginBottom: 16,
  },
  confirmIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmDetailsCard: {
    padding: 24,
    backgroundColor: '#fff',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 22,
  },
  paymentBadgeContainer: {
    marginTop: 2,
  },
  paymentBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  paymentBadgeOnline: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  paymentBadgeCash: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  paymentBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  paymentBadgeTextOnline: {
    color: '#065f46',
  },
  paymentBadgeTextCash: {
    color: '#92400e',
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#310101',
    shadowColor: '#310101',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  totalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalContent: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#310101',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnDisabled: {
    opacity: 0.5,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  cancelBtnTextDisabled: {
    color: '#94a3b8',
  },
  proceedBtn: {
    flex: 2,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#310101',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#310101',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  proceedBtnLoading: {
    backgroundColor: '#52525b',
  },
  proceedBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proceedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  detailsWrap: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  rowLabel: { width: 120, color: '#6b7280' },
  rowValue: { flex: 1 },

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

  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1 },
  chipOk: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  chipWarn: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
  chipNeutral: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },

  bannerOk: { borderWidth: 1, borderColor: '#86efac', backgroundColor: '#f0fdf4', borderRadius: 12, padding: 10, marginTop: 4 },
  bannerNeutral: { borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10, marginTop: 4 },
  bannerText: { marginLeft: 6 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalMsg: { textAlign: 'center', opacity: 0.8, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },

  paymentContainer: {
    gap: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  paymentSubtitle: {
    color: '#6b7280',
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  paymentRadioSelected: {
    borderColor: '#059669',
  },
  paymentRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  recommendedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
})
