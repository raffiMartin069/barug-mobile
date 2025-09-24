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
import { documentOptions } from '@/constants/formoptions'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import ClearanceAdult from './(docreq)/clearanceadult'
import ClearanceMinor from './(docreq)/clearanceminor'
import Death from './(docreq)/death'
import IndigencyAdult from './(docreq)/indigencyadult'
import IndigencyMinor from './(docreq)/indigencyminor'
import LowIncomeAdult from './(docreq)/lowincomeadult'
import LowIncomeMinor from './(docreq)/lowincomeminor'
import ResidencyAdult from './(docreq)/residencyadult'
import ResidencyMinor from './(docreq)/residencyminor'

const DOC_COMPONENTS: Record<string, React.FC> = {
  // Barangay Clearance
  brgy_clearance_adult: ClearanceAdult,
  brgy_clearance_minor: ClearanceMinor,

  // Barangay Death Certificate
  cert_death: Death,

  // Certificate of Indigency
  cert_indigency_adult: IndigencyAdult,
  cert_indigency_minor: IndigencyMinor,

  // Certificate of Low Income
  cert_lowincome_adult: LowIncomeAdult,
  cert_lowincome_minor: LowIncomeMinor,

  // Certificate of Residency
  cert_residency_adult: ResidencyAdult,
  cert_residency_minor: ResidencyMinor,
};



const RequestDoc = () => {
  const router = useRouter()

  const [document, setDocument] = useState('')
  const SelectedDocument = useMemo(() => DOC_COMPONENTS[document] ?? null, [document])

  return (
    <ThemedView safe={true}>

      <ThemedAppBar
        title='Request a Document'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText>Please fill out the form below to request a document from the barangay office.</ThemedText>
            <Spacer height={15}/>

            <ThemedDropdown
              items={documentOptions}
              value={document}
              setValue={(v: string) => setDocument(v)}
              placeholder={'Select Document Type'}
              order={0}
            />

            {SelectedDocument ? <SelectedDocument /> : null}

            <Spacer height={15}/>
        </View>

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
              <Ionicons name={(ICONS[(modal.icon || 'info') as IconKey] as any) || 'information-circle'} size={34} color="#fff" />
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

function RowTitle({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={styles.iconPill}><Ionicons name={icon} size={16} color={BRAND} /></View>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
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

  dropzone: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#d1d5db', padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#fcfcfc' },
  attachmentCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, backgroundColor: '#fff' },
  previewBox: { width: 64, height: 64, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', backgroundColor: '#f3f4f6' },
  pdfBadge: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  fadeTop: { position: 'absolute', left: 0, right: 0, bottom: SUBMIT_BAR_HEIGHT, height: 14, backgroundColor: 'transparent' },
  submitBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: SUBMIT_BAR_HEIGHT,
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },

  // Chips / banners
  chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 9999, borderWidth: 1 },
  chipOk: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  chipWarn: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
  chipNeutral: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },

  bannerOk: {
    borderWidth: 1, borderColor: '#86efac', backgroundColor: '#f0fdf4',
    borderRadius: 12, padding: 10, marginTop: 4,
  },
  bannerNeutral: {
    borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc',
    borderRadius: 12, padding: 10, marginTop: 4,
  },
  bannerText: { marginLeft: 6 },

  // modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  modalTitle: { textAlign: 'center', marginTop: 4 },
  modalMsg: { textAlign: 'center', opacity: 0.8, marginTop: 6, marginBottom: 14 },
  modalBtn: { marginTop: 4, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: BRAND },
})
