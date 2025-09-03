import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { civilStatusMap, educAttainmentMap, empStatMap, genderMap, govProgMap, mnthlyPersonalIncomeMap, nationalityMap, religionMap } from '@/constants/formOptions'
import { useSearchParams } from 'expo-router/build/hooks'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const ReviewInputsProfile = () => {
  const params = useSearchParams()
  const data = Object.fromEntries(params.entries())

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
            title='Review Details'
            showNotif={false}
            showProfile={false}
        />

        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedText title={true}>Personal Information</ThemedText>
                <View style={styles.row}>
                    <ThemedText subtitle={true}>First Name:</ThemedText>
                    <ThemedText subtitle={true}>{data.fname}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Middle Name:</ThemedText>
                    <ThemedText subtitle={true}>{data.mname}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Last Name:</ThemedText>
                    <ThemedText subtitle={true}>{data.lname}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Suffix:</ThemedText>
                    <ThemedText subtitle={true}>{data.suffix}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Sex:</ThemedText>
                    <ThemedText subtitle={true}>{genderMap[data.gender]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Date of Birth:</ThemedText>
                    <ThemedText subtitle={true}>{data.dob}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Suffix:</ThemedText>
                    <ThemedText subtitle={true}>{data.suffix}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Civil Status:</ThemedText>
                    <ThemedText subtitle={true}>{civilStatusMap[data.civilStatus]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Nationality:</ThemedText>
                    <ThemedText subtitle={true}>{nationalityMap[data.nationality]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Religion:</ThemedText>
                    <ThemedText subtitle={true}>{religionMap[data.religion]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Street:</ThemedText>
                    <ThemedText subtitle={true}>{data.street}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Purok / Sitio:</ThemedText>
                    <ThemedText subtitle={true}>{data.purokSitio}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Barangay:</ThemedText>
                    <ThemedText subtitle={true}>{data.brgy}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>City:</ThemedText>
                    <ThemedText subtitle={true}>{data.city}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Mobile Number:</ThemedText>
                    <ThemedText subtitle={true}>{data.mobnum}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Email Address:</ThemedText>
                    <ThemedText subtitle={true}>{data.email}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Password:</ThemedText>
                    <ThemedText subtitle={true}>{data.password}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Confirm Password:</ThemedText>
                    <ThemedText subtitle={true}>{data.cpassword}</ThemedText>
                </View>

                <Spacer height={20}/>

                <ThemedText title={true}>Socioeconomic Information</ThemedText>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Educational Attainment:</ThemedText>
                    <ThemedText subtitle={true}>{educAttainmentMap[data.educattainment]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Employment Status:</ThemedText>
                    <ThemedText subtitle={true}>{empStatMap[data.employmentstat]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Occupation:</ThemedText>
                    <ThemedText subtitle={true}>{data.occupation}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Monthly Personal Income:</ThemedText>
                    <ThemedText subtitle={true}>{mnthlyPersonalIncomeMap[data.mnthlypersonalincome]}</ThemedText>
                </View>

                <Spacer height={10}/>

                <View style={styles.row}>
                    <ThemedText subtitle={true}>Government Program:</ThemedText>
                    <ThemedText subtitle={true}>{govProgMap[data.govprogrm]}</ThemedText>
                </View>
            </View>

            <Spacer height={15}/>

            <View>
                <ThemedButton>
                    <ThemedText btn={true}>Submit</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>

    </ThemedView>
  )
}

export default ReviewInputsProfile

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
        borderBottomWidth: 2,             
        borderBottomColor: 'black',        
        paddingBottom: 8,  
    },
})