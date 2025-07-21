import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedImage from '@/components/ThemedImage'
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
      
      <Spacer height={20}/>

      <ThemedCard>
        <View style={{alignItems: 'center'}}>
          <ThemedImage
            src={require('@/assets/images/sample1.jpg')}
            size={90}
          />
        </View>

        <Spacer height={15}/>

        <ThemedText title={true}>Personal Infomation</ThemedText>
      </ThemedCard>
    </ThemedView>
  )
}

export default ResidentProfile

const styles = StyleSheet.create({})