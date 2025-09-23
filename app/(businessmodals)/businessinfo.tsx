import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDatePicker from '@/components/ThemedDatePicker'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedFileInput from '@/components/ThemedFileInput'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

const BusinessInfo = () => {
  const [bname, setBName] = useState('')
  const [btype, setBType] = useState('')
  const [bnature, setBNature] = useState('')
  const [ownershiptype, setOwnershipType] = useState('')
  const [address, setAddress] = useState('')
  const [bdesc, setBDesc] = useState('')
  const [dateest, setDateEst] = useState('')
  const [dti, setDti] = useState('')
  const [capitalinvested, setCapitalInvested] = useState('')
  const [mnthlygross, setMonthlyGross] = useState('')
  const [prevgross, setPrevGross] = useState('')
  const [empnum, setEmpNum] = useState('')
  const [optdays, setOptDays] = useState<string[]>([])
  const [opthrs, setOptHours] = useState('')
  const [optStart, setOptStart] = useState<string>('')
  const [optEnd, setOptEnd] = useState<string>('')
  const [prevbrgyclearance, setPrevBrgyClearance] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)

  const clearanceOptions = [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ];

  const handleFileSelected = (file) => {
    console.log('Selected file:', file)
    setSelectedFile(file)
  }

  const handleRemoveFile = () => {
    console.log('File cleared')
    setSelectedFile(null)
  }

  return (
    <ThemedView safe>
        <ThemedAppBar
            title='Business Profile'
        />

        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedTextInput
                    placeholder = 'Business Name'
                    value={bname}
                    onChangeText={setBName}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    placeholder='Business Type'
                    value={btype}
                    setValue={setBType}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    placeholder='Nature of Business'
                    value={bnature}
                    setValue={setBNature}
                    order={1}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    placeholder='Ownership Type'
                    value={ownershiptype}
                    setValue={setOwnershipType}
                    order={2}
                />

                <Spacer height={10}/>
                
                <Pressable>
                    <ThemedTextInput
                        placeholder='Business Address'
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={2}
                        editable={false}
                        pointerEvents="none"
                    />
                </Pressable>

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Location Description'
                    value={bdesc}
                    onChangeText={setBDesc}
                    multiline
                />

                <Spacer height={10}/>

                <ThemedDatePicker
                    placeholder={'Date Established'}
                    value={dateest}
                    onChange={setDateEst}
                    mode={'date'}
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='DTI/Sec. Registration Number'
                    value={dti}
                    onChangeText={setDti}
                />

                <Spacer height={10}/>
                
                <ThemedTextInput
                    placeholder='Capital Invested'
                    value={capitalinvested}
                    onChangeText={setCapitalInvested}
                    inputMode = 'numeric'
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Monthly Gross Income'
                    value={mnthlygross}
                    onChangeText={setMonthlyGross}
                    keyboardType = 'numeric'
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='Total Gross Sales of Previous Year'
                    value={prevgross}
                    onChangeText={setPrevGross}
                    keyboardType = 'numeric'
                />

                <Spacer height={10}/>

                <ThemedTextInput
                    placeholder='No. of Employees (including owner)'
                    value={empnum}
                    onChangeText={setEmpNum}
                    inputMode = 'numeric'
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    placeholder='Operating Days'
                    value={optdays}
                    setValue={(val: string[]) => setOptDays(val)}
                    order={3}
                />

                <Spacer height={10}/>

                <ThemedDatePicker
                    placeholder="Operating Hours - Start"
                    value={optStart}
                    onChange={setOptStart}
                    mode="time"
                />

                <Spacer height={10}/>

                <ThemedDatePicker
                    placeholder="Operating Hours - End"
                    value={optEnd}
                    onChange={setOptEnd}
                    mode="time"
                />

                <Spacer height={10}/>

                <ThemedText>Has previous Barangay Clearance?</ThemedText>

                <ThemedRadioButton
                    label="Has previous Barangay Clearance?"
                    value={prevbrgyclearance}
                    onChange={setPrevBrgyClearance}
                    options={clearanceOptions}
                />

                <Spacer height={10}/>

                <ThemedText>Proof of Business (e.g., lease, photos, permit)</ThemedText>

                <ThemedFileInput
                    selectedFile={selectedFile}
                    onFileSelected={handleFileSelected}
                    onFileRemoved={handleRemoveFile}
                />
            </View>

            <Spacer height={15}/>

            <View>
                <ThemedButton>
                    <ThemedText btn>Submit</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default BusinessInfo

const styles = StyleSheet.create({})