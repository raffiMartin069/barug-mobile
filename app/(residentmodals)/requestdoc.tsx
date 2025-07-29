import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const RequestDoc = () => {
  return (
    <ThemedView safe={true}>

      <ThemedAppBar
        title='Request a Document'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedCard>
            <ThemedText>Please fill out the form below to request a document from the barangay office.</ThemedText>
            <Spacer height={15}/>
            <ThemedButton>
              <ThemedText btn={true}>Submit</ThemedText>
            </ThemedButton>
          </ThemedCard>

          <Spacer height={20}/>

          <ThemedCard>
            <View style={styles.row}>
              <ThemedIcon
                name={'information-circle-outline'}
                bgColor='#310101'
                size={20}
                containerSize={25}
              />
              <ThemedText style={{paddingLeft: 10}} link={true}>Important Note</ThemedText>
            </View>
            <ThemedText>• Processing time is typically 2-3 business days.</ThemedText>
            <Spacer height={5}/>
            <ThemedText>• You will receive a notification when your certificate is ready for pickup.</ThemedText>
            <Spacer height={5}/>
            <ThemedText>• Please bring a valid ID when claiming your certificate.</ThemedText>
            <Spacer height={5}/>
            <ThemedText>• For urgent requests, please visit the Barangay Hall directly.</ThemedText>
            <Spacer height={5}/>
            <View style={[styles.row]}>
              <Ionicons
                name='call'
                color={'#310101'}
                size={15}
              />
              <ThemedText style={{paddingLeft: 10, fontWeight: 'bold'}}>For assistance, call: 0917-123-4567</ThemedText>
            </View>
          </ThemedCard>
        </View>

        <Spacer height={15}/>

      </ThemedKeyboardAwareScrollView>

    </ThemedView>
  )
}

export default RequestDoc

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
})