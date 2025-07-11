import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

const AddMember = () => {
  const [resid, setResID] = useState('')
  const [hhrel, setHhRel] = useState('')
  const [famrel, setFamRel] = useState('')

  return (
    <ThemedView safe={true}>
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedText style={styles.textcenter} title={true}>Add Member/s</ThemedText>
                <Spacer height={20}/>
                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Household #:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>
                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Family #:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>
                <Spacer height={10}/>
                <ThemedDivider/>
                <Spacer height={10}/>
                <View style={styles.inputRow}>
                    <ThemedTextInput
                        placeholder="Member's Resident ID"
                        style={styles.textInput}
                        value={resid}
                        onChangeText={setResID}
                    />
                    <TouchableOpacity onPress={() => setResID('')}>
                        <Ionicons name="remove-circle-outline" size={20}/>
                    </TouchableOpacity>
                </View>

                <ThemedDropdown
                    items={[]}
                    value={famrel}
                    setValue={setFamRel}
                    placeholder='Relationship to Household Head'
                    order={0}
                />

                <Spacer height={10 }/>

                <ThemedDropdown
                    items={[]}
                    value={hhrel}
                    setValue={setHhRel}
                    placeholder='Relationship to Family Head'
                    order={1}
                />

                <Spacer height={30}/>
                <ThemedDivider/>
                <Spacer height={10}/>
                <ThemedButton style={{ borderWidth: 0 }} submit={false}>
                    <ThemedText non_btn>+ Add another member</ThemedText>
                </ThemedButton>
            </View>
            <Spacer height={15}/>
            <View>
                <ThemedButton>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default AddMember

const styles = StyleSheet.create({
    textcenter: {
        textAlign: 'center',
    },
    textbold: {
        fontWeight: 'bold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
    },
})