import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import ThemedView from '@/components/ThemedView'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedText from '@/components/ThemedText'
import ThemedCard from '@/components/ThemedCard'
import ThemedButton from '@/components/ThemedButton'
import Spacer from '@/components/Spacer'
import { supabase } from '@/constants/supabase'

const ValidationStatus = () => {
  const router = useRouter()
  const { personId } = useLocalSearchParams()
  const [loading, setLoading] = useState(true)
  const [validationData, setValidationData] = useState<any>(null)

  useEffect(() => {
    loadValidationDetails()
  }, [])

  const loadValidationDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_details', { p_person_id: personId })
      if (error) throw error
      
      if (data && data.length > 0) {
        setValidationData(data[0])
      }
    } catch (error) {
      console.error('Failed to load validation details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#fbbf24'
      case 'APPROVED': return '#10b981'
      case 'REJECTED': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const handleResubmit = () => {
    router.push('/(bhwmodals)/(person)/validid')
  }

  if (loading) {
    return (
      <ThemedView safe style={styles.loadingContainer}>
        <ThemedAppBar title="Validation Status" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
          <ThemedText style={{ marginTop: 12 }}>Loading validation details...</ThemedText>
        </View>
      </ThemedView>
    )
  }

  if (!validationData) {
    return (
      <ThemedView safe>
        <ThemedAppBar title="Validation Status" />
        <View style={styles.container}>
          <ThemedText>No validation data found.</ThemedText>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="ID Validation Status" />
      
      <ScrollView style={styles.container}>
        {/* Status Card */}
        <ThemedCard style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <ThemedText style={styles.statusTitle}>Validation Status</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(validationData.latest_status) }]}>
              <ThemedText style={styles.statusText}>{validationData.latest_status}</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.dateText}>
            Submitted: {new Date(validationData.date_requested).toLocaleDateString()}
          </ThemedText>
          
          {validationData.remarks && (
            <>
              <Spacer height={12} />
              <ThemedText style={styles.remarksLabel}>Remarks:</ThemedText>
              <ThemedText style={styles.remarksText}>{validationData.remarks}</ThemedText>
            </>
          )}
        </ThemedCard>

        <Spacer height={16} />

        {/* Submitted Documents */}
        <ThemedCard>
          <ThemedText style={styles.sectionTitle}>Submitted Documents</ThemedText>
          
          {/* ID Front */}
          {validationData.valid_id_front_files && validationData.valid_id_front_files.length > 0 && (
            <View style={styles.imageSection}>
              <ThemedText style={styles.imageLabel}>ID Front:</ThemedText>
              <Image 
                source={{ uri: validationData.valid_id_front_files[0] }} 
                style={styles.idImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* ID Back */}
          {validationData.valid_id_back_files && validationData.valid_id_back_files.length > 0 && (
            <View style={styles.imageSection}>
              <ThemedText style={styles.imageLabel}>ID Back:</ThemedText>
              <Image 
                source={{ uri: validationData.valid_id_back_files[0] }} 
                style={styles.idImage}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Selfie */}
          {validationData.selfie_file && (
            <View style={styles.imageSection}>
              <ThemedText style={styles.imageLabel}>Selfie with ID:</ThemedText>
              <Image 
                source={{ uri: validationData.selfie_file }} 
                style={styles.idImage}
                resizeMode="contain"
              />
            </View>
          )}
        </ThemedCard>

        <Spacer height={20} />

        {/* Resubmit Button for Rejected Status */}
        {validationData.latest_status === 'REJECTED' && (
          <ThemedButton onPress={handleResubmit}>
            <ThemedText btn>Resubmit ID Verification</ThemedText>
          </ThemedButton>
        )}

        <Spacer height={40} />
      </ScrollView>
    </ThemedView>
  )
}

export default ValidationStatus

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusCard: { padding: 16 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusTitle: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  dateText: { fontSize: 14, color: '#6b7280' },
  remarksLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  remarksText: { fontSize: 14, color: '#ef4444', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  imageSection: { marginBottom: 20 },
  imageLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  idImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#f3f4f6' },
})