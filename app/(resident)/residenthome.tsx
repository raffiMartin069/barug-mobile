import { fetchResidentProfile } from '@/api/residentApi';
import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedImage from '@/components/ThemedImage';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

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

  return (
    <ThemedView style={{ justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title="Barangay Sto. Niño" showBack={false} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <>
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

          {/* Activities Section */}
          <Spacer height={5} />
          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>
              Activities
            </ThemedText>
          </ThemedCard>

          <Spacer height={20} />

          {/* Services Section */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>
              Services
            </ThemedText>
            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <TouchableOpacity>
                  <ThemedIcon
                    name="document-text"
                    iconColor="#9c27b0"
                    bgColor="#f3e5f5"
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Request a Document</ThemedText>
              </View>
              <View style={styles.subcontainer}>
                <TouchableOpacity>
                  <ThemedIcon
                    name="warning"
                    iconColor="#2196f3"
                    bgColor="#e3f2fd"
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>File a Blotter Report</ThemedText>
              </View>
              <View style={styles.subcontainer}>
                <TouchableOpacity>
                  <ThemedIcon
                    name="folder-open"
                    iconColor="#8bc34a"
                    bgColor="#e8f5e9"
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Barangay Cases</ThemedText>
              </View>
            </View>
          </ThemedCard>
        </>
      )}
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
  subcontainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: 90,
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  icontext: {
    textAlign: 'center',
    paddingTop: 10,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
