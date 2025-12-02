// app/(resident)/SocioeconomicInfo.tsx
import NiceModal from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import {
  educAttainmentOptions,
  empStatOptions,
  govProgOptions,
  mnthlyPerosonalIncomeOptions,
} from '@/constants/formoptions'
import { useResidentFormStore } from '@/store/forms'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

/** Required flags */
const REQUIRED = {
  educattainment: false,
  employmentstat: true,
  occupation: false,
  mnthlypersonalincome: true,
} as const

const LABELS: Record<keyof typeof REQUIRED, string> = {
  educattainment: 'Educational Attainment',
  employmentstat: 'Employment Status',
  occupation: 'Occupation',
  mnthlypersonalincome: 'Monthly Personal Income',
}

/** Persist gov programs as CSV to keep your store untouched */
const asCsv = (arr: string[]) => arr.join(',')
const fromCsv = (csv?: string | null) =>
  (csv?.trim() ? csv.split(',').map(s => s.trim()).filter(Boolean) : []) as string[]

/** Theme (matches your maroon header) */
const BRAND = '#7a1212'
const BRAND_700 = '#4a0a0a'
const SURFACE = '#ffffff'
const WASH = '#fafafa'
const OUTLINE = '#e5e7eb'
const INK = '#0f172a'

/* ---------- Tiny UI primitives ---------- */
function ChoiceTile({
  title,
  icon,
  selected,
  onPress,
  testID,
}: {
  title: string
  icon: keyof typeof Ionicons.glyphMap
  selected: boolean
  onPress: () => void
  testID?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: '#00000011' }}
      style={[
        styles.tile,
        { borderColor: selected ? BRAND : OUTLINE, backgroundColor: selected ? '#fff6f6' : SURFACE },
        selected && styles.tileSelectedShadow,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.tileIconWrap,
          { backgroundColor: selected ? BRAND : WASH, borderColor: selected ? BRAND_700 : OUTLINE },
        ]}
      >
        <Ionicons name={icon} size={16} color={selected ? SURFACE : INK} />
      </View>
      <ThemedText non_btn style={[styles.tileLabel, { color: selected ? BRAND_700 : INK }]}>
        {title}
      </ThemedText>
    </Pressable>
  )
}

function CheckRow({
  label,
  selected,
  onPress,
  disabled = false,
  testID,
}: {
  label: string
  selected: boolean
  onPress: () => void
  disabled?: boolean
  testID?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      android_ripple={{ color: '#00000011' }}
      style={[styles.checkRow, disabled && { opacity: 0.55 }]}
      testID={testID}
    >
      <View
        style={[
          styles.checkboxBox,
          {
            backgroundColor: selected ? BRAND : SURFACE,
            borderColor: selected ? BRAND_700 : BRAND,
          },
        ]}
      >
        {selected && <Ionicons name="checkmark" size={14} color={SURFACE} />}
      </View>
      <ThemedText non_btn style={[styles.checkLabel, { color: INK }]}>{label}</ThemedText>
    </Pressable>
  )
}

/* ---------- Screen ---------- */
const SocioeconomicInfo = () => {
  const router = useRouter()
  const {
    educattainment,
    employmentstat,
    occupation,
    mnthlypersonalincome,
    govprogrm, // CSV ("1,3,5")
    residencyMonth,
    residencyYear,
    setMany,
  } = useResidentFormStore()

  // Set default to current month/year if not set
  React.useEffect(() => {
    if (!residencyMonth || !residencyYear) {
      const now = new Date()
      setMany({
        residencyMonth: residencyMonth || String(now.getMonth() + 1),
        residencyYear: residencyYear || String(now.getFullYear())
      })
    }
  }, [])

  const [isStudent, setIsStudent] = useState<boolean>(false)
  const [selectedGovs, setSelectedGovs] = useState<string[]>(() => fromCsv(govprogrm))

  // Auto-flag student if employment status == '4' (Student)
  useEffect(() => {
    if (employmentstat === '4') setIsStudent(true)
  }, [employmentstat])

  // Modal
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'info' as 'info' | 'success' | 'warn' | 'error',
  })
  const closeModal = () => setModal(m => ({ ...m, visible: false }))

  // Store adapters
  const setEduc = (next: string | ((curr: string) => string)) =>
    setMany({ educattainment: String(typeof next === 'function' ? next(educattainment) : next) })
  const setEmp = (next: string | ((curr: string) => string)) =>
    setMany({ employmentstat: String(typeof next === 'function' ? next(employmentstat) : next) })
  const setIncome = (next: string | ((curr: string) => string)) =>
    setMany({ mnthlypersonalincome: String(typeof next === 'function' ? next(mnthlypersonalincome) : next) })
  const setOcc = (v: string) => setMany({ occupation: v })
  
  const setResidencyMonth = (v: string | ((curr: string) => string)) => {
    const value = typeof v === 'function' ? v(residencyMonth) : v
    console.log('[SocioeconomicInfo] Setting residency month:', value)
    setMany({ residencyMonth: value })
  }
  const setResidencyYear = (v: string | ((curr: string) => string)) => {
    const value = typeof v === 'function' ? v(residencyYear) : v
    console.log('[SocioeconomicInfo] Setting residency year:', value)
    setMany({ residencyYear: value })
  }
  
  // Log current values whenever they change
  React.useEffect(() => {
    console.log('[SocioeconomicInfo] Current residency values:', { residencyMonth, residencyYear })
  }, [residencyMonth, residencyYear])

  // Government Programs
  const NONE_VALUE = '7'
  const optionsNoNone = useMemo(() => govProgOptions.filter(o => o.value !== NONE_VALUE), [])

  const toggleGov = (val: string) => {
    setSelectedGovs(prev => {
      if (val === NONE_VALUE) return [NONE_VALUE]                    // None wipes others
      const base = prev.includes(NONE_VALUE) ? [] : [...prev]
      return base.includes(val) ? base.filter(v => v !== val) : [...base, val]
    })
  }
  const isGovSelected = (val: string) => selectedGovs.includes(val)
  const isNoneSelected = selectedGovs.includes(NONE_VALUE)
  const selectedCount = isNoneSelected ? 0 : selectedGovs.length
  const clearGov = () => setSelectedGovs([])

  // Submit
  const handleSubmit = () => {
    const isEmpty = (v?: string | null) => !v || String(v).trim() === ''
    const missing: string[] = []
    if (REQUIRED.educattainment && isEmpty(educattainment)) missing.push(LABELS.educattainment)
    if (REQUIRED.employmentstat && isEmpty(employmentstat)) missing.push(LABELS.employmentstat)
    if (REQUIRED.occupation && isEmpty(occupation)) missing.push(LABELS.occupation)
    if (REQUIRED.mnthlypersonalincome && isEmpty(mnthlypersonalincome)) missing.push(LABELS.mnthlypersonalincome)
    if (isEmpty(residencyMonth) || isEmpty(residencyYear)) missing.push('Residency Period')

    if (missing.length) {
      setModal({
        visible: true,
        title: 'Required Field',
        message: `Missing: ${missing.join(', ')}`,
        variant: 'error',
      })
      return
    }

    const csv = asCsv(isNoneSelected ? [NONE_VALUE] : selectedGovs)
    setMany({ govprogrm: csv })

    router.push({
      pathname: '/reviewinputsprofile',
      params: { isStudent: isStudent ? '1' : '0' },
    })
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="Socioeconomic Information" showNotif={false} showProfile={false} />
      <ThemedProgressBar step={4} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedDropdown
            items={educAttainmentOptions}
            value={educattainment}
            setValue={setEduc}
            placeholder={`Educational Attainment${REQUIRED.educattainment ? ' *' : ''}`}
            order={0}
          />

          <ThemedDropdown
            items={empStatOptions.filter(opt => opt.value !== '4')}
            value={employmentstat}
            setValue={setEmp}
            placeholder={`Employment Status${REQUIRED.employmentstat ? ' *' : ''}`}
            order={1}
          />

          <Spacer height={10} />

          <ThemedTextInput
            placeholder={`Occupation${REQUIRED.occupation ? ' *' : ''}`}
            value={occupation}
            onChangeText={setOcc}
          />

          <ThemedDropdown
            items={mnthlyPerosonalIncomeOptions}
            value={mnthlypersonalincome}
            setValue={setIncome}
            placeholder={`Monthly Personal Income${REQUIRED.mnthlypersonalincome ? ' *' : ''}`}
            order={2}
          />

          <Spacer height={10} />

          {/* --- Residency Period --- */}
          <View style={styles.card}>
            <ThemedText subtitle>When did you start being a resident in Sto. Niño? *</ThemedText>
            <Spacer height={8} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <ThemedDropdown
                  items={[
                    { label: 'January', value: '1' }, { label: 'February', value: '2' },
                    { label: 'March', value: '3' }, { label: 'April', value: '4' },
                    { label: 'May', value: '5' }, { label: 'June', value: '6' },
                    { label: 'July', value: '7' }, { label: 'August', value: '8' },
                    { label: 'September', value: '9' }, { label: 'October', value: '10' },
                    { label: 'November', value: '11' }, { label: 'December', value: '12' },
                  ]}
                  value={residencyMonth}
                  setValue={setResidencyMonth}
                  placeholder="Month"
                  order={3}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedDropdown
                  items={Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return { label: String(year), value: String(year) }
                  })}
                  value={residencyYear}
                  setValue={setResidencyYear}
                  placeholder="Year"
                  order={4}
                />
              </View>
            </View>
          </View>

          <Spacer height={10} />

          {/* --- Student choice (compact tiles) --- */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <ThemedText subtitle>Are you still a student?</ThemedText>
              <View style={[styles.badge, { backgroundColor: BRAND }]}>
                <ThemedText non_btn style={{ color: SURFACE, fontWeight: '700', fontSize: 11 }}>
                  {isStudent ? 'Yes' : 'No'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.tileRow}>
              <ChoiceTile
                title="Yes"
                icon="school-outline"
                selected={isStudent}
                onPress={() => setIsStudent(true)}
                testID="student-yes"
              />
              <ChoiceTile
                title="No"
                icon="close-circle-outline"
                selected={!isStudent}
                onPress={() => setIsStudent(false)}
                testID="student-no"
              />
            </View>
          </View>

          <Spacer height={10} />

          {/* --- Government programs (checklist) --- */}
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <ThemedText subtitle>Government Programs</ThemedText>
              <View style={styles.headRight}>
                <View style={styles.countBadge}>
                  <ThemedText non_btn style={styles.countText}>
                    {selectedCount} selected
                  </ThemedText>
                </View>
                <Pressable onPress={clearGov} android_ripple={{ color: '#00000011' }} style={styles.clearBtn}>
                  <Ionicons name="close-circle-outline" size={16} color={INK} />
                  <ThemedText non_btn style={styles.clearText}>Clear</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.list}>
              <CheckRow
                label="None"
                selected={isNoneSelected}
                onPress={() => toggleGov(NONE_VALUE)}
                testID="gov-none"
              />

              {optionsNoNone.map(opt => (
                <CheckRow
                  key={opt.value}
                  label={opt.label}
                  selected={isGovSelected(opt.value)}
                  onPress={() => toggleGov(opt.value)}
                  disabled={isNoneSelected}
                  testID={`gov-${opt.value}`}
                />
              ))}
            </View>

            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={14} color={INK} />
              <ThemedText non_btn style={styles.hintText}>
                Selecting “None” disables the other options.
              </ThemedText>
            </View>
          </View>
        </View>

        <Spacer height={16} />

        <View>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      <NiceModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        onPrimary={closeModal}
        onClose={closeModal}
      />
    </ThemedView>
  )
}

export default SocioeconomicInfo

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: "#441010ff",
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 10,                  // ⬅️ smaller
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,              // ⬅️ tighter
  },
  badge: {
    paddingHorizontal: 8,         // ⬅️ smaller
    paddingVertical: 2,
    borderRadius: 999,
  },

  /* tiles (compact) */
  tileRow: {
    flexDirection: 'row',
    gap: 8,                       // ⬅️ tighter
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,             // ⬅️ smaller radius
    paddingVertical: 10,          // ⬅️ less height
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,                // ⬅️ compact footprint
  },
  tileSelectedShadow: {
    shadowColor: BRAND_700,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tileIconWrap: {
    width: 28,                    // ⬅️ smaller icon container
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileLabel: {
    fontWeight: '700',
    fontSize: 14,                 // ⬅️ slightly smaller text
  },

  /* checklist */
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  countBadge: {
    backgroundColor: WASH,
    borderWidth: 1,
    borderColor: OUTLINE,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
    opacity: 0.8,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: WASH,
    borderWidth: 1,
    borderColor: OUTLINE,
  },
  clearText: { fontSize: 12 },

  list: {
    borderWidth: 1,
    borderColor: OUTLINE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: OUTLINE,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkLabel: {
    fontWeight: '600',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginTop: 8,
  },
  hintText: { fontSize: 12, opacity: 0.8 },
})