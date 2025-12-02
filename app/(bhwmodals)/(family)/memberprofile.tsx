import CenteredModal from '@/components/custom/CenteredModal';
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedImage from '@/components/ThemedDocumentImage';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { RELATIONSHIP } from '@/constants/relationship';
import { ResidencyException } from '@/exception/ResidencyException';
import { useNiceModal } from '@/hooks/NiceModalProvider';
import { HouseMemberCommand } from '@/repository/queries/HouseMemberCommand';
import { ResidentRepository } from '@/repository/residentRepository';
import { useHouseMateStore } from '@/store/houseMateStore';
import { MgaKaHouseMates } from '@/types/houseMates';
import { PersonalDetails } from '@/types/personalDetails';
import React, { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

const MemberProfile = () => {
  const memberId = useHouseMateStore((state: MgaKaHouseMates) => state.memberId);
  const [personalDetails, setPersonalDetails] = React.useState<PersonalDetails | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const { showModal } = useNiceModal()
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false)
  const [reason, setReason] = React.useState<string>('')
  const [relToHousehold, setRelToHousehold] = React.useState<number | null>(null)
  const [relToFamily, setRelToFamily] = React.useState<number | null>(null)
  const [relationshipPicker, setRelationshipPicker] = React.useState<'household' | 'family' | null>(null)
  const [isConfirmed, setIsConfirmed] = React.useState<boolean>(false)

  const mountedRef = useRef(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    const repo = new ResidentRepository();
    try {
      if (opts?.refresh) setRefreshing(true)
      else setLoading(true);
      const details: any = await repo.getAllResidentInfo(memberId);

      if (!mountedRef.current) return;

      // attempt relationship-prefill: try house_member records first, then fallback to kinship DTO
      try {
        const houseCmd = new HouseMemberCommand()
        const hm = await houseCmd.FetchActiveHouseMemberByPersonId(Number(memberId))
        if (hm) {
          const hhRel = hm.relationship_to_hholdhead_id ?? hm.relationship_to_household_head_id ?? hm.relationship_to_household_id ?? hm.rel_to_hhold_head_id ?? null
          const famRel = hm.relationship_to_family_head_id ?? hm.relationship_to_family_id ?? hm.rel_to_family_head_id ?? null
          if (hhRel != null) setRelToHousehold(Number(hhRel))
          if (famRel != null) setRelToFamily(Number(famRel))
        }
      } catch {
      }

      // Use image paths directly from the details response
      setPersonalDetails({
        person_id: details[0].person_id,
        first_name: details[0].first_name,
        middle_name: details[0].middle_name,
        last_name: details[0].last_name,
        suffix: details[0].suffix,
        sex: details[0].sex,
        birthdate: details[0].birthdate,
        civil_status: details[0].civil_status,
        nationality: details[0].nationality,
        religion: details[0].religion,
        education: details[0].education,
        employment_status: details[0].employment_status,
        occupation: details[0].occupation,
        personal_monthly_income: details[0].personal_monthly_income,
        gov_program: details[0].gov_program,
        front_id_file: details[0].valid_id_front_path || undefined,
        back_id_file: details[0].valid_id_back_path || undefined,
        selfie_id_file: details[0].selfie_with_id || undefined,
        profile_picture: details[0].profile_picture || undefined,
        residency_status: String(details[0].residential_status).toLowerCase() || undefined,
      });

    } catch (e: any) {
      showModal({ title: 'Error', message: e?.message || 'Failed to load member details.', variant: 'error', primaryText: 'OK', dismissible: true })
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false)
      }
    }
  }, [memberId, showModal]);

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  const handleConfirmResidency = () => {
    // open the centered modal to collect reason and relationships
    setConfirmModalVisible(true)
  };

  const submitConfirmResidency = async () => {
    const repo = new ResidentRepository();
    try {
      const residentialStatus = personalDetails?.residency_status || ''
      if (residentialStatus.toLowerCase() !== 'resident') {
        showModal({ title: 'Warning', message: 'Only residents can have their residency confirmed.', variant: 'warn', primaryText: 'OK', dismissible: true })
        return;
      }

      if (!reason || !reason.trim()) {
        showModal({ title: 'Warning', message: 'Please provide a reason for confirming residency.', variant: 'warn', primaryText: 'OK', dismissible: true })
        return;
      }

      if (isConfirmed) {
        showModal({ title: 'Warning', message: 'Residency has already been confirmed.', variant: 'warn', primaryText: 'OK', dismissible: true })
        return;
      }

      setSubmitting(true);
      await repo.confirmResidency(Number(memberId), undefined, relToHousehold ?? null, relToFamily ?? null, reason ?? null)
      showModal({ title: 'Success', message: 'Residency has been confirmed.', variant: 'success', primaryText: 'OK', dismissible: true })
      setConfirmModalVisible(false)
      setRelToHousehold(null)
      setRelToFamily(null)
      setReason('')
      setIsConfirmed(true)
    } catch (e: any) {
      if (e instanceof ResidencyException) {
        showModal({ title: 'Warning', message: e.message, variant: 'warn', primaryText: 'OK', dismissible: true })
        return
      }
      showModal({ title: 'Error', message: 'Failed to confirm residency.', variant: 'error', primaryText: 'OK', dismissible: true })
    } finally {
      setSubmitting(false)
    }
  }

  // const handleRemoveMember = () => {
  //   showModal({
  //     title: 'Remove Member',
  //     message: 'Remove this member from the household/family? This action cannot be undone.',
  //     variant: 'warn',
  //     primaryText: 'Remove',
  //     secondaryText: 'Cancel',
  //     onPrimary: async () => {
  //       const repo = new ResidentRepository();
  //       try {
  //         setSubmitting(true);
  //         await repo.removeHouseMember(memberId);
  //         Alert.alert('Removed', 'Member has been removed.');
  //       } catch (e: any) {
  //         Alert.alert('Error', e?.message || 'Failed to remove member.');
  //       } finally {
  //         setSubmitting(false);
  //       }
  //     }
  //   })
  // };

  return (
    <ThemedView style={{ flex: 1 }} safe={true}>
      <ThemedAppBar
        title='Family Member Profile'
        showNotif={false}
        showProfile={false}
      />

      <View style={styles.container}>
        <ThemedKeyboardAwareScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load({ refresh: true })} />}
        >
          <ThemedCard>
            <View style={{ alignItems: 'center' }}>
              <ThemedImage
                src={
                  personalDetails?.profile_picture
                    ? { uri: personalDetails.profile_picture }
                    : require('@/assets/images/default-image.jpg')
                }
                size={90}
                resizeMode="contain"
              />
            </View>

            <Spacer height={15} />

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
              <ThemedText subtitle={true}>{memberId}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
              <ThemedText subtitle={true}>
                {personalDetails?.first_name} {personalDetails?.middle_name} {personalDetails?.last_name}
              </ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.sex}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.birthdate}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.civil_status}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.nationality}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.religion}</ThemedText>
            </View>

            <Spacer height={15} />
            <ThemedDivider />
            <Spacer height={15} />

            {/* Socioeconomic Information */}
            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.education}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.employment_status}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.occupation ?? 'N/A'}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.personal_monthly_income ?? 'N/A'}</ThemedText>
            </View>

            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
              <ThemedText subtitle={true}>{personalDetails?.gov_program ?? 'N/A'}</ThemedText>
            </View>

            <Spacer height={15} />
            <ThemedDivider />
            <Spacer height={15} />

            {/* Documents */}
            <ThemedText title={true}>Documents</ThemedText>
            <Spacer height={10} />

            <Spacer height={10} />

            {/* Carousel of documents */}
            <ThemedView>
              <ThemedKeyboardAwareScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                style={{ flexDirection: 'row' }}
              >
                {/* Front of ID */}
                <View style={styles.docContainer}>
                  <ThemedImage
                    src={
                      personalDetails?.front_id_file
                        ? { uri: personalDetails.front_id_file }
                        : require('@/assets/images/favicon.png')
                    }
                    size={220}
                    resizeMode="contain"
                  />
                  <ThemedText subtitle={true} style={styles.caption}>Front of ID</ThemedText>
                </View>

                {/* Back of ID */}
                <View style={styles.docContainer}>
                  <ThemedImage
                    src={
                      personalDetails?.back_id_file
                        ? { uri: personalDetails.back_id_file }
                        : require('@/assets/images/favicon.png')
                    }
                    size={220}
                    resizeMode="contain"
                  />
                  <ThemedText subtitle={true} style={styles.caption}>Back of ID</ThemedText>
                </View>

                {/* Selfie with ID */}
                <View style={styles.docContainer}>
                  <ThemedImage
                    src={
                      personalDetails?.selfie_id_file
                        ? { uri: personalDetails.selfie_id_file }
                        : require('@/assets/images/favicon.png')
                    }
                    size={220}
                    resizeMode="contain"
                  />
                  <ThemedText subtitle={true} style={styles.caption}>Selfie w/ ID</ThemedText>
                </View>
              </ThemedKeyboardAwareScrollView>
            </ThemedView>

            <Spacer height={20} />
          </ThemedCard>

          <Spacer height={20} />
        </ThemedKeyboardAwareScrollView>

        {/* Confirm Residency Modal */}
        <CenteredModal
          visible={confirmModalVisible}
          title='Confirm Residency Details'
          footer={(
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Close (left) */}
              <ThemedButton
                submit={false}
                style={{ flex: 1, borderRadius: 8, marginRight: 10, paddingVertical: 10 }}
                onPress={() => setConfirmModalVisible(false)} label={undefined}              >
                <ThemedText non_btn>Close</ThemedText>
              </ThemedButton>

              {/* Confirm (right) - disabled until a relationship is selected */}
              <ThemedButton
                style={{ flex: 1, borderRadius: 8, paddingVertical: 10 }}
                onPress={() => showModal({
                  title: 'Confirm Residency',
                  message: 'Are you sure you want to confirm this residency? This action cannot be undone.',
                  variant: 'warn',
                  primaryText: 'Confirm',
                  secondaryText: 'Cancel',
                  onPrimary: async () => { await submitConfirmResidency(); },
                  onSecondary: () => { },
                  dismissible: true,
                })}
                disabled={submitting || !(relToHousehold || relToFamily)} label={undefined}              >
                <ThemedText btn>Confirm</ThemedText>
              </ThemedButton>
            </View>
          )}
        >
          <ThemedText style={{ marginBottom: 8 }}>Please provide the following details before confirming residency.</ThemedText>
          <ThemedTextInput placeholder='Reason (optional)' value={reason} onChangeText={(t) => setReason(t)} />
          <Spacer height={8} />
          <Pressable onPress={() => setRelationshipPicker('household')} style={{ paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <ThemedText>{relToHousehold ? (RELATIONSHIP.find(r => Number(r.value) === Number(relToHousehold))?.label ?? 'Selected') : 'Select relationship to Household Head'}</ThemedText>
          </Pressable>
          <Spacer height={8} />
          <Pressable onPress={() => setRelationshipPicker('family')} style={{ paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <ThemedText>{relToFamily ? (RELATIONSHIP.find(r => Number(r.value) === Number(relToFamily))?.label ?? 'Selected') : 'Select relationship to Family Head'}</ThemedText>
          </Pressable>
          <CenteredModal
            visible={relationshipPicker === 'household' || relationshipPicker === 'family'}
            title={relationshipPicker === 'household' ? 'Select relationship to Household Head' : 'Select relationship to Family Head'}
            onClose={() => setRelationshipPicker(null)}
          >
            {RELATIONSHIP.map((r) => (
              <Pressable key={r.value as any} onPress={() => {
                if (relationshipPicker === 'household') setRelToHousehold(Number(r.value))
                else setRelToFamily(Number(r.value))
                setRelationshipPicker(null)
              }} style={{ paddingVertical: 12 }}>
                <ThemedText>{r.label}</ThemedText>
              </Pressable>
            ))}
          </CenteredModal>
        </CenteredModal>

        {/* Fixed Footer Actions */}
        <View style={styles.footer}>
          {
            personalDetails?.residency_status === 'resident' ? (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  styles.disabled,
                ]}
                disabled={true}
                onPress={handleConfirmResidency}
              >
                {submitting ? (
                  <ActivityIndicator />
                ) : (
                  <ThemedText style={styles.buttonText}>Residency Confirmed</ThemedText>
                )}
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.primaryBtn,
                  pressed && styles.pressed,
                  (submitting || loading) && styles.disabled,
                ]}
                disabled={submitting || loading || isConfirmed}
                onPress={handleConfirmResidency}
              >
                {submitting ? (
                  <ActivityIndicator />
                ) : (
                  <ThemedText style={styles.buttonText}>{isConfirmed ? 'Residency Confirmed' : 'Confirm Residency'}</ThemedText>
                )}
              </Pressable>
            )
          }


          {/* <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.dangerBtn,
              pressed && styles.pressed,
              (submitting || loading) && styles.disabled,
            ]}
            disabled={submitting || loading}
            onPress={handleRemoveMember}
          >
            {submitting ? (
              <ActivityIndicator />
            ) : (
              <ThemedText style={styles.buttonText}>Remove Member</ThemedText>
            )}
          </Pressable> */}
        </View>
      </View>
    </ThemedView>
  );
};

export default MemberProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  bold: {
    fontWeight: '600',
  },
  docContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  caption: {
    marginTop: 5,
    textAlign: 'center',
    color: '#6b6b6b',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.12)',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryBtn: {
    backgroundColor: '#6d2932', // brand-700
  },
  dangerBtn: {
    backgroundColor: '#BB2222',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.6,
  },
});
