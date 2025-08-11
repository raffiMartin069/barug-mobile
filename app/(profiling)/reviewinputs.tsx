import { requestPersonVerification } from '@/api/profilingApi';
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';

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

// RN file type helper (keeps TS happy)
type RNFile = {
  uri: string;
  name: string;
  type: string;
};

const ReviewInputs = () => {
  const params = useLocalSearchParams();

  // safely coerce a param to string (handles string | string[] | undefined)
  const getVal = (k: string) => {
    const v = params[k];
    if (Array.isArray(v)) return v[0] ?? '';
    return (v as string) ?? '';
  };

  const vals = {
    fname: getVal('fname'),
    mname: getVal('mname'),
    lname: getVal('lname'),
    suffix: getVal('suffix'),
    gender: getVal('gender'),
    dob: getVal('dob'),
    civilStatus: getVal('civilStatus'),
    nationality: getVal('nationality'),
    religion: getVal('religion'),
    street: getVal('street'),
    purokSitio: getVal('purokSitio'),
    brgy: getVal('brgy'),
    city: getVal('city'),
    mobnum: getVal('mobnum'),
    email: getVal('email'),

    educattainment: getVal('educattainment'),
    employmentstat: getVal('employmentstat'),
    occupation: getVal('occupation'),
    mnthlypersonalincome: getVal('mnthlypersonalincome'),
    govprogrm: getVal('govprogrm'),

    idType: getVal('idType'),

    validIdFrontUri: getVal('validIdFrontUri'),
    validIdBackUri: getVal('validIdBackUri'),
    validIdSelfieUri: getVal('validIdSelfieUri'),

    person_id: getVal('person_id'),
    resident_id: getVal('resident_id'),
    requester_id: getVal('requester_id'),
  };

  const [submitting, setSubmitting] = useState(false);

  // Viewer state for tap-to-zoom
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);

  const openViewer = (uri?: string | null) => {
    if (!uri) return;
    setViewerSrc(uri);
    setViewerOpen(true);
  };

  // Pull URIs that were pushed from ValidId screen
  const frontUri = useMemo(() => vals.validIdFrontUri || '', [vals.validIdFrontUri]);
  const backUri = useMemo(() => vals.validIdBackUri || '', [vals.validIdBackUri]);
  const selfieUri = useMemo(() => vals.validIdSelfieUri || '', [vals.validIdSelfieUri]);

  const ImageRow = ({ label, uri }: { label: string; uri?: string }) => (
    <View style={styles.block}>
      <ThemedText subtitle={true}>{label}</ThemedText>
      {uri ? (
        <TouchableOpacity activeOpacity={0.85} onPress={() => openViewer(uri)}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <ThemedText style={styles.tapHint}>Tap to view</ThemedText>
        </TouchableOpacity>
      ) : (
        <ThemedText subtitle={true}>No Image Uploaded</ThemedText>
      )}
    </View>
  );

  // ---------- SUBMIT (only Socioeconomic + Valid ID) ----------
  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // compress images first (BEFORE building FormData)
      const front = frontUri ? await compress(frontUri) : undefined;
      const back = backUri ? await compress(backUri) : undefined;
      const selfie = selfieUri ? await compress(selfieUri) : undefined;

      const fd = new FormData();

      // Optional: requester (person) id if present
      const requesterId = vals.person_id || vals.resident_id || vals.requester_id;
      if (requesterId) fd.append('requester_id', String(requesterId));

      // Pass name fields for OCR matching
      if (vals.fname) fd.append('first_name', vals.fname);
      if (vals.lname) fd.append('last_name', vals.lname);
      if (vals.mname) fd.append('middle_name', vals.mname);

      // Socioeconomic fields — ensure strings
      if (vals.educattainment) fd.append('education_id', String(vals.educattainment));
      if (vals.employmentstat) fd.append('employment_status_id', String(vals.employmentstat));
      if (vals.occupation) fd.append('occupation', String(vals.occupation));
      if (vals.govprogrm) fd.append('gov_mem_prog_id', String(vals.govprogrm));
      if (vals.mnthlypersonalincome) fd.append('mnthly_personal_income_id', String(vals.mnthlypersonalincome));

      // Valid ID
      if (vals.idType) fd.append('doc_type_id', String(vals.idType));

      // Images (append whichever the user provided) — use the COMPRESSED URIs
      const addFile = (key: 'id_front' | 'id_back' | 'id_selfie', uri?: string) => {
        if (!uri) return;
        const file: RNFile = {
          uri,
          name: `${key}.jpg`,
          type: 'image/jpeg',
        };
        // @ts-expect-error React Native FormData accepts this shape
        fd.append(key, file);
      };
      addFile('id_front', front);
      addFile('id_back', back);
      addFile('id_selfie', selfie);

      // Submit to your verification endpoint
      const res = await requestPersonVerification(fd);
      console.log('✅ Verification submitted:', res);
      Alert.alert('Success', 'Your verification request has been submitted.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.error ||
        err?.message ||
        'Verification failed';
      console.error('❌ Verification failed:', err);
      Alert.alert('Submit Failed', String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title='Review Details' showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText title={true}>Personal Information</ThemedText>

          <View style={styles.row}>
            <ThemedText subtitle={true}>First Name:</ThemedText>
            <ThemedText subtitle={true}>{vals.fname}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Middle Name:</ThemedText>
            <ThemedText subtitle={true}>{vals.mname}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Last Name:</ThemedText>
            <ThemedText subtitle={true}>{vals.lname}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Suffix:</ThemedText>
            <ThemedText subtitle={true}>{vals.suffix}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>{genderMap[vals.gender]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>{vals.dob}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>{civilStatusMap[vals.civilStatus]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>{nationalityMap[vals.nationality]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>{religionMap[vals.religion]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Street:</ThemedText>
            <ThemedText subtitle={true}>{vals.street}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Purok / Sitio:</ThemedText>
            <ThemedText subtitle={true}>{vals.purokSitio}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Barangay:</ThemedText>
            <ThemedText subtitle={true}>{vals.brgy}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>City:</ThemedText>
            <ThemedText subtitle={true}>{vals.city}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Mobile Number:</ThemedText>
            <ThemedText subtitle={true}>{vals.mobnum}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Email Address:</ThemedText>
            <ThemedText subtitle={true}>{vals.email}</ThemedText>
          </View>

          <Spacer height={20} />
          <ThemedText title={true}>Socioeconomic Information</ThemedText>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>{educAttainmentMap[vals.educattainment]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>{empStatMap[vals.employmentstat]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>{vals.occupation}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>{mnthlyPersonalIncomeMap[vals.mnthlypersonalincome]}</ThemedText>
          </View>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>{govProgMap[vals.govprogrm]}</ThemedText>
          </View>

          <Spacer height={20} />
          <ThemedText title={true}>Valid ID</ThemedText>

          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText subtitle={true}>ID Type:</ThemedText>
            <ThemedText subtitle={true}>{vals.idType ? idTypeMap[vals.idType] : 'Not Provided'}</ThemedText>
          </View>

          <Spacer height={10} />
          <ImageRow label="Front of the ID" uri={frontUri} />
          <Spacer height={10} />
          <ImageRow label="Back of the ID" uri={backUri} />
          <Spacer height={10} />
          <ImageRow label="Selfie with ID" uri={selfieUri} />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit} disabled={submitting}>
            <ThemedText btn={true}>{submitting ? 'Submitting...' : 'Submit'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Fullscreen viewer */}
      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable style={styles.viewerBackdrop} onPress={() => setViewerOpen(false)} />
          <View style={styles.viewerFrame}>
            {viewerSrc ? (
              <Image source={{ uri: viewerSrc }} style={styles.viewerImage} resizeMode="contain" />
            ) : null}
          </View>
          <ThemedButton onPress={() => setViewerOpen(false)}>
            <ThemedText btn={true}>Close</ThemedText>
          </ThemedButton>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default ReviewInputs;

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
  block: {
    marginVertical: 6,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  tapHint: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 4,
  },
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
  viewerImage: {
    width: '100%',
    height: '100%',
  },
});
