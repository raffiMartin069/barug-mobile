import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const BarangayCases = () => {
  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start'}} safe={true}>

      <ThemedAppBar
        title='Barangay Cases'
      />

      <KeyboardAvoidingView>
        <ScrollView>
          <Spacer height={15}/>


           <View style={[styles.row, {paddingHorizontal: 25,}]}>
            <ThemedText style={styles.title}>Active Barangay Cases</ThemedText>
            <ThemedText link={true}>View All</ThemedText>
          </View>

          <View>
            <Spacer height={10}/>
            <ThemedText style={styles.no} subtitle={true}>No active barangay cases.</ThemedText>
          </View>

          <ThemedCard>
            <View>
              <View>
                <ThemedText>BC#23-03-14</ThemedText>
                <ThemedText>Physical Injury</ThemedText>
              </View>
              <View>
                
              </View>
            </View>

            <Spacer height={10}/>

            <ThemedDivider/>

            <Spacer height={10}/>
            <View>
              <View style={styles.row}>
                <ThemedText>Your Role</ThemedText>
                <ThemedText>Complainant</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText>Date & Time Filed</ThemedText>
                <ThemedText>03-03-2023</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText>Next Hearing</ThemedText>
                <ThemedText>03-03-2023</ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20}/>


          <View style={[styles.row, {paddingHorizontal: 25,}]}>
            <ThemedText style={styles.title}>Barangay Cases History</ThemedText>
            <ThemedText link={true}>View All</ThemedText>
          </View>

          <View>
            <Spacer height={10}/>
            <ThemedText style={styles.no} subtitle={true}>No barangay cases history.</ThemedText>
          </View>

          <ThemedCard>
            
          </ThemedCard>

          <Spacer height={15}/>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab}>
        <ThemedIcon
          name={'add'}
          bgColor="#310101"
          size={24}
        />
      </TouchableOpacity>

    </ThemedView>
  )
}

export default BarangayCases

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
  no: {
    textAlign: 'center', 
    fontWeight: 400, 
    color: '#808080',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
})