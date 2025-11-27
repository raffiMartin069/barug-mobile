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


const Businesses= () => {
  const router = useRouter();
  const [search, setSearch] = useState("");

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
    if (!search) return true;
    const s = search.trim().toLowerCase();
    return (
      b.business_name.toLowerCase().includes(s)
    );
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
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar title="Businesses"  showBack={false}/>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.search}>
          <ThemedTextInput
            placeholder="Search business #, name, owner or address..."
            value={search}
            onChangeText={(t: string) => setSearch(t)}
          />
        </View>

        <Spacer height={12} />

        {filtered.map((b) => (
          <Pressable key={b.business_id} onPress={() => openBusiness(b)}>
            <ThemedCard>
              <View style={styles.rowContainer}>
                <View style={styles.rowSubContainer}>
                  <ThemedIcon name="business" bgColor="#310101" containerSize={40} size={18} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <ThemedText style={{ fontWeight: "700", paddingBottom: 5 }} subtitle>
                      {b.business_name}
                    </ThemedText>
                    <View style={styles.statusPill}>
                      <ThemedText style={styles.statusText}>{b.business_status_name}</ThemedText>
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
        ))}

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
    paddingHorizontal: 20,
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
    backgroundColor: "#bda9a9ff",
    paddingHorizontal: 6, // smaller horizontal padding
    paddingVertical: 2,   // minimal vertical padding
    borderRadius: 12,
    alignSelf: "flex-start", // ensures it wraps only the text width
    marginBottom: 4, // optional spacing below pill
  },
  statusText: {
    color: "#310101",
    fontWeight: "600",
    fontSize: 12,
  },
});

