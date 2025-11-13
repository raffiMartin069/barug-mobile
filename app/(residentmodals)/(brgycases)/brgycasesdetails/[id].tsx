import React, { useEffect, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

import ThemedView from '@/components/ThemedView';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedIcon from '@/components/ThemedIcon';
import Spacer from '@/components/Spacer';

import { getCaseTimeline, CaseTimelineEvent } from '@/services/blotterReport';

const accent = '#6d2932';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No case ID provided');
      setLoading(false);
      return;
    }

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        const data = await getCaseTimeline(Number(id));
        setTimeline(data);
      } catch (err) {
        console.error('[CaseDetails] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load case timeline');
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
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
      <ThemedAppBar title="Case Timeline" showNotif={false} showProfile={false} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <ThemedCard style={styles.headerCard}>
          <View style={styles.headerRow}>
            <ThemedIcon name="briefcase-outline" size={24} containerSize={32} bgColor={accent} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <ThemedText style={styles.caseTitle}>Case #{id}</ThemedText>
              <ThemedText muted style={styles.eventCount}>{timeline.length} events</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Timeline */}
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
});