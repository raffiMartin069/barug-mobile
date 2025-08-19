import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    useColorScheme,
    Alert,
} from "react-native";

import { Picker } from '@react-native-picker/picker';
import ThemedView from "@/components/ThemedView";
import ThemedText from "@/components/ThemedText";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedKeyboardAwareScrollView from "@/components/ThemedKeyboardAwareScrollView";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { APICaller } from "@/src/infra/api/server_call";

const relationshipOptions: { [key: number]: string } = {
    1: "HOUSEHOLD_HEAD",
    2: "FAMILY_HEAD",
    3: "SPOUSE",
    4: "SON",
    5: "DAUGHTER",
    6: "PARENT",
    7: "SIBLING",
    8: "GRANDCHILD",
    9: "GRANDPARENT",
    10: "NEPHEW",
    11: "NIECE",
    12: "UNCLE",
    13: "AUNT",
    14: "COUSIN",
    15: "IN_LAW",
    16: "BOARDER",
    17: "RENTER",
    18: "DOMESTIC_HELPER",
    19: "OTHER_RELATIVE",
    20: "NON_RELATIVE",
};

const JoinHouseFam = () => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme] ?? Colors.light;

    const [household, setHousehold] = useState<{ label: string; value: string }[]>([]);
    const [families, setFamilies] = useState<{ label: string; value: string }[]>([]);

    const [selectedHousehold, setSelectedHousehold] = useState<{ label: string; value: string } | null>(null);
    const [selectedFamily, setSelectedFamily] = useState<{ label: string; value: string } | null>(null);

    const [householdRelationship, setHouseholdRelationship] = useState<number | null>(null);
    const [familyRelationship, setFamilyRelationship] = useState<number | null>(null);

    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNTcsInVzZXJuYW1lIjoiYXJsZW5lQHlhaG9vLmNvbSIsInJvbGUiOiJQRVJTT04iLCJleHAiOjE3NTU2MjM5OTd9.ya-9Jzhd8yjmDZWZu9DFc56ShiLPHDKAXOdVPZwjwIo";

    // Fetch households
    const householdData = async (key: string) => {
        try {
            const result = await APICaller.get(
                "/api/v1/residents/households/search/",
                { q: key },
                token
            );

            const households = Array.isArray(result.data.message) ? result.data.message : [];

            setHousehold(
                households.map((item: any) => ({
                    label: item.household_head_name,
                    value: item.household_id,
                }))
            );

            if (households.length === 0) setHousehold([]);
        } catch (error: any) {
            console.error("Household fetch error:", error);
            setHousehold([]);
        }
    };

    // Fetch families
    const familyData = async (householdId: string | number) => {
        try {
            const result = await APICaller.get(
                "/api/v1/residents/fetch/families/",
                { q: householdId },
                token
            );

            const familyArr =
                result?.data?.message?.family_data && Array.isArray(result.data.message.family_data)
                    ? result.data.message.family_data
                    : [];

            if (familyArr.length === 0) {
                setFamilies([]);
                return;
            }

            const mapped = familyArr.map((item: any) => ({
                label: item.person.first_name + " " + item.person.last_name,
                value: item.family_id,
            }));

            setFamilies(mapped);
        } catch (error: any) {
            console.error("Family fetch error:", error);
            setFamilies([]);
        }
    };

    // Join household/family
    const joinHouseholdFamily = async () => {
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

            const result = await APICaller.post(
                "/api/v1/residents/family-membership/",
                payload,
                token
            );

            Alert.alert("Success", "Membership successfully submitted!");
        } catch (error: any) {
            const apiError =
            error?.response?.data?.error ||  // <- matches your API format
            error?.message ||                 // fallback
            "Failed to join household/family.";

        console.error("Join request error:", error.response.data.error);
        Alert.alert("Error", apiError);
        }
    };

    return (
        <ThemedView safe={true}>
            <ThemedAppBar title="Join Household & Family Unit" showNotif={false} showProfile={false} />
            <ThemedKeyboardAwareScrollView>
                <View style={{ padding: 12 }}>
                    {/* Search Field */}
                    <TextInput
                        placeholder="Search Household Head / Household Number"
                        onChangeText={householdData}
                        style={{
                            color: theme.text,
                            flex: 1,
                            paddingVertical: 15,
                            backgroundColor: "white",
                            borderColor: "black",
                            borderBottomWidth: 2,
                            paddingHorizontal: 12,
                        }}
                    />

                    {/* Household List */}
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>Households</Text>
                    <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
                        {household.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    setSelectedHousehold(item);
                                    familyData(item.value);
                                }}
                                style={{
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderColor: "#ddd",
                                    backgroundColor: selectedHousehold?.value === item.value ? "#e0f7ff" : "transparent",
                                }}
                            >
                                <Text style={{ color: theme.text }}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Household Relationship Dropdown */}
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>Relationship to Household Head</Text>
                    <Picker
                        selectedValue={householdRelationship}
                        onValueChange={(value) => setHouseholdRelationship(value)}
                        style={{ marginTop: 8 }}
                    >
                        <Picker.Item label="Select relationship" value={null} />
                        {Object.entries(relationshipOptions).map(([key, label]) => (
                            <Picker.Item key={key} label={label} value={Number(key)} />
                        ))}
                    </Picker>

                    {/* Family List */}
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>Families</Text>
                    <ScrollView style={{ maxHeight: 200, marginTop: 8 }}>
                        {families.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => setSelectedFamily(item)}
                                style={{
                                    padding: 10,
                                    borderBottomWidth: 1,
                                    borderColor: "#ccc",
                                    backgroundColor: selectedFamily?.value === item.value ? "#e0f7ff" : "transparent",
                                }}
                            >
                                <Text style={{ color: theme.text }}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Family Relationship Dropdown */}
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.text }}>Relationship to Family Head</Text>
                    <Picker
                        selectedValue={familyRelationship}
                        onValueChange={(value) => setFamilyRelationship(value)}
                        style={{ marginTop: 8 }}
                    >
                        <Picker.Item label="Select relationship" value={null} />
                        {Object.entries(relationshipOptions).map(([key, label]) => (
                            <Picker.Item key={key} label={label} value={Number(key)} />
                        ))}
                    </Picker>

                    {/* Join Button */}
                    <ThemedButton style={{ marginTop: 12 }} onPress={joinHouseholdFamily}>
                        <ThemedText btn={true}>Join</ThemedText>
                    </ThemedButton>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    );
};

export default JoinHouseFam;
