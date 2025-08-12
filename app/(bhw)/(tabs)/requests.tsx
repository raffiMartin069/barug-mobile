import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native'

const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <View style={styles.avatar}>
      <ThemedText style={styles.avatarText}>{initials}</ThemedText>
    </View>
  )
}

const Requests = () => {
  return (
    <ThemedView style={{ flex : 1, justifyContent: 'flext-start'}} safe={true}>
        <ThemedAppBar/>

        <KeyboardAvoidingView>
            <ScrollView contentContainerStyle={{paddingBottom: 50}} showsVerticalScrollIndicator={false}>
                <ThemedCard>
                    <View style={styles.rowContainer}>
                      <View style={styles.rowSubContainer}>
                        <Avatar
                          name='Bellosillo'
                        />
                        <ThemedText style={{fontWeight: 700, marginLeft: 10}} subtitle={true}>Bellosillo Residence</ThemedText>
                      </View>
                        <Ionicons
                          name='chevron-forward'
                          size={18}
                        />
                    </View>

                    <Spacer height={10}/>

                    <View>
                      <View style={[styles.rowSubContainer]}>
                        <Ionicons
                          name='calendar-outline'
                          size={16}
                          color='#475569'
                        />
                        <ThemedText style={{marginLeft: 10, color: '#475569'}}>2025-08-01 06:30 AM</ThemedText>
                      </View>

                      <View style={styles.rowSubContainer}>
                        <Ionicons
                          name='location-outline'
                          size={16}
                          color='#475569'
                        />
                        <ThemedText style={{marginLeft: 10, color: '#475569'}}>Brgy. Sto Nino</ThemedText>
                      </View>
                    </View>

                    <Spacer height={10}/>

                    <View>
                      <ThemedButton submit={false}>
                        <ThemedText non_btn={true}>View Details</ThemedText>
                      </ThemedButton>
                    </View>
                </ThemedCard>
            </ScrollView>
        </KeyboardAvoidingView>
    </ThemedView>
  )
}

export default Requests

const styles = StyleSheet.create({
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  avatarText: {
    fontWeight: '700', 
    color: '#334155'
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  rowSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
})