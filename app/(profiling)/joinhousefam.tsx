import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedKeyboardAwareScrollView from "@/components/ThemedKeyboardAwareScrollView";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { APICaller } from "@/src/infra/api/server_call";
import { AuthTokenUtil } from "@/utils/authTokenUtil";

type Option = { label: string; value: string | number };

enum Relationship {
    HOUSEHOLD_HEAD = 1,
    FAMILY_HEAD,
    SPOUSE,
    SON,
    DAUGHTER,
    PARENT,
    SIBLING,
    GRANDCHILD,
    GRANDPARENT,
    NEPHEW,
    NIECE,
    UNCLE,
    AUNT,
    COUSIN,
    IN_LAW,
    BOARDER,
    RENTER,
    DOMESTIC_HELPER,
    OTHER_RELATIVE,
    NON_RELATIVE,
}

const relationshipOptions: Record<number, string> = Object.keys(Relationship)
    .filter((k) => Number.isFinite(Number(k)))
    .reduce((acc: Record<number, string>, key: string) => {
        const num = Number(key);
        acc[num] = Relationship[num as keyof typeof Relationship] as unknown as string;
        return acc;
    }, {});

const initialState = {
    households: [] as Option[],
    families: [] as Option[],
    selectedHousehold: null as Option | null,
    selectedFamily: null as Option | null,
    householdRelationship: null as number | null,
    familyRelationship: null as number | null,
};

const DEBOUNCE_MS = 300; // tune as needed

const JoinHouseFam = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;

    const [state, setState] = useState(initialState);
    const [searchText, setSearchText] = useState("");
    const [loading, setLoading] = useState(false);

    // Guards to ignore stale async responses (race-safe)
    const searchSeqRef = useRef(0);
    const familySeqRef = useRef(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearAll = () => setState(initialState);

    const applyHouseholds = (options: Option[]) =>
        setState({ ...initialState, households: options });

    const handleSearchChange = (text: string) => {
        setSearchText(text);
    };

    useEffect(() => {
        // Debounce keystrokes
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            const trimmed = searchText.trim();

            // start a new sequence for every debounced search
            const mySeq = ++searchSeqRef.current;

            if (!trimmed) {
                // when blank, nuke state and make sure older responses can't overwrite
                clearAll();
                return;
            }

            (async () => {
                setLoading(true);
                try {
                    const token = await AuthTokenUtil.getToken();
                    const result = await APICaller.get(
                        "/api/v1/residents/households/search/",
                        { q: trimmed },
                        token
                    );
                    const households = Array.isArray(result?.data?.message)
                        ? result.data.message
                        : [];

                    if (searchSeqRef.current !== mySeq) return; // stale response, ignore

                    if (households.length === 0) {
                        clearAll();
                        return;
                    }

                    const options: Option[] = households.map((item: any) => ({
                        label: item.household_head_name,
                        value: item.household_id,
                    }));

                    applyHouseholds(options);
                } catch (error) {
                    if (searchSeqRef.current !== mySeq) return; // ignore if stale
                    clearAll();
                } finally {
                    if (searchSeqRef.current === mySeq) setLoading(false);
                }
            })();
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [searchText]);

    const familyData = async (householdId: string | number) => {
        const mySeq = ++familySeqRef.current;
        const token = await AuthTokenUtil.getToken();
        try {
            const result = await APICaller.get(
                "/api/v1/residents/fetch/families/",
                { q: householdId },
                token
            );
            const familyArr = result?.data?.message?.family_data || [];

            if (familySeqRef.current !== mySeq) return; // stale, ignore

            if (!Array.isArray(familyArr) || familyArr.length === 0) {
                setState((prev) => ({ ...prev, families: [], selectedFamily: null, familyRelationship: null }));
                return;
            }

            setState((prev) => ({
                ...prev,
                families: familyArr.map((item: any) => ({
                    label: `${item.person.first_name} ${item.person.last_name}`,
                    value: item.family_id,
                })),
                selectedFamily: null,
                familyRelationship: null,
            }));
        } catch (error) {
            if (familySeqRef.current !== mySeq) return; // stale, ignore
            setState((prev) => ({ ...prev, families: [], selectedFamily: null, familyRelationship: null }));
        }
    };

    const joinHouseholdFamily = async () => {
        const {
            selectedHousehold,
            selectedFamily,
            householdRelationship,
            familyRelationship,
        } = state;

        if (!selectedHousehold || !selectedFamily || !householdRelationship || !familyRelationship) {
            Alert.alert("Missing fields", "Please select household, family, and relationships.");
            return;
        }

        try {
            const payload = {
                household_id: selectedHousehold.value,
                family_id: selectedFamily.value,
                household_head_relationship: householdRelationship,
                family_head_relationship: familyRelationship,
            };
            const token = await AuthTokenUtil.getToken();

            await APICaller.post("/api/v1/residents/family-membership/", payload, token);
            Alert.alert("Success", "Membership successfully submitted!");
            clearAll();
            setSearchText("");
        } catch (error: any) {
            const apiError = error?.response?.data?.error || error?.message || "Failed to join household/family.";
            Alert.alert("Error", apiError);
        }
    };

    return (
        <ThemedView safe={true}>
            <ThemedAppBar title="Join Household & Family Unit" showNotif={false} showProfile={false} />
            <ThemedKeyboardAwareScrollView>
                <View style={{ padding: 12 }}>
                    <TextInput
                        placeholder="Search Household Head / Household Number"
                        value={searchText}
                        onChangeText={handleSearchChange}
                        style={{
                            color: theme.text,
                            flex: 1,
                            paddingVertical: 15,
                            backgroundColor: "white",
                            borderColor: loading ? "#3b82f6" : "black",
                            borderBottomWidth: 2,
                            paddingHorizontal: 12,
                        }}
                    />

                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>
                        {loading ? "Searching…" : "Households"}
                    </Text>
                    <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
                        {state.households.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.value}-${index}`}
                                onPress={() => {
                                    setState((prev) => ({
                                        ...prev,
                                        selectedHousehold: item,
                                        // clear downstream when household changes
                                        families: [],
                                        selectedFamily: null,
                                        familyRelationship: null,
                                    }));
                                    familyData(item.value);
                                }}
                                style={{
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderColor: "#ddd",
                                    backgroundColor:
                                        state.selectedHousehold?.value === item.value ? "#e0f7ff" : "transparent",
                                }}
                            >
                                <Text style={{ color: theme.text }}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>
                        Relationship to Household Head
                    </Text>
                    <Picker
                        selectedValue={state.householdRelationship}
                        onValueChange={(value) =>
                            setState((prev) => ({ ...prev, householdRelationship: value as number | null }))
                        }
                        style={{ marginTop: 8 }}
                    >
                        <Picker.Item label="Select relationship" value={null} />
                        {Object.entries(relationshipOptions).map(([key, label]) => (
                            <Picker.Item key={key} label={label} value={Number(key)} />
                        ))}
                    </Picker>

                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>Families</Text>
                    <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
                        {state.families.map((item, index) => (
                            <TouchableOpacity
                                key={`${item.value}-${index}`}
                                onPress={() =>
                                    setState((prev) => ({ ...prev, selectedFamily: item }))
                                }
                                style={{
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderColor: "#ccc",
                                    backgroundColor:
                                        state.selectedFamily?.value === item.value ? "#e0f7ff" : "transparent",
                                }}
                            >
                                <Text style={{ color: theme.text }}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>
                        Relationship to Family Head
                    </Text>
                    <Picker
                        selectedValue={state.familyRelationship}
                        onValueChange={(value) =>
                            setState((prev) => ({ ...prev, familyRelationship: value as number | null }))
                        }
                        style={{ marginTop: 8 }}
                    >
                        <Picker.Item label="Select relationship" value={null} />
                        {Object.entries(relationshipOptions).map(([key, label]) => (
                            <Picker.Item key={key} label={label} value={Number(key)} />
                        ))}
                    </Picker>

                    <ThemedButton
                        style={{ marginTop: 12, opacity: state.selectedHousehold && state.selectedFamily && state.householdRelationship && state.familyRelationship ? 1 : 0.7 }}
                        onPress={joinHouseholdFamily}
                    >
                        <ThemedText btn={true}>Join</ThemedText>
                    </ThemedButton>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    );
};

export default JoinHouseFam;
