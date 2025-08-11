import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedImage from '@/components/ThemedImage'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

export const options = {
  href: null,
}

const ResidentProfile = () => {
  const router = useRouter()
  const params = useLocalSearchParams()

  // normalize params (expo-router gives string | string[] | undefined)
  const p = useMemo(() => {
    const entries = Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? '')])
    return Object.fromEntries(entries) as Record<string, string>
  }, [params])

  const fullName = [p.first_name, p.middle_name, p.last_name, p.suffix].filter(Boolean).join(' ')
  const address = [p.street, p.purok_sitio, p.barangay, p.city].filter(Boolean).join(', ')

  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start'}} safe={true}>
      <ThemedAppBar
        title='Profile'
        showProfile={false}
        showNotif={false}
        showSettings={true}
      />

      <ThemedKeyboardAwareScrollView>
        <Spacer height={20}/>

        <ThemedCard>
          <View style={{alignItems: 'center'}}>
            <ThemedImage
              src={p.p_person_img ? { uri: p.p_person_img } : require('@/assets/images/default-image.jpg')}
              size={90}
            />
          </View>

          <Spacer height={15}/>

          {/* <ThemedText title={true}>Personal Infomation</ThemedText> */}

          <Spacer height={10}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
            <ThemedText subtitle={true}>{p.resident_id || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
            <ThemedText subtitle={true}>{fullName || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>{p.sex || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>{p.birthdate || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>{p.civil_status || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>{p.nationality || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>{p.religion || '—'}</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>{p.education || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>{p.employment_status || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>{p.occupation || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>{p.personal_income || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>{p.gov_program || '—'}</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Home Address:</ThemedText>
            <ThemedText subtitle={true}>{address || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Residency Period:</ThemedText>
            <ThemedText subtitle={true}>{p.residency_period || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Status:</ThemedText>
            <ThemedText subtitle={true}>{p.acc_status || '—'}</ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={30}/>

        <ThemedCard>
          <ThemedText title={true}>Household Infomation</ThemedText>

          <Spacer height={10}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Head:</ThemedText>
            <ThemedText subtitle={true}>{p.household_head || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Number:</ThemedText>
            <ThemedText subtitle={true}>{p.household_num || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Type:</ThemedText>
            <ThemedText subtitle={true}>{p.house_type || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Ownership:</ThemedText>
            <ThemedText subtitle={true}>{p.house_ownership || '—'}</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <ThemedText title={true}>Family Infomation</ThemedText>

          <Spacer height={10}/>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Head:</ThemedText>
            <ThemedText subtitle={true}>{p.family_head || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Number:</ThemedText>
            <ThemedText subtitle={true}>{p.family_num || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Type:</ThemedText>
            <ThemedText subtitle={true}>{p.family_type || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>NHTS:</ThemedText>
            <ThemedText subtitle={true}>{p.nhts_status || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Indigent:</ThemedText>
            <ThemedText subtitle={true}>{p.indigent_status || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Source of Income:</ThemedText>
            <ThemedText subtitle={true}>{p.source_of_income || '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Monthly Income:</ThemedText>
            <ThemedText subtitle={true}>{p.family_monthly_income || '—'}</ThemedText>
          </View>

          <Spacer height={15}/>

          <ThemedDivider/>

          <Spacer height={15}/>

          <ThemedText title={true}>Family Members</ThemedText>

          <Spacer height={10}/>  

          <View style={styles.familyList}>
          {[
            { name: 'Maria Lourdes A. Cruz' },
            { name: 'Renzo Gabriel A. Cruz' },
            { name: 'Andrei A. Cruz' },
          ].map((member, index) => (
            <View key={index} style={styles.familyCard}>
              <ThemedText subtitle={true}>
                {member.name}
              </ThemedText>
            </View>
          ))}
        </View>

        <Spacer height={15}/>

        {/* Show only if the resident is hhhead or famhead or what is designed for the system. */}
        <View>
          <ThemedButton submit={false} onPress={() => router.push('/request')}>
            <ThemedText non_btn={true}>Request House-to-House Visit</ThemedText>
          </ThemedButton>
        </View>
      
        </ThemedCard>

        <Spacer height={15}/>

        <View style={{paddingHorizontal: 15}}>
          <ThemedButton submit={false}>
            <ThemedText non_btn={true}>Logout</ThemedText>
          </ThemedButton>
        </View>
        <Spacer height={20}/>
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
  member: {
    backgroundColor: "#310101",
  },
  familyList: {
    gap: 10,
  },
  familyCard: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
})
