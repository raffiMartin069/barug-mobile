// app/(bhwmodals)/(person)/update-resident.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal'
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
    suffixOptions,
} from '@/constants/formoptions'
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { fetchResidentPlusById } from '@/services/profile'
import { updateResident, type UpdateResidentArgs } from '@/services/profiling'
import { useResidentFormStore } from '@/store/forms'
import { PersonSearchRequest } from '@/types/householdHead'
import React, { useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

/* ------------------------------ helpers ------------------------------ */

const invert = (obj: Record<string, string>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]))

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

const toNumberOrNull = (v?: string | number | null) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const toIntArray = (arr?: Array<string | number> | null): number[] =>
  Array.isArray(arr) ? arr.map((x) => Number(x)).filter((n) => Number.isFinite(n)) as number[] : []

type Rel = 'MOTHER' | 'FATHER' | 'GUARDIAN'
type CRel = 'CHILD' | 'SON' | 'DAUGHTER'

/* -------------------------------------------------------------------- */

const UpdateResident = () => {
  /** A) Resident search (top of the screen) */
  const { results: searchResults, search } = usePersonSearchByKey()
  const [searchText, setSearchText] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null)

  /** B) Central store (we reuse the same store used by your Create flow) */
  const store = useResidentFormStore()
  const {
    // PERSONAL
    fname, mname, lname, suffix,
    gender, dob, civilStatus, nationality, religion,
    haddress, street, purokSitio, brgy, city,
    mobnum, email, latitude, longitude,
    // SOCIOECON
    educattainment, employmentstat, occupation, mnthlypersonalincome, govprogrm,
    // LINKS
    motherId, motherName, fatherId, fatherName,
    guardianIds, guardianNames, childIds, childNames,
    // setters
    setMany, setMother, setFather, addGuardian, removeGuardian, addChild, removeChild,
  } = store

  /** C) Edit mode — fields are read-only until "Edit" is tapped */
  const [isEditing, setIsEditing] = useState(false)

  /** D) Keep a "baseline" snapshot for blue-on-change highlighting */
  type StoreShape = ReturnType<typeof useResidentFormStore.getState>
  type FieldKey = keyof StoreShape
  const baselineRef = useRef<Partial<StoreShape> | null>(null)

  const isChanged = (k: FieldKey) => {
    const b = baselineRef.current
    if (!b) return false

    // arrays: shallow compare for ids
    if (k === 'guardianIds' || k === 'childIds') {
      const a = (store as StoreShape)[k] as unknown as string[]
      const c = (b[k] ?? []) as unknown as string[]
      return a.length !== c.length || a.some((v, i) => v !== c[i])
    }
    return (store as StoreShape)[k] !== (b[k] as StoreShape[FieldKey])
  }

  const changeStyle = (k: FieldKey) =>
    isEditing && isChanged(k) ? { color: '#2563EB' } : undefined

  const changeBox = (k: FieldKey) =>
    isEditing && isChanged(k) ? { borderColor: '#2563EB' } : undefined

  /** E) Reverse maps so we can prefill dropdowns using text labels if IDs aren’t provided */
  const genderIdByLabel = useMemo(() => invert(genderMap), [])
  const civilIdByLabel = useMemo(() => invert(civilStatusMap), [])
  const nationalityIdByLabel = useMemo(() => invert(nationalityMap), [])
  const religionIdByLabel = useMemo(() => invert(religionMap), [])
  const educIdByLabel = useMemo(() => invert(educAttainmentMap), [])
  const empIdByLabel = useMemo(() => invert(empStatMap), [])
  const govIdByLabel = useMemo(() => invert(govProgMap), [])
  const incomeIdByLabel = useMemo(() => invert(mnthlyPersonalIncomeMap), [])

  /** F) Load selected resident -> prefill store + baseline */
  const loadResident = async (pid: number) => {
    const details = await fetchResidentPlusById(pid)

    // PERSONAL + SOCIOECON
    setMany({
      fname: details.first_name ?? '',
      mname: details.middle_name ?? '',
      lname: details.last_name ?? '',
      suffix: details.suffix ?? '',
      dob: toYYYYMMDD(details.birthdate) ?? '',

      gender: String(details.sex_id ?? genderIdByLabel[details.sex ?? ''] ?? ''),
      civilStatus: String(details.civil_status_id ?? civilIdByLabel[details.civil_status ?? ''] ?? ''),
      nationality: String(details.nationality_id ?? nationalityIdByLabel[details.nationality ?? ''] ?? ''),
      religion: String(details.religion_id ?? religionIdByLabel[details.religion ?? ''] ?? ''),

      street: details.street_name ?? '',
      purokSitio: details.purok_sitio_name ?? '',
      brgy: details.barangay_name ?? '',
      city: details.city_name ?? '',
      haddress: [details.street_name, details.purok_sitio_name, details.barangay_name, details.city_name].filter(Boolean).join(', '),

      mobnum: details.mobile_num ?? '',
      email: details.email ?? '',

      latitude: String(details.latitude ?? ''),
      longitude: String(details.longitude ?? ''),

      educattainment: String(details.education_id ?? educIdByLabel[details.education ?? ''] ?? ''),
      employmentstat: String(details.employment_status_id ?? empIdByLabel[details.employment_status ?? ''] ?? ''),
      occupation: details.occupation ?? '',
      mnthlypersonalincome: String(details.mnthly_personal_income_id ?? incomeIdByLabel[details.personal_monthly_income ?? ''] ?? ''),
      govprogrm: String(details.gov_mem_prog_id ?? govIdByLabel[details.gov_program ?? ''] ?? ''),
    })

    // LINKS
    setMother(details.mother?.person_id ?? null, details.mother?.full_name ?? null)
    setFather(details.father?.person_id ?? null, details.father?.full_name ?? null)

    guardianIds.slice().forEach((id) => removeGuardian(id))
    ;(details.guardians ?? []).forEach((g: any) => addGuardian(String(g.person_id), g.full_name))

    childIds.slice().forEach((id) => removeChild(id))
    ;(details.children ?? []).forEach((c: any) => addChild(String(c.person_id), c.full_name))

    // lock editing and set baseline snapshot
    setIsEditing(false)
    baselineRef.current = {
      ...useResidentFormStore.getState(),
    }
  }

  /** G) Top search select: pick a resident to edit */
  const onSelectResident = async (p: PersonSearchRequest) => {
    setSelectedPersonId(Number(p.person_id))
    setSearchText(p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)
    await loadResident(Number(p.person_id))
  }

  /** H) Relationship dropdown data & helpers */
  const hasMother = !!motherId
  const hasFather = !!fatherId
  const relItems = [
    { label: 'Mother', value: 'MOTHER', disabled: hasMother },
    { label: 'Father', value: 'FATHER', disabled: hasFather },
    { label: 'Guardian', value: 'GUARDIAN' },
  ] as const
  const childRelItems = [
    { label: 'Child (unspecified)', value: 'CHILD' },
    { label: 'Son', value: 'SON' },
    { label: 'Daughter', value: 'DAUGHTER' },
  ] as const
  const [rel, setRel] = useState<Rel | ''>('')
  const [childRel, setChildRel] = useState<CRel | ''>('')

  /** I) Inline search for linking family members (same hook) */
  const { results: linkResultsPG, search: searchPG } = usePersonSearchByKey()
  const [linkInputPG, setLinkInputPG] = useState('')
  const { results: linkResultsChild, search: searchChild } = usePersonSearchByKey()
  const [linkInputChild, setLinkInputChild] = useState('')

  const onPickPG = (p: PersonSearchRequest) => {
    if (!isEditing) return
    if (!rel) return
    if (rel === 'MOTHER') { if (motherId) return; setMother(p.person_id, p.full_name) }
    else if (rel === 'FATHER') { if (fatherId) return; setFather(p.person_id, p.full_name) }
    else { if (guardianIds.includes(p.person_id)) return; addGuardian(p.person_id, p.full_name) }
    setRel('')
    setLinkInputPG('')
  }

  const onPickChild = (p: PersonSearchRequest) => {
    if (!isEditing) return
    if (!childRel) return
    if (childIds.includes(p.person_id)) return
    addChild(p.person_id, p.full_name)
    setChildRel('')
    setLinkInputChild('')
  }

  /** J) Adapters (so dropdowns behave like setState) */
  const setSuffixAdapt = (u: string | ((c: string) => string)) =>
    setMany({ suffix: String(typeof u === 'function' ? u(suffix) : u) })
  const setGenderAdapt = (u: string | ((c: string) => string)) =>
    setMany({ gender: String(typeof u === 'function' ? u(gender) : u) })
  const setCivilAdapt = (u: string | ((c: string) => string)) =>
    setMany({ civilStatus: String(typeof u === 'function' ? u(civilStatus) : u) })
  const setNatAdapt = (u: string | ((c: string) => string)) =>
    setMany({ nationality: String(typeof u === 'function' ? u(nationality) : u) })
  const setReligAdapt = (u: string | ((c: string) => string)) =>
    setMany({ religion: String(typeof u === 'function' ? u(religion) : u) })
  const setEducAdapt = (u: string | ((c: string) => string)) =>
    setMany({ educattainment: String(typeof u === 'function' ? u(educattainment) : u) })
  const setEmpAdapt = (u: string | ((c: string) => string)) =>
    setMany({ employmentstat: String(typeof u === 'function' ? u(employmentstat) : u) })
  const setIncomeAdapt = (u: string | ((c: string) => string)) =>
    setMany({ mnthlypersonalincome: String(typeof u === 'function' ? u(mnthlypersonalincome) : u) })
  const setGovAdapt = (u: string | ((c: string) => string)) =>
    setMany({ govprogrm: String(typeof u === 'function' ? u(govprogrm) : u) })

  /** K) Modal state */
  const [modal, setModal] = useState<{ visible: boolean; title: string; message?: string; variant?: ModalVariant }>({
    visible: false,
    title: '',
    message: '',
    variant: 'info',
  })
  const openModal = (opts: { title: string; message?: string; variant?: ModalVariant }) =>
    setModal({ visible: true, ...opts })
  const closeModal = () => setModal((m) => ({ ...m, visible: false }))

  /** L) Submit -> UPDATE RPC */
  const handleUpdate = async () => {
    if (!selectedPersonId) {
      openModal({ title: 'Select a resident', message: 'Search and pick a resident to update.', variant: 'warn' })
      return
    }

    const payload: UpdateResidentArgs = {
      p_person_id: selectedPersonId,
      p_performer_id: 5, // TODO: supply logged-in staff id
      p_last_name: (lname || '').trim(),
      p_first_name: (fname || '').trim(),
      p_middle_name: mname?.trim() || null,
      p_suffix: suffix?.trim() || null,
      p_birthdate: toYYYYMMDD(dob),
      p_email: email?.trim() || null,
      p_mobile_num: (mobnum || '').trim(),
      p_residency_period: 0,
      p_occupation: (occupation || '').trim(),

      p_sex_id: toIntOrNull(gender) ?? 0,
      p_civil_status_id: toIntOrNull(civilStatus) ?? 0,
      p_nationality_id: toIntOrNull(nationality) ?? 0,
      p_religion_id: toIntOrNull(religion) ?? 0,
      p_education_id: toIntOrNull(educattainment) ?? 0,
      p_employment_status_id: toIntOrNull(employmentstat) ?? 0,
      p_gov_mem_prog_id: toIntOrNull(govprogrm) ?? 0,
      p_mnthly_personal_income_id: toIntOrNull(mnthlypersonalincome) ?? 0,

      p_street: (street || '').trim(),
      p_barangay: (brgy || '').trim(),
      p_city: (city || '').trim(),
      p_purok_sitio_name: (purokSitio || '').trim(),

      p_latitude: toNumberOrNull(latitude),
      p_longitude: toNumberOrNull(longitude),

      p_mother_person_id: toIntOrNull(motherId),
      p_father_person_id: toIntOrNull(fatherId),
      p_guardian_person_ids: toIntArray(guardianIds),
      p_child_person_ids: toIntArray(childIds),

      p_is_business_owner: false,
      p_is_email_verified: false,
      p_is_id_valid: false,
    }

    try {
      await updateResident(payload)
      // After a successful save, capture the new baseline & exit edit mode
      baselineRef.current = { ...useResidentFormStore.getState() }
      setIsEditing(false)
      openModal({ title: 'Saved', message: 'Resident updated successfully.', variant: 'success' })
    } catch (err: any) {
      openModal({ title: 'Update failed', message: err?.message ?? 'Unexpected error', variant: 'error' })
    }
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="Update Resident" showNotif={false} showProfile={false} />
      <ThemedKeyboardAwareScrollView>
        {/* A. Pick resident to edit */}
        <ThemedCard>
          <ThemedText title>Find Resident</ThemedText>
          <Spacer height={8} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={searchResults}
            getLabel={(p) => (p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)}
            getSubLabel={(p) => p.address}
            inputValue={searchText}
            onInputValueChange={(t) => {
              setSearchText(t)
              search(t)
            }}
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
          <Spacer height={10} />
          <ThemedButton
            submit={false}
            disabled={!selectedPersonId}
            onPress={() => {
              // enter edit mode, capture baseline so we can highlight changes
              baselineRef.current = { ...useResidentFormStore.getState() }
              setIsEditing(true)
            }}
          >
            <ThemedText non_btn>{isEditing ? 'Editing…' : 'Edit'}</ThemedText>
          </ThemedButton>
        </ThemedCard>

        <Spacer />

        {/* B. Personal Information */}
        <ThemedCard>
          <ThemedText title>Personal Information</ThemedText>
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="First Name *"
            value={fname}
            onChangeText={(v) => setMany({ fname: v })}
            editable={isEditing}
            style={changeStyle('fname' as FieldKey)}
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Middle Name"
            value={mname}
            onChangeText={(v) => setMany({ mname: v })}
            editable={isEditing}
            style={changeStyle('mname' as FieldKey)}
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Last Name *"
            value={lname}
            onChangeText={(v) => setMany({ lname: v })}
            editable={isEditing}
            style={changeStyle('lname' as FieldKey)}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={suffixOptions}
            value={suffix}
            setValue={setSuffixAdapt}
            placeholder="Suffix"
            order={0}
            disabled={!isEditing}
            style={changeBox('suffix' as FieldKey) as any}
          />

          <Spacer height={10} />
          <ThemedText subtitle>Sex</ThemedText>
          <ThemedRadioButton
            value={gender}
            onChange={setGenderAdapt}
            options={genderOptions}
            disabled={!isEditing}
            style={changeStyle('gender' as FieldKey) as any}
          />

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Birthdate (YYYY-MM-DD) *"
            value={dob ?? ''}
            onChangeText={(v) => setMany({ dob: v })}
            editable={isEditing}
            style={changeStyle('dob' as FieldKey)}
          />

          <Spacer height={10} />
          <ThemedDropdown
            items={civilStatusOptions}
            value={civilStatus}
            setValue={setCivilAdapt}
            placeholder="Civil Status *"
            order={1}
            disabled={!isEditing}
            style={changeBox('civilStatus' as FieldKey) as any}
          />
          <Spacer height={10} />
          <ThemedDropdown
            items={nationalityOptions}
            value={nationality}
            setValue={setNatAdapt}
            placeholder="Nationality *"
            order={2}
            disabled={!isEditing}
            style={changeBox('nationality' as FieldKey) as any}
          />
          <Spacer height={10} />
          <ThemedDropdown
            items={religionOptions}
            value={religion}
            setValue={setReligAdapt}
            placeholder="Religion *"
            order={3}
            disabled={!isEditing}
            style={changeBox('religion' as FieldKey) as any}
          />

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Street"
            value={street}
            onChangeText={(v) => setMany({ street: v })}
            editable={isEditing}
            style={changeStyle('street' as FieldKey)}
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Purok / Sitio"
            value={purokSitio}
            onChangeText={(v) => setMany({ purokSitio: v })}
            editable={isEditing}
            style={changeStyle('purokSitio' as FieldKey)}
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Barangay"
            value={brgy}
            onChangeText={(v) => setMany({ brgy: v })}
            editable={isEditing}
            style={changeStyle('brgy' as FieldKey)}
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="City"
            value={city}
            onChangeText={(v) => setMany({ city: v })}
            editable={isEditing}
            style={changeStyle('city' as FieldKey)}
          />

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Latitude"
            value={latitude}
            onChangeText={(v) => setMany({ latitude: v })}
            keyboardType="numeric"
            editable={isEditing}
            style={changeStyle('latitude' as FieldKey)}
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Longitude"
            value={longitude}
            onChangeText={(v) => setMany({ longitude: v })}
            keyboardType="numeric"
            editable={isEditing}
            style={changeStyle('longitude' as FieldKey)}
          />

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Mobile Number *"
            value={mobnum}
            onChangeText={(v) => setMany({ mobnum: v })}
            keyboardType="phone-pad"
            editable={isEditing}
            style={changeStyle('mobnum' as FieldKey)}
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Email Address"
            value={email}
            onChangeText={(v) => setMany({ email: v })}
            editable={isEditing}
            style={changeStyle('email' as FieldKey)}
          />
        </ThemedCard>

        <Spacer />

        {/* C. Parent(s) / Guardian */}
        <ThemedCard>
          <ThemedText title>Parent(s) / Guardian</ThemedText>
          <Spacer height={10} />
          {/* Current links */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {motherId ? <ThemedText subtitle>{`${motherName} • MOTHER`}</ThemedText> : null}
            {fatherId ? <ThemedText subtitle>{`${fatherName} • FATHER`}</ThemedText> : null}
            {guardianIds.map((id, i) => (
              <ThemedText key={id} subtitle>{`${guardianNames[i]} • GUARDIAN`}</ThemedText>
            ))}
            {!motherId && !fatherId && guardianIds.length === 0 && (
              <ThemedText style={{ opacity: 0.6 }}>No links yet</ThemedText>
            )}
          </View>

          <Spacer height={10} />
          <ThemedDropdown
            items={relItems as any}
            value={rel}
            setValue={setRel as any}
            placeholder="Relationship"
            disabled={!isEditing}
          />
          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={linkResultsPG}
            getLabel={(p) => (p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)}
            getSubLabel={(p) => p.address}
            inputValue={linkInputPG}
            onInputValueChange={(t) => {
              setLinkInputPG(t)
              searchPG(t)
            }}
            placeholder="Search resident to link…"
            emptyText="No matches"
            onSelect={onPickPG}
            fillOnSelect={false}
            disabled={!isEditing}
          />
        </ThemedCard>

        <Spacer />

        {/* D. Children */}
        <ThemedCard>
          <ThemedText title>Children</ThemedText>
          <Spacer height={10} />
          {childIds.length ? (
            <View style={{ gap: 8 }}>
              {childNames.map((nm, idx) => (
                <View key={childIds[idx]} style={styles.childRow}>
                  <ThemedText subtitle style={changeStyle('childIds' as FieldKey)}>{`${idx + 1}. ${nm}`}</ThemedText>
                  <ThemedButton submit={false} onPress={() => isEditing && removeChild(childIds[idx])} disabled={!isEditing}>
                    <ThemedText non_btn>Remove</ThemedText>
                  </ThemedButton>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={{ opacity: 0.6 }}>No children linked</ThemedText>
          )}

          <Spacer height={10} />
          <ThemedDropdown
            items={childRelItems as any}
            value={childRel}
            setValue={setChildRel as any}
            placeholder="Relationship"
            disabled={!isEditing}
          />
          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={linkResultsChild}
            getLabel={(p) => (p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)}
            getSubLabel={(p) => p.address}
            inputValue={linkInputChild}
            onInputValueChange={(t) => {
              setLinkInputChild(t)
              searchChild(t)
            }}
            placeholder="Search child to link…"
            emptyText="No matches"
            onSelect={onPickChild}
            fillOnSelect={false}
            disabled={!isEditing}
          />
        </ThemedCard>

        <Spacer />

        {/* E. Socioeconomic */}
        <ThemedCard>
          <ThemedText title style>Socioeconomic</ThemedText>
          <Spacer height={10} />
          <ThemedDropdown
            items={educAttainmentOptions}
            value={educattainment}
            setValue={setEducAdapt}
            placeholder="Educational Attainment"
            order={0}
            disabled={!isEditing}
            style={changeBox('educattainment' as FieldKey) as any}
          />
          <Spacer height={10} />
          <ThemedDropdown
            items={empStatOptions}
            value={employmentstat}
            setValue={setEmpAdapt}
            placeholder="Employment Status"
            order={1}
            disabled={!isEditing}
            style={changeBox('employmentstat' as FieldKey) as any}
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Occupation"
            value={occupation}
            onChangeText={(v) => setMany({ occupation: v })}
            editable={isEditing}
            style={changeStyle('occupation' as FieldKey)}
          />
          <Spacer height={10} />
          <ThemedDropdown
            items={mnthlyPerosonalIncomeOptions}
            value={mnthlypersonalincome}
            setValue={setIncomeAdapt}
            placeholder="Monthly Personal Income"
            order={2}
            disabled={!isEditing}
            style={changeBox('mnthlypersonalincome' as FieldKey) as any}
          />
          <Spacer height={10} />
          <ThemedDropdown
            items={govProgOptions}
            value={govprogrm}
            setValue={setGovAdapt}
            placeholder="Government Program"
            order={3}
            disabled={!isEditing}
            style={changeBox('govprogrm' as FieldKey) as any}
          />
        </ThemedCard>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleUpdate} disabled={!selectedPersonId || !isEditing}>
            <ThemedText btn>Update Resident</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

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

export default UpdateResident

const styles = StyleSheet.create({
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})
