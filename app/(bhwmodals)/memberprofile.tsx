import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedImage from '@/components/ThemedImage';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { supabase } from '@/constants/supabase';
import dayjs from 'dayjs';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

const BRAND = '#310101';
const NEUTRAL_100 = '#f5f5f5';
const NEUTRAL_600 = '#525252';
const NEUTRAL_700 = '#374151';
const NEUTRAL_900 = '#171717';

interface Person {
  person_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  full_name: string;
}

interface BlotterReport {
  blotter_report_id: number;
  incident_subject: string;
  date_time_reported: string;
  role_in_report: string;
  status_name: string;
}

interface CaseHistory {
  case_id: number;
  case_no: string;
  title: string;
  filed_date: string;
  role_in_case: string;
  settlement_status: string;
}

const MemberProfile = () => {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [reportHistory, setReportHistory] = useState<BlotterReport[]>([]);
  const [caseHistory, setCaseHistory] = useState<CaseHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'cases'>('reports');

  const loadPersonDetails = useCallback(async () => {
    if (!personId) return;
    
    try {
      setLoading(true);
      
      // Get person details
      const { data: personData, error: personError } = await supabase
        .from('person')
        .select('person_id, first_name, last_name, middle_name, suffix')
        .eq('person_id', parseInt(personId))
        .single();
      
      if (personError) throw personError;
      
      const fullName = [personData.first_name, personData.middle_name, personData.last_name, personData.suffix]
        .filter(Boolean)
        .join(' ');
      
      setPerson({ ...personData, full_name: fullName });
      
      // Get blotter report history
      const { data: reportData, error: reportError } = await supabase
        .rpc('fn_person_blotter_report_history', { person_id_param: parseInt(personId) });
      
      if (!reportError && reportData) {
        setReportHistory(reportData);
      }
      
      // Get case history
      const { data: caseData, error: caseError } = await supabase
        .rpc('fn_person_blotter_case_history', { person_id_param: parseInt(personId) });
      
      if (!caseError && caseData) {
        setCaseHistory(caseData);
      }
      
    } catch (error) {
      console.error('Failed to load person details:', error);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    loadPersonDetails();
  }, [loadPersonDetails]);

  const complainantReportsCount = reportHistory.filter(r => r.role_in_report === 'COMPLAINANT').length;
  const respondentReportsCount = reportHistory.filter(r => r.role_in_report === 'RESPONDENT').length;
  const complainantCasesCount = caseHistory.filter(c => c.role_in_case === 'COMPLAINANT').length;
  const respondentCasesCount = caseHistory.filter(c => c.role_in_case === 'RESPONDENT').length;

  if (loading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} safe>
        <ActivityIndicator size="large" color={BRAND} />
        <ThemedText style={{ marginTop: 12 }}>Loading records...</ThemedText>
      </ThemedView>
    );
  }

  if (!person) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} safe>
        <ThemedText>Person not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar
        title={`Records - ${person.full_name}`}
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        {/* Person Info */}
        <ThemedCard style={styles.personCard}>
          <View style={styles.personHeader}>
            <ThemedImage
              src={require('@/assets/images/default-image.jpg')}
              size={60}
            />
            <View style={styles.personInfo}>
              <ThemedText style={styles.personName}>{person.full_name}</ThemedText>
              <ThemedText style={styles.personId}>ID: {person.person_id}</ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Summary Stats */}
        <ThemedCard style={styles.statsCard}>
          <ThemedText style={styles.statsTitle}>Record Summary</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{complainantReportsCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Reports as Complainant</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{respondentReportsCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Reports as Respondent</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{complainantCasesCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Cases as Complainant</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{respondentCasesCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Cases as Respondent</ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
            onPress={() => setActiveTab('reports')}
          >
            <ThemedIcon name="document-text-outline" size={16} containerSize={20} bgColor="transparent" iconColor={activeTab === 'reports' ? '#fff' : NEUTRAL_600} />
            <ThemedText style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>
              Blotter Reports ({reportHistory.length})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'cases' && styles.activeTab]}
            onPress={() => setActiveTab('cases')}
          >
            <ThemedIcon name="folder-outline" size={16} containerSize={20} bgColor="transparent" iconColor={activeTab === 'cases' ? '#fff' : NEUTRAL_600} />
            <ThemedText style={[styles.tabText, activeTab === 'cases' && styles.activeTabText]}>
              Barangay Cases ({caseHistory.length})
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'reports' ? (
          <View style={styles.contentSection}>
            {reportHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedIcon name="document-outline" size={48} containerSize={80} bgColor={NEUTRAL_100} iconColor={NEUTRAL_600} />
                <ThemedText style={styles.emptyTitle}>No Blotter Reports</ThemedText>
                <ThemedText style={styles.emptyText}>This person has no blotter report history.</ThemedText>
              </View>
            ) : (
              reportHistory.map((report, index) => (
                <ThemedCard key={report.blotter_report_id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <ThemedText style={styles.recordTitle}>{report.incident_subject}</ThemedText>
                    <View style={[styles.roleBadge, { backgroundColor: report.role_in_report === 'COMPLAINANT' ? '#dcfce7' : '#fef3c7' }]}>
                      <ThemedText style={[styles.roleText, { color: report.role_in_report === 'COMPLAINANT' ? '#059669' : '#d97706' }]}>
                        {report.role_in_report}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.recordMeta}>
                    <ThemedText style={styles.recordId}>Report #{report.blotter_report_id}</ThemedText>
                    <ThemedText style={styles.recordDate}>
                      {dayjs(report.date_time_reported).format('MMM DD, YYYY h:mm A')}
                    </ThemedText>
                  </View>
                  <View style={styles.statusContainer}>
                    <ThemedText style={styles.statusLabel}>Status:</ThemedText>
                    <ThemedText style={styles.statusValue}>{report.status_name}</ThemedText>
                  </View>
                </ThemedCard>
              ))
            )}
          </View>
        ) : (
          <View style={styles.contentSection}>
            {caseHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedIcon name="folder-outline" size={48} containerSize={80} bgColor={NEUTRAL_100} iconColor={NEUTRAL_600} />
                <ThemedText style={styles.emptyTitle}>No Barangay Cases</ThemedText>
                <ThemedText style={styles.emptyText}>This person has no barangay case history.</ThemedText>
              </View>
            ) : (
              caseHistory.map((caseItem, index) => (
                <ThemedCard key={caseItem.case_id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <ThemedText style={styles.recordTitle}>{caseItem.title}</ThemedText>
                    <View style={[styles.roleBadge, { backgroundColor: caseItem.role_in_case === 'COMPLAINANT' ? '#dcfce7' : '#fef3c7' }]}>
                      <ThemedText style={[styles.roleText, { color: caseItem.role_in_case === 'COMPLAINANT' ? '#059669' : '#d97706' }]}>
                        {caseItem.role_in_case}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.recordMeta}>
                    <ThemedText style={styles.recordId}>Case #{caseItem.case_no}</ThemedText>
                    <ThemedText style={styles.recordDate}>
                      {dayjs(caseItem.filed_date).format('MMM DD, YYYY')}
                    </ThemedText>
                  </View>
                  <View style={styles.statusContainer}>
                    <ThemedText style={styles.statusLabel}>Status:</ThemedText>
                    <ThemedText style={styles.statusValue}>{caseItem.settlement_status}</ThemedText>
                  </View>
                </ThemedCard>
              ))
            )}
          </View>
        )}

        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default MemberProfile;

const styles = StyleSheet.create({
  personCard: { margin: 16, marginBottom: 8 },
  personHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personInfo: { flex: 1 },
  personName: { fontSize: 18, fontWeight: '700', color: NEUTRAL_900 },
  personId: { fontSize: 14, color: NEUTRAL_600, marginTop: 2 },

  statsCard: { margin: 16, marginTop: 8, marginBottom: 8 },
  statsTitle: { fontSize: 16, fontWeight: '700', color: NEUTRAL_900, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { flex: 1, minWidth: '45%', alignItems: 'center', padding: 12, backgroundColor: NEUTRAL_100, borderRadius: 8 },
  statNumber: { fontSize: 24, fontWeight: '800', color: BRAND },
  statLabel: { fontSize: 12, color: NEUTRAL_600, textAlign: 'center', marginTop: 4 },

  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: NEUTRAL_100, borderRadius: 8, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 6 },
  activeTab: { backgroundColor: BRAND },
  tabText: { fontSize: 14, fontWeight: '600', color: NEUTRAL_600 },
  activeTabText: { color: '#fff' },

  contentSection: { paddingHorizontal: 16 },
  recordCard: { marginBottom: 12 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  recordTitle: { fontSize: 16, fontWeight: '700', color: NEUTRAL_900, flex: 1, marginRight: 12 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '700' },
  recordMeta: { marginBottom: 8 },
  recordId: { fontSize: 12, color: NEUTRAL_600, marginBottom: 2 },
  recordDate: { fontSize: 12, color: NEUTRAL_600 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 12, color: NEUTRAL_600 },
  statusValue: { fontSize: 12, fontWeight: '600', color: BRAND },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: NEUTRAL_900, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: NEUTRAL_600, textAlign: 'center', lineHeight: 20 },
});
