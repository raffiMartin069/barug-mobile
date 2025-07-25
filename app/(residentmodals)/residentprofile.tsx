import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedImage from '@/components/ThemedImage'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, View } from 'react-native'

export const options = {
  href: null,
}

const ResidentProfile = () => {
  return (
    <ThemedView style={{justifyContent: 'flex-start'}} safe={true}>
      <ThemedAppBar
        title='Profile'
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <Spacer height={20}/>

        <ThemedCard>
          <View style={{alignItems: 'center'}}>
            <ThemedImage
              src={require('@/assets/images/default-image.jpg')}
              size={90}
            />
          </View>

          <Spacer height={15}/>

          {/* <ThemedText title={true}>Personal Infomation</ThemedText> */}

          <Spacer height={10}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Home Address:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Residency Period:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Status:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={15}/>

        <ThemedCard>
          <ThemedText title={true}>Household Infomation</ThemedText>

          <Spacer height={10}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Head:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Number:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Type:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Ownership:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Type:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedText title={true}>Family Infomation</ThemedText>

          <Spacer height={10}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Head:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Number:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>NHTS:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Indigent:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Source of Income:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Monthly Income:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <ThemedText title={true}>Family Members</ThemedText>

          <Spacer height={10}/>  

          <View style={styles.row}>
            <ThemedText subtitle={true}>Full Name</ThemedText>
            <ThemedText style={styles.relationship} subtitle={true}>(relationship to resident)</ThemedText>
          </View>        
        </ThemedCard>
      </ThemedKeyboardAwareScrollView>

    </ThemedView>
  )
}

export default ResidentProfile

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  bold: {
    fontWeight: 600,
  },
  relationship: {
    color: '#808080'
  },
})