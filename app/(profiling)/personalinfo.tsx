import { registerResidentWithVerification } from '@/api/profilingApi';
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
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

// ✅ Import static dropdown options
import {
  civilStatusOptions,
  genderOptions,
  nationalityOptions,
  religionOptions,
} from '../../constants/formoptions';

const PersonalInfo = () => {
  const params = useSearchParams();
  const router = useRouter();

  const [fname, setFname] = useState('');
  const [mname, setMname] = useState('');
  const [lname, setLname] = useState('');
  const [suffix, setSuffix] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [nationality, setNationality] = useState('');
  const [religion, setReligion] = useState('');
  const [haddress, setHAddress] = useState('');
  const [mobnum, setMobNum] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const streetParam = params.get('street') ?? '';
    const purokParam = params.get('puroksitio') ?? '';
    const brgyParam = params.get('brgy') ?? '';
    const cityParam = params.get('city') ?? '';

    if (streetParam || purokParam || brgyParam || cityParam) {
      const fullAddress = `${streetParam}, ${purokParam}, ${brgyParam}, ${cityParam}`;
      setHAddress(fullAddress);
    }
  }, [params]);

  // ✅ Simple regex for email validation
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };


  // ✅ Allow formats: 09XXXXXXXXX or +639XXXXXXXXX
  const validateMobileNumber = (number: string) => {
    const phRegex = /^(09\d{9}|\+639\d{9})$/;
    return phRegex.test(number);
  };


  
  // ✅ Handle Submit with full frontend validation and Supabase error handling
  // ✅ Handle Submit with trimming and error handling
  const handleSubmit = async () => {
    // Trim all values before validation
    const trimmedFname = fname.trim();
    const trimmedMname = mname.trim();
    const trimmedLname = lname.trim();
    const trimmedSuffix = suffix.trim();
    const trimmedEmail = email.trim();
    const trimmedMobnum = mobnum.trim();
    const trimmedPassword = password.trim();
    const trimmedCPassword = cpassword.trim();
    const trimmedHAddress = haddress.trim();

    // Frontend validations
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

    if (trimmedSuffix && !/^(JR|SR|III|IV|V)$/i.test(trimmedSuffix)) {
      Alert.alert('Validation Error', 'Suffix must be JR, SR, III, IV, or V.');
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
      Alert.alert('Validation Error', 'Mobile number must be in the format 09XXXXXXXXX or +639XXXXXXXXX.');
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

    setLoading(true);

    const payload = {
      first_name: trimmedFname,
      middle_name: trimmedMname || null,
      last_name: trimmedLname,
      suffix: trimmedSuffix || null,
      date_of_birth: dob,
      email: trimmedEmail,
      mobile_number: trimmedMobnum,
      sex_id: gender === 'male' ? 1 : 2,
      civil_status_id: parseInt(civilStatus),
      nationality_id: parseInt(nationality),
      religion_id: parseInt(religion),
      city: params.get('city') || '',
      barangay: params.get('brgy') || '',
      purok: params.get('puroksitio') || '',
      street: params.get('street') || '',
      username: trimmedEmail,
      password: trimmedPassword,
    };

    try {
      const response = await registerResidentWithVerification(payload);
      console.log('✅ Registered:', response);
      Alert.alert('Success', 'Resident registered successfully.');
      router.push('/verifyemail');
    } catch (error: any) {
      console.error('❌ Registration API error:', error);

      let code = 'UNKNOWsssN';
      let reason = 'Something went wrong during registration.';

      if (typeof error?.error === 'string') {
        try {
          // ✅ Preprocess backend error to make it JSON safe
          const fixedErrorString = error.error
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/\bNone\b/g, 'null'); // Replace Python's None with null

          const backendError = JSON.parse(fixedErrorString);
          code = backendError?.code || code;
          reason = backendError?.message || reason;
        } catch (parseErr) {
          console.error('⚠️ Failed to parse backend error:', parseErr);
        }
      } else if (typeof error === 'object') {
        // fallback for regular Supabase errors
        code = error?.code || code;
        reason = error?.message || reason;
      }

      Alert.alert('Registration Failed', `[${code}] ${reason}`);
    } finally {
      setLoading(false);
    }

  };


  
  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: {
        returnTo: '/residentaddress',
      },
    });
  };

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title='Personal Information' showNotif={false} showProfile={false} />
      <ThemedProgressBar step={1} totalStep={3} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput placeholder="First Name" value={fname} onChangeText={setFname} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Middle Name" value={mname} onChangeText={setMname} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Last Name" value={lname} onChangeText={setLname} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Suffix" value={suffix} onChangeText={setSuffix} />
          <Spacer height={10} />

          <ThemedText subtitle={true}>Sex</ThemedText>
          <ThemedRadioButton value={gender} onChange={setGender} options={genderOptions} />
          <Spacer height={10} />

          <ThemedDatePicker
            value={dob}
            mode={'date'}
            onChange={setDob}
            placeholder="Date of Birth"
            maximumDate={new Date()}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={civilStatusOptions}
            value={civilStatus}
            setValue={setCivilStatus}
            placeholder='Civil Status'
            order={0}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={nationalityOptions}
            value={nationality}
            setValue={setNationality}
            placeholder='Nationality'
            order={1}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={religionOptions}
            value={religion}
            setValue={setReligion}
            placeholder='Religion'
            order={2}
          />
          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder="Home Address"
              value={haddress}
              onChangeText={setHAddress}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Mobile Number"
            value={mobnum}
            onChangeText={setMobNum}
            keyboardType="numeric"
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder='Confirm Password'
            value={cpassword}
            onChangeText={setCPassword}
            secureTextEntry
          />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleSubmit} disabled={loading}>
            <ThemedText btn={true}>{loading ? 'Registering...' : 'Continue'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default PersonalInfo;

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 70,
    alignSelf: 'center',
  },
  text: {
    textAlign: 'center',
  },
  link: {
    textAlign: 'right',
  },
});
