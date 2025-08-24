import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'

type Message = {
  id: string
  text: string
  sender: 'user' | 'bot'
  ts: number
}

const MessageBubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.sender === 'user'
  return (
    <View style={[styles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      {!isUser && (
        <View style={styles.avatar}>
          <ThemedIcon name="chatbubbles" size={16} containerSize={28} bgColor="#310101" />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.botBubble,
          isUser ? { borderTopRightRadius: 6 } : { borderTopLeftRadius: 6 },
        ]}
      >
        <ThemedText style={styles.bubbleText}>{msg.text}</ThemedText>
        <ThemedText style={styles.timeText}>
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </View>
    </View>
  )
}

const ChatBot = () => {
  const [message, setMessage] = useState('')
  const listRef = useRef<FlatList<Message>>(null)

  const messages: Message[] = [
    {
      id: '1',
      text: "Hello! I'm your Barangay AI Assistant. How can I help you today?",
      sender: 'bot',
      ts: Date.now(),
    },
    {
      id: '2',
      text: 'What are the requirements for Barangay Clearance?',
      sender: 'user',
      ts: Date.now(),
    },
    {
      id: '3',
      text: 'You need 1 valid ID and proof of residence.',
      sender: 'bot',
      ts: Date.now(),
    },
  ]

  const data = useMemo(() => [...messages].reverse(), [messages])

  return (

    <ThemedView style={{flex: 1}} safe={true}>
      <ThemedAppBar title="Barangay Assistant" showNotif={false} showProfile={false} />

      <ThemedView>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <FlatList
            style={{ flex: 1 }}
            ref={listRef}
            data={data}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={{ padding: 12, flexGrow: 1 }}
            renderItem={({ item }) => <MessageBubble msg={item} />}
          />

          {/* Composer */}
          <View style={styles.inputContainer}>
            <ThemedTextInput
              style={styles.textInput}
              placeholder="Type your message..."
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={() => {}} activeOpacity={0.7}>
              <ThemedIcon name="send" size={20} bgColor="#310101" containerSize={40} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </ThemedView>
  )
}

export default ChatBot

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  userBubble: {
    backgroundColor: '#e9f0ff',
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: '#f2f2f2',
    alignSelf: 'flex-start',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    marginTop: 4,
    fontSize: 11,
    opacity: 0.6,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 10,
  },
  sendButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
