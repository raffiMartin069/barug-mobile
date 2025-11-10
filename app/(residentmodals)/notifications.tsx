import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { useAccountRole } from '@/store/useAccountRole';
import { useRouter } from 'expo-router';
import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import { Colors } from '@/constants/Colors';

export default function ResidentNotificationsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const { getProfile, ensureLoaded } = useAccountRole();
  const [personId, setPersonId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Get person ID from profile
  useEffect(() => {
    const loadProfile = async () => {
      const profile = await ensureLoaded('resident');
      if (profile?.person_id) {
        setPersonId(profile.person_id);
      }
    };
    loadProfile();
  }, []);

  const { items, unread, markAllRead } = useNotifications({ 
    userTypeId: 1, 
    personId 
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh notifications by re-fetching profile
    await ensureLoaded('resident', { force: true });
    setRefreshing(false);
  };

  const handleNotificationPress = (item: any) => {
    if (item.deep_link) {
      router.push(item.deep_link);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('document') || lowerTitle.includes('request')) return 'document-text';
    if (lowerTitle.includes('payment') || lowerTitle.includes('bill')) return 'card';
    if (lowerTitle.includes('announcement') || lowerTitle.includes('news')) return 'megaphone';
    if (lowerTitle.includes('reminder')) return 'alarm';
    if (lowerTitle.includes('approval') || lowerTitle.includes('approved')) return 'checkmark-circle';
    if (lowerTitle.includes('rejected') || lowerTitle.includes('denied')) return 'close-circle';
    return 'notifications';
  };

  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      style={styles.notificationItem}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <ThemedIcon
            name={getNotificationIcon(item.title)}
            size={20}
            iconColor={item.is_read ? theme.icon : Colors.primary}
            bgColor={item.is_read ? theme.card : '#fef2f2'}
            containerSize={40}
            shape="round"
          />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <ThemedText 
              style={[
                styles.title,
                { fontWeight: item.is_read ? '500' : '700' }
              ]}
              numberOfLines={2}
            >
              {item.title}
            </ThemedText>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          
          <ThemedText 
            style={[
              styles.body,
              { color: item.is_read ? theme.icon : theme.text }
            ]}
            numberOfLines={3}
          >
            {item.body}
          </ThemedText>
          
          <ThemedText style={styles.timestamp}>
            {formatTimeAgo(item.created_at)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ThemedIcon
        name="notifications-off"
        size={48}
        iconColor={theme.icon}
        bgColor="transparent"
        containerSize={80}
      />
      <ThemedText style={styles.emptyTitle}>No notifications yet</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        You'll see important updates and announcements here
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText title style={styles.headerTitle}>Notifications</ThemedText>
        {items.length > 0 && (
          <TouchableOpacity onPress={markAllRead} style={[styles.markAllButton, { backgroundColor: Colors.primary + '10' }]}>
            <ThemedText style={styles.markAllText}>
              {unread > 0 ? `Mark all read (${unread})` : 'Clear all'}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.notification_id)}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          items.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    flex: 1,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,

  },
  markAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});