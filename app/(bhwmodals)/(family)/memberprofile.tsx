import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedImage from '@/components/ThemedDocumentImage';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { ResidentRepository } from '@/repository/residentRepository';
import { useHouseMateStore } from '@/store/houseMateStore';
import { MgaKaHouseMates } from '@/types/houseMates';
import { PersonalDetails } from '@/types/personalDetails';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';



const MemberProfile = () => {
  const memberId = useHouseMateStore((state: MgaKaHouseMates) => state.memberId);
  const [personalDetails, setPersonalDetails] = React.useState<PersonalDetails | null>(null);

  useEffect(() => {
    const repo = new ResidentRepository();
    const details = async () => {
      const details: any = await repo.getAllResidentInfo(memberId);
      const ids = [];
      let profile_picture = null;
      if(details[0].profile_picture) {
        profile_picture = await repo.getDocuments(details[0].profile_picture);
      }
      for(let doc of details[0].valid_id_files) {
        if (!doc) continue;
        const images = await repo.getDocuments(doc);
        ids.push(images);
      }
      setPersonalDetails({
        person_id: details[0].person_id,
        first_name: details[0].first_name,
        middle_name: details[0].middle_name,
        last_name: details[0].last_name,
        suffix: details[0].suffix,
        sex: details[0].sex,
        birthdate: details[0].birthdate,
        civil_status: details[0].civil_status,
        nationality: details[0].nationality,
        religion: details[0].religion,
        education: details[0].education,
        employment_status: details[0].employment_status,
        occupation: details[0].occupation,
        personal_monthly_income: details[0].personal_monthly_income,
        gov_program: details[0].gov_program,
        front_id_file: ids[0] ? ids[0].publicUrl : undefined,
        back_id_file: ids[1] ? ids[1].publicUrl : undefined,
        selfie_id_file: ids[2] ? ids[2].publicUrl : undefined,
        profile_picture: profile_picture ? profile_picture.publicUrl : undefined,
      });
    }
    details();
  }, [memberId]);

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
              src={personalDetails?.profile_picture ? {uri: personalDetails.profile_picture} : require('@/assets/images/default-image.jpg')}
              size={90}
              resizeMode="contain"
            />
          </View>

          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
            <ThemedText subtitle={true}>{memberId}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.first_name} {personalDetails?.middle_name} {personalDetails?.last_name}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.sex}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.birthdate}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.civil_status}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.nationality}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.religion}</ThemedText>
          </View>

          <Spacer height={15} />

          <ThemedDivider />
          
          <Spacer height={15} />

          {/* Socioeconomic Information */}
          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.education}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.employment_status}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.occupation ?? 'N/A'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.personal_monthly_income ?? 'N/A'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>{personalDetails?.gov_program ?? 'N/A'}</ThemedText>
          </View>

          <Spacer height={15} />

          <ThemedDivider />

          <Spacer height={15} />

          {/* Documents */}
          <ThemedText title={true}>Documents</ThemedText>
          <Spacer height={10} />

          {/* TO BE DISCUSSED, NO RETURNED ID YET */}
          {/* <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>ID Type:</ThemedText>
            <ThemedText subtitle={true}>Voter&apos;s ID</ThemedText>
          </View> */}

          <Spacer height={10} />

          {/* Carousel of documents */}
          <ThemedView>
            <ThemedKeyboardAwareScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              style={{ flexDirection: 'row' }}
            >
              {/* Front of ID */}
              <View style={styles.docContainer}>
                <ThemedImage
                  src={personalDetails?.front_id_file ? { uri: personalDetails.front_id_file } : require('@/assets/images/favicon.png')}
                  size={220}
                  resizeMode="contain"
                />
                <ThemedText subtitle={true} style={styles.caption}>Front of ID</ThemedText>
              </View>

              {/* Back of ID */}
              <View style={styles.docContainer}>
                <ThemedImage
                  src={personalDetails?.back_id_file ? { uri: personalDetails.back_id_file } : require('@/assets/images/favicon.png')}
                  size={220}
                  resizeMode="contain"
                />
                <ThemedText subtitle={true} style={styles.caption}>Back of ID</ThemedText>
              </View>

              {/* Selfie with ID */}
              <View style={styles.docContainer}>
                <ThemedImage
                  src={personalDetails?.selfie_id_file ? { uri: personalDetails.selfie_id_file } : require('@/assets/images/favicon.png')}
                  size={220}
                  resizeMode="contain"
                />
                <ThemedText subtitle={true} style={styles.caption}>Selfie w/ ID</ThemedText>
              </View>
            </ThemedKeyboardAwareScrollView>
          </ThemedView>

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
  docContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  caption: {
    marginTop: 5,
    textAlign: 'center',
    color: '#6b6b6b',
  },
});