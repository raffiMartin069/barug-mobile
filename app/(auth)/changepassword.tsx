import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { Keyboard, StyleSheet, TouchableWithoutFeedback } from 'react-native'

const ChangePassword = () => {
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [cNewPass, setCNewPass] = useState('')

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView>
            <ThemedCard>
                <ThemedText title={true}>Change Password</ThemedText>

                <Spacer height={15}/>

                <ThemedTextInput
                    placeholder='Current Password'
                    value={currentPass}
                    onChangeText={setCurrentPass}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='New Password'
                    value={newPass}
                    onChangeText={setNewPass}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Confirm New Password'
                    value={cNewPass}
                    onChangeText={setCNewPass}
                />

                <Spacer height={15}/>

                <ThemedButton>
                    <ThemedText btn={true}>Submit</ThemedText>
                </ThemedButton>
            </ThemedCard>
        </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default ChangePassword

const styles = StyleSheet.create({})