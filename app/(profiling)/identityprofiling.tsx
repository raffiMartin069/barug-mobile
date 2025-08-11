import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'

const IdentityProfiling = () => {
    const router = useRouter()

    const handleContinue = () => {
        router.push('/verifypersonalinfo')
    }

    return (
        <TouchableWithoutFeedback>
            <ThemedView safe={true}>
                <ThemedCard>
                    <Image
                        source={require('@/assets/images/icon-.png')}
                        style={styles.image}
                    />

                    <Spacer height={20} />

                    <ThemedText style={styles.text} title={true}>
                        Barangay Sto. Niño
                    </ThemedText>

                    <ThemedText style={styles.text} subtitle={true}>
                        Full Verification Process
                    </ThemedText>

                    <Spacer height={15} />

                    <ThemedText>
                        Please complete the following steps in order and make sure to provide accurate information in each one.
                    </ThemedText>

                    <Spacer height={10} />

                    <View>
                        {/* 1. Personal Information */}
                        <View style={styles.stepItem}>
                            <View style={styles.circle}>
                                <Text style={styles.circleText}>1</Text>
                            </View>
                            <Text style={styles.stepText}>Personal Information</Text>
                        </View>

                        {/* 2. Socioeconomic Information */}
                        <View style={styles.stepItem}>
                            <View style={styles.circle}>
                                <Text style={styles.circleText}>2</Text>
                            </View>
                            <Text style={styles.stepText}>Socioeconomic Information</Text>
                        </View>

                        {/* 3. Valid ID */}
                        <View style={styles.stepItem}>
                            <View style={styles.circle}>
                                <Text style={styles.circleText}>3</Text>
                            </View>
                            <Text style={styles.stepText}>Valid ID</Text>
                        </View>

                        {/* 4. Household Profiling (locked until 1–3 approved) */}
                        <View style={styles.stepItem}>
                            <View style={[styles.circle, styles.circleDisabled]}>
                                <Text style={[styles.circleText, styles.circleTextDisabled]}>4</Text>
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={[styles.stepText, styles.stepTextDisabled]}>
                                    Household Profiling
                                </Text>
                                <Text style={styles.lockNote}>
                                    Available after Steps 1–3 are approved.
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Spacer height={10} />

                    <ThemedButton onPress={handleContinue}>
                        <ThemedText btn={true}>Continue</ThemedText>
                    </ThemedButton>
                </ThemedCard>
            </ThemedView>
        </TouchableWithoutFeedback>
    )
}

export default IdentityProfiling

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 70,
        alignSelf: 'center',
    },
    text: {
        textAlign: 'center',
    },
    link: {
        textAlign: 'right',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    circle: {
        backgroundColor: '#4a0000', // deep maroon
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    circleText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    stepText: {
        fontSize: 14,
        color: '#333',
    },
    button: {
        backgroundColor: '#4a0000',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },

    // Locked step styles
    circleDisabled: {
        backgroundColor: '#cfcfcf',
    },
    circleTextDisabled: {
        color: '#666',
    },
    stepTextDisabled: {
        color: '#7a7a7a',
    },
    lockNote: {
        marginTop: 2,
        fontSize: 12,
        color: '#888',
    },
})
