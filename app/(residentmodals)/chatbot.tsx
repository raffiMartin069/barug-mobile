import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native'

const ChatBot = () => {
  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start'}} safe={true}>
      <ThemedAppBar
        title='Barangay Assistant'
        showNotif={false}
        showProfile={false}
      />

      <KeyboardAvoidingView>
        <ScrollView>
          <Spacer height={15}/>
          <ThemedCard>
            <ThemedView style={styles.headerRow}>
              <ThemedIcon
                name={'chatbubbles'}
                bgColor={'#310101'}
                containerSize={40}
                size={20}
              />
              <ThemedText style={{paddingLeft: 10, fontWeight: 'bold'}} subtitle={true}>Barangay AI Assistant</ThemedText>
            </ThemedView>

            <Spacer height={10}/>

            <ThemedText>
              Hello! I'm your Barangay AI Assistant. How can I help you today?
            </ThemedText>
          </ThemedCard>

          <Spacer height={15}/>


        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

export default ChatBot

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
})