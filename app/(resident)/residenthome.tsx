import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

const ResidentHome = () => {
  return (
    <ThemedView style={{justifyContent: 'flex-start'}} safe={true}>

        <ThemedAppBar
            title={'Barangay Sto. Niño'}
            showBack={false}
        />

        <View style={[styles.container, {paddingHorizontal: 10, paddingVertical: 10,}]}>
          <ThemedText title={true}>Welcome, firstname!</ThemedText>
          <ThemedImage
            src={require('@/assets/images/default-image.jpg')}
            size={60}
          />
        </View>

        <View>

          <Spacer height={5}/>

          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Activities</ThemedText>
          </ThemedCard>
          
          <Spacer height={20}/>

          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Services</ThemedText>
            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <TouchableOpacity>
                  <ThemedIcon
                    name={'document-text'}
                    iconColor={'#9c27b0'}
                    bgColor={'#f3e5f5'}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Request a Document</ThemedText>
              </View>
              <View style={styles.subcontainer}>
                <TouchableOpacity>
                  <ThemedIcon
                    name={'warning'}
                    iconColor={'#2196f3'}
                    bgColor={'#e3f2fd'}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>File a Blotter Report</ThemedText>
              </View>
              <View style={styles.subcontainer}>
                <TouchableOpacity>
                  <ThemedIcon
                    name={'folder-open'}
                    iconColor={'#8bc34a'}
                    bgColor={'#e8f5e9'}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Barangay Cases</ThemedText>
              </View>
            </View>

          </ThemedCard>

        </View>

    </ThemedView>
  )
}

export default ResidentHome

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
  icontext: {
    textAlign: 'center',
    paddingTop: 10,
  }
})