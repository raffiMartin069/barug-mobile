<<<<<<< HEAD
=======
// app/.../ReviewInputsProfile.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal'
>>>>>>> origin/develop
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
<<<<<<< HEAD
import { civilStatusMap, educAttainmentMap, empStatMap, genderMap, govProgMap, mnthlyPersonalIncomeMap, nationalityMap, religionMap } from '@/constants/formOptions'
import { useSearchParams } from 'expo-router/build/hooks'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const ReviewInputsProfile = () => {
  const params = useSearchParams()
  const data = Object.fromEntries(params.entries())

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
            title='Review Details'
            showNotif={false}
            showProfile={false}
        />

        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedText title={true}>Personal Information</ThemedText>
                <View style={styles.row}>
                    <ThemedText subtitle={true}>First Name:</ThemedText>
                    <ThemedText subtitle={true}>{data.fname}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Middle Name:</ThemedText>
                    <ThemedText subtitle={true}>{data.mname}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Last Name:</ThemedText>
                    <ThemedText subtitle={true}>{data.lname}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Suffix:</ThemedText>
                    <ThemedText subtitle={true}>{data.suffix}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Sex:</ThemedText>
                    <ThemedText subtitle={true}>{genderMap[data.gender]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Date of Birth:</ThemedText>
                    <ThemedText subtitle={true}>{data.dob}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Suffix:</ThemedText>
                    <ThemedText subtitle={true}>{data.suffix}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Civil Status:</ThemedText>
                    <ThemedText subtitle={true}>{civilStatusMap[data.civilStatus]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Nationality:</ThemedText>
                    <ThemedText subtitle={true}>{nationalityMap[data.nationality]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Religion:</ThemedText>
                    <ThemedText subtitle={true}>{religionMap[data.religion]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Street:</ThemedText>
                    <ThemedText subtitle={true}>{data.street}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Purok / Sitio:</ThemedText>
                    <ThemedText subtitle={true}>{data.purokSitio}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Barangay:</ThemedText>
                    <ThemedText subtitle={true}>{data.brgy}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>City:</ThemedText>
                    <ThemedText subtitle={true}>{data.city}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Mobile Number:</ThemedText>
                    <ThemedText subtitle={true}>{data.mobnum}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Email Address:</ThemedText>
                    <ThemedText subtitle={true}>{data.email}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Password:</ThemedText>
                    <ThemedText subtitle={true}>{data.password}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Confirm Password:</ThemedText>
                    <ThemedText subtitle={true}>{data.cpassword}</ThemedText>
                </View>

                <Spacer height={20}/>

                <ThemedText title={true}>Socioeconomic Information</ThemedText>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Educational Attainment:</ThemedText>
                    <ThemedText subtitle={true}>{educAttainmentMap[data.educattainment]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Employment Status:</ThemedText>
                    <ThemedText subtitle={true}>{empStatMap[data.employmentstat]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Occupation:</ThemedText>
                    <ThemedText subtitle={true}>{data.occupation}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Monthly Personal Income:</ThemedText>
                    <ThemedText subtitle={true}>{mnthlyPersonalIncomeMap[data.mnthlypersonalincome]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Government Program:</ThemedText>
                    <ThemedText subtitle={true}>{govProgMap[data.govprogrm]}</ThemedText>
                </View>
            </View>

            <Spacer height={15}/>

            <View>
                <ThemedButton>
                    <ThemedText btn={true}>Submit</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>

    </ThemedView>
  )
=======
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

function toYYYYMMDD(input?: string) {
    if (!input) return ''
    const trimmed = String(input).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
    const d = new Date(trimmed)
    if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    }
    return trimmed
}

const ReviewInputsProfile = () => {
    const [submitting, setSubmitting] = useState(false)

    const toNumOrNull = (v?: string | number | null) => {
        if (v === null || v === undefined || v === '') return null
        const n = Number(v)
        return Number.isFinite(n) ? n : null
    }

    // 🔔 NiceModal local state
    const [modal, setModal] = useState<{
        visible: boolean
        title: string
        message?: string
        variant?: ModalVariant
    }>({ visible: false, title: '', message: '', variant: 'info' })

    const openModal = (opts: { title: string; message?: string; variant?: ModalVariant }) =>
        setModal({ visible: true, ...opts })
    const closeModal = () => setModal(m => ({ ...m, visible: false }))

    // Pull the entire draft from the in-memory store
    const data = useResidentFormStore()

    const handleSubmit = async () => {
        try {
            setSubmitting(true)

            const first = data.fname?.trim()
            const last = data.lname?.trim()
            const birthdate = toYYYYMMDD(data.dob)
            const mobile = data.mobnum?.trim()
            const email = data.email?.trim()

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

            const payload: ProfileResidentArgs = {
                p_performer_id: performerId,
                p_last_name: last,
                p_first_name: first,
                p_middle_name: data.mname?.trim() || null,
                p_suffix: data.suffix?.trim() || null,
                p_birthdate: birthdate,
                p_email: email || null,
                p_mobile_num: mobile,
                p_residency_period: residencyPeriod,
                p_occupation: data.occupation?.trim() || '',
                p_sex_id: Number(data.gender) || 0,
                p_civil_status_id: Number(data.civilStatus) || 0,
                p_nationality_id: Number(data.nationality) || 0,
                p_religion_id: Number(data.religion) || 0,
                p_education_id: Number(data.educattainment) || 0,
                p_employment_status_id: Number(data.employmentstat) || 0,
                p_gov_mem_prog_id: Number(data.govprogrm) || 0,
                p_mnthly_personal_income_id: Number(data.mnthlypersonalincome) || 0,
                p_street: data.street?.trim() || '',
                p_barangay: data.brgy?.trim() || '',
                p_city: data.city?.trim() || '',
                p_purok_sitio_name: data.purokSitio?.trim() || '',
                p_latitude: Number(data.latitude),   // ✅ now populated
                p_longitude: Number(data.longitude),  // ✅ now populated
                p_mother_person_id: null,
                p_father_person_id: null,
                p_guardian_person_ids: [],
                p_child_person_ids: [],
                p_is_business_owner: false,
                p_is_email_verified: false,
                p_is_id_valid: false,
            }

            // 🔍 Debug log
            // console.log('Submitting payload to profileResident:', payload)

            await profileResident(payload)

            openModal({
                title: 'Success',
                message: 'Resident profile submitted successfully.',
                variant: 'success',
            })
            // Optionally clear the draft:
            // useResidentFormStore.getState().reset()
        } catch (err: any) {
            // console.error('Submission error:', err)
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
>>>>>>> origin/develop
}

export default ReviewInputsProfile

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
<<<<<<< HEAD
        borderBottomWidth: 2,             
        borderBottomColor: 'black',        
        paddingBottom: 8,  
    },
})
=======
        borderBottomWidth: 2,
        borderBottomColor: 'black',
        paddingBottom: 8,
    },
})
>>>>>>> origin/develop
