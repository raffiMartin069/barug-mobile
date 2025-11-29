import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

import { supabase } from '@/constants/supabase';
import { CaseMediationHearing, CaseTimelineEvent, getCaseMediationHearings, getCaseTimeline } from '@/services/blotterReport';

interface CaseDetails {
  blotter_case_id: number;
  blotter_case_num: string;
  blotter_case_name: string;
  complaint_title: string;
  case_nature: string;
  settlement_status: string;
  date_filed: string;
  complainant_names: string;
  respondent_names: string;
}

interface KP7Data {
  complaint_details?: string;
}

interface KPFormData {
  kp15_award_description?: string;
  kp16_settlement_statement?: string;
}

const accent = '#310101';

const eventIcons: Record<string, string> = {
  REPORT: 'document-text-outline',
  CASE: 'briefcase-outline',
  FORM: 'clipboard-outline',
  HEARING: 'people-outline',
  CONCILIATION: 'handshake-outline',
  PROGRESS: 'trending-up-outline',
  PAYMENT: 'card-outline',
  STATUS: 'information-circle-outline',
  MEDIA: 'camera-outline',
};

const eventColors: Record<string, string> = {
  REPORT: '#3b82f6',
  CASE: '#6d2932',
  FORM: '#8b5cf6',
  HEARING: '#f59e0b',
  CONCILIATION: '#10b981',
  PROGRESS: '#06b6d4',
  PAYMENT: '#84cc16',
  STATUS: '#6b7280',
  MEDIA: '#ec4899',
};

export default function BltRptDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [timeline, setTimeline] = useState<CaseTimelineEvent[]>([]);
  const [hearings, setHearings] = useState<CaseMediationHearing[]>([]);
  const [caseDetails, setCaseDetails] = useState<CaseDetails | null>(null);
  const [kp7Data, setKp7Data] = useState<KP7Data | null>(null);
  const [kpFormData, setKpFormData] = useState<KPFormData | null>(null);
  const [expandedTexts, setExpandedTexts] = useState<{[key: string]: boolean}>({});
  const [showTimeline, setShowTimeline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No case ID provided');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [timelineData, hearingsData] = await Promise.all([
          getCaseTimeline(Number(id)),
          getCaseMediationHearings(Number(id))
        ]);
        setTimeline(timelineData);
        setHearings(hearingsData);
        
        // Fetch case details using the database function
        try {
          const { data: caseData, error: caseError } = await supabase
            .rpc('fn_person_blotter_case_history', { p_person_id: 4 }); // You may need to get the actual person_id
          
          if (!caseError && caseData) {
            // Find the specific case by ID
            const specificCase = caseData.find((c: any) => c.blotter_case_id === Number(id));
            if (specificCase) {
              setCaseDetails({
                blotter_case_id: specificCase.blotter_case_id,
                blotter_case_num: specificCase.blotter_case_num,
                blotter_case_name: specificCase.blotter_case_name,
                complaint_title: specificCase.complaint_title,
                case_nature: specificCase.case_nature,
                settlement_status: specificCase.settlement_status,
                date_filed: specificCase.date_filed,
                complainant_names: specificCase.complainant_names,
                respondent_names: specificCase.respondent_names
              });
            }
          }
        } catch (caseErr) {
          console.error('Failed to fetch case details:', caseErr);
        }
        
        // Fetch KP-7 complaint details
        try {
          const { data: kp7Json, error: kp7Error } = await supabase
            .rpc('get_latest_form_submission_json', { 
              p_case_id: Number(id), 
              p_form_code: 'KP-7' 
            });
          
          if (!kp7Error && kp7Json?.fields_text) {
            setKp7Data({
              complaint_details: kp7Json.fields_text.complaint_details || null
            });
          }
        } catch (kp7Err) {
          console.error('Failed to fetch KP-7 data:', kp7Err);
        }
        
        // Fetch KP-15 and KP-16 data
        try {
          const [kp15Response, kp16Response] = await Promise.all([
            supabase.rpc('get_latest_form_submission_json', { 
              p_case_id: Number(id), 
              p_form_code: 'KP-15' 
            }),
            supabase.rpc('get_latest_form_submission_json', { 
              p_case_id: Number(id), 
              p_form_code: 'KP-16' 
            })
          ]);
          
          const formData: KPFormData = {};
          
          if (!kp15Response.error && kp15Response.data?.fields_text) {
            formData.kp15_award_description = kp15Response.data.fields_text.award_description || null;
          }
          
          if (!kp16Response.error && kp16Response.data?.fields_text) {
            formData.kp16_settlement_statement = kp16Response.data.fields_text.settlement_statement || null;
          }
          
          setKpFormData(formData);
        } catch (kpErr) {
          console.error('Failed to fetch KP forms data:', kpErr);
        }
      } catch (err) {
        console.error('[CaseDetails] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load case data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <ThemedView safe style={{ flex: 1 }}>
        <ThemedAppBar title="Case Details" showNotif={false} showProfile={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
          <ThemedText muted style={{ marginTop: 12 }}>Loading case timeline...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView safe style={{ flex: 1 }}>
        <ThemedAppBar title="Case Details" showNotif={false} showProfile={false} />
        <View style={styles.errorContainer}>
          <ThemedIcon name="alert-circle-outline" size={48} containerSize={64} bgColor="#fee2e2" />
          <ThemedText style={styles.errorTitle}>Error Loading Case</ThemedText>
          <ThemedText muted style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const formatHearingSubtitle = (subtitle: string): string => {
    // Handle hearing format: "KP-12 held (sched #2); comp_att=True, resp_att=True, outcome=NOT_SETTLED"
    if (subtitle.includes('held') && subtitle.includes('comp_att=') && subtitle.includes('resp_att=')) {
      const parts = subtitle.split(';');
      const formPart = parts[0]?.trim() || '';
      const attendancePart = parts[1]?.trim() || '';
      
      // Extract form code (KP-12 -> KP12)
      const formMatch = formPart.match(/KP-?(\d+)/);
      const formCode = formMatch ? `KP${formMatch[1]}` : '';
      
      // Parse attendance
      const compMatch = attendancePart.match(/comp_att=(\w+)/);
      const respMatch = attendancePart.match(/resp_att=(\w+)/);
      const outcomeMatch = attendancePart.match(/outcome=(\w+)/);
      
      const compAttended = compMatch?.[1] === 'True' ? 'COMPLAINANT ATTENDED' : 'COMPLAINANT ABSENT';
      const respAttended = respMatch?.[1] === 'True' ? 'RESPONDENT ATTENDED' : 'RESPONDENT ABSENT';
      const outcome = outcomeMatch?.[1]?.replace(/_/g, ' ') || '';
      
      return `${formCode} HELD • ${compAttended} • ${respAttended} • ${outcome}`;
    }
    return subtitle;
  };

  const renderTimelineEvent = (event: CaseTimelineEvent, index: number) => {
    const isLast = index === timeline.length - 1;
    const color = eventColors[event.event_kind] || '#6b7280';
    const icon = eventIcons[event.event_kind] || 'help-circle-outline';
    const formattedSubtitle = event.event_subtitle ? formatHearingSubtitle(event.event_subtitle) : '';

    return (
      <View key={`${event.source_table}-${event.source_id}`} style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <View style={[styles.timelineIcon, { backgroundColor: color }]}>
            <ThemedIcon name={icon} size={16} containerSize={32} bgColor="transparent" />
          </View>
          {!isLast && <View style={styles.timelineLine} />}
        </View>
        
        <View style={styles.timelineContent}>
          <ThemedCard style={styles.eventCard}>
            <View style={styles.eventHeader}>
              <ThemedText style={styles.eventTitle}>{event.event_title}</ThemedText>
              <ThemedText muted style={styles.eventTime}>{event.event_at_pretty}</ThemedText>
            </View>
            {formattedSubtitle && (
              <ThemedText style={styles.eventSubtitle}>{formattedSubtitle}</ThemedText>
            )}
            <View style={styles.eventMeta}>
              <View style={[styles.kindBadge, { backgroundColor: `${color}20` }]}>
                <ThemedText style={[styles.kindText, { color }]}>{event.event_kind}</ThemedText>
              </View>
            </View>
          </ThemedCard>
        </View>
      </View>
    );
  };

  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar title="Case Timeline GIATAY" showNotif={false} showProfile={false} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Case Details Header */}
        {/* <ThemedCard style={styles.headerCard}>
          <View style={styles.headerRow}>
            <ThemedIcon name="briefcase-outline" size={24} containerSize={32} bgColor={accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText style={styles.caseTitle}>Case #{id}</ThemedText>
              <ThemedText muted style={styles.eventCount}>{timeline.length} events • {hearings.length} hearings</ThemedText>
            </View>
          </View>
        </ThemedCard> */}
        
        {/* <Spacer height={16} /> */}
        
        {/* Case Information */}
        <ThemedCard style={styles.caseInfoCard}>
          <View style={styles.caseInfoHeader}>
            <ThemedIcon name="information-circle-outline" size={20} containerSize={24} bgColor={accent} />
            <ThemedText style={styles.caseInfoTitle}>Case Information</ThemedText>
          </View>
          
          <View style={styles.caseInfoGrid}>
            <View style={styles.caseInfoItem}>
              <ThemedText style={styles.caseInfoLabel}>Case Number:</ThemedText>
              <ThemedText style={styles.caseInfoValue}>#{id}</ThemedText>
            </View>
            
            <View style={styles.caseInfoItem}>
              <ThemedText style={styles.caseInfoLabel}>Status:</ThemedText>
              <View style={[styles.statusBadge, { 
                backgroundColor: caseDetails?.settlement_status === 'SETTLED' ? '#dcfce7' : '#fef3c7' 
              }]}>
                <ThemedText style={[styles.statusText, { 
                  color: caseDetails?.settlement_status === 'SETTLED' ? '#16a34a' : '#d97706' 
                }]}>
                  {caseDetails?.settlement_status || 'ONGOING'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.caseInfoItem}>
              <ThemedText style={styles.caseInfoLabel}>Filed Date:</ThemedText>
              <ThemedText style={styles.caseInfoValue}>
                {caseDetails?.date_filed || timeline.find(e => e.event_kind === 'CASE')?.event_at_pretty || 'N/A'}
              </ThemedText>
            </View>
            
            <View style={styles.caseInfoItem}>
              <ThemedText style={styles.caseInfoLabel}>Complaint Title:</ThemedText>
              <View style={[styles.complaintBadge, { backgroundColor: '#310101' }]}>
                <ThemedText style={styles.complaintText}>
                  {caseDetails?.complaint_title || 'CRIMINAL CASE'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.caseInfoItem}>
              <ThemedText style={styles.caseInfoLabel}>Case Nature:</ThemedText>
              <View style={[styles.natureBadge, { backgroundColor: '#f3f4f6' }]}>
                <ThemedText style={[styles.natureText, { color: '#374151' }]}>
                  {caseDetails?.case_nature || 'ESTAFA'}
                </ThemedText>
              </View>
            </View>
            
            {caseDetails && (
              <View style={styles.partiesSection}>
                <ThemedText style={styles.caseInfoLabel}>Parties:</ThemedText>
                <View style={styles.partiesContainer}>
                  <View style={styles.partyItem}>
                    <ThemedText style={styles.partyLabel}>Complainant:</ThemedText>
                    <ThemedText style={styles.partyName}>{caseDetails.complainant_names || 'N/A'}</ThemedText>
                  </View>
                  <View style={styles.vsContainer}>
                    <ThemedText style={styles.vsText}>vs.</ThemedText>
                  </View>
                  <View style={styles.partyItem}>
                    <ThemedText style={styles.partyLabel}>Respondent:</ThemedText>
                    <ThemedText style={styles.partyName}>{caseDetails.respondent_names || 'N/A'}</ThemedText>
                  </View>
                </View>
              </View>
            )}
            
            {kp7Data?.complaint_details && (
              <View style={styles.complaintDetailsSection}>
                <ThemedText style={styles.caseInfoLabel}>Complaint Details:</ThemedText>
                <View style={styles.complaintDetailsContainer}>
                  <ThemedText style={styles.complaintDetailsText}>
                    {kp7Data.complaint_details}
                  </ThemedText>
                </View>
              </View>
            )}
            
            {kpFormData?.kp15_award_description && (
              <View style={styles.complaintDetailsSection}>
                <ThemedText style={styles.caseInfoLabel}>Award Description (KP-15):</ThemedText>
                <View style={styles.complaintDetailsContainer}>
                  <TouchableOpacity onPress={() => setExpandedTexts(prev => ({...prev, kp15: !prev.kp15}))}>
                    <ThemedText style={styles.complaintDetailsText} numberOfLines={expandedTexts.kp15 ? undefined : 3}>
                      {kpFormData.kp15_award_description}
                    </ThemedText>
                    {kpFormData.kp15_award_description.length > 100 && (
                      <ThemedText style={styles.expandText}>
                        {expandedTexts.kp15 ? 'Show less' : 'Show more...'}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {kpFormData?.kp16_settlement_statement && (
              <View style={styles.complaintDetailsSection}>
                <ThemedText style={styles.caseInfoLabel}>Settlement Statement (KP-16):</ThemedText>
                <View style={styles.complaintDetailsContainer}>
                  <TouchableOpacity onPress={() => setExpandedTexts(prev => ({...prev, kp16: !prev.kp16}))}>
                    <ThemedText style={styles.complaintDetailsText} numberOfLines={expandedTexts.kp16 ? undefined : 3}>
                      {kpFormData.kp16_settlement_statement}
                    </ThemedText>
                    {kpFormData.kp16_settlement_statement.length > 100 && (
                      <ThemedText style={styles.expandText}>
                        {expandedTexts.kp16 ? 'Show less' : 'Show more...'}
                      </ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {hearings.length > 0 && (
          <>
            <ThemedCard style={styles.hearingsCard}>
              <View style={styles.hearingsHeader}>
                <ThemedIcon name="calendar-outline" size={20} containerSize={24} bgColor={accent} />
                <ThemedText style={styles.hearingsTitle}>Mediation Hearings</ThemedText>
              </View>
              {hearings.map((hearing) => (
                <View key={hearing.notice_sid} style={styles.hearingItem}>
                  <View style={styles.hearingHeader}>
                    <ThemedText style={styles.hearingNumber}>#{hearing.hearing_no}</ThemedText>
                    <View style={[styles.sourceBadge, { backgroundColor: hearing.source === 'KP-8' ? '#3b82f6' : '#8b5cf6' }]}>
                      <ThemedText style={styles.sourceText}>{hearing.source}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.hearingDetails}>
                    <View style={styles.hearingRow}>
                      <ThemedIcon name="calendar-outline" size={14} containerSize={16} bgColor="transparent" iconColor={accent} />
                      <ThemedText style={styles.hearingText}>
                        {hearing.hearing_date || 'No date'} {hearing.hearing_time && `at ${hearing.hearing_time}`}
                      </ThemedText>
                    </View>
                    <View style={styles.hearingRow}>
                      <ThemedIcon name={hearing.hearing_held ? 'checkmark-circle' : 'time-outline'} size={14} containerSize={16} bgColor="transparent" iconColor={hearing.hearing_held ? '#10b981' : accent} />
                      <ThemedText style={[styles.hearingText, { color: hearing.hearing_held ? '#10b981' : '#6b7280' }]}>
                        {hearing.hearing_held ? 'Held' : 'Scheduled'}
                      </ThemedText>
                    </View>
                    {hearing.hearing_held && (
                      <>
                        <View style={styles.attendanceRow}>
                          <ThemedText style={styles.attendanceLabel}>Attendance:</ThemedText>
                          <ThemedText style={styles.attendanceText}>
                            C: {hearing.complainant_attended} • R: {hearing.respondent_attended}
                          </ThemedText>
                        </View>
                        <View style={styles.outcomeRow}>
                          <ThemedText style={[styles.outcomeText, { color: hearing.settlement_outcome === 'SETTLED' ? '#10b981' : '#f59e0b' }]}>
                            {hearing.settlement_outcome}
                          </ThemedText>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ThemedCard>
            <Spacer height={16} />
          </>
        )}

        {/* Timeline Toggle */}
        <ThemedCard style={styles.timelineToggleCard}>
          <TouchableOpacity 
            style={styles.timelineToggle} 
            onPress={() => setShowTimeline(!showTimeline)}
          >
            <View style={styles.timelineToggleLeft}>
              <ThemedIcon name="time-outline" size={20} containerSize={24} bgColor={accent} />
              <ThemedText style={styles.timelineToggleTitle}>Case Timeline</ThemedText>
              <ThemedText style={styles.timelineToggleCount}>({timeline.length} events)</ThemedText>
            </View>
            <ThemedIcon 
              name={showTimeline ? 'chevron-up-outline' : 'chevron-down-outline'} 
              size={20} 
              containerSize={24} 
              bgColor="transparent" 
              iconColor={accent} 
            />
          </TouchableOpacity>
        </ThemedCard>
        
        {showTimeline && (
          <>
            <Spacer height={16} />
            {timeline.length === 0 ? (
              <ThemedCard style={styles.emptyCard}>
                <ThemedIcon name="time-outline" size={48} containerSize={64} bgColor="#f3f4f6" />
                <ThemedText style={styles.emptyTitle}>No Timeline Events</ThemedText>
                <ThemedText muted style={styles.emptyText}>No events found for this case.</ThemedText>
              </ThemedCard>
            ) : (
              <View style={styles.timeline}>
                {timeline.map((event, index) => renderTimelineEvent(event, index))}
              </View>
            )}
          </>
        )}

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
    alignItems: 'center',
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  eventCount: {
    fontSize: 13,
    marginTop: 2,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  eventCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    fontSize: 11,
    textAlign: 'right',
  },
  eventSubtitle: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
    marginBottom: 8,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  kindText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  hearingsCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  hearingsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  hearingsTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginLeft: 8 },
  hearingItem: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 8 },
  hearingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hearingNumber: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sourceText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  hearingDetails: { gap: 4 },
  hearingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hearingText: { fontSize: 12, color: '#4b5563' },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  attendanceLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  attendanceText: { fontSize: 11, color: '#4b5563' },
  outcomeRow: { marginTop: 4 },
  outcomeText: { fontSize: 11, fontWeight: '600' },
  
  caseInfoCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  caseInfoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  caseInfoTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginLeft: 8 },
  caseInfoGrid: { gap: 12 },
  caseInfoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caseInfoLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', flex: 1 },
  caseInfoValue: { fontSize: 14, color: '#1f2937', flex: 2, textAlign: 'right' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },
  complaintBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  complaintText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  natureBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  natureText: { fontSize: 11, fontWeight: '700' },
  
  partiesSection: { gap: 8 },
  partiesContainer: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12, gap: 8 },
  partyItem: { gap: 4, alignItems: 'center' },
  partyLabel: { fontSize: 11, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' },
  partyName: { fontSize: 12, color: '#1f2937', fontWeight: '500', lineHeight: 16 },
  vsContainer: { alignItems: 'center', paddingVertical: 4 },
  vsText: { fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  
  complaintDetailsSection: { gap: 8 },
  complaintDetailsContainer: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 12 },
  complaintDetailsText: { fontSize: 13, color: '#374151', lineHeight: 18 },
  expandText: { fontSize: 12, color: '#310101', fontWeight: '600', marginTop: 4 },
  
  timelineToggleCard: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  timelineToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timelineToggleTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  timelineToggleCount: { fontSize: 13, color: '#6b7280' },
});