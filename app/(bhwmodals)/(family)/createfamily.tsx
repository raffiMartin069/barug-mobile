import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const CreateFamily = () => {
  return (
    <ThemedView safe>
        <ThemedAppBar/>
        <ThemedKeyboardAwareScrollView>
            <View>

            </View>

            <View>
                <ThemedButton>
                    <ThemedText btn>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default CreateFamily

const styles = StyleSheet.create({})