import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { useAccountRole } from '@/store/useAccountRole';
import { PaymentHistory } from '@/types/paymentHistoryType';
import React, { useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

export default function PaymentHistoryScreen() {
  const { paymentHistory, loading, loadingMore, hasMore, fetchPaymentHistory, loadMore, refresh } = usePaymentHistory();
  const { getProfile } = useAccountRole();
  const profile = getProfile('business');

  useEffect(() => {
    if (profile?.person_id) {
      fetchPaymentHistory(profile.person_id, undefined, undefined, true);
    }
  }, [profile?.person_id]);

  const renderPaymentItem = ({ item }: { item: PaymentHistory }) => (
    <View style={styles.paymentItem}>
      <View style={styles.paymentHeader}>
        <ThemedIcon
          name="receipt"
          iconColor="#561C24"
          bgColor="#F5E6E8"
          shape="square"
          containerSize={50}
          size={20}
        />
        <View style={styles.paymentDetails}>
          <ThemedText style={styles.orNumber}>OR #{item.or_number}</ThemedText>
          <ThemedText style={styles.purpose}>{item.purpose}</ThemedText>
        </View>
        <View style={styles.amountContainer}>
          <ThemedText style={styles.amount}>₱{item.amount_paid.toLocaleString()}</ThemedText>
          <View style={[styles.badge, { backgroundColor: '#F5E6E8' }]}>
            <ThemedText style={styles.badgeText}>Paid</ThemedText>
          </View>
        </View>
      </View>
      
      <View style={styles.paymentMeta}>
        <View style={styles.metaRow}>
          <ThemedText style={styles.metaLabel}>Method:</ThemedText>
          <ThemedText style={styles.metaValue}>{item.payment_method}</ThemedText>
        </View>
        <View style={styles.metaRow}>
          <ThemedText style={styles.metaLabel}>Year:</ThemedText>
          <ThemedText style={styles.metaValue}>{item.origin_period_year}</ThemedText>
        </View>
        <View style={styles.metaRow}>
          <ThemedText style={styles.metaLabel}>Date:</ThemedText>
          <ThemedText style={styles.metaValue}>{new Date(item.issued_at).toLocaleDateString()}</ThemedText>
        </View>
        <View style={styles.metaRow}>
          <ThemedText style={styles.metaLabel}>Issued by:</ThemedText>
          <ThemedText style={styles.metaValue}>{item.issued_by}</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={{ paddingBottom: 0 }} safe>
      <ThemedAppBar title="Payment History" showBack={false} />
      
      <FlatList
        data={paymentHistory}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.or_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => profile?.person_id && refresh(profile.person_id)}
          />
        }
        onEndReached={() => profile?.person_id && hasMore && loadMore(profile.person_id)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingFooter}>
              <ThemedText style={styles.loadingText}>Loading more...</ThemedText>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <ThemedIcon
                name="receipt-outline"
                iconColor="#9CA3AF"
                bgColor="#F3F4F6"
                containerSize={80}
                size={40}
              />
              <ThemedText style={styles.emptyText}>No payment history found</ThemedText>
              <ThemedText style={styles.emptySubtext}>Your payment records will appear here</ThemedText>
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 0,
  },
  paymentItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  purpose: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#561C24',
    marginBottom: 4,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentMeta: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    color: '#6B7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
});