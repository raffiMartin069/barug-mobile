// app/(profiling)/reviewinputs.tsx
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedProgressBar from '@/components/ThemedProgressBar';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

import { requestPersonVerification } from '@/api/profilingApi';
import { useProfilingWizard } from '@/store/profilingWizard';
import { useRegistrationStore } from '@/store/registrationStore';

import * as ImageManipulator from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import {
  civilStatusMap,
  educAttainmentMap,
  empStatMap,
  genderMap,
  govProgMap,
  idTypeMap,
  mnthlyPersonalIncomeMap,
  nationalityMap,
  religionMap,
} from '../../constants/formoptions';

async function compress(uri: string) {
  const { uri: out } = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return out;
}
type RNFile = { uri: string; name: string; type: string };

function normalizeDateYMD(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const cleaned = v.replace(/\bGMT[^\s)]+(?:\s*\([^)]*\))?/i, '').trim();
    const d1 = new Date(cleaned);
    if (!isNaN(d1.getTime())) {
      const y = d1.getFullYear();
      const m = String(d1.getMonth() + 1).padStart(2, '0');
      const d = String(d1.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    const t = v.indexOf('T');
    if (t > 0) return v.slice(0, 10);
    return v.slice(0, 10);
  }
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const ReviewInputs = () => {
  const router = useRouter();
  const { personal, socio, validId, setPersonal } = useProfilingWizard();
  const reg = useRegistrationStore();

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  // Seed from registration store if personal empty
  useEffect(() => {
    if (personal) return;
    const hasReg = reg.fname || reg.lname || reg.email || reg.street || reg.brgy || reg.city;
    if (!hasReg) return;

    setPersonal({
      first_name: reg.fname?.trim() || '',
      middle_name: reg.mname?.trim() || null,
      last_name: reg.lname?.trim() || '',
      suffix: reg.suffix?.trim() || null,
      date_of_birth: reg.dob ? normalizeDateYMD(reg.dob) : '',
      email: reg.email?.trim() || '',
      mobile_number: reg.mobnum?.trim() || '',
      sex_id: reg.gender === 'female' ? 2 : 1,
      civil_status_id: parseInt(reg.civilStatus || '0') || undefined,
      nationality_id: parseInt(reg.nationality || '0') || undefined,
      religion_id: parseInt(reg.religion || '0') || undefined,
      street: reg.street || '',
      purok: reg.puroksitio || '',
      barangay: reg.brgy || '',
      city: reg.city || '',
      username: reg.email?.trim() || '',
      password: reg.password?.trim() || '',
    });
  }, [personal, reg, setPersonal]);

  if (!personal) {
    return (
      <ThemedView safe>
        <ThemedAppBar title="Review Details" showNotif={false} showProfile={false} />
        <ThemedText>Missing data. Please go back to Personal Info.</ThemedText>
      </ThemedView>
    );
  }

  const displayGender = personal.sex_id === 1 ? 'male' : 'female';
  const frontUri = useMemo(() => validId?.id_front_uri || '', [validId?.id_front_uri]);
  const backUri = useMemo(() => validId?.id_back_uri || '', [validId?.id_back_uri]);
  const selfieUri = useMemo(() => validId?.id_selfie_uri || '', [validId?.id_selfie_uri]);

  const openViewer = (uri?: string | null) => { if (uri) { setViewerSrc(uri); setViewerOpen(true); } };

  const ImageRow: React.FC<{ label: string; uri?: string }> = ({ label, uri }) => (
    <View style={styles.block}>
      <Row label={label} />
      <Spacer height={10} />
      {uri ? (
        <TouchableOpacity activeOpacity={0.85} onPress={() => openViewer(uri)}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <ThemedText style={styles.tapHint}>Tap to view</ThemedText>
        </TouchableOpacity>
      ) : (
        <ThemedText subtitle>No Image Uploaded</ThemedText>
      )}
    </View>
  );

  // ---- ONLY the keys your API expects (+ names for OCR) ----
  const buildVerificationFormData = async () => {
    const fd = new FormData();

    const add = (k: string, v: any) => {
      if (v === undefined || v === null || v === '') return;
      fd.append(k, String(v));
    };

    // Required non-image fields
    add('education_id', socio?.educ_attainment_id);
    add('employment_status_id', socio?.employment_status_id);
    add('occupation', socio?.occupation);
    add('gov_mem_prog_id', socio?.gov_program_id);
    add('mnthly_personal_income_id', socio?.monthly_personal_income_id);
    add('doc_type_id', validId?.id_type_id);

    // Names to assist OCR matching (not required but used by backend)
    add('first_name', personal.first_name);
    add('last_name', personal.last_name);
    add('middle_name', personal.middle_name ?? '');

    // Files: expected keys
    const addImg = async (key: 'id_front' | 'id_back' | 'id_selfie', uri?: string) => {
      if (!uri) return;
      const c = await compress(uri);
      // @ts-expect-error RN FormData file shape for React Native
      fd.append(key, { uri: c, name: `${key}.jpg`, type: 'image/jpeg' } as RNFile);
    };

    await addImg('id_front', frontUri); // required
    await addImg('id_back', backUri);
    await addImg('id_selfie', selfieUri);

    return fd;
  };

  const onConfirmAndSubmit = async () => {
    try {
      // Client-side guard for the required fields
      if (!frontUri) {
        Alert.alert('Missing ID Front', 'Please upload the front image of the ID.');
        return;
      }

      setSubmitting(true);
      const formData = await buildVerificationFormData();

      // ✅ Use this API
      await requestPersonVerification(formData);

      Alert.alert('Success', 'Verification request submitted successfully.');
      router.push('/residenthome'); // adjust destination as needed
    } catch (err: any) {
      console.error('❌ Verification submit failed:', err);
      const msg = err?.response?.data?.error || err?.error || err?.message || 'Verification failed';
      Alert.alert('Submit Failed', String(msg));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <ThemedView safe>
      <ThemedAppBar title="Review Details" showNotif={false} showProfile={false} />
      <ThemedProgressBar step={4} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText title>Personal Information</ThemedText>

          <Row label="First Name" value={personal.first_name} />
          <Row label="Middle Name" value={personal.middle_name || ''} />
          <Row label="Last Name" value={personal.last_name} />
          <Row label="Suffix" value={personal.suffix || ''} />
          <Row label="Sex" value={genderMap[displayGender] || displayGender} />
          <Row label="Date of Birth" value={normalizeDateYMD(personal.date_of_birth)} />
          <Row label="Civil Status" value={civilStatusMap[String(personal.civil_status_id)]} />
          <Row label="Nationality" value={nationalityMap[String(personal.nationality_id)]} />
          <Row label="Religion" value={religionMap[String(personal.religion_id)]} />
          <Row label="Street" value={personal.street} />
          <Row label="Purok / Sitio" value={personal.purok} />
          <Row label="Barangay" value={personal.barangay} />
          <Row label="City" value={personal.city} />
          <Row label="Mobile Number" value={personal.mobile_number} />
          <Row label="Email Address" value={personal.email} />

          <Spacer height={20} />
          <ThemedText title>Socioeconomic Information</ThemedText>

          <Row label="Educational Attainment" value={educAttainmentMap[String(socio?.educ_attainment_id ?? '')]} />
          <Row label="Employment Status" value={empStatMap[String(socio?.employment_status_id ?? '')]} />
          <Row label="Occupation" value={socio?.occupation || ''} />
          <Row label="Monthly Personal Income" value={mnthlyPersonalIncomeMap[String(socio?.monthly_personal_income_id ?? '')]} />
          <Row label="Government Program" value={govProgMap[String(socio?.gov_program_id ?? '')]} />
          {socio?.gov_program_other ? <Row label="Gov Program (Other)" value={socio.gov_program_other} /> : null}

          <Spacer height={20} />
          <ThemedText title>Valid ID</ThemedText>
          <Row label="ID Type" value={validId?.id_type_id ? idTypeMap[String(validId.id_type_id)] : 'Not Provided'} />
          {validId?.id_number ? <Row label="ID Number" value={String(validId.id_number)} /> : null}

          <ImageRow label="Front of the ID" uri={frontUri} />
          <Spacer height={10} />
          <ImageRow label="Back of the ID" uri={backUri} />
          <Spacer height={10} />
          <ImageRow label="Selfie with ID" uri={selfieUri} />
        </View>

        <Spacer height={16} />
        <View>
          <ThemedButton onPress={() => setConfirmOpen(true)} disabled={submitting}>
            <ThemedText btn>{submitting ? 'Submitting…' : 'Confirm & Submit'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Fullscreen viewer */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerBackdrop} onPress={() => setViewerOpen(false)} />
          <View style={styles.viewerFrame}>
            {viewerSrc ? <Image source={{ uri: viewerSrc }} style={styles.viewerImage} resizeMode="contain" /> : null}
          </View>
          <ThemedButton onPress={() => setViewerOpen(false)}>
            <ThemedText btn>Close</ThemedText>
          </ThemedButton>
        </View>
      </Modal>

      {/* Confirmation checklist modal */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={{ fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
              Submission Confirmation
            </ThemedText>

            <Spacer height={12} />

            <ThemedText style={{ fontSize: 15, textAlign: 'center', lineHeight: 20 }}>
              Before submitting, please review and confirm the following:
            </ThemedText>

            <Spacer height={12} />

            {/* Checklist */}
            <View style={styles.list}>
              <View style={styles.listRow}>
                <ThemedText style={styles.listNum}>1.</ThemedText>
                <ThemedText style={styles.listText}>
                  Please make sure your <ThemedText style={{ fontWeight: '700' }}>full name</ThemedText> exactly matches the name on your
                  valid ID (including middle name/initial and suffix, if any).
                </ThemedText>
              </View>

              <View style={styles.listRow}>
                <ThemedText style={styles.listNum}>2.</ThemedText>
                <ThemedText style={styles.listText}>
                  Ensure the documents you attached are <ThemedText style={{ fontWeight: '700' }}>clear and readable</ThemedText> (no glare,
                  not cropped, and all details visible).
                </ThemedText>
              </View>

              <View style={styles.listRow}>
                <ThemedText style={styles.listNum}>3.</ThemedText>
                <ThemedText style={styles.listText}>
                  Confirm that all information provided is <ThemedText style={{ fontWeight: '700' }}>correct, accurate, and truthful</ThemedText>{' '}
                  to the best of your knowledge.
                </ThemedText>
              </View>
            </View>

            <Spacer height={16} />

            <ThemedButton onPress={onConfirmAndSubmit} disabled={submitting}>
              <ThemedText btn>{submitting ? 'Submitting…' : 'Confirm & Submit'}</ThemedText>
            </ThemedButton>

            <Spacer height={8} />

            <ThemedButton onPress={() => setConfirmOpen(false)}>
              <ThemedText btn>Cancel</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default ReviewInputs;

const Row = ({ label, value }: { label: string; value?: any }) => {
  const toText = (v: any) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? '' : String(v);
  return (
    <View style={styles.row}>
      <ThemedText subtitle>{label}:</ThemedText>
      <ThemedText subtitle>{toText(value)}</ThemedText>
    </View>
  );
};

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
  block: { marginVertical: 6 },
  preview: { width: '100%', height: 180, borderRadius: 12 },
  tapHint: { fontSize: 12, opacity: 0.7, textAlign: 'center', marginTop: 4 },

  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  viewerFrame: {
    width: '100%',
    maxWidth: 900,
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  viewerImage: { width: '100%', height: '100%' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },

  // checklist styles
  list: { gap: 10 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  listNum: { fontSize: 15, lineHeight: 20, fontWeight: '700', width: 18, textAlign: 'right' },
  listText: { flex: 1, fontSize: 15, lineHeight: 20 },
});
