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

const ITEMS: Item[] =[
    {
        key: 'register_resident',
        title: 'Register Resident',
        desc: 'Profile a resident.',
<<<<<<< HEAD
        icon: 'person-add',
=======
        icon: 'person-add-outline',
>>>>>>> origin/develop
        route: '/(bhwmodals)/(person)/personalinfo' as Href,
    },
    {
        key: 'register_household',
        title: 'Register Household',
        desc: 'Profile a household.',
<<<<<<< HEAD
        icon: 'home',
        route: '/(bhwmodals)/(household)/createhousehold' as Href,
    },
    {
        key: 'register_family',
        title: 'Register Family Unit',
        desc: 'Profile a family under a household.',
        icon: 'people',
        route: '/(bhwmodals)/(family)/createfamily' as Href,
    },
    {
        key: 'household_list',
        title: 'List of Households',
        desc: 'View and manage all registered households in the barangay.',
        icon: 'people',
=======
        icon: 'home-outline',
        route: '/(bhwmodals)/(household)/createhousehold' as Href,
    },
    {
        key: 'household_list',
        title: 'List of Households',
        desc: 'View and manage all registered households in the barangay.',
        icon: 'people-outline',
>>>>>>> origin/develop
        route: '/(bhwmodals)/(household)/householdlist' as Href,
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
    <ThemedView safe style={{flex: 1, justifyContent: 'flex-start'}}>
        <ThemedAppBar/>

        <ScrollView>

            <Spacer />

            {ITEMS.map((item) => (
                <View key={item.key}>
                    <ThemedCard>
                        <Pressable style={styles.container} onPress={() => go(item)}>
                            <View style={styles.row}>
                                <View style={{paddingRight: 10}}>
                                    <ThemedIcon
                                        name={item.icon}
                                        bgColor='#310101'
<<<<<<< HEAD
                                        size={15}
=======
                                        size={18}
>>>>>>> origin/develop
                                        containerSize={40}
                                    />
                                </View>

<<<<<<< HEAD
                                <View>
                                    <ThemedText>{item.title}</ThemedText>
                                    <ThemedText style={{color: 'gray'}}>{item.desc}</ThemedText>
=======
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>{item.title}</ThemedText>
                                    <ThemedText style={{ color: 'gray', flexWrap: 'wrap', flexShrink: 1 }}>{item.desc}</ThemedText>
>>>>>>> origin/develop
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

                    <Spacer height={15}/>
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
<<<<<<< HEAD
=======
        flexWrap: 'nowrap',
>>>>>>> origin/develop
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
})