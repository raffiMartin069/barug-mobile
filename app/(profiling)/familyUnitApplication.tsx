import { View, Text } from 'react-native'
import React, { use } from 'react'
import ThemedView from '@/components/ThemedView'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedDropdown from '@/components/ThemedDropdown_'
import ThemedText from '@/components/ThemedText'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import { INCOME } from '@/constants/income'
import { RELATIONSHIPS } from '@/constants/relationships'
import ThemedButton from '@/components/ThemedButton'
import { indigentOptions, nhtsOptions } from '@/constants/formoptions'
import { router } from 'expo-router'
import { useFamilyCreationStore } from '@/store/familyCreationStore'
import { FamilyApplication } from '@/types/familyApplication'

const FamilyUnitApplication = () => {
    
    const setHouseNumber = useFamilyCreationStore((state: FamilyApplication) => state.setHouseNumber)
    const setRelationship = useFamilyCreationStore((state: FamilyApplication) => state.setRelationship)
    const setNhts = useFamilyCreationStore((state: FamilyApplication) => state.setNhts)
    const setIndigent = useFamilyCreationStore((state: FamilyApplication) => state.setIndigent)
    const setSourceOfIncome = useFamilyCreationStore((state: FamilyApplication) => state.setSourceOfIncome)
    const setFamilyMonthlyIncome = useFamilyCreationStore((state: FamilyApplication) => state.setFamilyMonthlyIncome)

    const [houseNumberError, setHouseNumberError] = React.useState('')
    const [relationshipError, setRelationshipError] = React.useState('')
    const [familyMonthlyIncomeError, setFamilyMonthlyIncomeError] = React.useState('')
    const [sourceOfIncomeError, setSourceOfIncomeError] = React.useState('')

    const houseNumber = useFamilyCreationStore((state: FamilyApplication) => state.houseNumber)
    const relationship = useFamilyCreationStore((state: FamilyApplication) => state.relationship)
    const nhts = useFamilyCreationStore((state: FamilyApplication) => state.nhts)
    const indigent = useFamilyCreationStore((state: FamilyApplication) => state.indigent)
    const sourceOfIncome = useFamilyCreationStore((state: FamilyApplication) => state.sourceOfIncome)
    const familyMonthlyIncome = useFamilyCreationStore((state: FamilyApplication) => state.familyMonthlyIncome)

    const validation = () => {
        const errors: Record<string, string> = {};
        if(!houseNumber) errors.houseNumber = 'House Number is required';
        else if(!relationship) errors.relationship = 'Relationship to Household Head is required';
        else if(!familyMonthlyIncome) errors.familyMonthlyIncome = 'Family Monthly Income is required';
        else if(!sourceOfIncome && familyMonthlyIncome > 1) errors.sourceOfIncome = 'Source of Income is required for families with income greater than ₱5, 000.00';

        setHouseNumberError(errors.houseNumber ?? '');
        setRelationshipError(errors.relationship ?? '');
        setFamilyMonthlyIncomeError(errors.familyMonthlyIncome ?? '');
        setSourceOfIncomeError(errors.sourceOfIncome ?? '');

        return Object.keys(errors).length === 0;
    }

    const handleSubmit = () => {
        console.log(`House Number: ${houseNumber}`);
        console.log(`Relationship to Household Head: ${relationship}`);
        console.log(`NHTS Status: ${nhts}`);
        console.log(`Indigent Status: ${indigent}`);
        console.log(`Source of Income: ${sourceOfIncome}`);
        console.log(`Family Monthly Income: ${familyMonthlyIncome}`);
        console.log('Family Unit Application Screen....\n\n\n')
        router.push('/familyCreationSummary')
    }

    return (
        <ThemedView safe={true}>
            <ThemedAppBar
                title='Family Unit Application'
                showNotif={false}
                showProfile={false}
            />
            <ThemedKeyboardAwareScrollView>
                <View>
                    <View style={{ gap: 25 }}>
                        <View>
                            <ThemedTextInput
                                placeholder='House Number'
                                value={houseNumber}
                                onChangeText={(value) => {
                                    const numericValue = value.replace(/[^0-9]/g, '');
                                    setHouseNumber(numericValue)
                                }}
                                keyboardType="numeric"
                            />
                            <ThemedText style={{ color: 'red', margin: 5 }}>{houseNumberError}</ThemedText>
                        </View>

                        <View>
                            <ThemedDropdown
                                items={RELATIONSHIPS}
                                value={relationship}
                                setValue={(value) => setRelationship(value)}
                                placeholder='Relationship to Household Head'
                                order={0}
                            />
                            <ThemedText style={{ color: 'red', margin: 5 }}>{relationshipError}</ThemedText>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 25, justifyContent: 'center' }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <ThemedText subtitle={true}>NHTS Status</ThemedText>

                                <ThemedRadioButton
                                    value={ nhts === 2 ? "no" : "yes" }
                                    onChange={setNhts}
                                    options={nhtsOptions}
                                    setValue={(value) => {
                                        if (value === "yes") {
                                            setNhts(1)
                                        } else {
                                            setNhts(2)
                                        }
                                    }}
                                />
                            </View>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <ThemedText subtitle={true}>Indigent Status</ThemedText>

                                <ThemedRadioButton
                                    value={ indigent === 2 ? "no" : "yes" }
                                    onChange={setIndigent}
                                    options={indigentOptions}
                                    setValue={(value) => {
                                        if (value === "yes") {
                                            setIndigent(1)
                                        } else {
                                            setIndigent(2)
                                        }
                                    }}
                                />
                            </View>
                        </View>

                        <View>
                            <ThemedTextInput
                                placeholder='Source of Income'
                                value={sourceOfIncome}
                                onChangeText={(value) => setSourceOfIncome(value)}
                            />
                            <ThemedText style={{ color: 'red', margin: 5 }}>{sourceOfIncomeError}</ThemedText>
                        </View>

                        <View>
                            <ThemedDropdown
                                items={INCOME}
                                value={familyMonthlyIncome}
                                setValue={(value) => setFamilyMonthlyIncome(value)}
                                placeholder='Family Monthly Income'
                                order={1}
                            />
                        </View>

                        <View style={{ gap: 15, paddingHorizontal: 5 }}>
                            <View>
                                <Text style={{ fontSize: 14, color: 'gray', lineHeight: 18 }}>
                                    <Text style={{ fontWeight: 'bold' }}>National Household Targeting System (NHTS)</Text> – programa nga makatabang sa gobyerno nga mahibal-an kung unsang mga pamilya ang labing kinahanglan nga suporta.
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, color: 'gray', lineHeight: 18 }}>
                                    <Text style={{ fontWeight: 'bold' }}>Indigency Status</Text> – Para sa mga tawo o pamilya nga gamay ra o walay kita para sa matag-adlaw nga panginahanglanon.
                                </Text>
                            </View>
                            <View>
                                <Text style={{ fontSize: 14, color: 'gray', lineHeight: 18 }}>
                                    <Text style={{ fontWeight: 'bold' }} >DUGANG PAHIBALO:</Text> Para sa dugang nga tabang, palihog bisitaha ang atong mga Barangay Health Workers sa Barangay Sto. Niño Hall.
                                </Text>
                            </View>
                        </View>

                        <View>
                            <ThemedButton onPress={() => {
                                const isValid = validation();
                                if(!isValid) return;
                                handleSubmit();
                            }}>
                                <ThemedText btn={true}>View Request Summary</ThemedText>
                            </ThemedButton>
                        </View>

                    </View>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default FamilyUnitApplication