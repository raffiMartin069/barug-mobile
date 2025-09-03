import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const FileBlotterReport = () => {
  return (
    <ThemedView safe>

      <ThemedAppBar
        title='File a Blotter Report'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedCard>
            <ThemedButton>
              <ThemedText btn>Submit</ThemedText>
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
              <ThemedText style={{paddingLeft: 10}} link>Important Note</ThemedText>
            </View>
            <ThemedText>By submitting this blotter report, you affirm that all information provided is true and accurate to the best of your knowledge. False reporting may lead to legal consequences.</ThemedText>
          </ThemedCard>
        </View>
      </ThemedKeyboardAwareScrollView>

    </ThemedView>
  )
}

export default FileBlotterReport

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
})