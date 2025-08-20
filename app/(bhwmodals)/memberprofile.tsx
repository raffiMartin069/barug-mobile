import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedImage from '@/components/ThemedImage';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const MemberProfile = () => {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>

      <ThemedAppBar
        title='Family Member Profile'
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        <ThemedCard>
          <View style={{ alignItems: 'center' }}>
            <ThemedImage
              src={require('@/assets/images/default-image.jpg')}
              size={90}
            />
          </View>

          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
            <ThemedText subtitle={true}>John Doe</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>Male</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>January 1, 1990</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>Single</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>Filipino</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>Christian</ThemedText>
          </View>

          <Spacer height={15} />

          <ThemedDivider />
          
          <Spacer height={15} />

          {/* Socioeconomic Information */}
          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>Graduate</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>Employed</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>Software Engineer</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>₱25,000</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>SSS</ThemedText>
          </View>

          <Spacer height={15} />

          <ThemedDivider />

          <Spacer height={15} />

          {/* Documents */}
          <ThemedText title={true}>Documents</ThemedText>
          <Spacer height={10} />
          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>ID Type:</ThemedText>
            <ThemedText subtitle={true}>Voter's ID</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Document Status:</ThemedText>
            <ThemedText subtitle={true}>Verified</ThemedText>
          </View>

          <Spacer height={20} />
        </ThemedCard>
        <Spacer height={20}/>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default MemberProfile;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  bold: {
    fontWeight: '600',
  },
});
