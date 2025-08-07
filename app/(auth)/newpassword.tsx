import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, TouchableWithoutFeedback } from 'react-native'

const NewPassword = () => {
  const [newPass, setNewPass] = useState('')
  const [cNewPass, setCNewPass] = useState('')

  return (
    <TouchableWithoutFeedback>
        <ThemedView>
            <ThemedCard>
                <ThemedText title={true}>New Password</ThemedText>

                <Spacer height={15}/>

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

export default NewPassword

const styles = StyleSheet.create({})