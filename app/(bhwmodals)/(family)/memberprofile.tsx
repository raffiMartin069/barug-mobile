import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedBottomSheet from '@/components/ThemedBottomSheet';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedDropdown from '@/components/ThemedDropdown';
import ThemedImage from '@/components/ThemedImage';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type RemovalReason =
  | 'MOVED OUT'
  | 'DECEASED'
  | 'DATA CORRECTION'
  | 'DUPLICATE ENTRY'
  | 'OTHER';

const REMOVAL_REASONS: RemovalReason[] = [
  'MOVED OUT',
  'DECEASED',
  'DATA CORRECTION',
  'DUPLICATE ENTRY',
  'OTHER',
];

const MemberProfile = () => {
  // If navigated with ?openRemove=1, auto-open the sheet.
  const params = useLocalSearchParams<{ id?: string; openRemove?: string }>();

  // ---- Remove Member bottom sheet state ----
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<RemovalReason | null>(null);
  const [otherReason, setOtherReason] = useState('');

  // ThemedDropdown expects an items array; adapt reasons:
  const reasonItems = useMemo(
    () => REMOVAL_REASONS.map((r) => ({ label: r, value: r })),
    []
  );

  useEffect(() => {
    if (params?.openRemove === '1') {
      setRemoveOpen(true);
    }
  }, [params?.openRemove]);

  // Mocked member data (replace with real data using params.id)
  const member = {
    id: params?.id ?? '0001111',
    name: 'John Doe',
    sex: 'Male',
    dob: 'January 1, 1990',
    civilStatus: 'Single',
    nationality: 'Filipino',
    religion: 'Christian',
    education: 'Graduate',
    employmentStatus: 'Employed',
    occupation: 'Software Engineer',
    income: '₱25,000',
    govProgram: 'SSS',
    idType: "Voter's ID",
  };

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title='Family Member Profile' showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>
        {/* --- Member Profile Card --- */}
        <ThemedCard>
          <View style={{ alignItems: 'center' }}>
            <ThemedImage src={require('@/assets/images/default-image.jpg')} size={90} />
          </View>

          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
            <ThemedText subtitle={true}>{member.id}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
            <ThemedText subtitle={true}>{member.name}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>{member.sex}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>{member.dob}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>{member.civilStatus}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>{member.nationality}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>{member.religion}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          {/* Socioeconomic Information */}
          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>{member.education}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>{member.employmentStatus}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>{member.occupation}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>{member.income}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>{member.govProgram}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          {/* Documents */}
          <ThemedText title={true}>Documents</ThemedText>
          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>ID Type:</ThemedText>
            <ThemedText subtitle={true}>{member.idType}</ThemedText>
          </View>

          <Spacer height={10} />

          {/* Carousel of documents */}
          <ThemedView>
            <ThemedKeyboardAwareScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={{ flexDirection: 'row' }}
            >
              <View style={styles.docContainer}>
                <ThemedImage src={require('@/assets/images/favicon.png')} size={220} />
                <ThemedText subtitle={true} style={styles.caption}>Front of ID</ThemedText>
              </View>

              <View style={styles.docContainer}>
                <ThemedImage src={require('@/assets/images/favicon.png')} size={220} />
                <ThemedText subtitle={true} style={styles.caption}>Back of ID</ThemedText>
              </View>

              <View style={styles.docContainer}>
                <ThemedImage src={require('@/assets/images/favicon.png')} size={220} />
                <ThemedText subtitle={true} style={styles.caption}>Selfie w/ ID</ThemedText>
              </View>
            </ThemedKeyboardAwareScrollView>
          </ThemedView>

          <Spacer height={20} />
        </ThemedCard>

        <Spacer height={16} />

        {/* --- Actions Section --- */}
        <ThemedCard>
          <ThemedText title={true}>Actions</ThemedText>
          <Spacer height={12} />

          <ThemedButton>
            <ThemedText btn>Confirm Residency</ThemedText>
          </ThemedButton>

          <Spacer height={10} />

          <ThemedButton submit={false} onPress={() => setRemoveOpen(true)}>
            <ThemedText non_btn>Remove Member</ThemedText>
          </ThemedButton>
        </ThemedCard>

        <Spacer height={20}/>
      </ThemedKeyboardAwareScrollView>

      {/* ---- Remove Member Bottom Sheet (moved here) ---- */}
      <ThemedBottomSheet visible={removeOpen} onClose={() => setRemoveOpen(false)} heightPercent={0.85}>
        <View style={{ flex: 1 }}>
          <ThemedKeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <ThemedText subtitle>Remove Member</ThemedText>

            <View style={{ gap: 6, marginTop: 10 }}>
              <ThemedText style={{ color: '#475569' }}>You are removing:</ThemedText>
              <View style={styles.removeCard}>
                <Ionicons name="person-outline" size={18} color="#475569" />
                <View style={{ marginLeft: 8 }}>
                  <ThemedText style={{ fontWeight: '700' }}>{member.name}</ThemedText>
                  <ThemedText style={{ color: '#64748b' }}>
                    {member.sex}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 16, gap: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Select a Reason</ThemedText>
              <ThemedDropdown
                placeholder="Select a Reason"
                items={reasonItems}
                value={selectedReason}
                setValue={setSelectedReason}
                order={0}
              />
            </View>
          </ThemedKeyboardAwareScrollView>

          <View style={styles.sheetFooter}>
            <ThemedButton submit={false} onPress={() => setRemoveOpen(false)} style={{ flex: 1 }}>
              <ThemedText non_btn>Cancel</ThemedText>
            </ThemedButton>

            <View style={{ width: 10 }} />

            <ThemedButton style={{ flex: 1 }} onPress={() => {
              // TODO: call your removal mutation here using member.id + selectedReason (+ otherReason)
              setRemoveOpen(false);
            }}>
              <ThemedText btn>Confirm Remove</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedBottomSheet>
    </ThemedView>
  );
};

export default MemberProfile;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  bold: { fontWeight: '600' },
  docContainer: { alignItems: 'center', marginRight: 15 },
  caption: { marginTop: 5, textAlign: 'center', color: '#6b6b6b' },

  removeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E9EDEF',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#fff',
  },
  sheetFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
});
