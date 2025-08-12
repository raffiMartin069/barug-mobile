import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native'

const BhwHome = () => {
  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start'}} safe={true}>
      <ThemedAppBar
        showBack={false}
      />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{paddingBottom: 50}} showsVerticalScrollIndicator={false}>
          <View style={[styles.container, {paddingHorizontal: 30, paddingVertical: 10}]}>
            <ThemedText title={true}>Welcome, firstname!</ThemedText>
            <ThemedImage
              src={require('@/assets/images/default-image.jpg')}
              size={60}
            />
          </View>

          <Spacer height={5}/>

          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Activities</ThemedText>

            <View>
              
            </View>
          </ThemedCard>

          <Spacer height={20}/>

          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Services</ThemedText>
            <View style={styles.container}>

            </View>
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>

    </ThemedView>
  )
}

export default BhwHome

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subcontainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: 90,
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  iconText: {
    textAlign: 'center',
    paddingTop: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  activityDetails: {
    flex: 1,
    paddingHorizontal: 10,
  },
  activityTitle: {
    fontWeight: 'bold',
  },
  activitySubtext: {
    fontSize: 12,
    color: '#555',
  },
})