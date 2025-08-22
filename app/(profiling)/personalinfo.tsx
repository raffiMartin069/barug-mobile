import { registerResidentWithVerificationBHW } from '@/api/profilingApi';
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useRegistrationStore } from '@/store/registrationStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  civilStatusOptions,
  genderOptions,
  nationalityOptions,
  religionOptions,
  suffixOptions,
} from '../../constants/formoptions';

type AddrParams = { street?: string; puroksitio?: string; brgy?: string; city?: string };

const PersonalInfo = () => {
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

  // NEW: simple submitting state for the button text swap
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- WRAPPERS: make store setters behave like React state setters ---
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

  // NEW: suffix as dropdown
  const setSuffixState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
    return (valOrFn) => {
      const prev = useRegistrationStore.getState().suffix || '';
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn;
      setField('suffix', next ?? '');
    };
  }, [setField]);
  // --------------------------------------------------------------------

  // If address params are present (coming back from address flow), persist them
  useEffect(() => {
    if (pStreet || pPurok || pBrgy || pCity) {
      setAddress({ street: pStreet, puroksitio: pPurok, brgy: pBrgy, city: pCity });
    }
  }, [pStreet, pPurok, pBrgy, pCity, setAddress]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateMobileNumber = (n: string) => /^(09\d{9}|\+639\d{9})$/.test(n);

  const handleSubmit = async () => {
    if (isSubmitting) return; // prevent double taps

    const trimmedFname = fname.trim();
    const trimmedMname = mname.trim();
    const trimmedLname = lname.trim();
    const trimmedSuffix = (suffix || '').trim(); // now from dropdown
    const trimmedEmail = email.trim();
    const trimmedMobnum = mobnum.trim();
    const trimmedPassword = password.trim();
    const trimmedCPassword = cpassword.trim();
    const trimmedHAddress = haddress.trim();

    // ---- validations ----
    if (!trimmedFname || /[^a-zA-Z\s]/.test(trimmedFname)) {
      Alert.alert('Validation Error', 'Please enter a valid first name (letters only).');
      return;
    }
    if (!trimmedLname || /[^a-zA-Z\s]/.test(trimmedLname)) {
      Alert.alert('Validation Error', 'Please enter a valid last name (letters only).');
      return;
    }
    if (trimmedMname && /[^a-zA-Z\s]/.test(trimmedMname)) {
      Alert.alert('Validation Error', 'Middle name must contain letters only.');
      return;
    }
    // keep a safety net: suffix must be allowed value (or empty)
    if (
      trimmedSuffix &&
      !['JR', 'SR', 'III', 'IV', 'V'].includes(trimmedSuffix.toUpperCase())
    ) {
      Alert.alert('Validation Error', 'Suffix must be Jr., Sr., III, IV, or V.');
      return;
    }
    if (!dob || new Date(dob) > new Date()) {
      Alert.alert('Validation Error', 'Please select a valid date of birth.');
      return;
    }
    if (!civilStatus) {
      Alert.alert('Validation Error', 'Please select your civil status.');
      return;
    }
    if (!nationality) {
      Alert.alert('Validation Error', 'Please select your nationality.');
      return;
    }
    if (!religion) {
      Alert.alert('Validation Error', 'Please select your religion.');
      return;
    }
    if (!trimmedHAddress) {
      Alert.alert('Validation Error', 'Please set your complete home address.');
      return;
    }
    if (!trimmedMobnum || !validateMobileNumber(trimmedMobnum)) {
      Alert.alert('Validation Error', 'Mobile number must be 09XXXXXXXXX or +639XXXXXXXXX.');
      return;
    }
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 8 || /\s/.test(trimmedPassword)) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters long and contain no spaces.');
      return;
    }
    if (trimmedPassword !== trimmedCPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    // ---- payload -> FormData (backend uses MultiPartParser) ----
    const fd = new FormData();
    const add = (k: string, v: any) => {
      if (v === undefined || v === null || v === '') return;
      fd.append(k, typeof v === 'string' ? v : String(v));
    };

    add('first_name', trimmedFname);
    add('middle_name', trimmedMname || null);
    add('last_name', trimmedLname);
    add('suffix', trimmedSuffix || null); // dropdown value
    add('date_of_birth', typeof dob === 'string' ? dob : new Date(dob).toISOString().slice(0, 10));
    add('email', trimmedEmail);
    add('mobile_number', trimmedMobnum);
    add('sex_id', gender === 'male' ? 1 : 2);
    add('civil_status_id', parseInt(civilStatus));
    add('nationality_id', parseInt(nationality));
    add('religion_id', parseInt(religion));
    add('city', city);
    add('barangay', brgy);
    add('purok', puroksitio);
    add('street', street);
    // username = email for online flow
    add('username', trimmedEmail);
    add('password', trimmedPassword);

    try {
      setIsSubmitting(true);
      const response = await registerResidentWithVerificationBHW(fd); // multipart
      console.log('✅ Registered:', response);
      Alert.alert('Success', 'Resident registered successfully.');
      router.push({ pathname: '/verifyemail', params: { email: trimmedEmail } });
    } catch (error: any) {
      console.error('❌ Registration API error:', error);
      let code = 'UNKNOWN';
      let reason = 'Something went wrong during registration.';
      if (typeof error?.error === 'string') {
        try {
          const fixedErrorString = error.error.replace(/'/g, '"').replace(/\bNone\b/g, 'null');
          const backendError = JSON.parse(fixedErrorString);
          code = backendError?.code || code;
          reason = backendError?.message || reason;
        } catch {}
      } else if (typeof error === 'object') {
        code = error?.code || code;
        reason = error?.message || reason;
      }
      Alert.alert('Registration Failed', `[${code}] ${reason}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHomeAddress = () => {
    router.push({ pathname: '/mapaddress', params: { returnTo: '/residentaddress' } });
  };

  return (
    <ThemedView safe>
      <ThemedAppBar title="Personal Information" showNotif={false} showProfile={false} />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput placeholder="First Name" value={fname} onChangeText={(v) => setField('fname', v)} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Middle Name" value={mname} onChangeText={(v) => setField('mname', v)} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Last Name" value={lname} onChangeText={(v) => setField('lname', v)} />
          <Spacer height={10} />

          {/* Suffix as dropdown */}
          <ThemedDropdown
            items={suffixOptions}
            value={suffix || ''}
            setValue={setSuffixState}
            placeholder="Suffix (optional)"
            order={-1} // keep near name fields; order is just for your ThemedDropdown sorting if used
          />
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

          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Mobile Number"
            value={mobnum}
            onChangeText={(v) => setField('mobnum', v)}
            keyboardType="numeric"
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Email Address"
            value={email}
            onChangeText={(v) => setField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Password" value={password} onChangeText={(v) => setField('password', v)} secureTextEntry />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Confirm Password" value={cpassword} onChangeText={(v) => setField('cpassword', v)} secureTextEntry />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit} disabled={isSubmitting}>
            <ThemedText btn>{isSubmitting ? 'Registering…' : 'Continue'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default PersonalInfo;

const styles = StyleSheet.create({
  image: { width: '100%', height: 70, alignSelf: 'center' },
  text: { textAlign: 'center' },
  link: { textAlign: 'right' },
});
