import React from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'expo-router';

export default function ResidentNotificationsScreen() {
  // Replace with your real IDs (from store/profile)
  const personId = /* get from store/profile */ null as any;
  const { items, unread, markAllRead } = useNotifications({ userTypeId: 1, personId });
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 12, backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={{ color: '#7a1212', fontWeight: '700' }}>
            {unread > 0 ? `Mark ${unread} as read` : 'Mark all read'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.notification_id)}
        refreshControl={<RefreshControl refreshing={false} onRefresh={()=>{}} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              // navigate to deep link if supported
              // router.push(item.deep_link || '/');
            }}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          >
            <Text style={{ fontWeight: '700', color: '#111' }}>{item.title}</Text>
            <Text style={{ color: '#333', marginTop: 4 }}>{item.body}</Text>
            <Text style={{ color: '#94a3b8', marginTop: 6, fontSize: 12 }}>
              {new Date(item.created_at).toLocaleString()} {item.is_read ? '' : '• Unread'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#94a3b8' }}>No notifications</Text>}
      />
    </View>
  );
}
