import NiceModal, { type ModalVariant } from '@/components/NiceModal'; // ✅ add
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedImage from '@/components/ThemedImage';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { supabase } from '@/constants/supabase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react'; // ✅ modal state
import { StyleSheet, View } from 'react-native';


export const options = { href: null }

const ResidentProfile = () => {
  const router = useRouter()

  // 🟦 NiceModal local state (same pattern you used in enter-mpin.tsx)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMsg, setModalMsg] = useState('')
  const [modalVariant, setModalVariant] = useState<ModalVariant>('info')
  const [modalPrimary, setModalPrimary] = useState<(() => void) | undefined>(undefined)
  const [modalSecondary, setModalSecondary] = useState<(() => void) | undefined>(undefined)
  const [modalPrimaryText, setModalPrimaryText] = useState('Got it')
  const [modalSecondaryText, setModalSecondaryText] = useState<string | undefined>(undefined)

  const openModal = (
    title: string,
    message = '',
    variant: ModalVariant = 'info',
    opts?: { primaryText?: string; onPrimary?: () => void; secondaryText?: string; onSecondary?: () => void }
  ) => {
    setModalTitle(title)
    setModalMsg(message)
    setModalVariant(variant)
    setModalPrimary(() => opts?.onPrimary)
    setModalSecondary(() => opts?.onSecondary)
    setModalPrimaryText(opts?.primaryText ?? 'Got it')
    setModalSecondaryText(opts?.secondaryText)
    setModalOpen(true)
  }

  const confirmLogout = () => {
    openModal(
      'Sign Out',
      'Signing out will end your current session. OTP will be required next login. Continue?',
      'warn',
      {
        primaryText: 'Sign out',
        onPrimary: async () => {
          await supabase.auth.signOut()
          router.dismissAll()
          router.replace('/(auth)/phone')
        },
        secondaryText: 'Cancel',
      }
    )
  }


  // 🔁 “Switch Account” confirm flow (same as “Use another number”)
  const confirmSwitchAccount = () => {
    openModal(
      'Switch to another account',
      'Would you like to switch to a different account role?',
      'warn',
      {
        primaryText: 'Switch',
        onPrimary: async () => {
          router.replace('/(auth)/choose-account') // ✅ routing path basis from your example
        },
        secondaryText: 'Cancel',
      }
    )
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar
        title='Profile'
        showProfile={false}
        showNotif={false}
        showSettings={true}
      />

      <ThemedKeyboardAwareScrollView>
        <Spacer height={20} />

        <ThemedCard>
          <View style={{ alignItems: 'center' }}>
            <ThemedImage
              src={require('@/assets/images/default-image.jpg')}
              size={90}
            />
          </View>

          <Spacer height={15} />

          <Spacer height={10} />

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
            <ThemedText subtitle={true}>Catholic</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

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
            <ThemedText subtitle={true}>Office Worker</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle={true}>P50.00</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>SSS</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Home Address:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Residency Period:</ThemedText>
            <ThemedText subtitle={true}>3 years</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Status:</ThemedText>
            <ThemedText subtitle={true}>Dee Makalaya</ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={30} />

        <ThemedCard>
          <ThemedText title={true}>Household Infomation</ThemedText>

          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Head:</ThemedText>
            <ThemedText subtitle={true}>Enchong Dee</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Number:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Type:</ThemedText>
            <ThemedText subtitle={true}>Concrete</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Ownership:</ThemedText>
            <ThemedText subtitle={true}>Renter</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <ThemedText title={true}>Family Infomation</ThemedText>

          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Head:</ThemedText>
            <ThemedText subtitle={true}>Enchong Dee</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Number:</ThemedText>
            <ThemedText subtitle={true}>0001111</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Type:</ThemedText>
            <ThemedText subtitle={true}>Nuclear</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>NHTS:</ThemedText>
            <ThemedText subtitle={true}>Yes</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Indigent:</ThemedText>
            <ThemedText subtitle={true}>Yes</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Source of Income:</ThemedText>
            <ThemedText subtitle={true}>Office Worker</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Monthly Income:</ThemedText>
            <ThemedText subtitle={true}>P100.00</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <ThemedText title={true}>Family Members</ThemedText>

          <Spacer height={10} />

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

          <Spacer height={15} />
        </ThemedCard>

        <Spacer height={15} />

        {/* 🆕 Switch Account button (above Logout) */}
        <View style={{ paddingHorizontal: 15 }}>
          <ThemedButton submit={false} onPress={confirmSwitchAccount}>
            <ThemedText non_btn={true}>Switch Account</ThemedText>
          </ThemedButton>
        </View>

        <Spacer height={10} />

        <View style={{ paddingHorizontal: 15 }}>
          <ThemedButton submit={false} onPress={confirmLogout}>
            <ThemedText non_btn={true}>Logout</ThemedText>
          </ThemedButton>
        </View>


        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>

      {/* Shared NiceModal */}
      <NiceModal
        visible={modalOpen}
        title={modalTitle}
        message={modalMsg}
        variant={modalVariant}
        primaryText={modalPrimaryText}
        secondaryText={modalSecondaryText}
        onPrimary={() => { modalPrimary?.(); setModalOpen(false) }}
        onSecondary={() => { modalSecondary?.(); setModalOpen(false) }}
        onClose={() => setModalOpen(false)}
      />
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
    fontWeight: '600',
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
