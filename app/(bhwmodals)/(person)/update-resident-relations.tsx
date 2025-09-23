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
import { useAccountRole } from '@/store/useAccountRole'
import { PersonSearchRequest } from '@/types/householdHead'
import AsyncStorage from '@react-native-async-storage/async-storage'
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

const readSingleGuardian = (d: any): MiniPerson | null => {
  const flat = coerceMini(d?.guardian_id, d?.guardian_name)
  if (flat) return flat
  const arr = Array.isArray(d?.guardians) ? d.guardians : Array.isArray(d?.guardian_list) ? d.guardian_list : null
  if (!arr?.length) return null
  const first = arr[0]
  return coerceMini(first?.person_id ?? first?.guardian_id ?? first?.id, first?.full_name ?? first?.guardian_name ?? first?.name)
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
  visible, title, message, confirmText = 'Yes', cancelText = 'Cancel', onConfirm, onCancel,
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
          {message ? (<><Spacer height={8} /><ThemedText style={{ color: COLOR.text }}>{message}</ThemedText></>) : null}
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
const Arrow = () => (<ThemedText style={{ color: COLOR.arrow, marginHorizontal: 6 }}>→</ThemedText>)
const NameChip = ({ name }: { name: string }) => (
  <View style={styles.nameChip}><ThemedText style={{ color: COLOR.text, fontSize: 13 }}>{name}</ThemedText></View>
)

const DeltaItem = ({ title, from, to, add = [], rem = [] }: {
  title: string; from?: string | null; to?: string | null; add?: string[]; rem?: string[];
}) => {
  const hasFromTo = from !== undefined || to !== undefined
  const hasLists = (add?.length ?? 0) > 0 || (rem?.length ?? 0) > 0
  if (!hasFromTo && !hasLists) return null
  return (
    <View style={styles.deltaItem}>
      <View style={styles.deltaHeaderRow}><ThemedText subtitle>{title}</ThemedText></View>
      {hasFromTo ? (
        <View style={styles.fromToRow}>
          <Badge kind="label" text="From" /><NameChip name={from || '—'} /><Arrow />
          <Badge kind="label" text="To" /><NameChip name={to || '— (clear)'} />
        </View>
      ) : null}
      {add?.length ? (
        <View style={styles.deltaLine}><Badge kind="add" text="+ Add" />
          <View style={styles.namesWrap}>{add.map((n, i) => <NameChip key={`add-${i}`} name={n} />)}</View>
        </View>
      ) : null}
      {rem?.length ? (
        <View style={styles.deltaLine}><Badge kind="remove" text="− Remove" />
          <View style={styles.namesWrap}>{rem.map((n, i) => <NameChip key={`rem-${i}`} name={n} />)}</View>
        </View>
      ) : null}
    </View>
  )
}

/* ===== Main component ===== */
const RelationsEditor = () => {
  const roleStore = useAccountRole()
  const [myPersonId, setMyPersonId] = useState<number | null>(null)
  const router = useRouter()
  const { person_id } = useLocalSearchParams<{ person_id: string }>()
  const targetId = Number(person_id)

  const [staffId, setStaffId] = useState<number | null>(null)

  // original snapshot
  const [origMother, setOrigMother] = useState<MiniPerson | null>(null)
  const [origFather, setOrigFather] = useState<MiniPerson | null>(null)
  const [origGuardian, setOrigGuardian] = useState<MiniPerson | null>(null)
  const [origChildren, setOrigChildren] = useState<MiniPerson[]>([])

  // working state
  const [mother, setMother] = useState<MiniPerson | null>(null)
  const [father, setFather] = useState<MiniPerson | null>(null)
  const [guardian, setGuardian] = useState<MiniPerson | null>(null)
  const [children, setChildren] = useState<MiniPerson[]>([])
  const [reason, setReason] = useState('')

  // search hooks
  const { results: resPG, search: searchPG } = usePersonSearchByKey()
  const { results: resChild, search: searchChild } = usePersonSearchByKey()

  // separate inputs
  const [inputMother, setInputMother] = useState('')
  const [inputFather, setInputFather] = useState('')
  const [inputGuardian, setInputGuardian] = useState('')
  const [inputChild, setInputChild] = useState('')

  // info & confirm
  const [info, setInfo] = useState<{ visible: boolean; title: string; message?: string; variant?: ModalVariant }>({
    visible: false, title: '', message: '', variant: 'info'
  })
  const openInfo = (opts: { title: string; message?: string; variant?: ModalVariant }) => setInfo({ visible: true, ...opts })
  const closeInfo = () => setInfo(m => ({ ...m, visible: false }))

  const [confirm, setConfirm] = useState<{ visible: boolean; title: string; message?: string; onYes?: () => void }>({
    visible: false, title: ''
  })
  const ask = (title: string, message: string, onYes: () => void) =>
    setConfirm({ visible: true, title, message, onYes })

  // load editor/staff
  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const me = await fetchResidentPlus()
        if (!live) return
        setStaffId(me?.staff_id ?? null)
        setMyPersonId(me?.details?.person_id ?? null)
      } catch {
        setStaffId(null)
        setMyPersonId(null)
      }
    })()
    return () => { live = false }
  }, [])

  // load current relations
  useEffect(() => {
    let live = true
    ;(async () => {
      if (!targetId) return
      const d = await fetchResidentPlusById(targetId)
      if (!live) return

      const m = readParent(d, 'mother')
      const f = readParent(d, 'father')
      const g = readSingleGuardian(d)

      const childrenRaw = d?.children ?? d?.child_list ?? []
      let c = readList(childrenRaw, ['person_id', 'child_id', 'id'], ['full_name', 'child_name', 'name'])
      if (!c.length && Array.isArray(d?.children_ids)) {
        const ids = d.children_ids as any[]
        const names = Array.isArray(d?.children_names) ? (d.children_names as any[]) : []
        c = uniqById(ids.map((id: any, idx: number) => coerceMini(id, names[idx]!)).filter(Boolean) as MiniPerson[])
      }

      setOrigMother(m); setMother(m)
      setOrigFather(f); setFather(f)
      setOrigGuardian(g); setGuardian(g)
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

  const guardianDelta = useMemo(() => {
    if (!origGuardian && !guardian) return null
    if (origGuardian?.person_id === guardian?.person_id) return null
    return { from: origGuardian?.full_name ?? null, to: guardian?.full_name ?? null }
  }, [origGuardian, guardian])

  const childrenDelta = useMemo(() => {
    const orig = toSet(origChildren)
    const now = toSet(children)
    const add = children.filter(c => !orig.has(c.person_id)).map(c => c.full_name)
    const rem = origChildren.filter(c => !now.has(c.person_id)).map(c => c.full_name)
    if (!add.length && !rem.length) return null
    return { add, rem }
  }, [origChildren, children])

  const hasAnyDelta = !!(motherDelta || fatherDelta || guardianDelta || childrenDelta)

  /* ===== Actions ===== */
  const pickAsMother = (p: MiniPerson) => {
    if (p.person_id === father?.person_id || p.person_id === guardian?.person_id) return
    if (children.some(c => c.person_id === p.person_id)) return
    setMother(p)
  }
  const pickAsFather = (p: MiniPerson) => {
    if (p.person_id === mother?.person_id || p.person_id === guardian?.person_id) return
    if (children.some(c => c.person_id === p.person_id)) return
    setFather(p)
  }
  const pickAsGuardian = (p: MiniPerson) => {
    if (p.person_id === mother?.person_id || p.person_id === father?.person_id) return
    if (children.some(c => c.person_id === p.person_id)) return
    setGuardian(p)
  }

  const clearMother = () => ask('Clear mother?', 'Do you really want to clear the current mother link?', () => setMother(null))
  const clearFather = () => ask('Clear father?', 'Do you really want to clear the current father link?', () => setFather(null))
  const clearGuardian = () => ask('Clear guardian?', 'Do you really want to clear the current guardian link?', () => setGuardian(null))

  const addChild = (p: MiniPerson) => {
    if (p.person_id === mother?.person_id || p.person_id === father?.person_id || p.person_id === guardian?.person_id) return
    if (children.some(c => c.person_id === p.person_id)) return
    setChildren(prev => uniqById([...prev, p]))
  }
  const removeChild = (id: number) =>
    ask('Remove child?', 'Do you really want to unlink this child?', () =>
      setChildren(prev => prev.filter(c => c.person_id !== id))
    )

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

    const origChildSet = toSet(origChildren)
    const nowChildSet = toSet(children)
    const children_add = [...nowChildSet].filter(id => !origChildSet.has(id))
    const children_remove = [...origChildSet].filter(id => !nowChildSet.has(id))

    const payload = {
      p_performed_by: staffId,
      p_person_id: targetId,
      p_reason: reason.trim(),
      p_mother_id: mother?.person_id ?? (origMother ? 0 : null),
      p_father_id: father?.person_id ?? (origFather ? 0 : null),
      p_guardian_id: guardian?.person_id ?? (origGuardian ? 0 : null),
      p_children_add: children_add.length ? children_add : null,
      p_children_remove: children_remove.length ? children_remove : null,
    } as const

    try {
      console.log('[Relations] payload:', payload)
      console.log('[Relations] payload (stringified):', JSON.stringify(payload, null, 2))
      await updatePersonRelations(payload)

      openInfo({ title: 'Saved', message: 'Relations updated successfully.', variant: 'success' })
      setOrigMother(mother)
      setOrigFather(father)
      setOrigGuardian(guardian)
      setOrigChildren(children)
      setReason('')

      if (myPersonId && targetId === myPersonId) {
        await roleStore.ensureLoaded('resident', { force: true })
        try {
          const raw = await AsyncStorage.getItem('role-store-v1')
          if (raw) console.log('[Relations] role-store-v1 (after refresh):', JSON.parse(raw))
        } catch {}
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

      {/* add extra bottom padding so content isn't hidden behind the sticky footer */}
      <ThemedKeyboardAwareScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Reason */}
        <ThemedCard style={[styles.card, { marginTop: 20 }]}>
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
            {mother ? <Chip text={mother.full_name} onRemove={() => ask('Clear mother?', 'Do you really want to clear the current mother link?', () => setMother(null))} /> : <ThemedText style={{ opacity: 0.6 }}>No mother linked</ThemedText>}
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
            onSelect={(p) => { pickAsMother({ person_id: Number(p.person_id), full_name: p.full_name }); setInputMother('') }}
            fillOnSelect={false}
          />

          {/* Father */}
          <Spacer height={18} />
          <ThemedText subtitle>Father</ThemedText>
          <Spacer height={6} />
          <View style={styles.chipsWrap}>
            {father ? <Chip text={father.full_name} onRemove={() => ask('Clear father?', 'Do you really want to clear the current father link?', () => setFather(null))} /> : <ThemedText style={{ opacity: 0.6 }}>No father linked</ThemedText>}
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
            onSelect={(p) => { pickAsFather({ person_id: Number(p.person_id), full_name: p.full_name }); setInputFather('') }}
            fillOnSelect={false}
          />
        </ThemedCard>

        <Spacer />

        {/* Guardian (single) */}
        <ThemedCard style={styles.card}>
          <View style={styles.headerRow}>
            <ThemedText title>Guardian</ThemedText>
            <ThemedText style={{ opacity: 0.6 }}>Optional, single</ThemedText>
          </View>

          <Spacer height={8} />
          <View style={styles.chipsWrap}>
            {guardian ? <Chip text={guardian.full_name} onRemove={() => ask('Clear guardian?', 'Do you really want to clear the current guardian link?', () => setGuardian(null))} /> : <ThemedText style={{ opacity: 0.6 }}>No guardian linked</ThemedText>}
          </View>

          <Spacer height={10} />
          <ThemedSearchSelect<PersonSearchRequest>
            items={resPG}
            getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={inputGuardian}
            onInputValueChange={(t) => { setInputGuardian(t); searchPG(t) }}
            placeholder="Search to set guardian…"
            emptyText="No matches"
            onSelect={(p) => {
              pickAsGuardian({ person_id: Number(p.person_id), full_name: p.full_name })
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
            onSelect={(p) => { addChild({ person_id: Number(p.person_id), full_name: p.full_name }); setInputChild('') }}
            fillOnSelect={false}
          />
        </ThemedCard>

        {/* Pending Changes */}
        {hasAnyDelta ? (
          <>
            <Spacer />
            <ThemedCard style={styles.pendingCard}>
              <ThemedText title>Pending Changes</ThemedText>
              <Spacer height={8} />
              <DeltaItem title="Mother"   from={motherDelta?.from ?? undefined}   to={motherDelta?.to ?? undefined} />
              <DeltaItem title="Father"   from={fatherDelta?.from ?? undefined}   to={fatherDelta?.to ?? undefined} />
              <DeltaItem title="Guardian" from={guardianDelta?.from ?? undefined} to={guardianDelta?.to ?? undefined} />
              <DeltaItem title="Children" add={childrenDelta?.add ?? []} rem={childrenDelta?.rem ?? []} />
            </ThemedCard>
          </>
        ) : null}
      </ThemedKeyboardAwareScrollView>

      {/* Sticky Footer Actions */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <ThemedButton onPress={() => router.back()} style={[styles.footerBtn, styles.footerBtnSecondary]}>
            <ThemedText btn style={{ color: COLOR.primary }}>Back</ThemedText>
          </ThemedButton>
          <ThemedButton onPress={handleSave} style={[styles.footerBtn, styles.footerBtnPrimary]}>
            <ThemedText btn style={{ color: COLOR.primaryText }}>Save Relations</ThemedText>
          </ThemedButton>
        </View>
      </View>

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

      {/* Confirm modal */}
      <ConfirmDialog
        visible={confirm.visible}
        title={confirm.title}
        message={confirm.message}
        confirmText="Yes, continue"
        cancelText="Cancel"
        onConfirm={() => { confirm.onYes?.(); setConfirm({ visible: false, title: '' }) }}
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

  /* Sticky footer */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    backgroundColor: COLOR.surface,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 45, // space for home indicator on iOS; tweak if needed
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerBtn: {
    flex: 1,
  },
  footerBtnSecondary: {
    backgroundColor: COLOR.surface,
    borderWidth: 1,
    borderColor: COLOR.border,
  },
  footerBtnPrimary: {
    backgroundColor: COLOR.primary,
  },
})
