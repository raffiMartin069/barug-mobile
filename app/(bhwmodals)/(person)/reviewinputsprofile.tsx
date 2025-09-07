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
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

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

/** Normalize single ID to integer or null (DB wants integer|null) */
const toIntOrNull = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** Normalize an array of IDs into integer[] (DB wants integer[]) */
const toIntArray = (arr?: Array<string | number> | null): number[] => {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => Number(x)).filter((n) => Number.isFinite(n)) as number[]
}

/** Normalize numeric input to number|null (for latitude/longitude) */
const toNumberOrNull = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const ReviewInputsProfile = () => {
  const [submitting, setSubmitting] = useState(false)

  // 🔔 NiceModal local state
  const [modal, setModal] = useState<{
    visible: boolean
    title: string
    message?: string
    variant?: ModalVariant
  }>({ visible: false, title: '', message: '', variant: 'info' })

  const openModal = (opts: { title: string; message?: string; variant?: ModalVariant }) =>
    setModal({ visible: true, ...opts })
  const closeModal = () => setModal((m) => ({ ...m, visible: false }))

  // Pull the entire draft from the in-memory store (includes relationships)
  const data = useResidentFormStore()

  const handleSubmit = async () => {
    try {
      setSubmitting(true)

      const first = data.fname?.trim()
      const last = data.lname?.trim()
      const birthdate = toYYYYMMDD(data.dob)
      const mobile = data.mobnum?.trim()
      const email = data.email?.trim() || null // DB accepts text|null

      if (!first || !last || !birthdate || !mobile) {
        openModal({
          title: 'Missing required info',
          message: 'First, Last, Date of Birth, and Mobile are required.',
          variant: 'warn',
        })
        return
      }

      // TODO: replace with actual logged-in staff/BHW person_id
      const performerId = 5
      const residencyPeriod = 0

      console.log("MOTHER ID: ", data.motherId)
      console.log("FATHER ID: ", data.fatherId)
      console.log("GUARDIAN ID: ", data.guardianId)
      
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

        // lookups -> integer (use selected gender id; no hardcode)
        p_sex_id: toIntOrNull(data.gender) ?? 0,
        p_civil_status_id: toIntOrNull(data.civilStatus) ?? 0,
        p_nationality_id: toIntOrNull(data.nationality) ?? 0,
        p_religion_id: toIntOrNull(data.religion) ?? 0,
        p_education_id: toIntOrNull(data.educattainment) ?? 0,
        p_employment_status_id: toIntOrNull(data.employmentstat) ?? 0,
        p_gov_mem_prog_id: toIntOrNull(data.govprogrm) ?? 0,
        p_mnthly_personal_income_id: toIntOrNull(data.mnthlypersonalincome) ?? 0,

        // address
        p_street: data.street?.trim() || '',
        p_barangay: data.brgy?.trim() || '',
        p_city: data.city?.trim() || '',
        p_purok_sitio_name: data.purokSitio?.trim() || '',

        // coords (numeric|null)
        p_latitude: toNumberOrNull(data.latitude),
        p_longitude: toNumberOrNull(data.longitude),

        // relationships (ids must be integer or null / integer[])
        p_mother_person_id: toIntOrNull(data.motherId),
        p_father_person_id: toIntOrNull(data.fatherId),

        // ✅ single guardian -> send as 0 or [id] depending on your RPC contract
        // ProfileResidentArgs expects integer[], so pass [] or [guardianId]
        p_guardian_person_ids: toIntArray(data.guardianId ? [data.guardianId] : []),

        p_child_person_ids: toIntArray(data.childIds),

        // flags
        p_is_business_owner: false,
        p_is_email_verified: false,
        p_is_id_valid: false,
      }
      console.log("DEBUG payload: ", payload)
      await profileResident(payload)

      openModal({
        title: 'Success',
        message: 'Resident profile submitted successfully.',
        variant: 'success',
      })
      // Optionally clear the draft:
      // useResidentFormStore.getState().reset()
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
            <ThemedText subtitle>Street:</ThemedText>
            <ThemedText subtitle>{data.street}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Purok / Sitio:</ThemedText>
            <ThemedText subtitle>{data.purokSitio}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Barangay:</ThemedText>
            <ThemedText subtitle>{data.brgy}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>City:</ThemedText>
            <ThemedText subtitle>{data.city}</ThemedText>
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
            <ThemedText subtitle>{data.occupation}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle>{mnthlyPersonalIncomeMap[data.mnthlypersonalincome as keyof typeof mnthlyPersonalIncomeMap]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Government Program:</ThemedText>
            <ThemedText subtitle>{govProgMap[data.govprogrm as keyof typeof govProgMap]}</ThemedText>
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

          {/* ✅ Single guardian */}
          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle>Guardian:</ThemedText>
            <ThemedText subtitle>{data.guardianName || '—'}</ThemedText>
          </View>

          {/* Children list */}
          <Spacer height={10} />
          <View style={styles.rowTopAligned}>
            <ThemedText subtitle>Children:</ThemedText>

            {data.childNames.length ? (
              <View style={styles.childList}>
                {data.childNames.map((name, idx) => (
                  <View
                    key={data.childIds[idx] ?? idx}
                    style={styles.childItem}
                  >
                    <View style={styles.childBadge}>
                      <ThemedText non_btn style={styles.childBadgeText}>
                        {idx + 1}
                      </ThemedText>
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

      {/* 🟢 NiceModal */}
      <NiceModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        primaryText="OK"
        onPrimary={closeModal}
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
