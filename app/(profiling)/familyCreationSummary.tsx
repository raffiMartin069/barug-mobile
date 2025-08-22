import { View, StyleSheet, Text } from 'react-native'
import React from 'react'
import ThemedView from '@/components/ThemedView'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedButton from '@/components/ThemedButton'
import ThemedDivider from '@/components/ThemedDivider'

const FamilyCreationSummary = () => {
    return (
        <ThemedView safe={true}>
            <ThemedAppBar
                title='Family Creation Summary'
                showNotif={false}
                showProfile={false}
            />
            <ThemedKeyboardAwareScrollView>
                <View style={{ gap: 20, padding: 5 }}>
                    <View style={[styles.row]}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Name:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Internal Test</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={[styles.row]}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Home Address:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Test Address</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Household Number:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Test Househol Number</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Household Head:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Test Household Head</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Family Number:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Test Family Number</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <ThemedText style={styles.fontSetting} subtitle={true}>Family Head:</ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText subtitle={true}>Internal Test</ThemedText>
                        </View>
                    </View>

                    <ThemedDivider />

                    <View>
                        <Text style={{ fontSize: 12, color: 'gray', lineHeight: 18 }}>
                            Note: Family creation requests require approval from the household head or the Barangay Health Worker (BHW).
                            If you need further assistance, please reach out to your assigned BHW for guidance.
                        </Text>
                    </View>

                    <View>
                        <ThemedButton>
                            <ThemedText btn={true}>Request Family Creation</ThemedText>
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