
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

import { RELATIONSHIPS } from '@/constants/relationships';
import { INCOME } from '@/constants/income';

import { useFamilyCreationStore } from '@/store/familyCreationStore';

import { FamilyApplication } from '@/types/familyApplication';

const FamilyCreationSummary = () => {

    const houseNumber = useFamilyCreationStore((state: FamilyApplication) => state.houseNumber)
    const relationship = useFamilyCreationStore((state: FamilyApplication) => state.relationship)
    const nhts = useFamilyCreationStore((state: FamilyApplication) => state.nhts)
    const indigent = useFamilyCreationStore((state: FamilyApplication) => state.indigent)
    const sourceOfIncome = useFamilyCreationStore((state: FamilyApplication) => state.sourceOfIncome)
    const familyMonthlyIncome = useFamilyCreationStore((state: FamilyApplication) => state.familyMonthlyIncome)
    const resetStore = useFamilyCreationStore((state: FamilyApplication) => state.clearAll)

    const [houseNumberError, setHouseNumberError] = React.useState('')
    const [relationshipError, setRelationshipError] = React.useState('')
    const [familyMonthlyIncomeError, setFamilyMonthlyIncomeError] = React.useState('')
    const [sourceOfIncomeError, setSourceOfIncomeError] = React.useState('')

    const validation = () => {
        const errors: Record<string, string> = {};
        if(!houseNumber) errors.houseNumber = 'House Number is required';
        else if(!relationship) errors.relationship = 'Relationship to Household Head is required';
        else if(!familyMonthlyIncome) errors.familyMonthlyIncome = 'Family Monthly Income is required';

        setHouseNumberError(errors.houseNumber ?? '');
        setRelationshipError(errors.relationship ?? '');
        setFamilyMonthlyIncomeError(errors.familyMonthlyIncome ?? '');
        setSourceOfIncomeError(errors.sourceOfIncome ?? '');

        return Object.keys(errors).length === 0;
    }

    const obj = {
        houseNumber: houseNumber,
        relationship: relationship,
        nhts: nhts,
        indigent: indigent,
        sourceOfIncome: sourceOfIncome,
        familyMonthlyIncome: familyMonthlyIncome
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
                            <ThemedText style={styles.fontSetting} subtitle={true}>House Number:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true} editable={false}>{ houseNumber }</ThemedText>
                        </View>
                        <ThemedText style={{ color: 'red', margin: 5 }}>{houseNumberError}</ThemedText>

                    </View>

                    <ThemedDivider />

                    <View style={[styles.row]}>
                        <View style={{ flex: 1 }}>

                            <ThemedText style={styles.fontSetting} subtitle={true}>Household Head Relationship:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true} editable={false}>{ RELATIONSHIPS.map((item) => {
                                if (item.value === relationship) {
                                    return item.label
                                }
                            }) }</ThemedText>
                        </View>
                        <ThemedText style={{ color: 'red', margin: 5 }}>{relationshipError}</ThemedText>

                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>

                            <ThemedText style={styles.fontSetting} subtitle={true} editable={false}>NHTS Status:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ nhts === 1 ? "Yes" : "No" }</ThemedText>

                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>

                            <ThemedText style={styles.fontSetting} subtitle={true} editable={false}>Indigent Status:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>{ indigent === 1 ? "Yes" : "No" }</ThemedText>

                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>

                            <ThemedText style={styles.fontSetting} subtitle={true} >Source of Income:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true} editable={false}>{ !sourceOfIncome ? "N/A" : sourceOfIncome }</ThemedText>
                        </View>
                        <ThemedText style={{ color: 'red', margin: 5 }}>{sourceOfIncomeError}</ThemedText>

                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>

                            <ThemedText style={styles.fontSetting} subtitle={true}>Family Monthly Income:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true} editable={false}>{ 
                            INCOME.map((item) => {
                                return item.value === familyMonthlyIncome ? item.label : ''
                            })
                            }</ThemedText>
                        </View>
                        <ThemedText style={{ color: 'red', margin: 5 }}>{familyMonthlyIncomeError}</ThemedText>

                    </View>

                    <ThemedDivider />

                    <View>
                        <Text style={{ fontSize: 12, color: 'gray', lineHeight: 18 }}>
                            Note: Family creation requests require approval from the household head or the Barangay Health Worker (BHW).
                            If you need further assistance, please reach out to your assigned BHW for guidance.
                        </Text>
                    </View>

                    <View>
                        <ThemedButton onPress={
                            () => {
                                const isValid = validation();
                                if(!isValid) return;
                                handleRequest();
                            }}>
                            <ThemedText btn={true}>Create Request</ThemedText>
                        </ThemedButton>
                    </View>

                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default FamilyCreationSummary

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