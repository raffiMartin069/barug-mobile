import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import dayjs from 'dayjs';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

import { useRouter } from 'expo-router';
import { useAccountRole } from '@/store/useAccountRole';

type BlotterReport = {
  id: string;
  subject: string;
  description: string;
  incident_date: string;
  incident_time: string;
  status: 'pending' | 'under_investigation' | 'resolved' | 'dismissed';
  created_at: string;
  respondents?: string[];
  location?: string;
};

const accent = '#6d2932';
const statusColors = {
  pending: '#f59e0b',
  under_investigation: '#3b82f6',
  resolved: '#10b981',
  dismissed: '#6b7280',
};

const statusLabels = {
  pending: 'Pending',
  under_investigation: 'Under Investigation',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

export default function BlotterReportHistory() {
  const router = useRouter();
  const roleStore = useAccountRole();
  
  const [reports, setReports] = useState<BlotterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Mock data - replace with actual API call
  const mockReports: BlotterReport[] = [
    {
      id: '1',
      subject: 'Noise Complaint',
      description: 'Loud music from neighbor disrupting sleep',
      incident_date: '2024-01-15',
      incident_time: '23:30',
      status: 'resolved',
      created_at: '2024-01-16T08:00:00Z',
      respondents: ['Juan Dela Cruz'],
      location: 'Purok 1, Barangay San Jose'
    },
    {
      id: '2',
      subject: 'Property Dispute',
      description: 'Boundary issue with adjacent lot',
      incident_date: '2024-01-20',
      incident_time: '14:00',
      status: 'under_investigation',
      created_at: '2024-01-20T15:30:00Z',
      respondents: ['Maria Santos', 'Pedro Garcia'],
      location: 'Purok 3, Barangay San Jose'
    },
    {
      id: '3',
      subject: 'Verbal Altercation',
      description: 'Heated argument between neighbors',
      incident_date: '2024-01-25',
      incident_time: '16:45',
      status: 'pending',
      created_at: '2024-01-25T17:00:00Z',
      location: 'Purok 2, Barangay San Jose'
    }
  ];

  const loadReports = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReports(mockReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'pending') return report.status === 'pending';
    if (filter === 'resolved') return report.status === 'resolved';
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'under_investigation': return 'search-outline';
      case 'resolved': return 'checkmark-circle-outline';
      case 'dismissed': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderReportItem = ({ item }: { item: BlotterReport }) => (
    <ThemedCard style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.reportSubject}>{item.subject}</ThemedText>
          <ThemedText muted style={styles.reportDate}>
            {dayjs(item.incident_date).format('MMM DD, YYYY')} at {item.incident_time}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
          <ThemedIcon 
            name={getStatusIcon(item.status)} 
            size={12} 
            containerSize={16} 
            bgColor="transparent"
          />
          <ThemedText style={styles.statusText}>
            {statusLabels[item.status]}
          </ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.reportDescription} numberOfLines={2}>
        {item.description}
      </ThemedText>
      
      {item.location && (
        <View style={styles.locationRow}>
          <ThemedIcon name="location-outline" size={14} containerSize={18} />
          <ThemedText muted style={styles.locationText}>{item.location}</ThemedText>
        </View>
      )}
      
      {item.respondents && item.respondents.length > 0 && (
        <View style={styles.respondentsRow}>
          <ThemedIcon name="people-outline" size={14} containerSize={18} />
          <ThemedText muted style={styles.respondentsText}>
            Respondents: {item.respondents.join(', ')}
          </ThemedText>
        </View>
      )}
      
      <View style={styles.reportFooter}>
        <ThemedText muted style={styles.createdDate}>
          Filed on {dayjs(item.created_at).format('MMM DD, YYYY')}
        </ThemedText>
        <TouchableOpacity style={styles.viewButton}>
          <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedCard>
  );

  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar title="Blotter Report History" showNotif={false} showProfile={false} />

      <View style={styles.container}>
        {/* Header Stats */}
        <ThemedCard style={styles.statsCard}>
          <View style={styles.row}>
            <ThemedIcon name="document-text-outline" bgColor={accent} size={20} containerSize={28} />
            <ThemedText style={styles.title}>Your Reports</ThemedText>
          </View>
          <ThemedText muted style={{ marginTop: 4 }}>
            Track the status of your filed blotter reports
          </ThemedText>
          
          <Spacer height={12} />
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{reports.length}</ThemedText>
              <ThemedText muted style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {reports.filter(r => r.status === 'pending').length}
              </ThemedText>
              <ThemedText muted style={styles.statLabel}>Pending</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {reports.filter(r => r.status === 'resolved').length}
              </ThemedText>
              <ThemedText muted style={styles.statLabel}>Resolved</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'resolved'] as const).map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterTab,
                filter === filterOption && styles.filterTabActive
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <ThemedText style={[
                styles.filterTabText,
                filter === filterOption && styles.filterTabTextActive
              ]}>
                {filterOption === 'all' ? 'All' : filterOption === 'pending' ? 'Pending' : 'Resolved'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <Spacer height={16} />

        {/* Reports List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accent} />
            <ThemedText muted style={{ marginTop: 12 }}>Loading reports...</ThemedText>
          </View>
        ) : filteredReports.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedIcon name="document-outline" size={48} containerSize={64} bgColor="#f3f4f6" />
            <ThemedText style={styles.emptyTitle}>No reports found</ThemedText>
            <ThemedText muted style={styles.emptyText}>
              {filter === 'all' 
                ? 'You haven\'t filed any blotter reports yet.'
                : `No ${filter} reports found.`
              }
            </ThemedText>
            <TouchableOpacity 
              style={styles.fileReportButton}
              onPress={() => router.push('/(residentmodals)/fileblotterreport')}
            >
              <ThemedIcon name="add" size={16} containerSize={20} />
              <ThemedText style={styles.fileReportButtonText}>File New Report</ThemedText>
            </TouchableOpacity>
          </ThemedCard>
        ) : (
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            ItemSeparatorComponent={() => <Spacer height={12} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[accent]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  title: { 
    paddingLeft: 10, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  
  // Stats Card
  statsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: accent,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: accent,
  },
  
  // Report Cards
  reportCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  reportDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  respondentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  respondentsText: {
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  createdDate: {
    fontSize: 11,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(109,41,50,0.08)',
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: accent,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginHorizontal: 24,
  },
  fileReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  fileReportButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
});
