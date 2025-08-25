import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const DocReqHistory = () => {
  const router = useRouter()

  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start',}} safe={true}>

      <ThemedAppBar
        title='Document Requests'
      />

      <KeyboardAvoidingView>
        <ScrollView>

          <Spacer height={15}/>

          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Active Requests</ThemedText>
              <ThemedText link={true}>View All</ThemedText>
            </View>

            <Spacer height={10}/>

            <ThemedDivider/>

            <Spacer height={10}/>
          </ThemedCard>

          <Spacer height={20}/>

          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Request History</ThemedText>
              <ThemedText link={true}>View All</ThemedText>
            </View>

            <Spacer height={10}/>

            <ThemedDivider/>

            <Spacer height={10}/>
          </ThemedCard>

          <Spacer height={15}/>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/requestdoc')}>
        <ThemedIcon
          name={'add'}
          bgColor="#310101"
          size={24}
        />
      </TouchableOpacity>

    </ThemedView>
  )
}

export default DocReqHistory

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  title: {
    fontSize: 20, 
    fontWeight: 'bold'
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  }
})