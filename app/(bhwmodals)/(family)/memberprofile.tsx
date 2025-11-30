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
import { PersonCommands } from '@/repository/commands/PersonCommands';
import { FamilyRepository } from '@/repository/familyRepository';
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
  const familyNumber = useHouseMateStore((state: MgaKaHouseMates) => state.familyId)

  const mountedRef = useRef(true)
  const [refreshing, setRefreshing] = React.useState(false)

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    const repo = new ResidentRepository();
    try {
      if (opts?.refresh) setRefreshing(true)
      else setLoading(true);
      const details: any = await repo.getAllResidentInfo(memberId);
        const ids: any[] = [];
        let profile_picture = null;

        if (details?.[0]?.profile_picture) {
          profile_picture = await repo.getDocuments(details[0].profile_picture);
        }

        for (let doc of (details?.[0]?.valid_id_files || [])) {
          if (!doc) continue;
          const images = await repo.getDocuments(doc);
          ids.push(images);
        }

        if (!mountedRef.current) return;

        // attempt kinship-derived relations (same approach as addmember.tsx)
        try {
          const personCmd = new PersonCommands()
          const kin = await personCmd.FetchKinshipBySrcPersonId(Number(memberId))

          // Attempt multiple ways to resolve family/household heads and match kin edges.
          const fRepo = new FamilyRepository()
          let fid: any = null
          let familyHeadId: any = null
          let householdId: any = null
          let householdHeadId: any = null

          // Try store-provided familyNumber first
          if (familyNumber) {
            fid = await fRepo.getFamilyId(familyNumber)
          }

          // If fid not found, try resident details payload (family_id or family_num)
          if (!fid && details?.[0]) {
            const d = details[0]
            if (d.family_num) {
              fid = await fRepo.getFamilyId(d.family_num)
            }
            // if we already have a numeric family primary id on details, use it directly
            if (!fid && d.family_id) {
              fid = d.family_id
            }
          }

          if (fid) {
            try {
              familyHeadId = await fRepo.GetFamilyHeadIdByFamilyId(fid)
            } catch {
            }
            try {
              householdId = await fRepo.GetHouseholdIdByFamilyId(fid)
            } catch {
            }
            if (householdId) {
              try {
                householdHeadId = await fRepo.GetHouseholdHeadIdByHouseholdId(householdId)
              } catch {
              }
            }
          }

          

          const normalize = <T,>(v: T | T[] | null | undefined): T[] => {
            if (Array.isArray(v)) return v as T[]
            if (v == null) return []
            return [v as T]
          }

          const extractPersonIds = (dp: any): number[] => {
            const out: number[] = []
            if (!dp) return out
            if (dp.person_id != null) out.push(Number(dp.person_id))
            if (dp.id != null) out.push(Number(dp.id))
            if (dp.person && dp.person.person_id != null) out.push(Number(dp.person.person_id))
            if (dp.person && dp.person.id != null) out.push(Number(dp.person.id))
            return out
          }

          const extractRelId = (r: any): number | null => {
            if (!r) return null
            if (r.relationship_id != null) return Number(r.relationship_id)
            if (r.id != null) return Number(r.id)
            if (r.rel_id != null) return Number(r.rel_id)
            if (r.relationship && r.relationship.relationship_id != null) return Number(r.relationship.relationship_id)
            return null
          }

          if (Array.isArray(kin)) {
            // look for family head reference
            let famEdge: any = null
            if (familyHeadId) {
              famEdge = kin.find((k: any) => normalize(k.dst_person).some((dp: any) => extractPersonIds(dp).includes(Number(familyHeadId))))
            }
            // fallback: try matching against details.family_head_person_id if present
            if (!famEdge && details?.[0]?.family_head_person_id) {
              const fh = Number(details[0].family_head_person_id)
              famEdge = kin.find((k: any) => normalize(k.dst_person).some((dp: any) => extractPersonIds(dp).includes(fh)))
            }
            
                if (famEdge) {
              const rel = normalize((famEdge as any).relationship)
              if (rel.length > 0) {
                const chosen = extractRelId(rel[0])
                if (chosen != null) {
                  setRelToFamily(chosen)
                }
              }
            }

            let hhEdge: any = null
            if (householdHeadId) {
              hhEdge = kin.find((k: any) => normalize(k.dst_person).some((dp: any) => extractPersonIds(dp).includes(Number(householdHeadId))))
            }
            // fallback: try matching against details.household_head_person_id
            if (!hhEdge && details?.[0]?.household_head_person_id) {
              const hh = Number(details[0].household_head_person_id)
              hhEdge = kin.find((k: any) => normalize(k.dst_person).some((dp: any) => extractPersonIds(dp).includes(hh)))
            }
            
            if (hhEdge) {
              const rel = normalize((hhEdge as any).relationship)
              if (rel.length > 0) {
                const chosen = extractRelId(rel[0])
                if (chosen != null) {
                  setRelToHousehold(chosen)
                }
              }
            }
          }
        } catch {
        }

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
          front_id_file: ids[0] ? ids[0].publicUrl : undefined,
          back_id_file: ids[1] ? ids[1].publicUrl : undefined,
          selfie_id_file: ids[2] ? ids[2].publicUrl : undefined,
          profile_picture: profile_picture ? profile_picture.publicUrl : undefined,
        });

    } catch (e: any) {
      showModal({ title: 'Error', message: e?.message || 'Failed to load member details.', variant: 'error', primaryText: 'OK', dismissible: true })
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false)
      }
    }
  }, [memberId, familyNumber, showModal]);

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
        setSubmitting(true);
        await repo.confirmResidency(Number(memberId), undefined, relToHousehold ?? null, relToFamily ?? null, reason ?? null)
        showModal({ title: 'Success', message: 'Residency has been confirmed.', variant: 'success', primaryText: 'OK', dismissible: true })
        setConfirmModalVisible(false)
        setRelToHousehold(null)
        setRelToFamily(null)
        setReason('')
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
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.primaryBtn,
              pressed && styles.pressed,
              (submitting || loading) && styles.disabled,
            ]}
            disabled={submitting || loading}
            onPress={handleConfirmResidency}
          >
            {submitting ? (
              <ActivityIndicator />
            ) : (
              <ThemedText style={styles.buttonText}>Confirm Residency</ThemedText>
            )}
          </Pressable>

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
