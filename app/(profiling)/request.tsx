import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const Request = () => {
  const [reason, setReason] = useState()
  return (
    <ThemedView style={{justifyContent: 'flex-start'}} safe={true}>
      <ThemedAppBar
        title='Request House-to-House Visit'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          {/* <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Head:</ThemedText>
            <ThemedText subtitle={true}>Enchong Dee</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Number:</ThemedText>
            <ThemedText subtitle={true}>00000111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Address:</ThemedText>
            <ThemedText style={styles.addressText} subtitle={true}>Enchong Dee Enchong Dee Enchong Dee</ThemedText>
          </View> */}

          <Spacer height={10}/>

          <ThemedDropdown
            items={[]}
            placeholder={'Reason for Request'}
            value={reason}
            setValue={setReason}
          />
        </View>
       
        <View>
          <ThemedButton>
            <ThemedText btn={true}>Submit</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default Request

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  bold: {
    fontWeight: 600,
  },
  addressText: {
    flex: 1,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
})