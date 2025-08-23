import { View, Text } from 'react-native'
import React from 'react'
import ThemedView from '@/components/ThemedView'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import { INCOME } from '@/constants/income'
import { RELATIONSHIPS } from '@/constants/relationships'
import ThemedButton from '@/components/ThemedButton'
import { indigentOptions, nhtsOptions } from '@/constants/formoptions'
import { router } from 'expo-router'

const IndividualFamilyCreation = () => {

    const [nhts, setNhts] = React.useState('no')
    const [indigent, setIndigent] = React.useState('no')

    const handleNhtsChange = (value) => {
        setNhts(value)
    }

    const handleIndigentChange = (value) => {
        setIndigent(value)
    }

    const handleSubmit = () => {
        router.push('/familyCreationSummary')
    }

    return (
        <ThemedView safe={true}>
            <ThemedAppBar
                title='Create Family'
                showNotif={false}
                showProfile={false}
            />
            <ThemedKeyboardAwareScrollView>
                <View>
                    <View style={{ gap: 20 }}>
                        <ThemedTextInput
                            placeholder='House Number'
                            value={''}
                            onChangeText={(value) => ({})}
                        />


                        <ThemedTextInput
                            placeholder='Family Head'
                            value={''}
                            onChangeText={(value) => ({})}
                        />


                        <ThemedDropdown
                            items={RELATIONSHIPS}
                            value={''}
                            setValue={(value) => ({})}
                            placeholder='Relationship to Household Head'
                            order={0}
                        />


                        <View style={{ flexDirection: 'row', gap: 25, justifyContent: 'center' }}>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <ThemedText subtitle={true}>NHTS Status</ThemedText>

                                <ThemedRadioButton
                                    value={nhts}
                                    onChange={handleNhtsChange}
                                    options={nhtsOptions}
                                />
                            </View>

                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <ThemedText subtitle={true}>Indigent Status</ThemedText>

                                <ThemedRadioButton
                                    value={indigent}
                                    onChange={handleIndigentChange}
                                    options={indigentOptions}
                                />
                            </View>
                        </View>

                        <ThemedTextInput
                            placeholder='Source of Income'
                            value={''}
                            onChangeText={(value) => ({})}
                        />


                        <ThemedDropdown
                            items={INCOME}
                            value={''}
                            setValue={(value) => ({})}
                            placeholder='Family Monthly Income'
                            order={1}
                        />

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
                            <ThemedButton onPress={handleSubmit}>
                                <ThemedText btn={true}>View Request Summary</ThemedText>
                            </ThemedButton>
                        </View>

                    </View>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default IndividualFamilyCreation