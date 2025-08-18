import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedProgressBar from '@/components/ThemedProgressBar';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';

import { loginBhw } from '@/api/authApi';
import { registerResidentWithVerificationBHW } from '@/api/profilingApi';
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
    mnthlyPersonalIncomeMap,
    nationalityMap,
    religionMap
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
  const { personal, socio, validId, clear, setPersonal } = useProfilingWizard();
  const reg = useRegistrationStore();

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bhwUser, setBhwUser] = useState('');
  const [bhwPass, setBhwPass] = useState('');

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

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

  if (!personal) {
    return (
      <ThemedView safe>
        <ThemedAppBar title="Review Details" showNotif={false} showProfile={false} />
        <ThemedText>Missing data. Please go back to Personal Info.</ThemedText>
      </ThemedView>
    )
  }

  const openViewer = (uri?: string | null) => { if (uri) { setViewerSrc(uri); setViewerOpen(true); } };

  const ImageRow = ({ label, uri }: { label: string; uri?: string }) => (
    <View style={styles.block}>
      <ThemedText subtitle>{label}</ThemedText>
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

  // ------------ BUILD REGISTER FORMDATA (with FILES + LOGS) ------------
  const buildRegisterFormData = async (bhwStaffId?: number) => {
    const fd = new FormData();
    const debug: Record<string, any> = {};
    const fileDebug: Record<string, any> = {};

    const add = (k: string, v: any, opts?: { mask?: boolean }) => {
      if (v === undefined || v === null || v === '') return;
      const s = String(v);
      fd.append(k, s);
      debug[k] = opts?.mask ? `${'*'.repeat(Math.min(s.length, 12))} (${s.length})` : s;
    };

    // Fields
    add('email', personal.email);
    add('password', personal.password, { mask: true });

    add('first_name', personal.first_name);
    add('middle_name', personal.middle_name);
    add('last_name', personal.last_name);
    add('suffix', personal.suffix);

    add('date_of_birth', normalizeDateYMD(personal.date_of_birth));
    add('mobile_number', personal.mobile_number);
    add('sex_id', personal.sex_id);
    add('civil_status_id', personal.civil_status_id);
    add('nationality_id', personal.nationality_id);
    add('religion_id', personal.religion_id);

    add('city', personal.city);
    add('barangay', personal.barangay);
    add('purok', personal.purok);
    add('street', personal.street);

    add('is_bhw_registration', true);
    if (bhwStaffId != null) add('added_by_id', bhwStaffId);

    add('education_level_id', socio?.educ_attainment_id);
    add('employment_status_id', socio?.employment_status_id);
    add('occupation', socio?.occupation);
    add('gov_mem_prog_id', socio?.gov_program_id);
    add('mnthly_personal_income_id', socio?.monthly_personal_income_id);

    add('id_type_id', validId?.id_type_id);
    add('id_number', validId?.id_number);

    // Files — keys expected by your DRF view:
    //  - person_img
    //  - front_doc
    //  - back_doc
    //  - selfie
    const addFile = async (key: 'person_img' | 'front_doc' | 'back_doc' | 'selfie', uri?: string) => {
      if (!uri) return;
      const c = await compress(uri);
      const file: any = { uri: c, name: `${key}.jpg`, type: 'image/jpeg' } as RNFile;
      // @ts-expect-error RN FormData file shape
      fd.append(key, file);
      fileDebug[key] = { name: file.name, type: file.type, uri: c };
    };

    await addFile('front_doc', frontUri);
    await addFile('back_doc', backUri);
    await addFile('selfie', selfieUri);

    // If you want a profile image and you don’t have a separate one,
    // reuse selfie as person_img:
    // await addFile('person_img', selfieUri);

    console.log('🧾 Register FormData (fields):', debug);
    console.log('🖼️ Register FormData (files):', fileDebug);

    return fd;
  };

  const onConfirmAndSubmit = async () => {
    try {
      if (!bhwUser.trim() || !bhwPass.trim()) {
        Alert.alert('BHW Login Required', 'Please enter your BHW username and password.');
        return;
      }

      setSubmitting(true);

      const staffId = await loginBhw(bhwUser.trim(), bhwPass.trim());
      console.log('✅ BHW staff_id:', staffId);

      const fdReg = await buildRegisterFormData(staffId);
      console.log('➡️ Calling registerResidentWithVerificationBHW…');
      await registerResidentWithVerificationBHW(fdReg); // must POST multipart/form-data
      console.log('✅ Registration call finished');

      Alert.alert('Success', 'Registration submitted successfully.');
      const email = personal.email;

      router.push({ pathname: '/login', params: { email } });
    } catch (err: any) {
      console.error('❌ Submit failed:', err);
      const msg = err?.response?.data?.error || err?.error || err?.message || 'Submission failed';
      Alert.alert('Submit Failed', String(msg));
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <ThemedView safe>
      <ThemedAppBar title="Review Details" showNotif={false} showProfile={false} />
      <ThemedProgressBar step={3} totalStep={3} />

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

      {/* Confirmation + BHW re-auth */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ThemedText style={{ fontWeight: '700' }}>Please confirm</ThemedText>
            <Spacer height={6} />
            <ThemedText>
              Do you confirm that all information is true and correct? Enter BHW credentials to proceed.
            </ThemedText>
            <Spacer height={12} />
            <ThemedTextInput placeholder="BHW Username" value={bhwUser} onChangeText={setBhwUser} />
            <Spacer height={8} />
            <ThemedTextInput placeholder="BHW Password" value={bhwPass} onChangeText={setBhwPass} secureTextEntry />
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginVertical: 5, borderBottomWidth: 2, borderBottomColor: 'black', paddingBottom: 8,
  },
  block: { marginVertical: 6 },
  preview: { width: '100%', height: 180, borderRadius: 12 },
  tapHint: { fontSize: 12, opacity: 0.7, textAlign: 'center', marginTop: 4 },

  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  viewerFrame: { width: '100%', maxWidth: 900, aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  viewerImage: { width: '100%', height: '100%' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
});
