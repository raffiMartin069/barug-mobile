// app/(businessmodals)/bussiness_doc_req.tsx
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'

import { useAccountRole } from '@/store/useAccountRole'

import {
  getDocumentTypes,
  getPurposesByDocumentType,
  getBusinessesOwnedByPerson,
  createDocumentRequest,
  computeExemptionAmount,
  peso,
  type DocType,
  type Purpose,
  type BusinessLite,
} from '@/services/documentRequest'

/* ---------------- Types ---------------- */
type PersonMinimal = {
  person_id: number
  first_name?: string
  middle_name?: string | null
  last_name?: string
  suffix?: string | null
  mobile_number?: string | null
  email?: string | null
  address?: string | null
}

/* ---------------- Consts ---------------- */
const SUBMIT_BAR_HEIGHT = 88
const BRAND = '#310101'
const BUSINESS_DOC_NAME = 'BARANGAY BUSINESS CLEARANCE' // must match DB seed
const ICONS = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
} as const

/* ---------------- Small UI bits ---------------- */
function RowTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.iconPill}><Ionicons name={icon} size={16} color={BRAND} /></View>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  )
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

/* ---------------- Helpers ---------------- */
function mapToPersonMinimal(details: any): PersonMinimal | null {
  if (!details) return null
  return {
    person_id: Number(details.person_id ?? details.details?.person_id ?? 0),
    first_name: details.first_name ?? details.details?.first_name,
    middle_name: details.middle_name ?? details.details?.middle_name,
    last_name: details.last_name ?? details.details?.last_name,
    suffix: details.suffix ?? details.details?.suffix,
    mobile_number: details.mobile_num ?? details.details?.mobile_num ?? details.mobile_number,
    email: details.email ?? details.details?.email,
    address: [
      details.street_name ?? details.street,
      details.purok_sitio_name ?? details.purok_sitio,
      details.barangay_name ?? details.barangay,
      details.city_name ?? details.city,
    ].filter(Boolean).join(', ')
  }
}

/* ---------------- Screen ---------------- */
export default function BusinessDocRequest() {
  const router = useRouter()

  // requester (SELF only)
  const roleStore = useAccountRole()
  const role = roleStore.currentRole ?? 'resident'
  const cached = roleStore.getProfile(role)
  const [loadingMe, setLoadingMe] = useState<boolean>(!cached)
  const [me, setMe] = useState<PersonMinimal | null>(cached ? mapToPersonMinimal(cached) : null)

  useEffect(() => {
    let live = true
    ;(async () => {
      const fresh = await roleStore.ensureLoaded('resident') // keep using resident payload
      if (!live) return
      const details = fresh ?? cached
      setMe(details ? mapToPersonMinimal(details) : null)
      setLoadingMe(false)
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleStore.ensureLoaded])

  // lookups (fixed doc type)
  const [docTypes, setDocTypes] = useState<DocType[]>([])
  const [documentTypeId, setDocumentTypeId] = useState<number | null>(null)

  const [purposes, setPurposes] = useState<Purpose[]>([])
  const [purposeId, setPurposeId] = useState<number | null>(null)

  const [businesses, setBusinesses] = useState<BusinessLite[]>([])
  const [businessId, setBusinessId] = useState<number | null>(null)

  // qty/notes
  const [quantity, setQuantity] = useState<number>(1)
  const [purposeNotes, setPurposeNotes] = useState<string>('')

  // fee/waiver
  const [checkingWaiver, setCheckingWaiver] = useState<boolean>(false)
  const [exemptUnit, setExemptUnit] = useState<number>(0)

  // ui state
  const [submitting, setSubmitting] = useState(false)
  const [modal, setModal] = useState<{ visible: boolean; icon?: keyof typeof ICONS; title?: string; message?: string; primaryText?: string; onPrimary?: () => void }>({ visible: false })
  const showModal = (opts: Partial<typeof modal>) => setModal(p => ({ ...p, visible: true, ...opts }))
  const hideModal = () => setModal(p => ({ ...p, visible: false }))

  // Load doc types & auto-pick Business Clearance
  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const types = await getDocumentTypes()
        if (!live) return
        setDocTypes(types)
        const chosen = types.find(t => String(t.document_type_name).toUpperCase() === BUSINESS_DOC_NAME)
        if (chosen) setDocumentTypeId(chosen.document_type_id)
      } catch (e) {
        console.log('[getDocumentTypes] failed:', e)
      }
    })()
    return () => { live = false }
  }, [])

  // Load purposes for the fixed doc type
  useEffect(() => {
    let live = true
    ;(async () => {
      setPurposes([])
      setPurposeId(null)
      if (!documentTypeId) return
      try {
        const p = await getPurposesByDocumentType(documentTypeId)
        if (!live) return
        setPurposes(p)
      } catch (e) {
        console.log('[getPurposesByDocumentType] failed:', e)
      }
    })()
    return () => { live = false }
  }, [documentTypeId])

  // Load businesses owned by requester
  useEffect(() => {
    let live = true
    ;(async () => {
      setBusinesses([])
      setBusinessId(null)
      const pid = Number(me?.person_id || 0)
      if (!pid) return
      try {
        const list = await getBusinessesOwnedByPerson(pid)
        if (!live) return
        setBusinesses(list)
        if (list.length === 1) setBusinessId(list[0].business_id) // auto-select single business
      } catch (e) {
        console.log('[getBusinessesOwnedByPerson] failed:', e)
      }
    })()
    return () => { live = false }
  }, [me?.person_id])

  // derived
  const selectedPurpose = useMemo(
    () => purposes.find(p => p.document_purpose_id === (purposeId ?? -1)),
    [purposes, purposeId]
  )

  // purpose dropdown: show "Purpose Label • ₱fee" (like the generic screen)
  const purposeItems = useMemo(
    () => purposes.map(p => ({
      label: `${p.purpose_label}  •  ${peso((p as any).current_amount || 0)}`,
      value: p.document_purpose_id
    })),
    [purposes]
  )

  const businessItems = useMemo(
    () => businesses.map(b => ({ label: b.business_name, value: b.business_id })),
    [businesses]
  )

  const unit = Number((selectedPurpose as any)?.current_amount || 0)
  const qty = Math.max(1, Number(quantity || 1))
  const netUnit = Math.max(0, unit - (exemptUnit || 0))
  const netTotal = netUnit * qty
  const estimatedDisplay = useMemo(
    () => checkingWaiver ? 'Checking…' : peso(netTotal),
    [netTotal, checkingWaiver]
  )

  // Server waiver check (kept for parity)
  useEffect(() => {
    let live = true
    ;(async () => {
      setExemptUnit(0)
      if (!selectedPurpose || !me?.person_id) return
      const feeItemId = Number((selectedPurpose as any).fee_item_id || 0)
      if (!feeItemId) return
      try {
        setCheckingWaiver(true)
        const ex = await computeExemptionAmount(me.person_id, feeItemId, (selectedPurpose as any).default_details ?? {})
        if (!live) return
        setExemptUnit(Number(ex) || 0)
      } catch {
        if (!live) return
        setExemptUnit(0)
      } finally {
        if (live) setCheckingWaiver(false)
      }
    })()
    return () => { live = false }
  }, [me?.person_id, selectedPurpose?.document_purpose_id])

  // validation
  const inlineError = useMemo(() => {
    if (!documentTypeId) return 'Business Clearance document type is not available.'
    if (!purposeId) return 'Please select a purpose.'
    if (!businessId) return 'Please choose your business.'
    if (!quantity || quantity < 1) return 'Quantity must be at least 1.'
    return ''
  }, [documentTypeId, purposeId, businessId, quantity])

  const summaryText = useMemo(() => {
    const doc = BUSINESS_DOC_NAME
    const purp = selectedPurpose?.purpose_label
    const amount =
      netUnit === 0
        ? '₱0.00'
        : `${peso(netUnit)} × ${qty} = ${peso(netTotal)}`
    return purp ? `${doc} • ${purp} • ${amount}` : `${doc}`
  }, [selectedPurpose, netUnit, netTotal, qty])

  const niceName = (p?: PersonMinimal | null) =>
    p ? [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(' ') : '—'

  // submit
  const handleSubmit = async () => {
    const err = inlineError
    if (err) {
      showModal({ icon: 'error', title: 'Missing info', message: err, primaryText: 'OK' })
      return
    }
    try {
      setSubmitting(true)
      const requesterId = Number(me?.person_id)
      const purp = selectedPurpose
      if (!requesterId || !purp) throw new Error('Could not resolve IDs or purpose.')

      const payload = {
        requested_by: requesterId,
        on_behalf_of: null,
        is_on_behalf: false,
        business_id: businessId,
        purpose_notes: purposeNotes || null,
        lines: [{
          document_purpose_id: purp.document_purpose_id,
          quantity: qty,
          offense_no: (purp as any).default_offense_no ?? null,
          details: {
            purpose_code: (purp as any).purpose_code,
          },
        }],
      }

      const newId = await createDocumentRequest(payload as any)
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
      setSubmitting(false)
      showModal({ icon: 'error', title: 'Submission failed', message: e?.message ?? 'Unable to submit request right now.' })
    }
  }

  /* ---------------- Render ---------------- */
  return (
    <ThemedView safe>
      <ThemedAppBar title="Business Clearance" showNotif={false} showProfile={false} />

      {/* Progress */}
      <View style={styles.stepper}>
        {['Requester', 'Business', 'Purpose & Copies'].map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={styles.stepDot} />
            <ThemedText small muted numberOfLines={1} style={{ maxWidth: 98 }}>{s}</ThemedText>
            {i < 2 && <View style={styles.stepLine} />}
          </View>
        ))}
      </View>

      <ThemedKeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: SUBMIT_BAR_HEIGHT + 28 }}
        enableOnAndroid extraScrollHeight={24} keyboardShouldPersistTaps="handled"
      >
        {/* Summary chip */}
        <View style={styles.summaryChip}>
          <Ionicons name="document-text-outline" size={16} color={BRAND} />
          <ThemedText style={{ marginLeft: 6 }} weight="700">{summaryText}</ThemedText>
        </View>

        {/* Requester */}
        <ThemedCard style={{ marginTop: 10 }}>
          <View style={styles.cardHeaderRow}>
            <RowTitle icon="person-outline" title="Requester (Business Owner)" />
          </View>

          {loadingMe ? (
            <View style={[styles.loadingRow, { marginTop: 6 }]}>
              <ActivityIndicator />
              <Spacer width={8} />
              <ThemedText muted>Loading your profile…</ThemedText>
            </View>
          ) : me ? (
            <View style={styles.detailsWrap}>
              <View style={styles.row}>
                <ThemedText muted style={styles.rowLabel}>Name</ThemedText>
                <ThemedText style={styles.rowValue}>{niceName(me)}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText muted style={styles.rowLabel}>Mobile</ThemedText>
                <ThemedText style={styles.rowValue}>{me.mobile_number || '—'}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText muted style={styles.rowLabel}>Resident ID</ThemedText>
                <ThemedText style={styles.rowValue}>{me.person_id}</ThemedText>
              </View>
            </View>
          ) : (
            <ThemedText muted>Couldn’t load your details. You can still proceed.</ThemedText>
          )}
        </ThemedCard>

        {/* Business */}
        <Spacer height={12} />
        <ThemedCard>
          <RowTitle icon="briefcase-outline" title="Business" />
          <Spacer height={8} />

          <ThemedDropdown
            items={businessItems}
            value={businessId}
            setValue={(v: number) => setBusinessId(v)}
            placeholder={businessItems.length ? 'Select business' : 'No businesses found'}
            order={0}
          />
          {(!businessId && businesses.length === 0) && (
            <ThemedText small style={styles.hintText}>
              No linked businesses. You can apply for a Business Profile from your Profile → Other Services.
            </ThemedText>
          )}
        </ThemedCard>

        {/* Purpose & Copies — purpose dropdown "like this" (from generic screen) */}
        <Spacer height={12} />
        <ThemedCard>
          <RowTitle icon="document-text-outline" title="Business Information" />
          <Spacer height={8} />

          <ThemedDropdown
            items={purposeItems}
            value={purposeId}
            setValue={(v: number) => setPurposeId(v)}
            placeholder={documentTypeId ? 'Select Purpose' : 'Loading document…'}
            order={1}
          />
          {!!documentTypeId && !purposeItems.length && <ThemedText small muted>Loading purposes…</ThemedText>}
          {(!purposeId) && <ThemedText small style={styles.errorText}>Please select a purpose.</ThemedText>}

          <Spacer height={12} />
          <FeeRow
            title="Estimated Fee"
            value={estimatedDisplay}
            sub={
              selectedPurpose
                ? (exemptUnit > 0
                    ? `Base ${peso(unit)} − Waiver ${peso(exemptUnit)} = ${peso(netUnit)} • Qty ${qty}`
                    : `Base ${peso(unit)} × ${qty}`)
                : undefined
            }
          />

          <Spacer height={12} />
          <ThemedText weight="600">Copies</ThemedText>
          <Spacer height={6} />
          <QuantityPicker value={quantity} onChange={setQuantity} />

          <Spacer height={12} />
          <ThemedText weight="600">Notes to Treasurer/Clerk (optional)</ThemedText>
          <Spacer height={6} />
          <ThemedTextInput
            value={purposeNotes}
            onChangeText={setPurposeNotes}
            placeholder="E.g., renewal before end of month"
            multiline
          />

          <Spacer height={6} />
          <ThemedText small muted>Final amount is confirmed by Treasurer.</ThemedText>
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

      {/* modal */}
      <Modal visible={modal.visible} transparent animationType="fade" onRequestClose={hideModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.iconWrap}>
              <Ionicons name={(ICONS[(modal.icon || 'info') as keyof typeof ICONS] as any) || 'information-circle'} size={34} color="#fff" />
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

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  detailsWrap: { marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  rowLabel: { width: 120, color: '#6b7280' },
  rowValue: { flex: 1 },

  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND, marginRight: 6 },
  stepLine: { width: 28, height: 2, backgroundColor: 'rgba(49,1,1,0.25)', marginHorizontal: 8, borderRadius: 1 },

  summaryChip: {
    marginHorizontal: 16, marginTop: 6, marginBottom: 2,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa',
    flexDirection: 'row', alignItems: 'center'
  },

  hintText: { marginTop: 6, color: '#6b7280' },
  errorText: { color: '#C0392B', marginTop: 6 },

  iconPill: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(49,1,1,0.08)', alignItems: 'center', justifyContent: 'center' },

  feeRow: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fafafa',
  },

  fadeTop: { position: 'absolute', left: 0, right: 0, bottom: SUBMIT_BAR_HEIGHT, height: 14, backgroundColor: 'transparent' },
  submitBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SUBMIT_BAR_HEIGHT,
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  iconPill: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(49,1,1,0.08)', alignItems: 'center', justifyContent: 'center' },

  feeRowText: { fontSize: 16 },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalMsg: { textAlign: 'center', opacity: 0.8, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },
})
