import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedProgressBar from '@/components/ThemedProgressBar';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';

import { useProfilingWizard } from '@/store/profilingWizard';
import { useRegistrationStore } from '@/store/registrationStore';

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  civilStatusOptions,
  genderOptions,
  nationalityOptions,
  religionOptions,
} from '../../constants/formoptions';

type AddrParams = { street?: string; puroksitio?: string; brgy?: string; city?: string };

const PersonalInfo2 = () => {
  const router = useRouter();
  const { street: pStreet = '', puroksitio: pPurok = '', brgy: pBrgy = '', city: pCity = '' } =
    useLocalSearchParams<AddrParams>();

  const {
    fname, mname, lname, suffix, gender, dob,
    civilStatus, nationality, religion,
    mobnum, email, password, cpassword,
    street, puroksitio, brgy, city, haddress,
    setField, setAddress,
  } = useRegistrationStore();

  const { personal, setPersonal } = useProfilingWizard();

  const [useEmail, setUseEmail] = useState<boolean>(() => Boolean(email?.trim()));

  const setCivilStatusState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().civilStatus;
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn;
      setField('civilStatus', next);
    };
  }, [setField]);
  const setNationalityState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().nationality;
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn;
      setField('nationality', next);
    };
  }, [setField]);
  const setReligionState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().religion;
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn;
      setField('religion', next);
    };
  }, [setField]);

  useEffect(() => {
    if (pStreet || pPurok || pBrgy || pCity) {
      setAddress({ street: pStreet, puroksitio: pPurok, brgy: pBrgy, city: pCity });
      setPersonal({
        ...(personal ?? {}),
        street: pStreet || street,
        purok: pPurok || puroksitio,
        barangay: pBrgy || brgy,
        city: pCity || city,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pStreet, pPurok, pBrgy, pCity]);

  const validateEmail = (eml: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eml);
  const validateMobileNumber = (n: string) => /^(09\d{9}|\+639\d{9})$/.test(n);

  // keep only a-z0-9
  const slugName = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  // Auto username: firstname+lastname@user. Falls back to 'user@user' if both empty (UI-only; submit requires names)
  const derivedUsername = (() => {
    const first = slugName(fname);
    const last = slugName(lname);
    const local = first || last ? [first, last].filter(Boolean).join('.') : 'user';
    return `${local}@user`;
  })();

  const mapRegToWizard = () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMobile = mobnum.trim();

    return {
      first_name: fname.trim(),
      middle_name: mname.trim() || null,
      last_name: lname.trim(),
      suffix: suffix.trim() || null,
      date_of_birth: dob,
      email: useEmail ? (trimmedEmail || null) : null, // only when useEmail
      mobile_number: trimmedMobile || null,            // optional
      sex_id: gender === 'male' ? 1 : 2,
      civil_status_id: parseInt(civilStatus || '0') || undefined,
      nationality_id: parseInt(nationality || '0') || undefined,
      religion_id: parseInt(religion || '0') || undefined,
      street,
      purok: puroksitio,
      barangay: brgy,
      city,
      username: useEmail ? trimmedEmail : derivedUsername, // non-editable fallback
      password: password.trim(),
    };
  };

  const handleSubmit = () => {
    const trimmedFname = fname.trim();
    const trimmedMname = mname.trim();
    const trimmedLname = lname.trim();
    const trimmedSuffix = suffix.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMobnum = mobnum.trim();
    const trimmedPassword = password.trim();
    const trimmedCPassword = cpassword.trim();
    const trimmedHAddress = haddress.trim();

    if (!trimmedFname || /[^a-zA-Z\s]/.test(trimmedFname)) { Alert.alert('Validation Error','Please enter a valid first name (letters only).'); return; }
    if (!trimmedLname || /[^a-zA-Z\s]/.test(trimmedLname)) { Alert.alert('Validation Error','Please enter a valid last name (letters only).'); return; }
    if (trimmedMname && /[^a-zA-Z\s]/.test(trimmedMname)) { Alert.alert('Validation Error','Middle name must contain letters only.'); return; }
    if (trimmedSuffix && !/^(JR|SR|III|IV|V)$/i.test(trimmedSuffix)) { Alert.alert('Validation Error','Suffix must be JR, SR, III, IV, or V.'); return; }
    if (!dob || new Date(dob) > new Date()) { Alert.alert('Validation Error','Please select a valid date of birth.'); return; }
    if (!civilStatus) { Alert.alert('Validation Error','Please select your civil status.'); return; }
    if (!nationality) { Alert.alert('Validation Error','Please select your nationality.'); return; }
    if (!religion) { Alert.alert('Validation Error','Please select your religion.'); return; }
    if (!trimmedHAddress) { Alert.alert('Validation Error','Please set your complete home address.'); return; }

    // Optional mobile: validate only if provided
    if (trimmedMobnum && !validateMobileNumber(trimmedMobnum)) {
      Alert.alert('Validation Error','Mobile number must be 09XXXXXXXXX or +639XXXXXXXXX.');
      return;
    }

    // If using email, require valid email
    if (useEmail) {
      if (!trimmedEmail) { Alert.alert('Validation Error','Please enter your email address.'); return; }
      if (!validateEmail(trimmedEmail)) { Alert.alert('Validation Error','Please enter a valid email address.'); return; }
    }

    if (!trimmedPassword || trimmedPassword.length < 8 || /\s/.test(trimmedPassword)) {
      Alert.alert('Validation Error','Password must be at least 8 characters and contain no spaces.');
      return;
    }
    if (trimmedPassword !== trimmedCPassword) {
      Alert.alert('Validation Error','Passwords do not match.');
      return;
    }

    setPersonal({ ...(personal ?? {}), ...mapRegToWizard() });
    router.push('/bhw_socioeconomic');
  };

  const handleHomeAddress = () => {
    router.push({ pathname: '/mapaddress2', params: { returnTo: '/residentaddress2' } });
  };

  const Checkbox = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.checkboxRow} activeOpacity={0.7}>
      <View style={[styles.checkboxBox, checked && styles.checkboxChecked]}>
        {checked ? <Text style={styles.checkboxTick}>✓</Text> : null}
      </View>
      <Text style={styles.checkboxLabel}>I have an email address</Text>
    </TouchableOpacity>
  );

  return (
    <ThemedView safe>
      <ThemedAppBar title="Personal Information" showNotif={false} showProfile={false} />
      <ThemedProgressBar step={1} totalStep={3} />


      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput placeholder="First Name" value={fname} onChangeText={(v) => setField('fname', v)} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Middle Name" value={mname} onChangeText={(v) => setField('mname', v)} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Last Name" value={lname} onChangeText={(v) => setField('lname', v)} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Suffix" value={suffix} onChangeText={(v) => setField('suffix', v)} />
          <Spacer height={10} />

          <ThemedText subtitle>Sex</ThemedText>
          <ThemedRadioButton value={gender} onChange={(v) => setField('gender', v)} options={genderOptions} />
          <Spacer height={10} />

          <ThemedDatePicker
            value={dob}
            mode="date"
            onChange={(v: string) => setField('dob', v)}
            placeholder="Date of Birth"
            maximumDate={new Date()}
          />
          <Spacer height={10} />

          <ThemedDropdown items={civilStatusOptions} value={civilStatus} setValue={setCivilStatusState} placeholder="Civil Status" order={0} />
          <Spacer height={10} />
          <ThemedDropdown items={nationalityOptions} value={nationality} setValue={setNationalityState} placeholder="Nationality" order={1} />
          <Spacer height={10} />
          <ThemedDropdown items={religionOptions} value={religion} setValue={setReligionState} placeholder="Religion" order={2} />
          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder="Home Address"
              multiline
              numberOfLines={2}
              value={haddress}
              onChangeText={(v) => setField('haddress', v)}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          <Spacer height={12} />
          <Checkbox checked={useEmail} onPress={() => setUseEmail((p) => !p)} />
          <Spacer height={8} />

          {useEmail ? (
            <ThemedTextInput
              placeholder="Email Address"
              value={email}
              onChangeText={(v) => setField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          ) : (
            <ThemedTextInput
              placeholder="Username (auto-generated)"
              value={derivedUsername}
              editable={false}
            />
          )}

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Mobile Number (optional)"
            value={mobnum}
            onChangeText={(v) => setField('mobnum', v)}
            keyboardType="numeric"
          />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Password" value={password} onChangeText={(v) => setField('password', v)} secureTextEntry />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Confirm Password" value={cpassword} onChangeText={(v) => setField('cpassword', v)} secureTextEntry />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default PersonalInfo2;

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },
  text: { textAlign: 'center' },
  link: { textAlign: 'right' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center' },
  checkboxBox: {
    width: 20, height: 20, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#666',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  checkboxChecked: { backgroundColor: '#4a0000', borderColor: '#4a0000' },
  checkboxTick: { color: '#fff', fontWeight: 'bold', fontSize: 14, lineHeight: 14 },
  checkboxLabel: { fontSize: 14, color: '#333' },
});
