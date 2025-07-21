import { registerResidentWithVerification } from '@/api/profilingApi'; // 👈 API function
import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedDatePicker from '@/components/ThemedDatePicker';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedRadioButton from '@/components/ThemedRadioButton';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

const PersonalInfo = () => {
  const params = useSearchParams();

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
  const [password, setPassword] = useState(''); // ✅ New password field
  const [cpassword, setCPassword] = useState('')
  const [loading, setLoading] = useState(false);

  const civilStatusOptions = [
    { label: 'Single', value: '1' },
    { label: 'Married', value: '2' },
    { label: 'Widowed', value: '3' },
    { label: 'Separated', value: '4' },
    { label: 'Divorced', value: '5' },
  ];

  const nationalityOptions = [
    { label: 'AMERICAN', value: '1' },
    { label: 'AUSTRALIAN', value: '2' },
    { label: 'BRAZILIAN', value: '3' },
    { label: 'BRITISH', value: '4' },
    { label: 'CANADIAN', value: '5' },
    { label: 'CHINESE', value: '6' },
    { label: 'FILIPINO', value: '7' },
    { label: 'FRENCH', value: '8' },
    { label: 'GERMAN', value: '9' },
    { label: 'INDIAN', value: '10' },
    { label: 'INDONESIAN', value: '11' },
    { label: 'ITALIAN', value: '12' },
    { label: 'JAPANESE', value: '13' },
    { label: 'KOREAN', value: '14' },
    { label: 'MALAYSIAN', value: '15' },
    { label: 'RUSSIAN', value: '16' },
    { label: 'SAUDI', value: '17' },
    { label: 'SPANISH', value: '18' },
    { label: 'THAI', value: '19' },
    { label: 'VIETNAMESE', value: '20' },
  ];


  const religionOptions = [
    { label: 'AGNOSTIC', value: '1' },
    { label: 'AMISH', value: '2' },
    { label: 'BORN AGAIN', value: '3' },
    { label: 'BUDDHIST', value: '4' },
    { label: 'CHRISTIAN', value: '5' },
    { label: 'EVANGELICAL', value: '6' },
    { label: 'HINDU', value: '7' },
    { label: 'IGLESIA NI CRISTO', value: '8' },
    { label: 'ISLAM', value: '9' },
    { label: "JEHOVAH'S WITNESS", value: '10' },
    { label: 'ORTHODOX', value: '11' },
    { label: 'PROTESTANT', value: '12' },
    { label: 'ROMAN CATHOLIC', value: '13' },
    { label: 'SEVENTH-DAY ADVENTIST', value: '14' },
    { label: 'OTHERS', value: '15' },
  ];

  useEffect(() => {
    if (
      params.get('street') ||
      params.get('puroksitio') ||
      params.get('brgy') ||
      params.get('city')
    ) {
      const fullAddress = `${params.get('street') ?? ''}, ${params.get('puroksitio') ?? ''
        }, ${params.get('brgy') ?? ''}, ${params.get('city') ?? ''}`;
      setHAddress(fullAddress);
    }
  }, [params]);

  const router = useRouter();

  const handleSubmit = async () => {
    if (!fname || !lname || !dob || !mobnum || !email || !password) {
      Alert.alert('Missing Fields', 'Please fill in all required fields, including password.');
      return;
    }

    // ✅ Check if password and confirm password match
    if (password !== cpassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }
    
    setLoading(true);

    // Build payload for API
    const payload = {
      first_name: fname,
      middle_name: mname || null,
      last_name: lname,
      suffix: suffix || null,
      date_of_birth: dob,
      email: email,
      mobile_number: mobnum,
      sex_id: gender === 'male' ? 1 : 2, // map gender to DB lookup
      civil_status_id: parseInt(civilStatus),
      nationality_id: parseInt(nationality),
      religion_id: parseInt(religion),
      city: params.get('city') || '',
      barangay: params.get('brgy') || '',
      purok: params.get('puroksitio') || '',
      street: params.get('street') || '',
      username: email, // use email as username
      password: password, // 👈 use entered password
      id_type_id: 1, // assuming ID type
      education_level_id: null,
      employment_status_id: null,
      occupation_id: null,
    };

    try {
      const response = await registerResidentWithVerification(payload);
      console.log('✅ Registered:', response);

      Alert.alert('Success', 'Resident registered successfully.');

      // Navigate to next screen
      router.push('/verifyemail');
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      Alert.alert('Registration Failed', error.message || 'Something went wrong.');
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
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText style={styles.text} title={true}>
            Personal Information
          </ThemedText>

          <ThemedTextInput
            placeholder="First Name"
            value={fname}
            onChangeText={setFname}
          />

          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Middle Name"
            value={mname}
            onChangeText={setMname}
          />

          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Last Name"
            value={lname}
            onChangeText={setLname}
          />

          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Suffix"
            value={suffix}
            onChangeText={setSuffix}
          />

          <Spacer height={10} />

          <ThemedText subtitle={true}>Sex</ThemedText>

          <ThemedRadioButton
            value={gender}
            onChange={setGender}
            options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ]}
          />

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
            placeholder="Civil Status"
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={nationalityOptions}
            value={nationality}
            setValue={setNationality}
            placeholder="Nationality"
            order={1}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={religionOptions}
            value={religion}
            setValue={setReligion}
            placeholder="Religion"
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
            <ThemedText btn={true}>
              {loading ? 'Registering...' : 'Continue'}
            </ThemedText>
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
