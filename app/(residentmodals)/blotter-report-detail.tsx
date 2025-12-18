import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';

import ThemedView from '@/components/ThemedView';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedIcon from '@/components/ThemedIcon';
import Spacer from '@/components/Spacer';

import { getBlotterReportDetail, BlotterReportDetail } from '@/services/blotterReport';

const accent = '#6d2932';

export default function BlotterReportDetailScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  
  const [detail, setDetail] = useState<BlotterReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError('No report ID provided');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await getBlotterReportDetail(Number(reportId));
        setDetail(data);
      } catch (err) {
        console.error('[BlotterDetail] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [reportId]);

  if (loading) {
    return (
      <ThemedView safe style={{ flex: 1 }}>
        <ThemedAppBar title="Report Details" showNotif={false} showProfile={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <ThemedText muted style={{ marginTop: 12 }}>Loading report details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !detail) {
    return (
      <ThemedView safe style={{ flex: 1 }}>
        <ThemedAppBar title="Report Details" showNotif={false} showProfile={false} />
        <View style={styles.errorContainer}>
          <ThemedIcon name="alert-circle-outline" size={48} containerSize={64} bgColor="#fee2e2" />
          <ThemedText style={styles.errorTitle}>Error Loading Report</ThemedText>
          <ThemedText muted style={styles.errorText}>{error || 'Report not found'}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar title="Report Details" showNotif={false} showProfile={false} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <ThemedCard style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.reportId}>Report #{detail.blotter_report_id}</ThemedText>
              <ThemedText style={styles.subject}>{detail.incident_subject || '(No subject)'}</ThemedText>
            </View>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>{detail.status_name || 'PENDING'}</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Incident Details */}
        <ThemedCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedIcon name="document-text-outline" size={20} containerSize={28} bgColor={accent} />
            <ThemedText style={styles.sectionTitle}>Incident Details</ThemedText>
          </View>
          
          <View style={styles.detailRow}>
            <ThemedText style={styles.label}>Date & Time:</ThemedText>
            <ThemedText style={styles.value}>
              {dayjs(detail.incident_date).format('MMM DD, YYYY')} at {detail.incident_time ? dayjs(`2000-01-01 ${detail.incident_time}`).format('h:mm A') : 'N/A'}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.label}>Reported:</ThemedText>
            <ThemedText style={styles.value}>
              {dayjs(detail.date_time_reported).format('MMM DD, YYYY [at] h:mm A')}
            </ThemedText>
          </View>

          {detail.reported_by_name && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Reported by:</ThemedText>
              <ThemedText style={styles.value}>{detail.reported_by_name}</ThemedText>
            </View>
          )}

          {detail.incident_desc && (
            <>
              <Spacer height={12} />
              <ThemedText style={styles.label}>Description:</ThemedText>
              <ThemedText style={styles.description}>{detail.incident_desc}</ThemedText>
            </>
          )}
        </ThemedCard>

        <Spacer height={16} />

        {/* Parties Involved */}
        <ThemedCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedIcon name="people-outline" size={20} containerSize={28} bgColor={accent} />
            <ThemedText style={styles.sectionTitle}>Parties Involved</ThemedText>
          </View>

          {detail.complainant_names && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Complainant(s):</ThemedText>
              <ThemedText style={styles.value}>{detail.complainant_names}</ThemedText>
            </View>
          )}

          {detail.respondent_names && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Respondent(s):</ThemedText>
              <ThemedText style={styles.value}>{detail.respondent_names}</ThemedText>
            </View>
          )}
        </ThemedCard>

        <Spacer height={16} />

        {/* Status Information */}
        <ThemedCard style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedIcon name="information-circle-outline" size={20} containerSize={28} bgColor={accent} />
            <ThemedText style={styles.sectionTitle}>Status Information</ThemedText>
          </View>

          <View style={styles.detailRow}>
            <ThemedText style={styles.label}>Current Status:</ThemedText>
            <ThemedText style={styles.value}>{detail.status_name || 'PENDING'}</ThemedText>
          </View>

          {detail.status_date && (
            <View style={styles.detailRow}>
              <ThemedText style={styles.label}>Status Date:</ThemedText>
              <ThemedText style={styles.value}>
                {dayjs(detail.status_date).format('MMM DD, YYYY [at] h:mm A')}
              </ThemedText>
            </View>
          )}

          {detail.status_remarks && (
            <>
              <Spacer height={12} />
              <ThemedText style={styles.label}>Remarks:</ThemedText>
              <ThemedText style={styles.description}>{detail.status_remarks}</ThemedText>
            </>
          )}


        </ThemedCard>

        <Spacer height={32} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: '#dc2626',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  headerCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reportId: {
    fontSize: 14,
    fontWeight: '600',
    color: accent,
    marginBottom: 4,
  },
  subject: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    backgroundColor: accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 10,
  },
  detailRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    marginTop: 4,
  },
});