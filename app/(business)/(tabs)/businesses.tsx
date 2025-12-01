import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useFetchBusiness } from "@/hooks/useFetchBusiness";

import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedCard from "@/components/ThemedCard";
import ThemedIcon from "@/components/ThemedIcon";
import ThemedText from "@/components/ThemedText";
import ThemedTextInput from "@/components/ThemedTextInput";
import ThemedView from "@/components/ThemedView";
import { useAccountRole } from "@/store/useAccountRole";

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#fde68a', fg: '#92400e' },  // yellow
  ACTIVE: { bg: '#d1fae5', fg: '#065f46' },   // green
  EXPIRED: { bg: '#fecaca', fg: '#7f1d1d' },  // red
  CLOSED: { bg: '#e5e7eb', fg: '#374151' },   // gray
};


const Businesses= () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { businesses, getBusinesses, setSelectedBusiness} = useFetchBusiness();

  const { currentRole,ensureLoaded } = useAccountRole()
  const role = currentRole ?? 'no role'
  const isBusiness = role === 'business'

  const [ownerId, setOwnerId] = useState<number | undefined>();
  console.log("Owner id:",ownerId)

  React.useEffect(() => {
    if (isBusiness) {
      ensureLoaded('business').then(profile => {
        if (profile?.person_id) setOwnerId(profile.person_id);
      });
    }
  }, [isBusiness, ensureLoaded]);

  React.useEffect(() => {
    getBusinesses(undefined, ownerId);
  }, [ownerId]);

  const filtered = businesses.filter((b) => {
    // Search filter
    if (search) {
      const s = search.trim().toLowerCase();
      const matchesSearch = b.business_name.toLowerCase().includes(s);
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter !== 'ALL') {
      const matchesStatus = b.business_status_name?.toUpperCase() === statusFilter;
      if (!matchesStatus) return false;
    }
    
    return true;
  });

  // ← updated: set selected business then navigate and pass id as string
  const openBusiness = (b: typeof businesses[0]) => {
    // store selected business in hook/store (optional, useful for detail screen)
    if (setSelectedBusiness) setSelectedBusiness(b);

    // navigator: pass id as string — expo-router expects string params
    router.push({
      pathname: "/(businessmodals)/businessdetails",
      params: { id: String(b.business_id) },
    });
  };

  return (
    <ThemedView style={{ paddingBottom: 0 }} safe>
      <ThemedAppBar title="Businesses"  showBack={false}/>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Spacer height={12} />
        <View style={styles.search}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color="#6b7280" />
            <View style={{ flex: 1 }}>
              <ThemedTextInput
                placeholder="Search business #, name, owner or address..."
                value={search}
                onChangeText={(t: string) => setSearch(t)}
                style={{ paddingLeft: 6 }}
              />
            </View>
          </View>

          <Spacer height={12} />

          {/* Status Filter */}
          <View style={styles.segment}>
            <Pressable 
              style={[styles.segmentItem, statusFilter === 'ALL' && styles.segmentItemSelected, styles.segmentDivider]}
              onPress={() => setStatusFilter('ALL')}
            >
              <ThemedText style={[styles.segmentText, statusFilter === 'ALL' && styles.segmentTextSelected]}>
                All
              </ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.segmentItem, statusFilter === 'PENDING' && styles.segmentItemSelected, styles.segmentDivider]}
              onPress={() => setStatusFilter('PENDING')}
            >
              <ThemedText style={[styles.segmentText, statusFilter === 'PENDING' && styles.segmentTextSelected]}>
                Pending
              </ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.segmentItem, statusFilter === 'ACTIVE' && styles.segmentItemSelected, styles.segmentDivider]}
              onPress={() => setStatusFilter('ACTIVE')}
            >
              <ThemedText style={[styles.segmentText, statusFilter === 'ACTIVE' && styles.segmentTextSelected]}>
                Active
              </ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.segmentItem, statusFilter === 'EXPIRED' && styles.segmentItemSelected, styles.segmentDivider]}
              onPress={() => setStatusFilter('EXPIRED')}
            >
              <ThemedText style={[styles.segmentText, statusFilter === 'EXPIRED' && styles.segmentTextSelected]}>
                Expired
              </ThemedText>
            </Pressable>
            
            <Pressable 
              style={[styles.segmentItem, statusFilter === 'CLOSED' && styles.segmentItemSelected]}
              onPress={() => setStatusFilter('CLOSED')}
            >
              <ThemedText style={[styles.segmentText, statusFilter === 'CLOSED' && styles.segmentTextSelected]}>
                Closed
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <Spacer height={12} />

        {filtered.map((b) => {
          const statusKey = b.business_status_name?.toUpperCase() || 'PENDING';
          const statusColor = STATUS_COLORS[statusKey] || STATUS_COLORS.PENDING;
          
          return (
            <Pressable key={b.business_id} onPress={() => openBusiness(b)}>
              <ThemedCard>
                <View style={styles.rowContainer}>
                  <View style={styles.rowSubContainer}>
                    <ThemedIcon name="business" bgColor="#310101" containerSize={40} size={18} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <ThemedText style={{ fontWeight: "700", paddingBottom: 5 }} subtitle>
                        {b.business_name}
                      </ThemedText>
                      <View style={[styles.statusPill, { backgroundColor: statusColor.bg }]}>
                        <ThemedText style={[styles.statusText, { color: statusColor.fg }]}>
                          {b.business_status_name}
                        </ThemedText>
                      </View>
                      <ThemedText style={{ color: "#475569" }}>{String(b.business_id).padStart(6, "0")} • {b.business_category_name}</ThemedText>
                      <ThemedText style={{ color: "#475569" }}>{b.ownership_type_name}</ThemedText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} />
                </View>

              <View style={[styles.rowSubContainer, { paddingTop: 8 }]}> 
                <Ionicons name="location-outline" size={16} color="#475569" />
                <ThemedText style={{ marginLeft: 8, color: "#475569" }}>{b.business_address}</ThemedText>
              </View>

              <Spacer height={12} />

              <ThemedButton submit={false} onPress={() => openBusiness(b)}>
                <ThemedText non_btn>View Details</ThemedText>
              </ThemedButton>
            </ThemedCard>
            <Spacer height={20}/>
          </Pressable>
        );
        })}

        {filtered.length === 0 && (
          <ThemedText style={{ color: "#64748b", textAlign: "center", marginTop: 40 }}>
            No businesses found.
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
};

export default Businesses;

const styles = StyleSheet.create({
  search: {
    paddingHorizontal: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e7e7e7',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  segment: {
    borderColor: '#e7e7e7',
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  segmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemSelected: {
    backgroundColor: '#f5f5f5',
  },
  segmentDivider: {
    borderRightColor: '#e7e7e7',
    borderRightWidth: 1,
  },
  segmentText: {
    fontSize: 12,
    color: '#6b7280',
  },
  segmentTextSelected: {
    color: '#310101',
    fontWeight: '700',
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  rowSubContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 11,
  },
});

