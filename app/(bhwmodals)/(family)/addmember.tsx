/*
    Header follows the grouping/style used in `designation.tsx`:
    - Components
    - Constants
    - Hooks
    - Repository / services
    - Stores / types
    - React / react-native

    (This keeps imports organized and consistent across screens.)
*/

// --- Components
import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedDropdown from "@/components/ThemedDropdown";
import ThemedKeyboardAwareScrollView from "@/components/ThemedKeyboardAwareScrollView";
import ThemedSearchSelect from "@/components/ThemedSearchSelect";
import ThemedText from "@/components/ThemedText";
import ThemedTextInput from "@/components/ThemedTextInput";
import ThemedView from "@/components/ThemedView";

// --- Constants
import { RELATIONSHIP } from "@/constants/relationship";

// --- Hooks
import { useNiceModal } from '@/hooks/NiceModalProvider';
import { useAddMember } from "@/hooks/useAddMember";
import { usePersonSearchByKey } from "@/hooks/usePersonSearch";

// --- Repository / Commands
import { HouseholdCommand } from "@/repository/commands/HouseholdCommand";
import { PersonCommands } from "@/repository/commands/PersonCommands";
import { FamilyRepository } from "@/repository/familyRepository";

// --- Stores / Types
import { useHouseMateStore } from "@/store/houseMateStore";
import { useAccountRole } from "@/store/useAccountRole";
import { FamilyMembershipType } from "@/types/familyMembership";
import { MgaKaHouseMates } from "@/types/houseMates";

// --- React / React Native
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Platform, RefreshControl, StyleSheet, View } from "react-native";

type Resident = {
    person_id: string;
    full_name: string;
    person_code?: string;
    address?: string;
};

const AddMember = () => {
    const [residentSearchText, setResidentSearchText] = useState("");

    // selected values
    const [residentId, setResidentId] = useState<string>("");
    const [famheadrel, setFamHeadRel] = useState<number | string>("");
    const [hhheadrel, setHhHeadReal] = useState<number | string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [age, setAge] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [mobile, setMobile] = useState<string>("");
    const [nationality, setNationality] = useState<string>("");
    const [sex, setSex] = useState<string>("");
    const [refreshing, setRefreshing] = useState(false);
    const [isFetchingResident, setIsFetchingResident] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const [familyId, setFamilyId] = useState<number | null>(null);
    const familyNumber = useHouseMateStore((state: MgaKaHouseMates) => state.familyId);
    const { results: residentItems, search } = usePersonSearchByKey();
    const { addMember, loading, error } = useAddMember();
    const profile = useAccountRole((s) => s.getProfile('resident'));
    const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null;
    const { showModal } = useNiceModal();

    useEffect(() => {
        const getFamilyId = async () => {
            const id = await new FamilyRepository().getFamilyId(familyNumber);
            setFamilyId(id);
        };
        getFamilyId();
    }, [familyNumber]);

    const clearPrefill = () => {
        setFirstName("");
        setLastName("");
        setAge("");
        setAddress("");
        setEmail("");
        setMobile("");
        setNationality("");
        setSex("");
        setFamHeadRel("");
        setHhHeadReal("");
    };

    const normalize = <T,>(v: T | T[] | null | undefined): T[] => {
        if (Array.isArray(v)) return v as T[];
        if (v == null) return [];
        return [v as T];
    };

    const fetchResidentInfo = useCallback(async (personId: string) => {
        if (!personId) {
            clearPrefill();
            return;
        }

        setIsFetchingResident(true);
        try {
            const personRepo = new PersonCommands();
            const details = await personRepo.FetchResidentByPersonId(Number(personId));

            // map simple fields
            setFirstName(details?.first_name ?? "");
            setLastName(details?.last_name ?? "");
            setAge(details?.age ? String(details.age) : (details?.birthdate ? '' : ''));

            // address: try to use first address row (normalize to support object or array)
            const addrItem = normalize(details?.addresss)[0] ?? null;
            if (addrItem) {
                const parts = [(addrItem as any).street, (addrItem as any).barangay, (addrItem as any).city].filter(Boolean);
                setAddress(parts.join(', '));
            } else {
                setAddress("");
            }

            setEmail(details?.email ?? "");
            setMobile(details?.mobile_num ?? "");
            setNationality(normalize(details?.nationality)[0]?.nationality_name ?? "");
            setSex(normalize(details?.sex)[0]?.sex_name ?? "");

            // Kinship prefill removed: user will select relationships manually.
        } catch (e) {
            console.error('fetchResidentInfo error', e);
        } finally {
            setIsFetchingResident(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchResidentInfo(residentId);
        setRefreshing(false);
    }, [residentId, fetchResidentInfo]);

    const submitHandler = async () => {
        // guard: ensure resident isn't already an active house member
        setIsChecking(true);
        try {
            if (residentId) {
                const existing = await new HouseholdCommand().FetchActiveHouseMemberByPersonId(Number(residentId));
                if (existing) {
                    Alert.alert("Warning", "This person is currently an active member of a family.");
                    setIsChecking(false);
                    return;
                }
            }
        } catch (e) {
            console.error('check existing member error', e);
            Alert.alert('Warning', 'Unable to verify existing membership. Please try again.');
            setIsChecking(false);
            return;
        }
        setIsChecking(false);

        const data: FamilyMembershipType = {
            p_family_id: familyId,
            p_added_by_id: parseInt(addedById ?? '1'),
            p_existing_person_id: Number(residentId),
            p_relationship_to_hholdhead_id: Number(hhheadrel),
            p_relationship_to_family_head_id: Number(famheadrel),
        };

        const res = await addMember(data);
        if (!res) {
            Alert.alert("Warning", error || "Failed to add member. Please try again.");
            return;
        }

        Alert.alert("Success!", "Member added successfully!");
        // clear all prefilled values on success
        clearPrefill();
        setResidentId("");
        setResidentSearchText("");
    };

    return (
        <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
            <ThemedAppBar title="Add Member" showNotif={true} showProfile={true} />

            <ThemedKeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', padding: 20 }}
            >
                <View>
                    <ThemedSearchSelect<Resident>
                        items={residentItems}
                        getLabel={(p) =>
                            p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
                        }
                        getSubLabel={(p) => p.address}
                        inputValue={residentSearchText}
                        onInputValueChange={(t) => {
                            setResidentSearchText(t);
                            search(t);
                            if (!t) {
                                setResidentId("");
                                clearPrefill();
                            }
                        }}
                        placeholder="Search Resident (Name / Resident ID)"
                        filter={(p, q) => {
                            const query = q.toLowerCase();
                            return (
                                p.full_name.toLowerCase().includes(query) ||
                                (p.person_code || "").toLowerCase().includes(query) ||
                                (p.address || "").toLowerCase().includes(query) ||
                                query.includes(p.full_name.toLowerCase()) ||
                                (p.person_code && query.includes(p.person_code.toLowerCase()))
                            );
                        }}
                        onSelect={(p) => {
                            setResidentId(p.person_id);
                            setResidentSearchText(
                                p.person_code
                                    ? `${p.full_name} · ${p.person_code}`
                                    : p.full_name
                            );
                            fetchResidentInfo(p.person_id);
                        }}
                        autoCapitalize="words"
                        emptyText="No resident found"
                    />

                    <Spacer height={10} />
                </View>

                <Spacer height={12} />

                <View style={styles.container}>
                    <ThemedDropdown
                        items={RELATIONSHIP}
                        value={famheadrel}
                        setValue={setFamHeadRel}
                        placeholder="Relationship to Family Head"
                    />

                    {String(famheadrel).length === 0 && (
                        <>
                            <Spacer height={6} />
                            <ThemedText style={styles.required}>
                                * Relationship to Family Head is required.
                            </ThemedText>
                        </>
                    )}

                    <Spacer height={10} />

                    <ThemedDropdown
                        items={RELATIONSHIP.filter(r => r.value !== 1)}
                        value={hhheadrel}
                        setValue={setHhHeadReal}
                        placeholder="Relationship to Household Head"
                        order={1}
                    />

                    {String(hhheadrel).length === 0 && (
                        <>
                            <Spacer height={6} />
                            <ThemedText style={styles.required}>
                                * Relationship to Household Head is required.
                            </ThemedText>
                        </>
                    )}

                    <Spacer height={10} />
                    <View style={styles.row}>
                        <View style={[styles.col, styles.colRight]}>
                            <ThemedText bold>First Name</ThemedText>
                            <ThemedTextInput value={firstName} editable={false} onChangeText={() => {}} />
                        </View>
                        <View style={styles.col}>
                            <ThemedText bold>Last Name</ThemedText>
                            <ThemedTextInput value={lastName} editable={false} onChangeText={() => {}} />
                        </View>
                    </View>

                    <Spacer height={8} />

                    <View style={styles.row}>
                        <View style={[styles.col, styles.colRight]}>
                            <ThemedText bold>Email</ThemedText>
                            <ThemedTextInput value={email} editable={false} onChangeText={() => {}} />
                        </View>
                        <View style={styles.col}>
                            <ThemedText bold>Mobile Number</ThemedText>
                            <ThemedTextInput value={mobile} editable={false} onChangeText={() => {}} />
                        </View>
                    </View>

                    <Spacer height={8} />

                    <View style={styles.row}>
                        <View style={[styles.col, styles.colRight]}>
                            <ThemedText bold>Age</ThemedText>
                            <ThemedTextInput value={age} editable={false} onChangeText={() => {}} />
                        </View>
                        <View style={styles.col}>
                            <ThemedText bold>Sex</ThemedText>
                            <ThemedTextInput value={sex} editable={false} onChangeText={() => {}} />
                        </View>
                    </View>

                    <Spacer height={8} />

                    <ThemedText bold>Address</ThemedText>
                    <ThemedTextInput value={address} editable={false} onChangeText={() => {}} />

                    <Spacer height={8} />
                    <ThemedText bold>Nationality</ThemedText>
                    <ThemedTextInput value={nationality} editable={false} onChangeText={() => {}} />

                    <Spacer height={15} />

                    <ThemedButton
                        label={isFetchingResident || isChecking || loading ? "Loading..." : "Continue"}
                        onPress={() => showModal({
                            title: 'Add Member',
                            message: 'Add this resident to the family?',
                            variant: 'info',
                            primaryText: 'Add',
                            secondaryText: 'Cancel',
                            onPrimary: () => submitHandler(),
                        })}
                        disabled={
                            !residentId ||
                            String(famheadrel).length === 0 ||
                            String(hhheadrel).length === 0 ||
                            isFetchingResident ||
                            isChecking ||
                            loading
                        }
                    >
                        <ThemedText btn>{isFetchingResident || isChecking || loading ? 'Loading...' : 'Continue'}</ThemedText>
                    </ThemedButton>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    );
};

export default AddMember;

const styles = StyleSheet.create({
    container: { paddingHorizontal: 8 },
    row: { flexDirection: 'row', alignItems: 'flex-start' },
    col: { flex: 1 },
    colRight: { marginRight: 10 },
    required: { color: '#b00020', fontSize: 12, marginBottom: 6 },
});
