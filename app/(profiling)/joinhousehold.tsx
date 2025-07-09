import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const JoinHousehold = () => {
  return (
    <ThemedView safe={true}>
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText style={styles.text} title={true}>Join A Household</ThemedText>
        </View>
        <View>
          <ThemedButton submit={false}>
            <ThemedText non_btn={true}>Skip</ThemedText>
          </ThemedButton>
          <ThemedButton>
            <ThemedText btn={true}>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default JoinHousehold

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
})