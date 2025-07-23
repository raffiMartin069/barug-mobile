import { fetchResidentProfile } from '@/api/residentApi';
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedImage from '@/components/ThemedImage';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const ResidentHome = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchResidentProfile();
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <ThemedView>
        <ActivityIndicator size="large" color="#0000ff" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title="Barangay Sto. Niño" showBack={false} />

      <View style={[styles.container, { paddingHorizontal: 15, paddingVertical: 10 }]}>
        <ThemedText title={true}>
          Welcome, {profile?.first_name || 'Resident'}!
        </ThemedText>
        <ThemedImage
          src={
            profile?.p_person_img
              ? { uri: profile.p_person_img }
              : require('@/assets/images/sample1.jpg')
          }
          size={60}
        />
      </View>

      {/* Services */}
      <View>
        <Spacer height={5} />
        <ThemedCard>
          <ThemedText style={styles.text} subtitle={true}>
            Activities
          </ThemedText>
        </ThemedCard>

        <Spacer height={20} />
        <ThemedCard>
          <ThemedText style={styles.text} subtitle={true}>
            Services
          </ThemedText>
          <View style={styles.container}>
            {/* Service buttons */}
          </View>
        </ThemedCard>
      </View>
    </ThemedView>
  );
};

export default ResidentHome;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
