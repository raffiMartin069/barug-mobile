// app/(bhwmodals)/(person)/update-resident.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDatePicker from '@/components/ThemedDatePicker'; // ✅ NEW
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import {
    civilStatusMap,
    civilStatusOptions,
    educAttainmentMap,
    educAttainmentOptions,
    empStatMap,
    empStatOptions,
    genderMap,
    genderOptions,
    govProgMap,
    govProgOptions,
    mnthlyPerosonalIncomeOptions,
    mnthlyPersonalIncomeMap,
    nationalityMap,
    nationalityOptions,
    religionMap,
    religionOptions,
    residentialStatusMap,
    residentialStatusOptions,
    suffixOptions,
} from '@/constants/formoptions'
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import {
    fetchResidentPlus,
    fetchResidentPlusById,
    updateResident,
    type UpdateResidentArgs,
} from '@/services/profile'
import { useResidentFormStore } from '@/store/forms'
import { useAccountRole } from '@/store/useAccountRole'
import { PersonSearchRequest } from '@/types/householdHead'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

/** Helpers */
const invert = (obj: Record<string | number, string>) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, String(k)]))

const toYYYYMMDD = (input?: unknown) => {
    if (input == null) return ''
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return input.trim()
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

type OriginalSnapshot = {
    // personal
    fname: string
    mname: string
    lname: string
    suffix: string
    gender: string
    dob: string
    civilStatus: string
    nationality: string
    religion: string
    street: string
    purokSitio: string
    brgy: string
    city: string
    latitude: string
    longitude: string
    mobnum: string
    email: string
    // socio
    educattainment: string
    employmentstat: string
    occupation: string
    mnthlypersonalincome: string
    govprogrm: string
    residentialStatus: string
}

/** Reason labels */
const R = {
    NAME: 'LEGAL NAME CHANGE',
    DOB: 'CORRECTION OF BIRTHDATE',
    GENDER: 'CORRECTION OF GENDER',
    CIVIL: 'CORRECTION OF CIVIL STATUS',
    RELIGION: 'UPDATE OF RELIGION',
    NATIONALITY: 'UPDATE OF NATIONALITY',
    MOBILE: 'UPDATE OF CONTACT NUMBER',
    EMAIL: 'UPDATE OF EMAIL ADDRESS',
    BHW_ERROR: 'CORRECTION OF INCORRECT ENTRY (BHW ERROR)',
    OCCUPATION: 'UPDATE OF OCCUPATION',
    EDUC: 'UPDATE OF EDUCATIONAL ATTAINMENT',
    INCOME: 'UPDATE OF MONTHLY INCOME',
    GOVPROG: 'UPDATE OF GOVERNMENT PROGRAM',
    RES_STATUS: 'UPDATE OF RESIDENTIAL STATUS',
} as const

const MANUAL_ONLY = R.BHW_ERROR

const REASONS_OPTIONS = [
    { label: R.NAME, value: R.NAME },
    { label: R.DOB, value: R.DOB },
    { label: R.GENDER, value: R.GENDER },
    { label: R.CIVIL, value: R.CIVIL },
    { label: R.RELIGION, value: R.RELIGION },
    { label: R.NATIONALITY, value: R.NATIONALITY },
    { label: R.MOBILE, value: R.MOBILE },
    { label: R.EMAIL, value: R.EMAIL },
    { label: R.BHW_ERROR, value: R.BHW_ERROR },
    { label: R.OCCUPATION, value: R.OCCUPATION },
    { label: R.EDUC, value: R.EDUC },
    { label: R.INCOME, value: R.INCOME },
    { label: R.GOVPROG, value: R.GOVPROG },
    { label: R.RES_STATUS, value: R.RES_STATUS },
]

/** Tiny floating label that can change color independently */
const FieldLabel = ({ children, changed }: { children: React.ReactNode; changed?: boolean }) => (
    <View style={styles.labelWrap}>
        <ThemedText style={[styles.labelText, changed && styles.changed]}>{children}</ThemedText>
    </View>
)

const UpdateResident = () => {
    const router = useRouter()

    /** 1) Resident search (top of the screen) */
    const { results: searchResults, search } = usePersonSearchByKey()
    const [searchText, setSearchText] = useState('')
    const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

    /** 2) Central store */
    const store = useResidentFormStore()
    const {
        // PERSONAL
        fname, mname, lname, suffix,
        gender, dob, civilStatus, nationality, religion,
        haddress, street, purokSitio, brgy, city,
        mobnum, email, latitude, longitude,
        // SOCIOECON
        educattainment, employmentstat, occupation, mnthlypersonalincome, govprogrm,
        // LINKS (display only here)
        motherId, motherName, fatherId, fatherName,
        guardianId, guardianName, childIds, childNames,
        // setters
        setMany, setMother, setFather, setGuardian, addChild, removeChild,
    } = store

    /** 3) Role store (to refresh AsyncStorage cache when editing self) */
    const roleStore = useAccountRole()

    /** 4) Reverse maps to prefill by labels when IDs are missing */
    const genderIdByLabel = useMemo(() => invert(genderMap), [])
    const civilIdByLabel = useMemo(() => invert(civilStatusMap), [])
    const nationalityIdByLabel = useMemo(() => invert(nationalityMap), [])
    const religionIdByLabel = useMemo(() => invert(religionMap), [])
    const educIdByLabel = useMemo(() => invert(educAttainmentMap), [])
    const empIdByLabel = useMemo(() => invert(empStatMap), [])
    const govIdByLabel = useMemo(() => invert(govProgMap), [])
    const incomeIdByLabel = useMemo(() => invert(mnthlyPersonalIncomeMap), [])
    const resStatusIdByLabel = useMemo(() => {
        return Object.fromEntries(
            Object.entries(residentialStatusMap).map(([id, label]) => [String(label).toUpperCase(), String(id)])
        ) as Record<string, string>
    }, [])

    /** 5) Residential Status (numeric-string) */
    const [residentialStatus, setResidentialStatus] = useState<string>('')
    const setResStatAdapt = (u: string | ((c: string) => string)) =>
        setResidentialStatus(String(typeof u === 'function' ? u(residentialStatus) : u))

    /** 5.1) Edit-mode toggle */
    const [isEditing, setIsEditing] = useState(false)

    /** 5.2) Original snapshot for change-highlighting */
    const [original, setOriginal] = useState<OriginalSnapshot | null>(null)
    const snapshot = (): OriginalSnapshot => ({
        fname: fname || '',
        mname: mname || '',
        lname: lname || '',
        suffix: suffix || '',
        gender: gender || '',
        dob: (dob || '') as string,
        civilStatus: civilStatus || '',
        nationality: nationality || '',
        religion: religion || '',
        street: street || '',
        purokSitio: purokSitio || '',
        brgy: brgy || '',
        city: city || '',
        latitude: latitude || '',
        longitude: longitude || '',
        mobnum: mobnum || '',
        email: email || '',
        educattainment: educattainment || '',
        employmentstat: employmentstat || '',
        occupation: occupation || '',
        mnthlypersonalincome: mnthlypersonalincome || '',
        govprogrm: govprogrm || '',
        residentialStatus: residentialStatus || '',
    })
    const isChanged = (key: keyof OriginalSnapshot) => {
        if (!original) return false
        return String(snapshot()[key] ?? '') !== String(original[key] ?? '')
    }
    const changedStyle = (key: keyof OriginalSnapshot) =>
        isEditing && isChanged(key) ? styles.changed : null

    /** 6) Reason state (auto vs manual) */
    const [reasonModalVisible, setReasonModalVisible] = useState(false)
    const [autoReasons, setAutoReasons] = useState<Set<string>>(new Set())
    const [manualReasons, setManualReasons] = useState<Set<string>>(new Set())

    // compute auto reasons whenever the edited values change vs original
    useEffect(() => {
        if (!original) {
            setAutoReasons(new Set())
            return
        }
        const current = snapshot()
        const next = new Set<string>()

        // Name fields (any of these changed)
        if (current.fname !== original.fname || current.mname !== original.mname ||
            current.lname !== original.lname || current.suffix !== original.suffix) {
            next.add(R.NAME)
        }

        if (current.dob !== original.dob) next.add(R.DOB)
        if (current.gender !== original.gender) next.add(R.GENDER)
        if (current.civilStatus !== original.civilStatus) next.add(R.CIVIL)
        if (current.religion !== original.religion) next.add(R.RELIGION)
        if (current.nationality !== original.nationality) next.add(R.NATIONALITY)
        if (current.mobnum !== original.mobnum) next.add(R.MOBILE)
        if (current.email !== original.email) next.add(R.EMAIL)
        if (current.occupation !== original.occupation) next.add(R.OCCUPATION)
        if (current.educattainment !== original.educattainment) next.add(R.EDUC)
        if (current.mnthlypersonalincome !== original.mnthlypersonalincome) next.add(R.INCOME)
        if (current.govprogrm !== original.govprogrm) next.add(R.GOVPROG)
        if (current.residentialStatus !== original.residentialStatus) next.add(R.RES_STATUS)

        setAutoReasons(next)
    }, [
        fname, mname, lname, suffix,
        dob, gender, civilStatus, religion, nationality,
        mobnum, email, occupation, educattainment, mnthlypersonalincome, govprogrm,
        residentialStatus,
        original,
    ])

    /** 7) Track current logged-in person's id (to know if editing self) */
    const [myPersonId, setMyPersonId] = useState<number | null>(null)
    const [editorStaffId, setEditorStaffId] = useState<number | null>(null)
    useEffect(() => {
        let live = true
            ; (async () => {
                try {
                    const me = await fetchResidentPlus()
                    if (!live) return
                    setEditorStaffId(me?.staff_id ?? null)
                    setMyPersonId(me?.details?.person_id ?? null)
                } catch (e) {
                    console.warn('Failed to resolve editor staff/person id', e)
                    setEditorStaffId(null)
                    setMyPersonId(null)
                }
            })()
        return () => { live = false }
    }, [])

    /** 8) Load selected resident -> prefill store */
    const loadResident = async (pid: number) => {
        const details = await fetchResidentPlusById(pid)

        // PERSONAL
        setMany({
            fname: details.first_name ?? '',
            mname: details.middle_name ?? '',
            lname: details.last_name ?? '',
            suffix: details.suffix ?? '',
            dob: toYYYYMMDD(details.birthdate) ?? '',

            gender: String(details.sex_id ?? genderIdByLabel[String(details.sex ?? '').toUpperCase()] ?? ''),
            civilStatus: String(details.civil_status_id ?? civilIdByLabel[String(details.civil_status ?? '').toUpperCase()] ?? ''),
            nationality: String(details.nationality_id ?? nationalityIdByLabel[String(details.nationality ?? '').toUpperCase()] ?? ''),
            religion: String(details.religion_id ?? religionIdByLabel[String(details.religion ?? '').toUpperCase()] ?? ''),

            street: details.street_name ?? '',
            purokSitio: details.purok_sitio_name ?? '',
            brgy: details.barangay_name ?? '',
            city: details.city_name ?? '',
            haddress: [details.street_name, details.purok_sitio_name, details.barangay_name, details.city_name]
                .filter(Boolean)
                .join(', '),

            mobnum: details.mobile_num ?? '',
            email: details.email ?? '',

            latitude: String(details.latitude ?? ''),
            longitude: String(details.longitude ?? ''),

            // SOCIOECON
            educattainment: String(details.education_id ?? educIdByLabel[String(details.education ?? '').toUpperCase()] ?? ''),
            employmentstat: String(details.employment_status_id ?? empIdByLabel[String(details.employment_status ?? '').toUpperCase()] ?? ''),
            occupation: details.occupation ?? '',
            mnthlypersonalincome: String(details.mnthly_personal_income_id ?? incomeIdByLabel[String(details.personal_monthly_income ?? '')] ?? ''),
            govprogrm: String(details.gov_mem_prog_id ?? govIdByLabel[String(details.gov_program ?? '').toUpperCase()] ?? ''),
        })

        // Residential status
        if (details.residential_status_id != null) {
            setResidentialStatus(String(details.residential_status_id))
        } else if (details.residential_status) {
            const idFromLabel = resStatusIdByLabel[String(details.residential_status).toUpperCase()]
            setResidentialStatus(idFromLabel ?? '')
        } else {
            setResidentialStatus('')
        }

        // PARENTS / GUARDIAN (display only)
        setMother(details.mother_id ?? null, details.mother_name ?? null)
        setFather(details.father_id ?? null, details.father_name ?? null)
        setGuardian(details.guardian_id ?? null, details.guardian_name ?? null)

            // Children: replace list (supports both shapes)
            ; (() => {
                const currentIds = [...childIds]
                currentIds.forEach((id) => removeChild(id))

                const rawIds = (Array.isArray(details.children_ids) ? details.children_ids : []) as any[]
                const rawNames = (Array.isArray(details.children_names) ? details.children_names : []) as any[]

                if (!rawIds.length) return

                if (typeof rawIds[0] === 'object' && rawIds[0] !== null) {
                    rawIds.forEach((c: any) => {
                        const id = c?.person_id ?? c?.id ?? c?.personId
                        const nm = c?.full_name ?? c?.name ?? c?.fullName ?? ''
                        if (id != null) addChild(String(id), String(nm || id))
                    })
                    return
                }

                rawIds.forEach((id: number, idx: number) => {
                    const nm = rawNames[idx] ?? ''
                    addChild(String(id), String(nm || id))
                })
            })()

        // snapshot for highlight
        setTimeout(() => {
            const snap: OriginalSnapshot = {
                fname: details.first_name ?? '',
                mname: details.middle_name ?? '',
                lname: details.last_name ?? '',
                suffix: details.suffix ?? '',
                gender: String(details.sex_id ?? genderIdByLabel[String(details.sex ?? '').toUpperCase()] ?? ''),
                dob: toYYYYMMDD(details.birthdate) ?? '',
                civilStatus: String(details.civil_status_id ?? civilIdByLabel[String(details.civil_status ?? '').toUpperCase()] ?? ''),
                nationality: String(details.nationality_id ?? nationalityIdByLabel[String(details.nationality ?? '').toUpperCase()] ?? ''),
                religion: String(details.religion_id ?? religionIdByLabel[String(details.religion ?? '').toUpperCase()] ?? ''),
                street: details.street_name ?? '',
                purokSitio: details.purok_sitio_name ?? '',
                brgy: details.barangay_name ?? '',
                city: details.city_name ?? '',
                latitude: String(details.latitude ?? ''),
                longitude: String(details.longitude ?? ''),
                mobnum: details.mobile_num ?? '',
                email: details.email ?? '',
                educattainment: String(details.education_id ?? educIdByLabel[String(details.education ?? '').toUpperCase()] ?? ''),
                employmentstat: String(details.employment_status_id ?? empIdByLabel[String(details.employment_status ?? '').toUpperCase()] ?? ''),
                occupation: details.occupation ?? '',
                mnthlypersonalincome: String(details.mnthly_personal_income_id ?? incomeIdByLabel[String(details.personal_monthly_income ?? '')] ?? ''),
                govprogrm: String(details.gov_mem_prog_id ?? govIdByLabel[String(details.gov_program ?? '').toUpperCase()] ?? ''),
                residentialStatus: (details.residential_status_id != null)
                    ? String(details.residential_status_id)
                    : (details.residential_status ? (resStatusIdByLabel[String(details.residential_status).toUpperCase()] ?? '') : ''),
            }
            setOriginal(snap)
            // reset reasons when loading a new resident
            setAutoReasons(new Set())
            setManualReasons(new Set())
        }, 0)
    }

    /** 9) Pick resident to edit */
    const onSelectResident = async (p: PersonSearchRequest) => {
        setSelectedPersonId(Number(p.person_id))
        setSearchText(p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)
        await loadResident(Number(p.person_id))
        setIsEditing(false)
    }

    /** Clear selection */
    const clearSelectedResident = () => {
        setSelectedPersonId(null)
        setSearchText('')
        setIsEditing(false)
        setOriginal(null)
        setAutoReasons(new Set())
        setManualReasons(new Set())
        // clear store fields
        setMany({
            fname: '', mname: '', lname: '', suffix: '',
            gender: '', dob: '', civilStatus: '', nationality: '', religion: '',
            haddress: '', street: '', purokSitio: '', brgy: '', city: '',
            mobnum: '', email: '', latitude: '', longitude: '',
            educattainment: '', employmentstat: '', occupation: '',
            mnthlypersonalincome: '', govprogrm: '',
        })
        // clear links
        setMother(null, null)
        setFather(null, null)
        setGuardian(null, null)
            ;[...store.childIds].forEach((id) => removeChild(id))
        // clear residential status
        setResidentialStatus('')
    }

    /** 10) Dropdown adapters */

    // DatePicker may pass a Date/string; store normalized YYYY-MM-DD
    const setDobAdapt = (next: Date | string | undefined) => {
        if (next instanceof Date && !isNaN(next.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0')
            const formatted = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
            setMany({ dob: formatted })
        } else if (typeof next === 'string') {
            setMany({ dob: next })
        } else {
            setMany({ dob: '' })
        }
    }

    const setSuffixAdapt = (u: string | ((c: string) => string)) => setMany({ suffix: String(typeof u === 'function' ? u(suffix) : u) })
    const setGenderAdapt = (u: string | ((c: string) => string)) => setMany({ gender: String(typeof u === 'function' ? u(gender) : u) })
    const setCivilAdapt = (u: string | ((c: string) => string)) => setMany({ civilStatus: String(typeof u === 'function' ? u(civilStatus) : u) })
    const setNatAdapt = (u: string | ((c: string) => string)) => setMany({ nationality: String(typeof u === 'function' ? u(nationality) : u) })
    const setReligAdapt = (u: string | ((c: string) => string)) => setMany({ religion: String(typeof u === 'function' ? u(religion) : u) })
    const setEducAdapt = (u: string | ((c: string) => string)) => setMany({ educattainment: String(typeof u === 'function' ? u(educattainment) : u) })
    const setEmpAdapt = (u: string | ((c: string) => string)) => setMany({ employmentstat: String(typeof u === 'function' ? u(employmentstat) : u) })
    const setIncomeAdapt = (u: string | ((c: string) => string)) => setMany({ mnthlypersonalincome: String(typeof u === 'function' ? u(mnthlypersonalincome) : u) })
    const setGovAdapt = (u: string | ((c: string) => string)) => setMany({ govprogrm: String(typeof u === 'function' ? u(govprogrm) : u) })

    /** 11) Info modal (warnings/errors) */
    const [modal, setModal] = useState<{ visible: boolean; title: string; message?: string; variant?: ModalVariant }>({
        visible: false, title: '', message: '', variant: 'info'
    })
    const openModal = (opts: { title: string; message?: string; variant?: ModalVariant }) => setModal({ visible: true, ...opts })
    const closeModal = () => setModal(m => ({ ...m, visible: false }))

    /** Save clicked → open reason modal (after basic checks) */
    const handleSaveClick = () => {
        if (!selectedPersonId) {
            openModal({ title: 'Select a resident', message: 'Search and pick a resident to update.', variant: 'warn' })
            return
        }
        if (!editorStaffId) {
            openModal({ title: 'Not allowed', message: 'Only staff can edit resident info. No staff ID detected for your account.', variant: 'error' })
            return
        }
        if (!residentialStatus) {
            openModal({ title: 'Residential status required', message: 'Please choose the resident’s current residential status.', variant: 'warn' })
            return
        }

        // ✅ If no field changes at all, do NOT open the modal.
        const hasChanges = !!original && JSON.stringify(snapshot()) !== JSON.stringify(original)
        if (!hasChanges) {
            openModal({ title: 'No changes detected', message: 'There are no edits to save.', variant: 'warn' })
            return
        }

        setReasonModalVisible(true)
    }

    /** Final update after reason confirmed */
    const performUpdate = async () => {
        const combined = new Set<string>([...autoReasons, ...manualReasons])
        const reasonValue = Array.from(combined).join(', ')
        if (!reasonValue) {
            openModal({ title: 'Reason required', message: 'At least one reason must be selected.', variant: 'warn' })
            return
        }

        const payload: UpdateResidentArgs = {
            // editor + target + audit
            p_editor_staff_id: editorStaffId!,
            p_person_id: selectedPersonId!,
            p_reason: reasonValue.trim(),

            // --- basic identity ---
            p_first_name: (fname || '').trim(),
            p_middle_name: mname?.trim() || null,
            p_last_name: (lname || '').trim(),
            p_suffix: suffix?.trim() || null,

            // YYYY-MM-DD
            p_birthdate: toYYYYMMDD(dob),

            // --- lookups ---
            p_sex_id: toIntOrNull(gender) ?? 0,
            p_civil_status_id: toIntOrNull(civilStatus) ?? 0,
            p_nationality_id: toIntOrNull(nationality) ?? 0,
            p_religion_id: toIntOrNull(religion) ?? 0,

            // --- contacts & work ---
            p_email: email?.trim() || null,
            p_mobile_num: (mobnum || '').trim(),
            p_occupation: (occupation || '').trim(),

            // --- socioeconomic ---
            p_mnthly_personal_income_id: toIntOrNull(mnthlypersonalincome) ?? 0,
            p_residential_status_id: toIntOrNull(residentialStatus) ?? 0,
            p_education_id: toIntOrNull(educattainment) ?? 0,
            p_employment_status_id: toIntOrNull(employmentstat) ?? 0,
            p_gov_mem_prog_id: toIntOrNull(govprogrm) ?? 0,
        }

        console.log('[UpdateResident] Payload:', payload)

        try {
            await updateResident(payload)
            setReasonModalVisible(false)
            openModal({ title: 'Saved', message: 'Resident updated successfully.', variant: 'success' })

            if (selectedPersonId) {
                await loadResident(selectedPersonId)
                setIsEditing(false)
            }

            if (myPersonId && selectedPersonId === myPersonId) {
                await roleStore.ensureLoaded('resident', { force: true })
                try {
                    const raw = await AsyncStorage.getItem('role-store-v1')
                    if (raw) console.log('[UpdateResident] role-store-v1 (after refresh):', JSON.parse(raw))
                } catch { }
            }
        } catch (err: any) {
            console.error('[UpdateResident] Update failed:', err)
            openModal({ title: 'Update failed', message: err?.message ?? 'Unexpected error', variant: 'error' })
        }
    }

    /** 12) Navigate to dedicated Relations editor */
    const goManageRelations = () => {
        if (!selectedPersonId) {
            openModal({ title: 'Pick a resident', message: 'Please select a resident first.', variant: 'warn' })
            return
        }
        router.push({
            pathname: '/(bhwmodals)/(person)/update-resident-relations',
            params: { person_id: String(selectedPersonId) }
        })
    }

    /** 13) Small helpers for disabled/readonly styling */
    const disabledProps = (enabled: boolean) => ({
        editable: enabled as any,
        disabled: !enabled as any,
        pointerEvents: enabled ? 'auto' : 'none',
    })

    /** Checkbox item (uses Ionicons) */
    const CheckItem = ({
        label, checked, disabled, onToggle,
    }: { label: string; checked: boolean; disabled?: boolean; onToggle?: () => void }) => {
        return (
            <Pressable
                onPress={() => { if (!disabled && onToggle) onToggle() }}
                style={[styles.checkboxRow, disabled && styles.checkboxRowDisabled]}
            >
                <Ionicons
                    name={checked ? 'checkbox-outline' : 'square-outline'}
                    size={22}
                    color={disabled ? '#9AA0A6' : '#1F2937'}
                    style={{ marginRight: 10 }}
                />
                <ThemedText style={[styles.checkboxLabel, disabled && styles.checkboxLabelDisabled]}>
                    {label}
                </ThemedText>
                {disabled && <ThemedText style={styles.autoTag}>AUTO</ThemedText>}
            </Pressable>
        )
    }

    /** DOB picker visibility */
    const [dobPickerOpen, setDobPickerOpen] = useState(false)

    return (
        <ThemedView safe>
            <ThemedAppBar title="Update Resident" showNotif={false} showProfile={false} />
            <ThemedKeyboardAwareScrollView>

                {/* A. Find Resident (with search icon + actions) */}
                <ThemedCard>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="search" size={18} color="#555" style={{ marginRight: 6 }} />
                            <ThemedText title>Find Resident</ThemedText>
                        </View>
                    </View>

                    <Spacer height={8} />

                    <ThemedSearchSelect<PersonSearchRequest>
                        items={searchResults}
                        getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
                        getSubLabel={(p) => p.address}
                        inputValue={searchText}
                        onInputValueChange={(t) => { setSearchText(t); search(t) }}
                        placeholder="Search by name or resident ID…"
                        emptyText="No matches"
                        onSelect={onSelectResident}
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
                    <Spacer height={5} />
                    <View style={styles.headerActions}>
                        <ThemedButton onPress={clearSelectedResident} variant="secondary">
                            <ThemedText btn>Clear</ThemedText>
                        </ThemedButton>
                        <ThemedButton onPress={() => setIsEditing(v => !v)} disabled={!selectedPersonId}>
                            <ThemedText btn>{isEditing ? 'Stop Editing' : 'Edit Fields'}</ThemedText>
                        </ThemedButton>
                    </View>
                </ThemedCard>

                <Spacer />

                {/* B. Personal Information */}
                <ThemedCard>
                    <ThemedText title>Personal</ThemedText>

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('fname')}>First Name</FieldLabel>
                    <ThemedTextInput
                        placeholder="First Name *"
                        value={fname}
                        onChangeText={(v) => setMany({ fname: v })}
                        style={changedStyle('fname')}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('mname')}>Middle Name</FieldLabel>
                    <ThemedTextInput
                        placeholder="Middle Name"
                        value={mname}
                        onChangeText={(v) => setMany({ mname: v })}
                        style={changedStyle('mname')}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('lname')}>Last Name</FieldLabel>
                    <ThemedTextInput
                        placeholder="Last Name *"
                        value={lname}
                        onChangeText={(v) => setMany({ lname: v })}
                        style={changedStyle('lname')}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('suffix')}>Suffix</FieldLabel>
                    <ThemedDropdown
                        items={suffixOptions}
                        value={suffix}
                        setValue={setSuffixAdapt}
                        placeholder="Suffix"
                        order={0}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('gender')}>Sex</FieldLabel>
                    <ThemedRadioButton
                        value={gender}
                        onChange={setGenderAdapt}
                        options={genderOptions}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('dob')}>Birthdate</FieldLabel>

                    {isEditing ? (
                        <ThemedDatePicker
                            value={dob ? new Date(dob) : undefined}
                            mode="date"
                            onChange={setDobAdapt}
                            placeholder="Date of Birth *"
                            maximumDate={new Date()}
                        />
                    ) : (
                        <ThemedTextInput
                            placeholder="Birthdate (YYYY-MM-DD)"
                            value={dob ? toYYYYMMDD(dob) : ''}
                            onChangeText={() => { }}
                            {...disabledProps(false)}
                        />
                    )}


                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('civilStatus')}>Civil Status</FieldLabel>
                    <ThemedDropdown
                        items={civilStatusOptions}
                        value={civilStatus}
                        setValue={setCivilAdapt}
                        placeholder="Civil Status *"
                        order={1}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('nationality')}>Nationality</FieldLabel>
                    <ThemedDropdown
                        items={nationalityOptions}
                        value={nationality}
                        setValue={setNatAdapt}
                        placeholder="Nationality *"
                        order={2}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('religion')}>Religion</FieldLabel>
                    <ThemedDropdown
                        items={religionOptions}
                        value={religion}
                        setValue={setReligAdapt}
                        placeholder="Religion *"
                        order={3}
                        {...disabledProps(isEditing)}
                    />

                    {/* Address — READ ONLY */}
                    <Spacer height={10} />
                    <FieldLabel>Street</FieldLabel>
                    <ThemedTextInput
                        placeholder="Street"
                        value={street}
                        onChangeText={() => { }}
                        style={null}
                        {...disabledProps(false)}
                    />
                    <Spacer height={10} />
                    <FieldLabel>Purok / Sitio</FieldLabel>
                    <ThemedTextInput
                        placeholder="Purok / Sitio"
                        value={purokSitio}
                        onChangeText={() => { }}
                        style={null}
                        {...disabledProps(false)}
                    />
                    <Spacer height={10} />
                    <FieldLabel>Barangay</FieldLabel>
                    <ThemedTextInput
                        placeholder="Barangay"
                        value={brgy}
                        onChangeText={() => { }}
                        style={null}
                        {...disabledProps(false)}
                    />
                    <Spacer height={10} />
                    <FieldLabel>City</FieldLabel>
                    <ThemedTextInput
                        placeholder="City"
                        value={city}
                        onChangeText={() => { }}
                        style={null}
                        {...disabledProps(false)}
                    />

                    {/* Removed Latitude/Longitude inputs from UI */}

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('mobnum')}>Mobile Number</FieldLabel>
                    <ThemedTextInput
                        placeholder="Mobile Number *"
                        value={mobnum}
                        onChangeText={(v) => setMany({ mobnum: v })}
                        keyboardType="phone-pad"
                        style={changedStyle('mobnum')}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('email')}>Email Address</FieldLabel>
                    <ThemedTextInput
                        placeholder="Email Address"
                        value={email}
                        onChangeText={(v) => setMany({ email: v })}
                        style={changedStyle('email')}
                        {...disabledProps(isEditing)}
                    />
                </ThemedCard>

                <Spacer />

                {/* D. Socioeconomic */}
                <ThemedCard>
                    <ThemedText title>Socioeconomic</ThemedText>

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('educattainment')}>Educational Attainment</FieldLabel>
                    <ThemedDropdown
                        items={educAttainmentOptions}
                        value={educattainment}
                        setValue={setEducAdapt}
                        placeholder="Educational Attainment"
                        order={0}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('employmentstat')}>Employment Status</FieldLabel>
                    <ThemedDropdown
                        items={empStatOptions}
                        value={employmentstat}
                        setValue={setEmpAdapt}
                        placeholder="Employment Status"
                        order={1}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('occupation')}>Occupation</FieldLabel>
                    <ThemedTextInput
                        placeholder="Occupation"
                        value={occupation}
                        onChangeText={(v) => setMany({ occupation: v })}
                        style={changedStyle('occupation')}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('mnthlypersonalincome')}>Monthly Personal Income</FieldLabel>
                    <ThemedDropdown
                        items={mnthlyPerosonalIncomeOptions}
                        value={mnthlypersonalincome}
                        setValue={setIncomeAdapt}
                        placeholder="Monthly Personal Income"
                        order={2}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('govprogrm')}>Government Program</FieldLabel>
                    <ThemedDropdown
                        items={govProgOptions}
                        value={govprogrm}
                        setValue={setGovAdapt}
                        placeholder="Government Program"
                        order={3}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={10} />
                    <FieldLabel changed={!!changedStyle('residentialStatus')}>Residential Status</FieldLabel>
                    <ThemedDropdown
                        items={residentialStatusOptions}
                        value={residentialStatus}
                        setValue={setResStatAdapt}
                        placeholder="Residential Status"
                        order={4}
                        {...disabledProps(isEditing)}
                    />

                    <Spacer height={15} />
                    <ThemedButton onPress={handleSaveClick} disabled={!selectedPersonId || !isEditing}>
                        <ThemedText btn>Save Personal & Socioeconomic</ThemedText>
                    </ThemedButton>
                    {!isEditing && (
                        <>
                            <Spacer height={6} />
                            <ThemedText style={{ opacity: 0.7, textAlign: 'center' }}>
                                Tap “Edit Fields” to enable editing. Changed fields turn blue.
                            </ThemedText>
                        </>
                    )}
                </ThemedCard>

                <Spacer />

                {/* C. Parent(s) / Guardian — DISPLAY ONLY here */}
                <ThemedCard>
                    <View style={styles.headerRow}>
                        <ThemedText title>Linked Relationships</ThemedText>
                    </View>

                    <Spacer height={10} />
                    <View style={{ gap: 8 }}>

                        <Spacer height={10} />

                        <View style={{ gap: 12 }}>
                            {/* Mother */}
                            <View>
                                <ThemedText style={styles.roleHeading}>Mother</ThemedText>
                                {motherId ? (
                                    <View style={styles.childRow}>
                                        <ThemedText subtitle>{motherName}</ThemedText>
                                    </View>
                                ) : (
                                    <ThemedText style={{ opacity: 0.6 }}>No mother linked</ThemedText>
                                )}
                            </View>

                            {/* Father */}
                            <View>
                                <ThemedText style={styles.roleHeading}>Father</ThemedText>
                                {fatherId ? (
                                    <View style={styles.childRow}>
                                        <ThemedText subtitle>{fatherName}</ThemedText>
                                    </View>
                                ) : (
                                    <ThemedText style={{ opacity: 0.6 }}>No father linked</ThemedText>
                                )}
                            </View>

                            {/* Guardian */}
                            <View>
                                <ThemedText style={styles.roleHeading}>Guardian</ThemedText>
                                {guardianId ? (
                                    <View style={styles.childRow}>
                                        <ThemedText subtitle>{guardianName}</ThemedText>
                                    </View>
                                ) : (
                                    <ThemedText style={{ opacity: 0.6 }}>No guardian linked</ThemedText>
                                )}
                            </View>
                        </View>

                        <Spacer height={10} />
                        <ThemedText style={styles.roleHeading}>Children</ThemedText>
                        {childIds.length ? (
                            <View style={{ gap: 8 }}>
                                {childNames.map((nm, idx) => (
                                    <View key={childIds[idx]} style={styles.childRow}>
                                        <ThemedText subtitle>{`${idx + 1}. ${nm}`}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        ) : <ThemedText style={{ opacity: 0.6 }}>No children linked</ThemedText>}
                    </View>


                    <Spacer height={15} />
                    <ThemedButton onPress={goManageRelations} disabled={!selectedPersonId}>
                        <ThemedText btn>Manage Relations</ThemedText>
                    </ThemedButton>

                    <Spacer height={6} />
                    <ThemedText style={{ opacity: 0.7, textAlign: 'center' }}>
                        To add/remove parents, guardian, or children, tap “Manage Relations”.
                    </ThemedText>
                </ThemedCard>

                <Spacer />
                <Spacer height={15} />
                <View />

            </ThemedKeyboardAwareScrollView>

            {/* Info/Warn/Error modal */}
            <NiceModal
                visible={modal.visible}
                title={modal.title}
                message={modal.message}
                variant={modal.variant}
                primaryText="OK"
                onPrimary={closeModal}
                onClose={closeModal}
            />

            {/* Reason selection modal with auto + manual checkboxes */}
            <Modal
                transparent
                visible={reasonModalVisible}
                animationType="fade"
                onRequestClose={() => setReasonModalVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <ThemedText title>Reason / Remarks</ThemedText>
                        <Spacer height={8} />
                        <ThemedText style={{ opacity: 0.75 }}>
                            The items below are automatically checked based on your changes.
                        </ThemedText>
                        <Spacer height={14} />

                        {/* Auto reasons (locked) */}
                        <View style={{ gap: 2 }}>
                            {REASONS_OPTIONS.filter(r => r.value !== MANUAL_ONLY).map(({ label, value }) => (
                                <CheckItem
                                    key={value}
                                    label={label}
                                    checked={autoReasons.has(value)}
                                    disabled
                                />
                            ))}
                        </View>

                        <Spacer height={10} />

                        {/* Manual-only reason */}
                        <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', paddingTop: 5 }}>
                            <Spacer height={6} />
                            <CheckItem
                                label={MANUAL_ONLY}
                                checked={manualReasons.has(MANUAL_ONLY)}
                                onToggle={() => {
                                    setManualReasons(prev => {
                                        const next = new Set(prev)
                                        if (next.has(MANUAL_ONLY)) next.delete(MANUAL_ONLY)
                                        else next.add(MANUAL_ONLY)
                                        return next
                                    })
                                }}
                            />
                        </View>

                        <Spacer height={16} />
                        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                            <ThemedButton onPress={() => setReasonModalVisible(false)}>
                                <ThemedText btn>Cancel</ThemedText>
                            </ThemedButton>
                            <ThemedButton
                                onPress={performUpdate}
                                disabled={autoReasons.size === 0 && !manualReasons.has(MANUAL_ONLY)}
                            >
                                <ThemedText btn>Confirm</ThemedText>
                            </ThemedButton>
                        </View>
                    </View>
                </View>
            </Modal>
        </ThemedView>
    )
}

export default UpdateResident

const styles = StyleSheet.create({
    childRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#865a5a3a',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    changed: {
        color: '#1976D2', // blue for edited fields (applies to label or text)
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 18,
    },
    modalCard: {
        width: '100%',
        maxWidth: 520,
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    checkboxRowDisabled: {
        opacity: 0.8,
    },
    checkboxLabel: {
        flex: 1,
    },
    checkboxLabelDisabled: {
        color: '#6B7280',
    },
    autoTag: {
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: '#441010ff',
        color: '#ffffffff',
    },
    labelWrap: {
        alignSelf: 'flex-start',
        backgroundColor: '#ffffffff',
        paddingHorizontal: 6,
        paddingVertical: 0,
        borderRadius: 6,
    },
    labelText: {
        fontSize: 12,
        opacity: 0.5,
    },
    datePress: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F6F6F6',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    roleHeading: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },

})
