import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedPill from '@/components/ThemedPill'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

const Receipt = () => {
  return (
    <ThemedView safe>

        <ThemedAppBar
            title='Receipt'
            showNotif={false}
            showProfile={false}
        />

        <ThemedView>
            <View style={styles.hero}>
                <View style={styles.badge}>
                    <Ionicons name="checkmark" size={28} color="#fff" />
                </View>
                <ThemedText style={styles.heroTitle}>Request Submitted</ThemedText>
                <ThemedText style={styles.heroSub}>
                Your certificate request has been submitted and will be reviewed by the Barangay Clerk.
                </ThemedText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Spacer />

                <ThemedCard>
                    <View style={styles.headerRow}>
                        <ThemedText style={styles.headerText}>Request #</ThemedText>
                        <ThemedText style={styles.headerText}>382449238</ThemedText>
                    </View>

                    <Spacer height={10}/>

                    <ThemedDivider />

                    <Spacer height={10}/>

                    <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>Document Type</ThemedText>
                        <ThemedText style={styles.rowValue}>Barangay Clearance</ThemedText>
                    </View>

                    <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>Date Requested</ThemedText>
                        <ThemedText style={styles.rowValue}>September 11, 2025</ThemedText>
                    </View>

                    <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>Processing Fee</ThemedText>
                        <ThemedText style={[styles.rowValue, styles.emphasis]}>₱100.00</ThemedText>
                    </View>

                    <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>Payment Status</ThemedText>
                        <ThemedPill 
                            label="Pending"
                            size="sm"
                            bgColor="#fde68a"   // amber-200
                            textColor="#92400e" // amber-800
                        />
                    </View>

                    <View style={styles.row}>
                        <ThemedText style={styles.rowLabel}>Claimable After</ThemedText>
                        <ThemedText style={styles.rowValue}>2-5 Business Days</ThemedText>
                    </View>

                    <Spacer height={10}/>

                    <ThemedDivider />

                    <Spacer height={10}/>

                    <ThemedText>This is an official receipt from the barangay office.</ThemedText>
                </ThemedCard>

                <Spacer />

                <ThemedCard>
                    
                    <ThemedText style={styles.cardTitle}>Important Information</ThemedText>

                    <Spacer height={10}/>

                    <ThemedDivider />

                    <Spacer height={10}/>

                    <View style={styles.row}>
                        <View style={styles.iconWrap}>
                            <Ionicons
                                name='information-circle'
                                size={20}
                                color={'#310101'}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <ThemedText style={{fontWeight: 600}}>Please bring the following when picking up your certificate:</ThemedText>
                            <ThemedText>Request number</ThemedText>
                            <ThemedText>Payment for processing fee.</ThemedText>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.iconWrap}>
                            <Ionicons
                                name='location'
                                size={20}
                                color={'#310101'}
                            />
                        </View>

                        <View style={{flex: 1}}>
                            <ThemedText style={{fontWeight: 600}}>Pickup Location:</ThemedText>
                            <ThemedText>Barangay Hall, Main Office</ThemedText>
                            <ThemedText>Monday–Friday: 8:00 AM – 5:00 PM</ThemedText>
                        </View>
                    </View>

                </ThemedCard>

                <Spacer height={15}/>

                <View style={styles.actionsRow}>
                    <ThemedButton style={{flex: 1}}>
                        <ThemedText btn style={{horizontalPadding: 20}}>Download Receipt</ThemedText>
                    </ThemedButton>
                    <ThemedButton submit={false} style={{flex: 1}}>
                        <ThemedText non_btn>View Request Details</ThemedText>
                    </ThemedButton>
                </View>

            </ScrollView>
        </ThemedView>

    </ThemedView>
  )
}

export default Receipt

const styles = StyleSheet.create({
    hero: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 18,
        alignItems: 'center',
        backgroundColor: '#310101',
    },
    badge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    heroTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
    },
    heroSub: {
        color: '#f3e8e8',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerText: {
        fontSize: 16,
        fontWeight: 700,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    iconWrap: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        backgroundColor: 'rgba(49,1,1,0.08)', // faint maroon tint like the mock
    },
    rowLabel: {
        fontSize: 13,
        color: '#6b7280',
        flexShrink: 1,
        paddingRight: 8,
    },
    rowValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'right',
        flexShrink: 1,
    },
    emphasis: {
        fontWeight: '800',
    },
    actionsRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 20,
    },

})