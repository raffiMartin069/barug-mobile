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
import { StyleSheet, View } from 'react-native';

type AddrParams = { street?: string; brgy?: string; city?: string; puroksitio?: string };

const ResidentAddress = () => {
  const router = useRouter();
  const { street: pStreet = '', brgy: pBrgy = '', city: pCity = '', puroksitio: pPurok = '' } =
    useLocalSearchParams<AddrParams>();

  const { street, brgy, city, puroksitio, setAddress } = useRegistrationStore();

  // Prefill local inputs from params OR store
  const [streetState, setStreet] = useState(pStreet || street);
  const [purokState, setPurokSitio] = useState(pPurok || puroksitio);
  const [brgyState, setBrgy] = useState(pBrgy || brgy);
  const [cityState, setCity] = useState(pCity || city);

  // If params change while mounted (unlikely), update local state
  useEffect(() => {
    if (pStreet || pBrgy || pCity || pPurok) {
      setStreet(pStreet || '');
      setPurokSitio(pPurok || '');
      setBrgy(pBrgy || '');
      setCity(pCity || '');
    }
  }, [pStreet, pBrgy, pCity, pPurok]);

  const submitAddress = () => {
    setAddress({ street: streetState, puroksitio: pPurok || purokState, brgy: brgyState, city: cityState });
    // Replace current screen with personal info; state persists via store
    router.replace('/personalinfo');
  };

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Home Address" showNotif={false} showProfile={false} />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput placeholder="Street" value={streetState} onChangeText={setStreet} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Purok or Sitio" value={purokState} onChangeText={setPurokSitio} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Barangay" value={brgyState} onChangeText={setBrgy} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="City" value={cityState} onChangeText={setCity} />
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
