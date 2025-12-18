import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
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
  incident_date: string;
  incident_time: string;
  incident_subject: string;
  incident_desc: string;
  date_time_reported: string;
  role_in_report: string;
  status_name: string;
  status_date: string;
  evidence_count: number;
  linked_case_id: number | null;
  linked_case_num: string | null;
}

interface CaseHistory {
  role_in_case: string;
  blotter_case_id: number;
  blotter_case_num: string;
  blotter_case_name: string;
  date_filed: string;
  time_filed: string;
  complaint_title: string;
  case_nature: string;
  settlement_status: string;
  last_progress: string | null;
  last_progress_date: string | null;
  total_payment_amount: string;
  last_payment_status: string;
  last_payment_date: string;
  total_form_submits: number;
  complainant_names: string;
  respondent_names: string;
}

const ResidentRecords = () => {
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Person | null>(null);
  const [reportHistory, setReportHistory] = useState<BlotterReport[]>([]);
  const [caseHistory, setCaseHistory] = useState<CaseHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'cases'>('reports');

  const loadPersonDetails = useCallback(async () => {
    if (!personId) {
      console.log('[ResidentRecords] No personId provided');
      return;
    }
    
    console.log('[ResidentRecords] Loading details for personId:', personId);
    
    try {
      setLoading(true);
      
      // Get person details
      console.log('[ResidentRecords] Fetching person data...');
      const { data: personData, error: personError } = await supabase
        .from('person')
        .select('person_id, first_name, last_name, middle_name, suffix')
        .eq('person_id', parseInt(personId))
        .single();
      
      if (personError) {
        console.error('[ResidentRecords] Person fetch error:', personError);
        throw personError;
      }
      
      console.log('[ResidentRecords] Person data:', personData);
      
      const fullName = [personData.first_name, personData.middle_name, personData.last_name, personData.suffix]
        .filter(Boolean)
        .join(' ');
      
      const personWithFullName = { ...personData, full_name: fullName };
      console.log('[ResidentRecords] Setting person:', personWithFullName);
      setPerson(personWithFullName);
      
      // Get blotter report history
      console.log('[ResidentRecords] Fetching blotter report history...');
      const { data: reportData, error: reportError } = await supabase
        .rpc('fn_person_blotter_report_history', { p_person_id: parseInt(personId) });
      
      console.log('[ResidentRecords] Report data response:', { reportData, reportError });
      
      if (reportError) {
        console.error('[ResidentRecords] Report fetch error:', reportError);
      } else {
        console.log('[ResidentRecords] Setting report history:', reportData?.length || 0, 'records');
        setReportHistory(reportData || []);
      }
      
      // Get case history
      console.log('[ResidentRecords] Fetching case history...');
      const { data: caseData, error: caseError } = await supabase
        .rpc('fn_person_blotter_case_history', { p_person_id: parseInt(personId) });
      
      console.log('[ResidentRecords] Case data response:', { caseData, caseError });
      
      if (caseError) {
        console.error('[ResidentRecords] Case fetch error:', caseError);
      } else {
        console.log('[ResidentRecords] Setting case history:', caseData?.length || 0, 'records');
        setCaseHistory(caseData || []);
      }
      
    } catch (error) {
      console.error('[ResidentRecords] Failed to load person details:', error);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    console.log('[ResidentRecords] Component mounted, personId:', personId);
    loadPersonDetails();
  }, [loadPersonDetails]);
  
  useEffect(() => {
    console.log('[ResidentRecords] State updated:', {
      person: person?.full_name,
      reportHistoryLength: reportHistory.length,
      caseHistoryLength: caseHistory.length
    });
  }, [person, reportHistory, caseHistory]);

  const complainantReportsCount = reportHistory.filter(r => r.role_in_report === 'COMPLAINANT').length;
  const respondentReportsCount = reportHistory.filter(r => r.role_in_report === 'RESPONDENT').length;
  const complainantCasesCount = caseHistory.filter(c => c.role_in_case === 'COMPLAINANT').length;
  const respondentCasesCount = caseHistory.filter(c => c.role_in_case === 'RESPONDENT').length;
  
  console.log('[ResidentRecords] Counts:', {
    reportHistory: reportHistory.length,
    caseHistory: caseHistory.length,
    complainantReports: complainantReportsCount,
    respondentReports: respondentReportsCount,
    complainantCases: complainantCasesCount,
    respondentCases: respondentCasesCount
  });

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
        title={`Blotter Records`}
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
        {/* Person Info */}
        {/* <ThemedCard style={styles.personCard}>
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
        </ThemedCard> */}

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
              reportHistory.map((report, index) => {
                console.log('[ResidentRecords] Rendering report:', report);
                return (
                  <TouchableOpacity
                    key={report.blotter_report_id || index}
                    onPress={() => {
                      const { useRouter } = require('expo-router');
                      const router = useRouter();
                      router.push(`/(residentmodals)/blotter-report-detail?reportId=${report.blotter_report_id}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <ThemedCard style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <ThemedText style={styles.recordTitle}>{report.incident_subject}</ThemedText>
                        <View style={[styles.roleBadge, { backgroundColor: report.role_in_report === 'COMPLAINANT' ? '#dcfce7' : '#fef3c7' }]}>
                          <ThemedText style={[styles.roleText, { color: report.role_in_report === 'COMPLAINANT' ? '#059669' : '#d97706' }]}>
                            {report.role_in_report}
                          </ThemedText>
                        </View>
                      </View>
                      
                      <ThemedText style={styles.recordDescription} numberOfLines={2}>
                        {report.incident_desc}
                      </ThemedText>
                      
                      <View style={styles.recordMeta}>
                        <ThemedText style={styles.recordId}>Report #{report.blotter_report_id}</ThemedText>
                        <ThemedText style={styles.recordDate}>
                          Incident: {dayjs(report.incident_date).format('MMM DD, YYYY')} at {report.incident_time}
                        </ThemedText>
                        <ThemedText style={styles.recordDate}>
                          Reported: {dayjs(report.date_time_reported).format('MMM DD, YYYY h:mm A')}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.statusContainer}>
                        <ThemedText style={styles.statusLabel}>Status:</ThemedText>
                        <ThemedText style={styles.statusValue}>{report.status_name}</ThemedText>
                        {report.linked_case_num && (
                          <ThemedText style={styles.linkedCase}>→ Case {report.linked_case_num}</ThemedText>
                        )}
                      </View>
                    </ThemedCard>
                  </TouchableOpacity>
                );
              })
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
              caseHistory.map((caseItem, index) => {
                console.log('[ResidentRecords] Rendering case:', caseItem);
                return (
                  <TouchableOpacity
                    key={caseItem.blotter_case_id || index}
                    onPress={() => {
                      const { useRouter } = require('expo-router');
                      const router = useRouter();
                      router.push(`/(residentmodals)/(brgycases)/brgycasesdetails/${caseItem.blotter_case_id}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <ThemedCard style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <ThemedText style={styles.recordTitle}>{caseItem.blotter_case_name}</ThemedText>
                        <View style={[styles.roleBadge, { backgroundColor: caseItem.role_in_case === 'COMPLAINANT' ? '#dcfce7' : '#fef3c7' }]}>
                          <ThemedText style={[styles.roleText, { color: caseItem.role_in_case === 'COMPLAINANT' ? '#059669' : '#d97706' }]}>
                            {caseItem.role_in_case}
                          </ThemedText>
                        </View>
                      </View>
                      
                      <View style={styles.caseTypeContainer}>
                        <ThemedText style={styles.caseType}>{caseItem.complaint_title}</ThemedText>
                        <ThemedText style={styles.caseNature}>{caseItem.case_nature}</ThemedText>
                      </View>
                      
                      <ThemedText style={styles.partiesText}>
                        {caseItem.complainant_names} vs. {caseItem.respondent_names}
                      </ThemedText>
                      
                      <View style={styles.recordMeta}>
                        <ThemedText style={styles.recordId}>Case #{caseItem.blotter_case_num}</ThemedText>
                        <ThemedText style={styles.recordDate}>
                          Filed: {dayjs(caseItem.date_filed).format('MMM DD, YYYY')} at {caseItem.time_filed}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.statusContainer}>
                        <ThemedText style={styles.statusLabel}>Status:</ThemedText>
                        <ThemedText style={styles.statusValue}>{caseItem.settlement_status}</ThemedText>
                      </View>
                      
                      {caseItem.last_progress && (
                        <View style={styles.progressContainer}>
                          <ThemedText style={styles.progressLabel}>Latest Progress:</ThemedText>
                          <ThemedText style={styles.progressText}>{caseItem.last_progress}</ThemedText>
                          <ThemedText style={styles.progressDate}>
                            {dayjs(caseItem.last_progress_date).format('MMM DD, YYYY h:mm A')}
                          </ThemedText>
                        </View>
                      )}
                      
                      <View style={styles.paymentContainer}>
                        <ThemedText style={styles.paymentLabel}>Payment:</ThemedText>
                        <ThemedText style={styles.paymentAmount}>₱{caseItem.total_payment_amount}</ThemedText>
                        <ThemedText style={[styles.paymentStatus, { color: caseItem.last_payment_status === 'PAID' ? '#059669' : '#d97706' }]}>
                          {caseItem.last_payment_status}
                        </ThemedText>
                      </View>
                    </ThemedCard>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default ResidentRecords;

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
  recordDescription: { fontSize: 14, color: NEUTRAL_700, marginBottom: 8, fontStyle: 'italic' },
  recordMeta: { marginBottom: 8 },
  recordId: { fontSize: 12, color: NEUTRAL_600, marginBottom: 2 },
  recordDate: { fontSize: 12, color: NEUTRAL_600, marginBottom: 1 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusLabel: { fontSize: 12, color: NEUTRAL_600 },
  statusValue: { fontSize: 12, fontWeight: '600', color: BRAND },
  linkedCase: { fontSize: 11, color: BRAND, fontWeight: '600', marginLeft: 8 },
  
  caseTypeContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  caseType: { fontSize: 12, fontWeight: '700', color: BRAND, backgroundColor: `${BRAND}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  caseNature: { fontSize: 12, fontWeight: '600', color: NEUTRAL_700, backgroundColor: NEUTRAL_100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  partiesText: { fontSize: 13, color: NEUTRAL_700, marginBottom: 8, fontWeight: '500' },
  
  progressContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: NEUTRAL_100 },
  progressLabel: { fontSize: 11, color: NEUTRAL_600, marginBottom: 2 },
  progressText: { fontSize: 12, fontWeight: '600', color: NEUTRAL_900, marginBottom: 2 },
  progressDate: { fontSize: 11, color: NEUTRAL_600 },
  
  paymentContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: NEUTRAL_100 },
  paymentLabel: { fontSize: 12, color: NEUTRAL_600 },
  paymentAmount: { fontSize: 12, fontWeight: '700', color: NEUTRAL_900 },
  paymentStatus: { fontSize: 11, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: NEUTRAL_900, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: NEUTRAL_600, textAlign: 'center', lineHeight: 20 },
});