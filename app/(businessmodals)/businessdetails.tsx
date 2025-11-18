// app/(businessmodals)/businessdetails.tsx
import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedCard from "@/components/ThemedCard";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useFetchBusiness } from "@/hooks/useFetchBusiness";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type ProofFile = {
  name?: string;
  signed_url?: string | null;
};

export default function BusinessDetails() {
  const params = useLocalSearchParams<{ id?: string }>();
  const idParam = params?.id ?? null;
  const businessId = useMemo(() => {
    if (!idParam) return null;
    const n = Number(idParam);
    return Number.isFinite(n) ? n : null;
  }, [idParam]);

  const {
    selectedBusiness,
    getBusinessDetails,
  } = useFetchBusiness();

  const [loading, setLoading] = useState<boolean>(false);
  const [details, setDetails] = useState<any | null>(selectedBusiness ?? null);
  const [files, setFiles] = useState<ProofFile[] | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!businessId) return;
      if (selectedBusiness?.business_id === businessId) {
        setDetails(selectedBusiness);
        setFiles(selectedBusiness.proof_images?.map((p: string) => ({ name: p.split("/").pop(), signed_url: p })) ?? null);
        return;
      }

      setLoading(true);
      const fetched = await getBusinessDetails(undefined, businessId);
      if (!mounted) return;
      setDetails(fetched ?? null);
      setFiles(fetched?.proof_images?.map((p: string) => ({ name: p.split("/").pop(), signed_url: p })) ?? null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [businessId, selectedBusiness, getBusinessDetails]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.center}>
        <ThemedText>No business found.</ThemedText>
      </View>
    );
  }

  const U = (v: any) => {
    if (v == null) return "—";
    if (typeof v === "string") {
      const t = v.trim();
      return t === "" ? "—" : t.toUpperCase();
    }
    return String(v);
  };

  const idDisplay = details.business_id ? String(details.business_id).padStart(6, "0") : "—";
  const owner = U(details.owner_full_name);
  const businessName = U(details.business_name);
  const businessAddress = U(details.business_address);
  const operatingDaysText = U(details.operating_days);
  const operatingHoursText = U(details.operating_hours);
  const ownershipType = U(details.ownership_type);
  const businessCategory = U(details.business_category);
  const businessNature = U(details.business_nature);
  const dateEstablished = details.date_established ? String(details.date_established) : "—";
  const businessFiles = files ?? [];

  return (
    <ThemedView safe>
      <ThemedAppBar
        title="Business Details"
        showProfile={false}
      />

      <ScrollView style={styles.container}>
        {/* BUSINESS IDENTITY */}
        <ThemedCard style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText subtitle style={styles.sectionIcon}>🏷️</ThemedText>
            <ThemedText style={styles.sectionTitle}>BUSINESS IDENTITY</ThemedText>
          </View>

          <View style={styles.rowSpace}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.businessName} title numberOfLines={2} ellipsizeMode="tail">
                {businessName}
              </ThemedText>
              <Spacer height={6} />
              <ThemedText style={styles.idDisplay}>{idDisplay}</ThemedText>

              <ThemedText style={[styles.kvLabel, { marginTop: 8 }]}>OWNER</ThemedText>
              <ThemedText style={styles.kvValue}>{owner}</ThemedText>
            </View>

            <View style={{ marginLeft: 12 }}>
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>{U(details.business_status)}</ThemedText>
              </View>
            </View>
          </View>

          <Spacer height={12} />

          <View style={styles.kvRow}>
            <View style={styles.kvCol}>
              <ThemedText style={styles.kvLabel}>OWNERSHIP TYPE</ThemedText>
              <ThemedText style={styles.kvValue}>{ownershipType}</ThemedText>
            </View>

            <View style={styles.kvCol}>
              <ThemedText style={styles.kvLabel}>BUSINESS CATEGORY</ThemedText>
              <ThemedText style={styles.kvValue}>{businessCategory}</ThemedText>
            </View>

            <View style={styles.kvCol}>
              <ThemedText style={styles.kvLabel}>NATURE OF BUSINESS</ThemedText>
              <ThemedText style={styles.kvValue}>{businessNature}</ThemedText>
            </View>

            <View style={styles.kvCol}>
              <ThemedText style={styles.kvLabel}>DATE ESTABLISHED</ThemedText>
              <ThemedText style={styles.kvValue}>{dateEstablished}</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={12} />

        {/* LOCATION */}
        <ThemedCard style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText subtitle style={styles.sectionIcon}>📍</ThemedText>
            <ThemedText style={styles.sectionTitle}>LOCATION</ThemedText>
          </View>

          <Spacer height={8} />

          <View style={styles.kvRow}>
            <View style={{ width: "100%" }}>
              <ThemedText style={styles.kvLabel}>BUSINESS ADDRESS</ThemedText>
              <ThemedText style={styles.kvValue} numberOfLines={2}>{businessAddress}</ThemedText>
            </View>

            <Spacer height={8} />

            <View style={{ width: "100%" }}>
              <ThemedText style={styles.kvLabel}>LOCATION DESCRIPTION</ThemedText>
              <ThemedText style={styles.kvValue}>{U(details.description)}</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={12} />

        {/* OPERATING SCHEDULE */}
        <ThemedCard style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText subtitle style={styles.sectionIcon}>⏰</ThemedText>
            <ThemedText style={styles.sectionTitle}>OPERATING SCHEDULE</ThemedText>
          </View>

          <Spacer height={8} />

          <View style={styles.kvRow}>
            <View style={styles.kvCol}>
              <ThemedText style={styles.kvLabel}>OPERATING DAYS</ThemedText>
              <ThemedText style={styles.kvValue}>{operatingDaysText}</ThemedText>
            </View>

            <View style={styles.kvCol}>
              <ThemedText style={styles.kvLabel}>OPERATING HOURS</ThemedText>
              <ThemedText style={styles.kvValue}>{operatingHoursText}</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={12} />

        {/* PROOF / ATTACHMENTS */}
        <ThemedCard style={styles.section}>
          <View style={styles.sectionHead}>
            <ThemedText subtitle style={styles.sectionIcon}>📎</ThemedText>
            <ThemedText style={styles.sectionTitle}>PROOF / ATTACHMENTS</ThemedText>
          </View>

          <Spacer height={8} />

          {businessFiles.length > 0 ? (
            <>
              <View style={styles.proofHeader}>
                <ThemedText style={styles.mutedSmall}>{String(businessFiles.length).toUpperCase()} FILE{businessFiles.length > 1 ? "S" : ""}</ThemedText>
                <ThemedButton submit={false} onPress={() => {/* open modal if you have a viewer */}}><ThemedText non_btn>VIEW ALL</ThemedText></ThemedButton>
              </View>

              <FlatList
                data={businessFiles}
                keyExtractor={(it, i) => String(i)}
                renderItem={({ item, index }) => (
                  <View style={styles.fileRow}>
                    <ThemedText style={styles.fileIcon}>📄</ThemedText>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <ThemedText numberOfLines={1} ellipsizeMode="tail" style={styles.kvValue}>{U(item.name)}</ThemedText>
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      {item.signed_url ? (
                        <TouchableOpacity onPress={() => { /* open item.signed_url with Linking.openURL */ }}>
                          <ThemedText subtitle>PREVIEW</ThemedText>
                        </TouchableOpacity>
                      ) : (
                        <ThemedText style={styles.mutedSmall}>NO SIGNED URL</ThemedText>
                      )}
                    </View>
                  </View>
                )}
                ItemSeparatorComponent={() => <Spacer height={8} />}
                style={{ marginTop: 8 }}
              />
            </>
          ) : (
            <ThemedText style={styles.mutedSmall}>NO ATTACHMENTS.</ThemedText>
          )}
        </ThemedCard>

        <Spacer height={32} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  section: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  sectionHead: { flexDirection: "row", alignItems: "center" },
  sectionIcon: { marginRight: 8, fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  rowSpace: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  businessName: { fontSize: 16, fontWeight: "700" },
  mutedSmall: { fontSize: 12, color: "#6b7280" },
  badge: { backgroundColor: "#fdecea", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#7a1919", fontWeight: "700", fontSize: 12 },
  kvRow: { marginTop: 8, gap: 8 },
  kvCol: { width: "50%", paddingVertical: 6 },
  kvLabel: { fontSize: 12, fontWeight: "600", opacity: 0.8, marginBottom: 4 },
  kvValue: { fontSize: 14, color: "#111827", fontWeight: "700" }, // <-- bold values
  proofHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  fileRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  fileIcon: { fontSize: 16 },
  idDisplay: { fontSize: 12, color: "#6b7280", fontWeight: "700" }, // bold id
});
