import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'

const AddMember = () => {
  const [members, setMembers] = useState([
    {resid: '', hhrel: '', famrel: ''}
  ])

  const addMember = () => {
    setMembers([...members, {resid: '', hhrel: '', famrel: ''}])
  }

  const updateField = (index, field, value) => {
    const updatedMembers = [...members]
    updatedMembers[index][field] = value
    setMembers(updatedMembers)
  }

  const removeField = (index) => {
    const updatedMembers = members.filter((_, i) => i !== index)
    setMembers(updatedMembers)
  }

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
            title='Add Member/s'
            showNotif={false}
            showProfile={false}
        />
        <ThemedKeyboardAwareScrollView>
            <View>

                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Home Address:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>
                
                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Household #:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>

                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Household Head:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>

                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Family #:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>

                <View style={styles.row}>
                    <ThemedText style={styles.textbold} subtitle={true}>Family Header:</ThemedText>
                    <ThemedText subtitle={true}>00000111</ThemedText>
                </View>
                
                <Spacer height={10}/>

                <ThemedDivider/>

                <Spacer height={10}/>

                {members.map((member,   index) => (
                    <View key={index}>
                        <ThemedTextInput
                            placeholder="Member's Resident ID"
                            value={member.resid}
                            onChangeText={(value) => updateField(index, 'resid', value)}
                            showClearButton={members.length > 1}
                            onRemove={() => removeField(index)}
                        />

                        <Spacer height={10}/>

                        <ThemedDropdown
                            items={[]}
                            value={member.famrel}
                            setValue={(value) => updateField(index, 'famrel', value)}
                            placeholder='Relationship to Household Head'
                            order={0}
                        />

                        <Spacer height={10}/>

                        <ThemedDropdown
                            items={[]}
                            value={member.hhrel}
                            setValue={(value) => updateField(index, 'hhrel', value)}
                            placeholder='Relationship to Family Head'
                            order={1}
                        />

                        <Spacer/>

                        <ThemedDivider/>
                        
                    </View>
                ))}

            <Spacer height={10}/>

            <ThemedButton style={{ borderWidth: 0 }} submit={false} onPress={addMember}>
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
})