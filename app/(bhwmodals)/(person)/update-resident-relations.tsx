// app/(bhwmodals)/(person)/update-resident-relations.tsx
// app/(bhwmodals)/(person)/update-resident-relations.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { fetchResidentPlus, fetchResidentPlusById, updatePersonRelations } from '@/services/profile'
import { useAccountRole } from '@/store/useAccountRole'; // ✅ NEW
import { PersonSearchRequest } from '@/types/householdHead'
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ NEW
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

/* ===== Theme ===== */
const COLOR = {
  primary: '#4A0E0E',
  primaryText: '#FFFFFF',
  border: '#EAEAEA',
  surface: '#FFFFFF',
  text: '#222222',
  hint: '#6B7280',
  chipBg: '#F9F1F1',
  chipBorder: '#E9D8D8',
  chipXBg: '#F1E2E2',
  warn: '#B71C1C',
  add: '#0B5ED7',
  mutedSurface: '#FEFCFC',
  badgeAddBg: '#E8F1FF',
  badgeAddText: '#0B5ED7',
  badgeRemBg: '#FFEAEA',
  badgeRemText: '#B71C1C',
  arrow: '#6B7280',
}

/* ===== Types & helpers ===== */
type MiniPerson = { person_id: number; full_name: string }

const uniqById = (arr: MiniPerson[]) => {
  const seen = new Set<number>()
  return arr.filter(x => (seen.has(x.person_id) ? false : (seen.add(x.person_id), true)))
}
const toSet = (arr: MiniPerson[]) => new Set(arr.map(x => x.person_id))

const coerceMini = (idLike: any, nameLike: any): MiniPerson | null => {
  const idNum = Number(idLike)
  if (!Number.isFinite(idNum) || idNum <= 0) return null
  const name = nameLike != null && String(nameLike).trim() ? String(nameLike) : `#${idNum}`
  return { person_id: idNum, full_name: String(name) }
}

const readParent = (d: any, role: 'mother' | 'father'): MiniPerson | null => {
  const obj = d?.[role]
  const id =
    d?.[`${role}_id`] ??
    obj?.person_id ??
    obj?.[`${role}_id`]

  const name =
    d?.[`${role}_name`] ??
    obj?.full_name ??
    obj?.name

  return coerceMini(id, name)
}

const readList = (arrLike: any, idKeys: string[], nameKeys: string[]): MiniPerson[] => {
  if (!arrLike) return []
  const arr = Array.isArray(arrLike) ? arrLike : []
  return uniqById(
    arr
      .map((x: any) => {
        const idKey = idKeys.find(k => x?.[k] != null)
        const id = idKey ? x[idKey] : null
        const nameKey = nameKeys.find(k => x?.[k] != null)
        const name = nameKey ? x[nameKey] : null
        return coerceMini(id, name)
      })
      .filter(Boolean) as MiniPerson[]
  )
}

/* ===== Confirm dialog with working cancel ===== */
function ConfirmDialog({
  visible,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  visible: boolean
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <ThemedText title>{title}</ThemedText>
          {message ? (
            <>
              <Spacer height={8} />
              <ThemedText style={{ color: COLOR.text }}>{message}</ThemedText>
            </>
          ) : null}
          <Spacer height={14} />
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <ThemedButton onPress={onCancel} style={{ backgroundColor: '#F3F4F6' }}>
              <ThemedText btn style={{ color: COLOR.text }}>{cancelText}</ThemedText>
            </ThemedButton>
            <ThemedButton onPress={onConfirm} style={{ backgroundColor: COLOR.primary }}>
              <ThemedText btn style={{ color: COLOR.primaryText }}>{confirmText}</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </View>
    </Modal>
  )
}

/* ===== Tiny UI atoms for Pending Changes ===== */
const Badge = ({ kind, text }: { kind: 'add' | 'remove' | 'label', text: string }) => {
  const style =
    kind === 'add'
      ? { bg: COLOR.badgeAddBg, fg: COLOR.badgeAddText }
      : kind === 'remove'
        ? { bg: COLOR.badgeRemBg, fg: COLOR.badgeRemText }
        : { bg: '#F3F4F6', fg: COLOR.text }
  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.bg }]}>
      <ThemedText style={{ color: style.fg, fontSize: 12 }}>{text}</ThemedText>
    </View>
  )
}

const Arrow = () => (
  <ThemedText style={{ color: COLOR.arrow, marginHorizontal: 6 }}>→</ThemedText>
)

const NameChip = ({ name }: { name: string }) => (
  <View style={styles.nameChip}>
    <ThemedText style={{ color: COLOR.text, fontSize: 13 }}>{name}</ThemedText>
  </View>
)

const DeltaItem = ({
  title,
  from,
  to,
  add = [],
  rem = [],
}: {
  title: string
  from?: string | null
  to?: string | null
  add?: string[]
  rem?: string[]
}) => {
  const hasFromTo = from !== undefined || to !== undefined
  const hasLists = (add?.length ?? 0) > 0 || (rem?.length ?? 0) > 0
  if (!hasFromTo && !hasLists) return null

  return (
    <View style={styles.deltaItem}>
      <View style={styles.deltaHeaderRow}>
        <ThemedText subtitle>{title}</ThemedText>
      </View>

      {hasFromTo ? (
        <View style={styles.fromToRow}>
          <Badge kind="label" text="From" />
          <NameChip name={from || '—'} />
          <Arrow />
          <Badge kind="label" text="To" />
          <NameChip name={to || '— (clear)'} />
        </View>
      ) : null}

      {add && add.length ? (
        <View style={styles.deltaLine}>
          <Badge kind="add" text="+ Add" />
          <View style={styles.namesWrap}>
            {add.map((n, i) => <NameChip key={`add-${i}`} name={n} />)}
          </View>
        </View>
      ) : null}

      {rem && rem.length ? (
        <View style={styles.deltaLine}>
          <Badge kind="remove" text="− Remove" />
          <View style={styles.namesWrap}>
            {rem.map((n, i) => <NameChip key={`rem-${i}`} name={n} />)}
          </View>
        </View>
      ) : null}
    </View>
  )
}

/* ===== Main component ===== */
const RelationsEditor = () => {
  // inside RelationsEditor component
  const roleStore = useAccountRole()               // ✅ NEW
  const [myPersonId, setMyPersonId] = useState<number | null>(null) // ✅ NEW
  const router = useRouter()
  const { person_id } = useLocalSearchParams<{ person_id: string }>()
  const targetId = Number(person_id)

  const [staffId, setStaffId] = useState<number | null>(null)

  // original snapshot
  const [origMother, setOrigMother] = useState<MiniPerson | null>(null)
  const [origFather, setOrigFather] = useState<MiniPerson | null>(null)
  const [origGuardians, setOrigGuardians] = useState<MiniPerson[]>([])
  const [origChildren, setOrigChildren] = useState<MiniPerson[]>([])

  // working state
  const [mother, setMother] = useState<MiniPerson | null>(null)
  const [father, setFather] = useState<MiniPerson | null>(null)
  const [guardians, setGuardians] = useState<MiniPerson[]>([])
  const [children, setChildren] = useState<MiniPerson[]>([])
  const [reason, setReason] = useState('')

  // search hooks
  const { results: resPG, search: searchPG } = usePersonSearchByKey()
  const { results: resChild, search: searchChild } = usePersonSearchByKey()

  // separate inputs so fields don’t share text
  const [inputMother, setInputMother] = useState('')
  const [inputFather, setInputFather] = useState('')
  const [inputGuardian, setInputGuardian] = useState('')
  const [inputChild, setInputChild] = useState('')

  // info modal
  const [info, setInfo] = useState<{ visible: boolean; title: string; message?: string; variant?: ModalVariant }>({
    visible: false, title: '', message: '', variant: 'info'
  })
  const openInfo = (opts: { title: string; message?: string; variant?: ModalVariant }) => setInfo({ visible: true, ...opts })
  const closeInfo = () => setInfo(m => ({ ...m, visible: false }))

  // confirm dialog
  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message?: string; onYes?: () => void }>({
    visible: false, title: ''
  })
  const ask = (title: string, message: string, onYes: () => void) =>
    setConfirm({ visible: true, title, message, onYes })

  // load editor/staff
  // load editor/staff
  useEffect(() => {
    let live = true
      ; (async () => {
        try {
          const me = await fetchResidentPlus()
          if (!live) return
          setStaffId(me?.staff_id ?? null)
          setMyPersonId(me?.details?.person_id ?? null)    // ✅ NEW
        } catch {
          setStaffId(null)
          setMyPersonId(null)                               // ✅ NEW
        }
      })()
    return () => { live = false }
  }, [])

  // load current relations
  useEffect(() => {
    let live = true
      ; (async () => {
        if (!targetId) return
        const d = await fetchResidentPlusById(targetId)
        if (!live) return

        const m = readParent(d, 'mother')
        const f = readParent(d, 'father')

        const guardiansRaw = d?.guardians ?? d?.guardian_list ?? d?.guardian ?? []
        let g = readList(guardiansRaw, ['person_id', 'guardian_id', 'id'], ['full_name', 'guardian_name', 'name'])
        const flatGuardian = coerceMini(d?.guardian_id, d?.guardian_name)
        if (flatGuardian) g = uniqById([...g, flatGuardian])

        const childrenRaw = d?.children ?? d?.child_list ?? []
        let c = readList(childrenRaw, ['person_id', 'child_id', 'id'], ['full_name', 'child_name', 'name'])
        if (!c.length && Array.isArray(d?.children_ids)) {
          const ids = d.children_ids as any[]
          const names = Array.isArray(d?.children_names) ? (d.children_names as any[]) : []
          c = uniqById(ids.map((id: any, idx: number) => coerceMini(id, names[idx]!)).filter(Boolean) as MiniPerson[])
        }

        setOrigMother(m); setMother(m)
        setOrigFather(f); setFather(f)
        setOrigGuardians(g); setGuardians(g)
        setOrigChildren(c); setChildren(c)
      })()
    return () => { live = false }
  }, [targetId])

  /* ===== Pending Differences ===== */
  const motherDelta = useMemo(() => {
    if (!origMother && !mother) return null
    if (origMother?.person_id === mother?.person_id) return null
    return { from: origMother?.full_name ?? null, to: mother?.full_name ?? null }
  }, [origMother, mother])

  const fatherDelta = useMemo(() => {
    if (!origFather && !father) return null
    if (origFather?.person_id === father?.person_id) return null
    return { from: origFather?.full_name ?? null, to: father?.full_name ?? null }
  }, [origFather, father])

  const guardiansDelta = useMemo(() => {
    const orig = toSet(origGuardians)
    const now = toSet(guardians)
    const add = guardians.filter(g => !orig.has(g.person_id)).map(g => g.full_name)
    const rem = origGuardians.filter(g => !now.has(g.person_id)).map(g => g.full_name)
    if (!add.length && !rem.length) return null
    return { add, rem }
  }, [origGuardians, guardians])

  const childrenDelta = useMemo(() => {
    const orig = toSet(origChildren)
    const now = toSet(children)
    const add = children.filter(c => !orig.has(c.person_id)).map(c => c.full_name)
    const rem = origChildren.filter(c => !now.has(c.person_id)).map(c => c.full_name)
    if (!add.length && !rem.length) return null
    return { add, rem }
  }, [origChildren, children])

  const hasAnyDelta = !!(motherDelta || fatherDelta || guardiansDelta || childrenDelta)

  /* ===== Actions ===== */
  const addGuardian = (p: MiniPerson) => {
    if (p.person_id === mother?.person_id || p.person_id === father?.person_id) return
    if (guardians.some(g => g.person_id === p.person_id)) return
    setGuardians(prev => uniqById([...prev, p]))
  }
  const removeGuardian = (id: number) =>
    ask('Remove guardian?', 'Do you really want to remove this guardian?', () =>
      setGuardians(prev => prev.filter(g => g.person_id !== id))
    )

  const addChild = (p: MiniPerson) => {
    if (children.some(c => c.person_id === p.person_id)) return
    setChildren(prev => uniqById([...prev, p]))
  }
  const removeChild = (id: number) =>
    ask('Remove child?', 'Do you really want to unlink this child?', () =>
      setChildren(prev => prev.filter(c => c.person_id !== id))
    )

  const pickAsMother = (p: MiniPerson) => {
    if (p.person_id === father?.person_id) return
    if (children.some(c => c.person_id === p.person_id)) return
    setMother(p)
  }
  const pickAsFather = (p: MiniPerson) => {
    if (p.person_id === mother?.person_id) return
    if (children.some(c => c.person_id === p.person_id)) return
    setFather(p)
  }

  const clearMother = () =>
    ask('Clear mother?', 'Do you really want to clear the current mother link?', () => setMother(null))
  const clearFather = () =>
    ask('Clear father?', 'Do you really want to clear the current father link?', () => setFather(null))

  const handleSave = async () => {
    if (!targetId) {
      openInfo({ title: 'No resident', message: 'Missing target resident.', variant: 'warn' })
      return
    }
    if (!staffId) {
      openInfo({ title: 'Not allowed', message: 'Only staff can edit relations.', variant: 'error' })
      return
    }
    if (!reason.trim()) {
      openInfo({ title: 'Reason required', message: 'Please provide reason/remarks for audit trail.', variant: 'warn' })
      return
    }

    // children delta to ids
    const origChildSet = toSet(origChildren)
    const nowChildSet = toSet(children)
    const children_add = [...nowChildSet].filter(id => !origChildSet.has(id))
    const children_remove = [...origChildSet].filter(id => !nowChildSet.has(id))

    const payload = {
      p_performed_by: staffId,
      p_person_id: targetId,
      p_reason: reason.trim(),
      // 0 means CLEAR link if there used to be one; null means NO-OP
      p_mother_id: mother?.person_id ?? (origMother ? 0 : null),
      p_father_id: father?.person_id ?? (origFather ? 0 : null),
      // Backend currently accepts only a single guardian id; UI supports many.
      // Leaving this null => no change on server-side guardian linkage.
      p_guardian_id: null,
      p_children_add: children_add.length ? children_add : null,
      p_children_remove: children_remove.length ? children_remove : null,
    }

    try {

      // debug logs (optional but handy)
      console.log('[Relations] targetId:', targetId, 'staffId:', staffId)
      console.log('[Relations] deltas:', {
        motherDelta,
        fatherDelta,
        guardiansDelta,
        childrenDelta,
      })
      console.log('[Relations] payload:', payload)
      console.log('[Relations] payload (stringified):', JSON.stringify(payload, null, 2))


      await updatePersonRelations(payload)
      openInfo({ title: 'Saved', message: 'Relations updated successfully.', variant: 'success' })
      setOrigMother(mother)
      setOrigFather(father)
      setOrigGuardians(guardians)
      setOrigChildren(children)
      setReason('')

      // ✅ NEW — if user just edited their own relations, refresh role-store cache
      if (myPersonId && targetId === myPersonId) {
        await roleStore.ensureLoaded('resident', { force: true })
        try {
          const raw = await AsyncStorage.getItem('role-store-v1')
          if (raw) console.log('[Relations] role-store-v1 (after refresh):', JSON.parse(raw))
        } catch { }
      }

    } catch (err: any) {
      console.error('[Relations] update failed', err)
      openInfo({ title: 'Update failed', message: err?.message ?? 'Unexpected error', variant: 'error' })
    }
  }

  /* ===== Chips for current state ===== */
  const Chip = ({ text, onRemove }: { text: string; onRemove?: () => void }) => (
    <View style={styles.chip}>
      <ThemedText style={styles.chipText}>{text}</ThemedText>
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.chipClose} hitSlop={8}>
          <ThemedText style={styles.chipCloseText}>×</ThemedText>
        </Pressable>
      ) : null}
    </View>
  )

  return (
    <ThemedView safe>
      <ThemedAppBar title="Manage Relations" showNotif={false} showProfile={false} />
      <ThemedKeyboardAwareScrollView>

        {/* Reason */}
        <ThemedCard style={styles.card}>
          <ThemedText title>Reason / Remarks</ThemedText>
          <Spacer height={8} />
          <ThemedTextInput
            placeholder="Explain why these relation changes are needed…"
            value={reason}
            onChangeText={setReason}
            multiline
          />
        </ThemedCard>

        <Spacer />

        {/* Parents */}
        <ThemedCard style={styles.card}>
          <View style={styles.headerRow}>
            <ThemedText title>Parents</ThemedText>
            <ThemedText style={{ opacity: 0.6 }}>Pick exactly 0–1 for each</ThemedText>
          </View>

          {/* Mother */}
          <Spacer height={10} />
          <ThemedText subtitle>Mother</ThemedText>
          <Spacer height={6} />
          <View style={styles.chipsWrap}>
            {mother ? <Chip text={mother.full_name} onRemove={clearMother} /> : <ThemedText style={{ opacity: 0.6 }}>No mother linked</ThemedText>}
          </View>
          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={resPG}
            getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={inputMother}
            onInputValueChange={(t) => { setInputMother(t); searchPG(t) }}
            placeholder="Search to set as Mother…"
            emptyText="No matches"
            onSelect={(p) => {
              setMother({ person_id: Number(p.person_id), full_name: p.full_name })
              setInputMother('')
            }}
            fillOnSelect={false}
          />

          {/* Father */}
          <Spacer height={18} />
          <ThemedText subtitle>Father</ThemedText>
          <Spacer height={6} />
          <View style={styles.chipsWrap}>
            {father ? <Chip text={father.full_name} onRemove={clearFather} /> : <ThemedText style={{ opacity: 0.6 }}>No father linked</ThemedText>}
          </View>
          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={resPG}
            getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={inputFather}
            onInputValueChange={(t) => { setInputFather(t); searchPG(t) }}
            placeholder="Search to set as Father…"
            emptyText="No matches"
            onSelect={(p) => {
              setFather({ person_id: Number(p.person_id), full_name: p.full_name })
              setInputFather('')
            }}
            fillOnSelect={false}
          />
        </ThemedCard>

        <Spacer />

        {/* Guardians */}
        <ThemedCard style={styles.card}>
          <View style={styles.headerRow}>
            <ThemedText title>Guardians</ThemedText>
            <ThemedText style={{ opacity: 0.6 }}>Zero or more</ThemedText>
          </View>

          <Spacer height={8} />
          <View style={styles.chipsWrap}>
            {guardians.length ? guardians.map(g => (
              <Chip key={g.person_id} text={g.full_name} onRemove={() => removeGuardian(g.person_id)} />
            )) : <ThemedText style={{ opacity: 0.6 }}>No guardians linked</ThemedText>}
          </View>

          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={resPG}
            getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={inputGuardian}
            onInputValueChange={(t) => { setInputGuardian(t); searchPG(t) }}
            placeholder="Search to add guardian…"
            emptyText="No matches"
            onSelect={(p) => {
              addGuardian({ person_id: Number(p.person_id), full_name: p.full_name })
              setInputGuardian('')
            }}
            fillOnSelect={false}
          />
        </ThemedCard>

        <Spacer />

        {/* Children */}
        <ThemedCard style={styles.card}>
          <ThemedText title>Children</ThemedText>
          <Spacer height={8} />
          <View style={styles.chipsWrap}>
            {children.length ? children.map(c => (
              <Chip key={c.person_id} text={c.full_name} onRemove={() => removeChild(c.person_id)} />
            )) : <ThemedText style={{ opacity: 0.6 }}>No children linked</ThemedText>}
          </View>

          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={resChild}
            getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={inputChild}
            onInputValueChange={(t) => { setInputChild(t); searchChild(t) }}
            placeholder="Search to add child…"
            emptyText="No matches"
            onSelect={(p) => {
              addChild({ person_id: Number(p.person_id), full_name: p.full_name })
              setInputChild('')
            }}
            fillOnSelect={false}
          />
        </ThemedCard>

        {/* Pending Changes (all) */}
        {hasAnyDelta ? (
          <>
            <Spacer />
            <ThemedCard style={styles.pendingCard}>
              <ThemedText title>Pending Changes</ThemedText>
              <Spacer height={8} />

              <DeltaItem
                title="Mother"
                from={motherDelta?.from ?? undefined}
                to={motherDelta?.to ?? undefined}
              />
              <DeltaItem
                title="Father"
                from={fatherDelta?.from ?? undefined}
                to={fatherDelta?.to ?? undefined}
              />
              <DeltaItem
                title="Guardians"
                add={guardiansDelta?.add ?? []}
                rem={guardiansDelta?.rem ?? []}
              />
              <DeltaItem
                title="Children"
                add={childrenDelta?.add ?? []}
                rem={childrenDelta?.rem ?? []}
              />
            </ThemedCard>
          </>
        ) : null}

        <Spacer height={20} />
        <View>
          <ThemedButton onPress={handleSave} style={{ backgroundColor: COLOR.primary }}>
            <ThemedText btn style={{ color: COLOR.primaryText }}>Save Relations</ThemedText>
          </ThemedButton>
          <Spacer height={10} />
          <ThemedButton onPress={() => router.back()} submit={false}>
            <ThemedText btn>Back</ThemedText>
          </ThemedButton>
        </View>
        <Spacer height={28} />
      </ThemedKeyboardAwareScrollView>

      {/* Info modal */}
      <NiceModal
        visible={info.visible}
        title={info.title}
        message={info.message}
        variant={info.variant}
        primaryText="OK"
        onPrimary={closeInfo}
        onClose={closeInfo}
      />

      {/* Confirm modal (working Cancel) */}
      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmText="Yes, continue"
        cancelText="Cancel"
        onConfirm={() => {
          confirm.onYes?.()
          setConfirm({ visible: false, title: '' })
        }}
        onCancel={() => setConfirm({ visible: false, title: '' })}
      />
    </ThemedView>
  )
}

export default RelationsEditor

/* ===== Styles ===== */
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.surface,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLOR.chipBg,
    borderWidth: 1,
    borderColor: COLOR.chipBorder,
  },
  chipText: { fontSize: 13, color: COLOR.text },
  chipClose: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR.chipXBg,
  },
  chipCloseText: { lineHeight: 18, fontSize: 16, color: COLOR.primary },

  /* Pending changes */
  pendingCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.mutedSurface,
    paddingBottom: 12,
    gap: 8,
  },
  deltaItem: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
  },
  deltaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fromToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  deltaLine: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  namesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  nameChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#ECECEC',
  },

  /* confirm modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLOR.border,
    backgroundColor: COLOR.surface,
    padding: 16,
  },
})
