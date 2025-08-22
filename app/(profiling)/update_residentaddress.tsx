import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useRegistrationStore } from '@/store/registrationStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

type AddrParams = { street?: string; brgy?: string; city?: string; puroksitio?: string };

const ResidentAddress = () => {
  const router = useRouter();
  const { street: pStreet = '', brgy: pBrgy = '', city: pCity = '', puroksitio: pPurok = '' } =
    useLocalSearchParams<AddrParams>();

  const { street, brgy, city, puroksitio, setAddress } = useRegistrationStore();

  // Prefill local inputs from params OR store
  const [streetState, setStreet] = useState(pStreet || street || '');
  const [purokState, setPurokSitio] = useState(pPurok || puroksitio || '');
  const [brgyState, setBrgy] = useState(pBrgy || brgy || '');
  const [cityState, setCity] = useState(pCity || city || '');

  // If params change while mounted, update local state
  useEffect(() => {
    if (pStreet || pBrgy || pCity || pPurok) {
      setStreet(pStreet || '');
      setPurokSitio(pPurok || '');
      setBrgy(pBrgy || '');
      setCity(pCity || '');
    }
  }, [pStreet, pBrgy, pCity, pPurok]);

  const submitAddress = () => {
    // Trim values
    const s = streetState.trim();
    const p = purokState.trim();
    const b = brgyState.trim();
    const c = cityState.trim();

    // Check required fields
    if (!s && !p && !b && !c) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    if (!s) {
      Alert.alert('Validation Error', 'Street is required.');
      return;
    }
    if (!p) {
      Alert.alert('Validation Error', 'Purok or Sitio is required.');
      return;
    }
    if (!b) {
      Alert.alert('Validation Error', 'Barangay is required.');
      return;
    }
    if (!c) {
      Alert.alert('Validation Error', 'City is required.');
      return;
    }

    // Save to store
    setAddress({ street: s, puroksitio: p, brgy: b, city: c });

    // Navigate back to update profile
    router.replace('/updateprofile');
  };

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Home Address" showNotif={false} showProfile={false} />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput
            placeholder="Street"
            value={streetState}
            onChangeText={setStreet}
            autoCapitalize="words"
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Purok or Sitio"
            value={purokState}
            onChangeText={setPurokSitio}
            autoCapitalize="words"
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="Barangay"
            value={brgyState}
            onChangeText={setBrgy}
            autoCapitalize="words"
          />
          <Spacer height={10} />
          <ThemedTextInput
            placeholder="City"
            value={cityState}
            onChangeText={setCity}
            autoCapitalize="words"
          />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={submitAddress}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default ResidentAddress;

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
});
