// app/.../ReviewInputsProfile.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import {
  civilStatusMap,
  educAttainmentMap,
  empStatMap,
  genderMap,
  govProgMap,
  mnthlyPersonalIncomeMap,
  nationalityMap,
  religionMap,
} from '@/constants/formoptions'
import { profileResident, type ProfileResidentArgs } from '@/services/profiling'
import { useResidentFormStore } from '@/store/forms'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

function toYYYYMMDD(input?: unknown) {
  if (input === null || input === undefined) return ''
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const d = new Date(trimmed)
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    return trimmed
  }
  if (input instanceof Date) {
    if (!Number.isNaN(input.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0')
      return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`
    }
    return ''
  }
  const d = new Date(String(input))
  if (!Number.isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return String(input)
}

const toIntOrNull = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const toIntArray = (arr?: Array<string | number> | null): number[] => {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => Number(x)).filter((n) => Number.isFinite(n)) as number[]
}
const toNumberOrNull = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const parseGovCsvToIds = (csv?: string | null): number[] => {
  if (!csv) return []
  return csv
    .split(',')
    .map(s => Number(String(s).trim()))
    .filter(n => Number.isFinite(n))
}

const idsToLabels = (ids: number[]) => {
  if (!ids.length) return ['—']
  return ids.map(id => govProgMap[id] ?? String(id))
}

const ReviewInputsProfile = () => {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  // from /SocioeconomicInfo route param
  const { isStudent: isStudentParam } = useLocalSearchParams<{ isStudent?: string }>()
  const isStudent = isStudentParam === '1'

  // 🔔 NiceModal local state (with optional success callback)
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message?: string
    variant?: ModalVariant
    _onOk?: () => void
  }>({ visible: false, title: '', message: '', variant: 'info' })

  const openModal = (opts: { title: string; message?: string; variant?: ModalVariant; onOk?: () => void }) =>
    setModal({ visible: true, _onOk: opts.onOk, title: opts.title, message: opts.message, variant: opts.variant ?? 'info' })
  const closeModal = () => setModal((m) => ({ ...m, visible: false }))

  // Pull the entire draft from the in-memory store (includes relationships)
  const data = useResidentFormStore()
  const resetForm = useResidentFormStore((s) => s.reset)

  // Compute gov program labels from CSV stored in govprogrm
  const govIds = useMemo(() => parseGovCsvToIds(data.govprogrm), [data.govprogrm])
  const govLabels = useMemo(() => idsToLabels(govIds), [govIds])

  const handleSuccessOk = () => {
    closeModal()
    router.replace('/(bhw)/(tabs)/profiling')
  }

  const handleSubmit = async () => {
    const first = data.fname?.trim()
    const last = data.lname?.trim()
    const birthdate = toYYYYMMDD(data.dob)
    const mobile = data.mobnum?.trim() || null
    const email = data.email?.trim() || null

    if (!first || !last || !birthdate) {
      openModal({
        title: 'Missing required info',
        message: 'First, Last, and Date of Birth are required.',
        variant: 'warn',
      })
      return
    }

    // Show confirmation dialog first
    Alert.alert(
      'Confirm Submission',
      'Do you really want to add this resident profile?\n\nBy proceeding, you confirm that all information provided is factual, accurate, and complete. Incorrect data may affect service delivery and legal processes.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit Profile',
          style: 'default',
          onPress: async () => {
            try {
              setSubmitting(true)

              // TODO: replace with actual logged-in staff/BHW person_id
              const performerId = 5
              
              // Calculate residency period in months
              const residencyPeriod = (() => {
                const month = Number(data.residencyMonth)
                const year = Number(data.residencyYear)
                console.log('[ReviewInputs] Residency data:', { month, year, raw: { residencyMonth: data.residencyMonth, residencyYear: data.residencyYear } })
                if (!month || !year) return 0
                
                const now = new Date()
                const startDate = new Date(year, month - 1, 1)
                const yearsDiff = now.getFullYear() - startDate.getFullYear()
                const monthsDiff = now.getMonth() - startDate.getMonth()
                const totalMonths = yearsDiff * 12 + monthsDiff
                console.log('[ReviewInputs] Calculated residency period:', totalMonths, 'months')
                return totalMonths
              })()

              const payload: ProfileResidentArgs = {
                p_performer_id: performerId,

                p_last_name: last,
                p_first_name: first,
                p_middle_name: data.mname?.trim() || null,
                p_suffix: data.suffix?.trim() || null,

                p_birthdate: birthdate,
                p_email: email,
                p_mobile_num: mobile,
                p_residency_period: residencyPeriod,
                p_occupation: data.occupation?.trim() || '',

                p_sex_id: toIntOrNull(data.gender) ?? 0,
                p_civil_status_id: toIntOrNull(data.civilStatus) ?? 0,
                p_nationality_id: toIntOrNull(data.nationality) ?? 0,
                p_religion_id: toIntOrNull(data.religion) ?? 0,
                p_education_id: toIntOrNull(data.educattainment) ?? 0,
                p_employment_status_id: toIntOrNull(data.employmentstat) ?? 0,

                // NEW: send array (RPC expects integer[])
                p_gov_mem_prog_ids: govIds,
                // Optional legacy single-value (service will convert if only this is present)
                // p_gov_mem_prog_id: govIds[0],

                p_mnthly_personal_income_id: toIntOrNull(data.mnthlypersonalincome) ?? 0,

                // address
                // p_street: data.street?.trim() || '',
                // p_barangay: data.brgy?.trim() || '',
                // p_city: data.city?.trim() || '',
                // p_purok_sitio_name: data.purokSitio?.trim() || '',

                // // coords
                // p_latitude: toNumberOrNull(data.latitude),
                // p_longitude: toNumberOrNull(data.longitude),

                // relationships
                p_mother_person_id: toIntOrNull(data.motherId),
                p_father_person_id: toIntOrNull(data.fatherId),
                p_guardian_person_ids: toIntArray(data.guardianId ? [data.guardianId] : []),
                p_child_person_ids: toIntArray(data.childIds),

                // flags
                p_is_business_owner: false,
                p_is_email_verified: false,
                p_is_id_valid: false,
                // NEW: student flag now part of RPC
                p_is_student: !!isStudent,
              }

              await profileResident(payload)

              resetForm()
              openModal({
                title: 'Success',
                message: 'Resident profile submitted successfully.',
                variant: 'success',
                onOk: handleSuccessOk,
              })
            } catch (err: any) {
              openModal({
                title: 'Submission failed',
                message: err?.message ?? 'Unexpected error',
                variant: 'error',
              })
            } finally {
              setSubmitting(false)
            }
          }
        }
      ]
    )
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="Review Details" showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText title>Personal Information</ThemedText>

          <View style={styles.row}>
            <ThemedText subtitle>First Name:</ThemedText>
            <ThemedText subtitle>{data.fname}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Middle Name:</ThemedText>
            <ThemedText subtitle>{data.mname}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Last Name:</ThemedText>
            <ThemedText subtitle>{data.lname}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Suffix:</ThemedText>
            <ThemedText subtitle>{data.suffix}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Sex:</ThemedText>
            <ThemedText subtitle>{genderMap[data.gender as keyof typeof genderMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Date of Birth:</ThemedText>
            <ThemedText subtitle>{toYYYYMMDD(data.dob)}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Civil Status:</ThemedText>
            <ThemedText subtitle>{civilStatusMap[data.civilStatus as keyof typeof civilStatusMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Nationality:</ThemedText>
            <ThemedText subtitle>{nationalityMap[data.nationality as keyof typeof nationalityMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Religion:</ThemedText>
            <ThemedText subtitle>{religionMap[data.religion as keyof typeof religionMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Mobile Number:</ThemedText>
            <ThemedText subtitle>{data.mobnum}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Email Address:</ThemedText>
            <ThemedText subtitle>{data.email}</ThemedText>
          </View>

          <Spacer height={20} />
          <ThemedText title>Socioeconomic Information</ThemedText>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Educational Attainment:</ThemedText>
            <ThemedText subtitle>{educAttainmentMap[data.educattainment as keyof typeof educAttainmentMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Employment Status:</ThemedText>
            <ThemedText subtitle>{empStatMap[data.employmentstat as keyof typeof empStatMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Occupation:</ThemedText>
            <ThemedText subtitle>{data.occupation || '—'}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle>{mnthlyPersonalIncomeMap[data.mnthlypersonalincome as keyof typeof mnthlyPersonalIncomeMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.rowTopAligned}>
            <ThemedText subtitle>Government Programs:</ThemedText>
            <View style={{ flex: 1, marginLeft: 12 }}>
              {govLabels.map((lbl, i) => (
                <ThemedText key={i} subtitle>• {lbl}</ThemedText>
              ))}
            </View>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Are you still a student?</ThemedText>
            <ThemedText subtitle>{isStudent ? 'Yes' : 'No'}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Resident Since:</ThemedText>
            <ThemedText subtitle>
              {data.residencyMonth && data.residencyYear
                ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(data.residencyMonth) - 1]} ${data.residencyYear}`
                : '—'}
            </ThemedText>
          </View>

          <Spacer height={20} />
          <ThemedText title>Family Links</ThemedText>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Mother:</ThemedText>
            <ThemedText subtitle>{data.motherName || '—'}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Father:</ThemedText>
            <ThemedText subtitle>{data.fatherName || '—'}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Guardian:</ThemedText>
            <ThemedText subtitle>{data.guardianName || '—'}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.rowTopAligned}>
            <ThemedText subtitle>Children:</ThemedText>
            {data.childNames.length ? (
              <View style={styles.childList}>
                {data.childNames.map((name, idx) => (
                  <View key={data.childIds[idx] ?? idx} style={styles.childItem}>
                    <View style={styles.childBadge}>
                      <ThemedText non_btn style={styles.childBadgeText}>{idx + 1}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText subtitle>{name}</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <ThemedText subtitle>—</ThemedText>
            )}
          </View>
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit} disabled={submitting}>
            <ThemedText btn>{submitting ? 'Submitting…' : 'Submit'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      <NiceModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        primaryText="OK"
        onPrimary={() => { modal._onOk ? modal._onOk() : closeModal() }}
        onClose={closeModal}
      />
    </ThemedView>
  )
}

export default ReviewInputsProfile

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    paddingBottom: 8,
  },
  rowTopAligned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    paddingBottom: 8,
  },
  childList: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  childBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  childBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
})
