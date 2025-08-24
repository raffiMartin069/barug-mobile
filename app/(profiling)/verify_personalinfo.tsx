// app/(profiling)/reviewpersonal.tsx
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedProgressBar from '@/components/ThemedProgressBar';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

import { fetchResidentProfile } from '@/api/residentApi';
import { useProfilingWizard } from '@/store/profilingWizard';

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import {
  civilStatusMap,
  genderMap,
  nationalityMap,
  religionMap,
} from '../../constants/formoptions';

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

const ReviewPersonal = () => {
  const router = useRouter();
  const { personal, setPersonal } = useProfilingWizard();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const p = await fetchResidentProfile();
      if (!p) {
        setLoadError('No profile found.');
        return;
      }

      const sexRaw = (p.sex_name ?? p.sex ?? '').toString().toLowerCase();
      const rawDob = p.birthdate ?? p.date_of_birth ?? '';

      setPersonal({
        first_name: p.first_name ?? '',
        middle_name: p.middle_name ?? null,
        last_name: p.last_name ?? '',
        suffix: p.suffix ?? null,
        date_of_birth: normalizeDateYMD(rawDob),
        email: p.email ?? '',
        mobile_number: p.mobile_num != null ? String(p.mobile_num) : '',
        sex_id: sexRaw.startsWith('f') ? 2 : 1,

        civil_status_id: p.civil_status_id ?? undefined,
        nationality_id:  p.nationality_id  ?? undefined,
        religion_id:     p.religion_id     ?? undefined,

        civil_status_name: p.civil_status ?? p.civil_status_name ?? '',
        nationality_name:  p.nationality  ?? p.nationality_name  ?? '',
        religion_name:     p.religion     ?? p.religion_name     ?? '',

        street: p.street ?? p.street_name ?? '',
        purok: p.purok ?? p.purok_sitio ?? p.purok_sitio_name ?? '',
        barangay: p.barangay ?? p.barangay_name ?? '',
        city: p.city ?? p.city_name ?? '',
      });
    } catch (e: any) {
      console.error('Failed to fetch resident profile:', e);
      setLoadError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setPersonal]);

  useFocusEffect(
    React.useCallback(() => {
      load();
      return undefined;
    }, [load])
  );

  const onEditProfile = () => {
    router.push({ pathname: '/update_profile', params: { returnTo: '/verify_personalinfo' } });
  };

  const onContinue = () => setShowConfirm(true);

  // Loading screen
  if (isLoading) {
    return (
      <ThemedView safe>
        <ThemedAppBar title="Review Personal Details" showNotif={false} showProfile={false} />
        <ThemedProgressBar step={1} totalStep={4} />
        <View style={styles.loadingWrap} accessible accessibilityLabel="Loading resident profile">
          <ActivityIndicator size="large" />
          <Spacer height={12} />
          <ThemedText style={{ textAlign: 'center' }}>Fetching resident profile…</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Error screen with Retry
  if (loadError) {
    return (
      <ThemedView safe>
        <ThemedAppBar title="Review Personal Details" showNotif={false} showProfile={false} />
        <ThemedProgressBar step={1} totalStep={4} />
        <View style={styles.loadingWrap}>
          <ThemedText title style={{ textAlign: 'center', marginBottom: 8 }}>
            Oops!
          </ThemedText>
          <ThemedText style={{ textAlign: 'center', marginBottom: 16 }}>
            {loadError}
          </ThemedText>
          <ThemedButton onPress={load}>
            <ThemedText btn>Retry</ThemedText>
          </ThemedButton>
        </View>
      </ThemedView>
    );
  }

  if (!personal) {
    // Fallback (shouldn’t happen if we handle error above)
    return (
      <ThemedView safe>
        <ThemedAppBar title="Review Personal Details" showNotif={false} showProfile={false} />
        <ThemedProgressBar step={1} totalStep={4} />
        <View style={styles.loadingWrap}>
          <ThemedText>No personal data available.</ThemedText>
          <Spacer height={8} />
          <ThemedButton onPress={load}>
            <ThemedText btn>Reload</ThemedText>
          </ThemedButton>
        </View>
      </ThemedView>
    );
  }

  const displayGenderKey = personal.sex_id === 1 ? 'male' : 'female';

  return (
    <ThemedView safe>
      <ThemedAppBar title="Review Personal Details" showNotif={false} showProfile={false} />
      <ThemedProgressBar step={1} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText title style={{ textAlign: 'center' }}>Personal Information</ThemedText>
          <Spacer height={16} />
          <Row label="First Name" labelStyle={{ fontWeight: 'bold' }} value={personal.first_name} />
          <Row label="Middle Name" labelStyle={{ fontWeight: 'bold' }} value={personal.middle_name || ''} />
          <Row label="Last Name" labelStyle={{ fontWeight: 'bold' }} value={personal.last_name} />
          <Row label="Suffix" labelStyle={{ fontWeight: 'bold' }} value={personal.suffix || ''} />
          <Row label="Sex" labelStyle={{ fontWeight: 'bold' }} value={(genderMap[displayGenderKey] || displayGenderKey).toUpperCase()} />
          <Row label="Date of Birth" labelStyle={{ fontWeight: 'bold' }} value={normalizeDateYMD(personal.date_of_birth)} />
          <Row
            label="Civil Status"
            labelStyle={{ fontWeight: 'bold' }} 
            value={
              civilStatusMap[String(personal.civil_status_id ?? '')] ||
              (personal as any).civil_status_name || ''
            }
          />
          <Row
            label="Nationality"
            labelStyle={{ fontWeight: 'bold' }} 
            value={
              nationalityMap[String(personal.nationality_id ?? '')] ||
              (personal as any).nationality_name || ''
            }
          />
          <Row
            label="Religion"
            labelStyle={{ fontWeight: 'bold' }}   
            value={
              religionMap[String(personal.religion_id ?? '')] ||
              (personal as any).religion_name || ''
            }
          />
          <Row label="Street" labelStyle={{ fontWeight: 'bold' }} value={personal.street || ''} />
          <Row label="Purok / Sitio" labelStyle={{ fontWeight: 'bold' }} value={personal.purok || ''} />
          <Row label="Barangay" labelStyle={{ fontWeight: 'bold' }} value={personal.barangay || ''} />
          <Row label="City" labelStyle={{ fontWeight: 'bold' }} value={personal.city || ''} />
          <Row label="Mobile Number" labelStyle={{ fontWeight: 'bold' }} value={personal.mobile_number || ''} />
          <Row label="Email Address" labelStyle={{ fontWeight: 'bold' }} value={personal.email || ''} />
        </View>

        <Spacer height={16} />

        <View style={styles.actionsRow}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <ThemedButton onPress={onEditProfile}>
              <ThemedText btn>Edit Profile</ThemedText>
            </ThemedButton>
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <ThemedButton onPress={onContinue}>
              <ThemedText btn>Continue</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirm(false)}
      >
        {/* Backdrop: tap to close */}
        <Pressable style={styles.backdrop} onPress={() => setShowConfirm(false)}>
          {/* Stop propagation so inner card doesn’t close when tapped */}
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <ThemedText title style={{ textAlign: 'center', marginBottom: 8 }}>
              Confirm your details
            </ThemedText>
            <ThemedText style={{ textAlign: 'center', marginBottom: 16 }}>
              Do you confirm that all personal information shown here is true, correct, and accurate?
            </ThemedText>

            <View style={styles.modalButtons}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <ThemedButton onPress={() => setShowConfirm(false)}>
                  <ThemedText btn>Review / Edit</ThemedText>
                </ThemedButton>
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <ThemedButton
                  onPress={() => {
                    setShowConfirm(false);
                    router.push('/socioeconomicinfo');
                  }}
                >
                  <ThemedText btn>Yes, confirm</ThemedText>
                </ThemedButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
};

export default ReviewPersonal;

const Row = ({ label, value, labelStyle, valueStyle }: { 
  label: string; 
  value?: any; 
  labelStyle?: any; 
  valueStyle?: any;
}) => {
  const toText = (v: any) =>
    v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? '' : String(v);
  return (
    <View style={styles.row}>
      <ThemedText subtitle style={labelStyle}>{label}:</ThemedText>
      <ThemedText subtitle style={[styles.valueText, valueStyle]}>
        {toText(value)}
      </ThemedText>
    </View>
  );
};



const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'black',
    paddingBottom: 8,
  },
  valueText: {
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 8, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
