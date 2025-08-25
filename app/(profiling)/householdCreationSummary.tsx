import React from 'react'
import { View, StyleSheet, Text } from 'react-native'

import ThemedView from '@/components/ThemedView'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedButton from '@/components/ThemedButton'
import ThemedDivider from '@/components/ThemedDivider'

import { householdCreationStore } from '@/store/householdCreationStore'
import { HOUSE_TYPE } from '@/constants/houseTypes'
import { HOUSE_OWNERSHIP } from '@/constants/houseOwnership'

const HouseholdCreationSummary = () => {

    const houseNumber = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state.houseNumber);
    const street = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state.street);
    const sitio = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state.sitio);
    const barangay = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state.barangay);
    const city = householdCreationStore((state: { houseNumber: string; street: string; sitio: string; barangay: string; city: string }) => state.city);
    const houseType = householdCreationStore((state: { houseType: string }) => state.houseType);
    const houseOwnership = householdCreationStore((state: { houseOwnership: string }) => state.houseOwnership);
    const message = householdCreationStore((state: { message: string }) => state.message);

    const obj = {
        houseNumber: houseNumber,
        street: street,
        sitio: sitio,
        barangay: barangay,
        city: city,
        houseType: houseType,
        houseOwnership: houseOwnership,
        message: message,
    }

    const handleRequest = () => {
        throw new Error('API integration not implemented, deployment not yet updated.')
    }

    return (
        <ThemedView safe={true}>
            <ThemedAppBar
                title='Request Creation Summary'
                showNotif={false}
                showProfile={false}
            />
            <ThemedKeyboardAwareScrollView>
                <View style={{ gap: 20, padding: 5 }}>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Household Head:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Test User</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Family Head:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Test User</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={[styles.row]}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Home Address:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ `${houseNumber} - ${street} - ${sitio} - ${barangay} - ${city}` }</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>House Number:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ houseNumber }</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>House Type:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ HOUSE_TYPE.map(type => {
                                if(type.value === parseInt(houseType)) {
                                    return type.label
                                }
                            }) }</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>House Ownership:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ HOUSE_OWNERSHIP.map(type => {
                                if(type.value === parseInt(houseOwnership)) {
                                    return type.label
                                }
                            }) }</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Request Message:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ message ? message : 'N/A' }</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View>
                        <Text style={{ fontSize: 12, color: 'gray', lineHeight: 18 }}>
                            Note: Household creation requests require approval from the Barangay Health Worker (BHW).
                            If you need further assistance, please reach out to your assigned BHW for guidance.
                        </Text>
                    </View>

                    <View>
                        <ThemedButton onPress={handleRequest}>
                            <ThemedText btn={true}>Create Request</ThemedText>
                        </ThemedButton>
                    </View>

                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default HouseholdCreationSummary

const styles = StyleSheet.create({
    textcenter: {
        textAlign: 'center',
    },
    fontSetting: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
})