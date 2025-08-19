import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedKeyboardAwareScrollView from "@/components/ThemedKeyboardAwareScrollView";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import React from "react";
import { TextInput, useColorScheme, View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { Dropdown } from 'react-native-element-dropdown';
import AntDesign from '@expo/vector-icons/AntDesign';
import { APICaller } from "@/src/infra/api/server_call";

const data = [];

type Household = {
    id: string;
    head: string;
    status: string;
}

function JoinHouseFam() {

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNTcsInVzZXJuYW1lIjoiYXJsZW5lQHlhaG9vLmNvbSIsInJvbGUiOiJQRVJTT04iLCJleHAiOjE3NTU2MDIyMDR9.oH-hS7G90uHc_STweX3rvjc_K8X6SZjhrwlEH7_G4Ok'

    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    const [householdText, setHouseholdText] = React.useState('');
    const [value, setValue] = React.useState(null);
    const [isFocus, setIsFocus] = React.useState(false);
    const [household, setHousehold] = React.useState<Household[]>([]);
    const [dropdownData, setDropdownData] = React.useState<{ label: string; value: string | number }[]>([]);


    const householdTextChange = async (text: string) => {
        setHouseholdText(text);
        try {
            const result = await APICaller.get(
                '/api/v1/residents/households/search/',
                { q: text },
                token
            );

            if (result.message === "No results found") {
                console.warn("No data");
                setDropdownData([]); // reset
                return;
            }

            console.log("Household search result:", result);

            const mapped = result.message.map((item: any) => ({
                label: item.household_head_name,
                value: item.household_id,
            }));

            setDropdownData(mapped);
            console.log("Data for dropdown:", mapped);

        } catch (error) {
            console.error("Error fetching household data:", error);
        }
    };

    return (
        <ThemedView safe={true}>
            <ThemedAppBar
                title="Join Household & Family Unit"
                showNotif={false}
                showProfile={false}
            />
            <ThemedKeyboardAwareScrollView>
                <View>
                    <TextInput
                        placeholder="Search Household Number / Household Head"
                        value={householdText}
                        onChangeText={householdTextChange}
                        style={[
                            styles.textInput,
                            theme.text
                        ]}
                    />

                    {
                        dropdownData.length > 0 && (
                            <View style={{ marginVertical: 10, borderColor: "grey", borderWidth: 0.5, height: 200 }}>
                                <ScrollView>
                                    {dropdownData.map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => {
                                                setValue(item.value);
                                                setIsFocus(false);
                                                setHouseholdText(item.label);
                                            }}
                                            style={{ padding: 10, borderBottomWidth: 0.5, borderColor: 'grey' }}
                                        >
                                            <ThemedText>{item.label}</ThemedText>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )
                    }
                    <Dropdown
                        style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={dropdownData}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={!isFocus ? 'Select item' : '...'}
                        searchPlaceholder="Search..."
                        value={value}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={item => {
                            setValue(item.value);
                            setIsFocus(false);
                        }}
                        renderLeftIcon={() => (
                            <AntDesign
                                style={styles.icon}
                                color={isFocus ? 'blue' : 'black'}
                                name="Safety"
                                size={20}
                            />
                        )}
                    />
                </View>
                <View>
                    <ThemedButton>
                        <ThemedText btn={true}>Join</ThemedText>
                    </ThemedButton>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    textInput: {
        flex: 1,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderColor: 'black',
        borderBottomWidth: 2,
        paddingHorizontal: 12,
    },
    ontainer: {
        backgroundColor: 'white',
        padding: 16,
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    icon: {
        marginRight: 5,
    },
    label: {
        position: 'absolute',
        backgroundColor: 'white',
        left: 22,
        top: 8,
        zIndex: 999,
        paddingHorizontal: 8,
        fontSize: 14,
    },
    placeholderStyle: {
        fontSize: 16,
    },
    selectedTextStyle: {
        fontSize: 16,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
})

export default JoinHouseFam;
