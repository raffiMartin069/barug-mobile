import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { Href, useRouter } from 'expo-router'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

type Item = {
    key: string
    title: string
    desc: string
    icon: string
    route: Href
    params?: Record<string, string | number>
}

const ITEMS: Item[] = [
    {
        key: 'register_resident',
        title: 'Register Resident',
        desc: 'Profile a resident.',
        icon: 'person-add-outline',
        route: '/(bhwmodals)/(person)/personalinfo' as Href,
    },
    {
        key: 'register_household',
        title: 'Register Household',
        desc: 'Profile a household.',
        icon: 'home-outline',
        route: '/(bhwmodals)/(household)/createhousehold' as Href,
    },
    {
        key: 'household_list',
        title: 'List of Households',
        desc: 'View and manage all registered households in the barangay.',
        icon: 'people-outline',
        route: '/(bhwmodals)/(household)/householdlist' as Href,
    },
    {
        key: 'update_resident',
        title: 'Update Resident',
        desc: 'Search and update an existing resident.',
        icon: 'create-outline',
        route: '/(bhwmodals)/(person)/update-resident' as Href,
    },
]

const Profiling = () => {
    const router = useRouter()

    const go = (item: Item) => {
        if (!item.params) {
            router.push(item.route)         // ok with Href<string>
            return
        }
        router.push({
            pathname: item.route,           // no casts needed
            params: item.params,
        })
    }


    return (
        <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
            <ThemedAppBar />

            <ScrollView>

                <Spacer />

                {ITEMS.map((item) => (
                    <View key={item.key}>
                        <ThemedCard>
                            <Pressable style={styles.container} onPress={() => go(item)}>
                                <View style={styles.row}>
                                    <View style={{ paddingRight: 10 }}>
                                        <ThemedIcon
                                            name={item.icon}
                                            bgColor='#310101'
                                            size={18}
                                            containerSize={40}
                                        />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>{item.title}</ThemedText>
                                        <ThemedText style={{ color: 'gray', flexWrap: 'wrap', flexShrink: 1 }}>{item.desc}</ThemedText>
                                    </View>
                                </View>

                                <View>
                                    <Ionicons
                                        name='chevron-forward'
                                        size={18}
                                    />
                                </View>
                            </Pressable>
                        </ThemedCard>

                        <Spacer height={15} />
                    </View>
                ))}
            </ScrollView>
        </ThemedView>
    )
}

export default Profiling

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'nowrap',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
})