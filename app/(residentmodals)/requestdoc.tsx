// app/(residentmodals)/requestdoc.tsx
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'

import { documentOptions } from '@/constants/formoptions'
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { fetchResidentPlus } from '@/services/profile'
import { uploadToStorage } from '@/services/storage'

// ⬇️ Document-specific forms (unchanged)
import ClearanceAdult from './(docreq)/clearanceadult'
import ClearanceMinor from './(docreq)/clearanceminor'
import Death from './(docreq)/death'
import IndigencyAdult from './(docreq)/indigencyadult'
import IndigencyMinor from './(docreq)/indigencyminor'
import LowIncomeAdult from './(docreq)/lowincomeadult'
import LowIncomeMinor from './(docreq)/lowincomeminor'
import ResidencyAdult from './(docreq)/residencyadult'
import ResidencyMinor from './(docreq)/residencyminor'

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
}

const DOC_COMPONENTS: Record<string, React.FC> = {
  brgy_clearance_adult: ClearanceAdult,
  brgy_clearance_minor: ClearanceMinor,
  cert_death: Death,
  cert_indigency_adult: IndigencyAdult,
  cert_indigency_minor: IndigencyMinor,
  cert_lowincome_adult: LowIncomeAdult,
  cert_lowincome_minor: LowIncomeMinor,
  cert_residency_adult: ResidencyAdult,
  cert_residency_minor: ResidencyMinor,
}

// 🔁 Map purposes by document
const PURPOSE_BY_DOC: Record<string, { label: string; value: string }[]> = {
  brgy_clearance_adult: [
    { label: 'Employment', value: 'EMPLOYMENT' },
    { label: 'Lending / Bank', value: 'LENDING' },
    { label: 'Business', value: 'BUSINESS' },
    { label: 'Travel', value: 'TRAVEL' },
    { label: 'Others', value: 'OTHERS' },
  ],
  brgy_clearance_minor: [
    { label: 'School / Scholarship', value: 'SCHOOL' },
    { label: 'Travel', value: 'TRAVEL' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_residency_adult: [
    { label: 'Employment', value: 'EMPLOYMENT' },
    { label: 'Passport / Travel', value: 'TRAVEL' },
    { label: 'Government / Legal', value: 'GOVT' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_residency_minor: [
    { label: 'School / Scholarship', value: 'SCHOOL' },
    { label: 'Travel', value: 'TRAVEL' },
    { label: 'Government / Legal', value: 'GOVT' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_indigency_adult: [
    { label: 'Medical Assistance', value: 'MEDICAL' },
    { label: 'Financial Assistance', value: 'FINANCIAL' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_indigency_minor: [
    { label: 'School Assistance', value: 'SCHOOL' },
    { label: 'Medical Assistance', value: 'MEDICAL' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_lowincome_adult: [
    { label: 'Scholarship / Tuition', value: 'SCHOOL' },
    { label: 'Employment / HR', value: 'EMPLOYMENT' },
    { label: 'Government Aid', value: 'GOVT' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_lowincome_minor: [
    { label: 'School Fee Discount', value: 'SCHOOL' },
    { label: 'Government Aid', value: 'GOVT' },
    { label: 'Others', value: 'OTHERS' },
  ],
  cert_death: [
    { label: 'Insurance Claim', value: 'INSURANCE' },
    { label: 'Burial Assistance', value: 'BURIAL' },
    { label: 'Government / Legal', value: 'GOVT' },
    { label: 'Others', value: 'OTHERS' },
  ],
}

const DEFAULT_PURPOSES = [
  { label: 'Employment', value: 'EMPLOYMENT' },
  { label: 'Travel', value: 'TRAVEL' },
  { label: 'School / Scholarship', value: 'SCHOOL' },
  { label: 'Lending / Bank', value: 'LENDING' },
  { label: 'Business', value: 'BUSINESS' },
  { label: 'Others', value: 'OTHERS' },
]

type Picked = {
  uri?: string
  path?: string
  name?: string
  fileName?: string
  type?: string
}

const SUBMIT_BAR_HEIGHT = 78

export default function RequestDoc() {
  const router = useRouter()

  // 🔹 Selections
  const [document, setDocument] = useState<string>('')
  const [purpose, setPurpose] = useState<string>('')

  // 🔹 Request target
  const [forWhom, setForWhom] = useState<'SELF' | 'OTHER'>('SELF')
  const [otherPerson, setOtherPerson] = useState<{ id: number | null; display: string | null }>({
    id: null,
    display: null,
  })
  const [authLetter, setAuthLetter] = useState<Picked | null>(null)

  // 🔹 Requester details
  const [me, setMe] = useState<PersonMinimal | null>(null)
  const [loadingMe, setLoadingMe] = useState<boolean>(true)
  const [expandRequester, setExpandRequester] = useState(false)

  // 🔎 Person search hook for "others"
  const { searchPeople } = usePersonSearchByKey()

  // 🎯 Active doc form
  const SelectedDocument = useMemo(() => DOC_COMPONENTS[document] ?? null, [document])

  // 🎯 Dynamic purpose items
  const purposeItems = useMemo(() => {
    if (!document) return DEFAULT_PURPOSES
    return PURPOSE_BY_DOC[document] ?? DEFAULT_PURPOSES
  }, [document])

  // 🧾 Load requester details
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingMe(true)
        const profile = await fetchResidentPlus()
        if (mounted && profile) {
          const fullAddress =
            [
              profile?.haddress,
              profile?.street,
              profile?.purok_sitio,
              profile?.barangay,
              profile?.city,
            ]
              .filter(Boolean)
              .join(', ') || undefined

          setMe({
            person_id: profile.person_id,
            first_name: profile.first_name,
            middle_name: profile.middle_name,
            last_name: profile.last_name,
            suffix: profile.suffix,
            sex: profile.sex,
            birth_date: profile.birth_date,
            mobile_number: profile.mobile_number,
            email: profile.email,
            address: fullAddress,
          })
        }
      } catch {
        // keep UI resilient
      } finally {
        if (mounted) setLoadingMe(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // 🔄 Reset dependent fields
  useEffect(() => {
    setPurpose('') // clear purpose when doc changes
  }, [document])

  const niceName = (p?: PersonMinimal | null) => {
    if (!p) return '—'
    return [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(' ')
  }

  const hasInlineErrors = () => {
    if (!document) return 'Please select a document.'
    if (!purpose) return 'Please select a purpose.'
    if (forWhom === 'OTHER') {
      if (!otherPerson.id) return 'Please choose the person you are requesting for.'
      if (!authLetter?.uri && !authLetter?.path) return 'Please upload an authorization letter.'
    }
    return ''
  }

  const handleSubmit = async () => {
    const err = hasInlineErrors()
    if (err) return // errors are shown inline; no alert()

    let authUploadPath: string | null = null
    if (forWhom === 'OTHER') {
      try {
        const filePath = authLetter?.path || authLetter?.uri!
        const fileName = authLetter?.name || authLetter?.fileName || `auth_${Date.now()}.jpg`
        const { path } = await uploadToStorage('authorization-letters', filePath, fileName)
        authUploadPath = path
      } catch {
        // inline error display instead of alert
        return
      }
    }

    // TODO: Call your RPC to create the request
    // await create_document_request({ document, purpose, forWhom, otherPersonId: otherPerson.id, authUploadPath })

    router.push('/receipt')
  }

  const inlineError = hasInlineErrors()
  const estimatedFee = '₱60.00' // you can compute based on document/purpose later

  return (
    <ThemedView safe>
      <ThemedAppBar title="Request a Document" showNotif={false} showProfile={false} />
      <Spacer height={8} />
      <ThemedKeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SUBMIT_BAR_HEIGHT + 24 }}
        enableOnAndroid
        extraScrollHeight={24}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepPill}>
          <ThemedText small muted>Step 1 of 3</ThemedText>
        </View>

        <Spacer height={100} />

        {/* 1) Requester details */}
        <ThemedCard>
          <View style={styles.cardHeaderRow}>
            <ThemedText style={styles.sectionTitle}>Requester Details</ThemedText>
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
            expandRequester ? (
              <View style={styles.detailsWrap}>
                <Row label="Name" value={niceName(me)} />
                <Row label="Sex" value={me.sex || '—'} />
                <Row label="Birthdate" value={me.birth_date || '—'} />
                <Row label="Mobile" value={me.mobile_number || '—'} />
                <Row label="Email" value={me.email || '—'} />
                <Row label="Address" value={me.address || '—'} multiline />
              </View>
            ) : (
              <View style={styles.detailsWrap}>
                <Row label="Name" value={niceName(me)} />
                <Row label="Address" value={me.address || '—'} multiline />
              </View>
            )
          ) : (
            <ThemedText muted>Couldn’t load your details. You can still proceed.</ThemedText>
          )}
        </ThemedCard>

        <Spacer height={14} />

        {/* 2) Document + Purpose */}
        <ThemedCard>
          <ThemedText style={styles.sectionTitle}>Document & Purpose</ThemedText>
          <Spacer height={8} />

          <ThemedDropdown
            items={documentOptions}
            value={document}
            setValue={(v: string) => setDocument(v)}
            placeholder="Select Document Type"
            order={0}
          />
          {(!document && inlineError) ? (
            <ThemedText small style={styles.errorText}>Please select a document.</ThemedText>
          ) : null}

          <Spacer height={10} />

          <ThemedDropdown
            items={purposeItems}
            value={purpose}
            setValue={(v: string) => setPurpose(v)}
            placeholder="Select Purpose"
            order={1}
          />
          {(!purpose && inlineError) ? (
            <ThemedText small style={styles.errorText}>Please select a purpose.</ThemedText>
          ) : null}
        </ThemedCard>

        <Spacer height={14} />

        {/* 3) Who is this for? */}
        <ThemedCard>
          <View style={styles.cardHeaderRow}>
            <ThemedText style={styles.sectionTitle}>Who is this for?</ThemedText>
            <ThemedText small muted>{forWhom}</ThemedText>
          </View>
          <Spacer height={8} />

          <ThemedRadioButton
            options={[
              { label: 'For myself', value: 'SELF' },
              { label: 'For someone else', value: 'OTHER' },
            ]}
            value={forWhom}
            onChange={(v: 'SELF' | 'OTHER') => setForWhom(v)}
          />

          {forWhom === 'OTHER' && (
            <>
              <Spacer height={10} />
              <ThemedText weight="600">Find the person</ThemedText>
              <Spacer height={6} />

              <ThemedSearchSelect
                placeholder="Search by name or ID"
                onSearch={async (q: string) => {
                  const res = await searchPeople({ key: q })
                  return (res || []).map((r: any) => ({
                    label: [r.first_name, r.middle_name, r.last_name, r.suffix].filter(Boolean).join(' '),
                    value: r.person_id,
                  }))
                }}
                onSelect={(opt: { label: string; value: number }) =>
                  setOtherPerson({ id: opt.value, display: opt.label })
                }
              />
              {!otherPerson.id && inlineError ? (
                <ThemedText small style={styles.errorText}>Please choose a person.</ThemedText>
              ) : null}

              {otherPerson.id ? (
                <>
                  <Spacer height={8} />
                  <Row label="Selected person" value={otherPerson.display || '—'} />
                </>
              ) : null}

              <Spacer height={14} />
              <ThemedText weight="600">Authorization Letter</ThemedText>
              <Spacer height={6} />
              <ThemedFileInput
                placeholder="Upload a signed authorization letter (JPG/PNG/PDF)"
                onPick={(file: Picked) => setAuthLetter(file)}
              />
              {authLetter?.name || authLetter?.fileName ? (
                <>
                  <Spacer height={6} />
                  <View style={styles.fileChip}>
                    <ThemedText small weight="600">{authLetter.name || authLetter.fileName}</ThemedText>
                    <TouchableOpacity onPress={() => setAuthLetter(null)}>
                      <ThemedText small muted> ✕ </ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
              {(!authLetter?.uri && !authLetter?.path && inlineError) ? (
                <ThemedText small style={styles.errorText}>Authorization letter is required.</ThemedText>
              ) : null}
            </>
          )}
        </ThemedCard>

        {/* 4) Document-specific form */}
        {SelectedDocument ? (
          <>
            <Spacer height={14} />
            <ThemedCard>
              <ThemedText style={styles.sectionTitle}>Details Required</ThemedText>
              <Spacer height={8} />
              <SelectedDocument />
            </ThemedCard>
          </>
        ) : null}

        <Spacer height={24} />
      </ThemedKeyboardAwareScrollView>

      {/* Sticky submit bar */}
      <View style={styles.submitBar}>
        <View>
          <ThemedText small muted>Total Estimated Fee</ThemedText>
          <ThemedText weight="700">{estimatedFee}</ThemedText>
        </View>
        <ThemedButton onPress={handleSubmit} disabled={!!inlineError}>
          <ThemedText btn>Submit Request</ThemedText>
        </ThemedButton>
      </View>
    </ThemedView>
  )
}

const Row = ({
  label,
  value,
  multiline,
}: {
  label: string
  value?: string | number | null
  multiline?: boolean
}) => (
  <View style={[styles.row, multiline && { alignItems: 'flex-start' }]}>
    <ThemedText muted style={styles.rowLabel}>
      {label}
    </ThemedText>
    <ThemedText style={[styles.rowValue, multiline && { flexShrink: 1 }]}>{value || '—'}</ThemedText>
  </View>
)

const styles = StyleSheet.create({
  stepPill: {
    alignSelf: 'flex-start',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Platform.select({ ios: '#F2F2F7', android: '#F3F4F6', default: '#F3F4F6' }),
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsWrap: {
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 8,
  },
  rowLabel: {
    width: 120,
  },
  rowValue: {
    flex: 1,
  },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  errorText: {
    color: '#C0392B',
    marginTop: 6,
  },
  submitBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SUBMIT_BAR_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})
