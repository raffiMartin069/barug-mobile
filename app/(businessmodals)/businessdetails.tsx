// app/(businessmodals)/businessdetails.tsx
import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedCard from "@/components/ThemedCard";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useFetchBusiness } from "@/hooks/useFetchBusiness";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TouchableOpacity, View, Modal, Image } from "react-native";
import { supabaseStorage } from "@/services/supabaseStorage";

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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!businessId) return;
      
      setLoading(true);
      
      // Get business details
      let businessData = selectedBusiness;
      if (!businessData || businessData.business_id !== businessId) {
        businessData = await getBusinessDetails(undefined, businessId);
      }
      
      if (!mounted) return;
      setDetails(businessData ?? null);
      
      // Get proof images from Supabase storage
      if (businessData) {
        const proofFiles = await supabaseStorage.getBusinessProofImages(businessId);
        setFiles(proofFiles.length > 0 ? proofFiles : null);
      }
      
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [businessId, selectedBusiness]);

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
  const businessFiles = files ?? details?.files ?? details?.attachments ?? [];

  const openImageModal = (url: string, index: number = 0) => {
    setSelectedImage(url);
    setCurrentIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : businessFiles.length - 1;
    setCurrentIndex(newIndex);
    setSelectedImage(businessFiles[newIndex].signed_url!);
  };

  const goToNext = () => {
    const newIndex = currentIndex < businessFiles.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedImage(businessFiles[newIndex].signed_url!);
  };

  const viewAllFiles = () => {
    if (businessFiles.length > 0 && businessFiles[0].signed_url) {
      openImageModal(businessFiles[0].signed_url, 0);
    }
  };

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
                <ThemedButton submit={false} onPress={viewAllFiles}><ThemedText non_btn>VIEW ALL</ThemedText></ThemedButton>
              </View>

              <View style={{ marginTop: 8 }}>
                {businessFiles.map((item, index) => (
                  <View key={index}>
                    <View style={styles.fileRow}>
                      <ThemedText style={styles.fileIcon}>📄</ThemedText>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <ThemedText numberOfLines={1} ellipsizeMode="tail" style={styles.kvValue}>{U(item.name)}</ThemedText>
                      </View>
                      <View style={{ marginLeft: 8 }}>
                        {item.signed_url ? (
                          <TouchableOpacity onPress={() => openImageModal(item.signed_url!, index)}>
                            <ThemedText subtitle>PREVIEW</ThemedText>
                          </TouchableOpacity>
                        ) : (
                          <ThemedText style={styles.mutedSmall}>NO SIGNED URL</ThemedText>
                        )}
                      </View>
                    </View>
                    {index < businessFiles.length - 1 && <Spacer height={8} />}
                  </View>
                ))}
              </View>
            </>
          ) : (
            <ThemedText style={styles.mutedSmall}>NO ATTACHMENTS.</ThemedText>
          )}
        </ThemedCard>

        <Spacer height={32} />
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
            <ThemedText style={styles.closeText}>✕</ThemedText>
          </TouchableOpacity>
          
          {businessFiles.length > 1 && (
            <TouchableOpacity style={styles.navLeft} onPress={goToPrevious}>
              <ThemedText style={styles.navText}>‹</ThemedText>
            </TouchableOpacity>
          )}
          
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
          
          {businessFiles.length > 1 && (
            <TouchableOpacity style={styles.navRight} onPress={goToNext}>
              <ThemedText style={styles.navText}>›</ThemedText>
            </TouchableOpacity>
          )}
          
          {businessFiles.length > 1 && (
            <View style={styles.imageCounter}>
              <ThemedText style={styles.counterText}>{currentIndex + 1} / {businessFiles.length}</ThemedText>
            </View>
          )}
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(240,240,240,0.95)", justifyContent: "center", alignItems: "center" },
  modalClose: { position: "absolute", top: 50, right: 20, zIndex: 1, padding: 10 },
  closeText: { color: "#333", fontSize: 24, fontWeight: "bold" },
  modalImage: { width: "90%", height: "80%" },
  navLeft: { position: "absolute", left: 20, top: "50%", zIndex: 1, padding: 15, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 25 },
  navRight: { position: "absolute", right: 20, top: "50%", zIndex: 1, padding: 15, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 25 },
  navText: { color: "white", fontSize: 30, fontWeight: "bold" },
  imageCounter: { position: "absolute", bottom: 50, alignSelf: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  counterText: { color: "white", fontSize: 14, fontWeight: "600" },
});
