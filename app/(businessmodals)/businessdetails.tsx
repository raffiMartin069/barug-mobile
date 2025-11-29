import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedCard from "@/components/ThemedCard";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useBusinessQuote } from "@/hooks/useBusinessQuote";
import { useFetchBusiness } from "@/hooks/useFetchBusiness";
import { BusinessRepository } from "@/repository/businessRepository";
import { supabaseStorage } from "@/services/supabaseStorage";
import { PaidRecord } from "@/types/businessType";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    return Number.isFinite(n) && n > 0 ? n : null;
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
  const { quote, loading: quoteLoading, error: quoteError, loadAutoQuote } = useBusinessQuote();
  const [quoteYear, setQuoteYear] = useState<number>(new Date().getFullYear());
  const [paidHistory, setPaidHistory] = useState<PaidRecord[]>([]);
  const [paidLoading, setPaidLoading] = useState(false);
  const businessRepo = new BusinessRepository();

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!businessId) return;
      
      setLoading(true);
      
      try {
        // Get business details
        let businessData = selectedBusiness;
        if (!businessData || businessData.business_id !== businessId) {
          businessData = await getBusinessDetails(undefined, businessId);
        }
        
        if (!mounted) return;
        setDetails(businessData ?? null);
        
        // Get proof images from Supabase storage
        if (businessData) {
          try {
            const proofFiles = await supabaseStorage.getBusinessProofImages(businessId);
            setFiles(proofFiles.length > 0 ? proofFiles : null);
          } catch (storageError) {
            console.warn('Failed to load business proof images:', storageError);
            setFiles(null);
          }

          // Get paid history
          try {
            setPaidLoading(true);
            const paidRecords = await businessRepo.fetchPaidHistory(businessId);
            setPaidHistory(paidRecords);
          } catch (paidError) {
            console.warn('Failed to load paid history:', paidError);
            setPaidHistory([]);
          } finally {
            setPaidLoading(false);
          }
        }
      } catch (error) {
        console.error('Failed to load business details:', error);
        if (mounted) {
          setDetails(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [businessId, selectedBusiness]);

  useEffect(() => {
    // auto-load quote once we have a business id
    let mounted = true;
    (async () => {
      if (!businessId) return;
      try {
        await loadAutoQuote(businessId, quoteYear);
      } catch (e) {
        /* swallow, error state is available via quoteError */
      }
    })();
    return () => { mounted = false; };
  }, [businessId, quoteYear]);

  // Early return if no valid business ID
  if (!businessId) {
    return (
      <ThemedView safe>
        <ThemedAppBar title="Business Details" showProfile={false} />
        <View style={styles.center}>
          <ThemedText>Invalid business ID provided.</ThemedText>
        </View>
      </ThemedView>
    );
  }

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
        title="Business Profile"
        showProfile={false}
      />

      <ScrollView style={styles.container}>
        {/* COVER PHOTO & HEADER */}
        <View style={styles.coverContainer}>
          {businessFiles.length > 0 && businessFiles[0].signed_url ? (
            <TouchableOpacity onPress={() => openImageModal(businessFiles[0].signed_url!, 0)} activeOpacity={0.9}>
              <Image
                source={{ uri: businessFiles[0].signed_url }}
                style={styles.coverImage}
                resizeMode="cover"
              />
              {businessFiles.length > 1 && (
                <View style={styles.coverBadge}>
                  <ThemedText style={styles.coverBadgeText}>+{businessFiles.length - 1} more</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.coverPlaceholder}>
              <ThemedText style={styles.coverPlaceholderText}>🏢</ThemedText>
            </View>
          )}
          
          {/* Business Name Overlay */}
          <View style={styles.headerOverlay}>
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.businessNameLarge} numberOfLines={2} ellipsizeMode="tail">
                  {businessName}
                </ThemedText>
                <ThemedText style={styles.idDisplayLarge}>ID: {idDisplay}</ThemedText>
              </View>
              <View style={styles.statusBadge}>
                <ThemedText style={styles.statusBadgeText}>{U(details.business_status)}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* BUSINESS IDENTITY */}
        <ThemedCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>BUSINESS IDENTITY</ThemedText>

          <Spacer height={12} />

          <View style={styles.kvRow}>
            <View style={{ width: "100%" }}>
              <ThemedText style={styles.kvLabel}>OWNER</ThemedText>
              <ThemedText style={styles.kvValue}>{owner}</ThemedText>
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
          <ThemedText style={styles.sectionTitle}>LOCATION</ThemedText>

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
          <ThemedText style={styles.sectionTitle}>OPERATING SCHEDULE</ThemedText>

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

        {/* ATTACHMENTS GALLERY */}
        {businessFiles.length > 0 && (
          <>
            <ThemedCard style={styles.section}>
              <View style={styles.sectionHead}>
                <ThemedText style={styles.sectionTitle}>ATTACHMENTS</ThemedText>
                <View style={{ marginLeft: "auto" }}>
                  <ThemedText style={styles.mutedSmall}>{businessFiles.length} file{businessFiles.length > 1 ? "s" : ""}</ThemedText>
                </View>
              </View>

              <Spacer height={12} />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                <View style={styles.galleryContainer}>
                  {businessFiles.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      onPress={() => openImageModal(item.signed_url!, index)}
                      style={styles.galleryItem}
                      activeOpacity={0.8}
                    >
                      {item.signed_url ? (
                        <Image
                          source={{ uri: item.signed_url }}
                          style={styles.galleryImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.galleryPlaceholder}>
                          <ThemedText style={styles.galleryPlaceholderText}>📄</ThemedText>
                        </View>
                      )}
                      <View style={styles.galleryOverlay}>
                        <ThemedText style={styles.galleryIndex}>{index + 1}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </ThemedCard>
            
            <Spacer height={12} />
          </>
        )}


        {/* AUTO-COMPUTED QUOTE BREAKDOWN */}
        <ThemedCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>BREAKDOWN</ThemedText>

          <Spacer height={8} />

          {quoteLoading ? (
            <View style={styles.center}><ActivityIndicator /></View>
          ) : quoteError ? (
            <ThemedText style={styles.mutedSmall}>Failed to load quote.</ThemedText>
          ) : !quote?.rows || quote.rows.length === 0 ? (
            <View style={styles.center}><ThemedText style={styles.mutedSmall}>No items.</ThemedText></View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
                <View style={styles.tableWrapper}>
                  <View style={styles.tableHeader}>
                    <ThemedText style={[styles.th, styles.colYear]}>Year</ThemedText>
                    <ThemedText style={[styles.th, styles.colKind]}>Kind</ThemedText>
                    <ThemedText style={[styles.th, styles.thRight, styles.colFee]}>Base Fee</ThemedText>
                    <ThemedText style={[styles.th, styles.thRight, styles.colOffense]}>Offense #</ThemedText>
                    <ThemedText style={[styles.th, styles.thRight, styles.colFee]}>Surcharge</ThemedText>
                    <ThemedText style={[styles.th, styles.thRight, styles.colTotal]}>Line Total</ThemedText>
                    <ThemedText style={[styles.th, styles.colDeadline]}>Deadline</ThemedText>
                    <ThemedText style={[styles.th, styles.thRight, styles.colDays]}>Days Late</ThemedText>
                  </View>

                  {quote.rows.map((r, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <ThemedText style={[styles.td, styles.colYear]}>{String(r.item_year)}</ThemedText>

                      <ThemedText style={[styles.td, styles.colKind]}>
                        <Text style={r.kind === "ARREARS" ? styles.pillArrearsText : styles.pillCurrentText}>
                          {r.kind === "ARREARS" ? "ARREARS" : "CURRENT"}
                        </Text>
                      </ThemedText>

                      <ThemedText style={[styles.tdRight, styles.td, styles.bold, styles.colFee]}>
                        {r.base_fee != null ? `₱ ${Number(r.base_fee).toFixed(2)}` : "—"}
                      </ThemedText>

                      <ThemedText style={[styles.tdRight, styles.td, styles.colOffense]}>
                        {r.offense_no ?? "—"}
                      </ThemedText>

                      <ThemedText style={[styles.tdRight, styles.td, styles.colFee]}>
                        {r.surcharge != null ? `₱ ${Number(r.surcharge).toFixed(2)}` : "—"}
                      </ThemedText>

                      <ThemedText style={[styles.tdRight, styles.td, styles.bold, styles.colTotal]}>
                        {r.total != null ? `₱ ${Number(r.total).toFixed(2)}` : "—"}
                      </ThemedText>

                      <ThemedText style={[styles.td, styles.colDeadline]}>
                        {r.deadline ? (/* try to format */ (():string => {
                          try { return new Date(r.deadline).toISOString().slice(0,10) } catch { return String(r.deadline) }
                        })()) : "—"}
                      </ThemedText>

                      <ThemedText style={[styles.tdRight, styles.td, styles.colDays]}>
                        {r.days_late ?? "—"}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* grand total */}
              <View style={[styles.tableFooter]}>
                <ThemedText style={[styles.tfootLabel]}>Grand Total</ThemedText>
                <ThemedText style={[styles.tfootValue]}>
                  <ThemedText style={styles.bold}>₱ {Number(quote.grand_total ?? 0).toFixed(2)}</ThemedText>
                </ThemedText>
              </View>

            </>
          )}
        </ThemedCard>

        <Spacer height={12} />

        {/* PAID HISTORY */}
        <ThemedCard style={styles.section}>
          <ThemedText style={styles.sectionTitle}>PAID HISTORY</ThemedText>

          <Spacer height={8} />

          {paidLoading ? (
            <View style={styles.center}><ActivityIndicator /></View>
          ) : paidHistory.length === 0 ? (
            <View style={styles.center}><ThemedText style={styles.mutedSmall}>No paid records.</ThemedText></View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableContainer}>
              <View style={styles.paidTableWrapper}>
                <View style={styles.tableHeader}>
                  <ThemedText style={[styles.th, styles.paidColYear]}>Year</ThemedText>
                  <ThemedText style={[styles.th, styles.paidColOR]}>OR Number</ThemedText>
                  <ThemedText style={[styles.th, styles.paidColDate]}>Paid On</ThemedText>
                  <ThemedText style={[styles.th, styles.paidColStatus]}>Status</ThemedText>
                </View>

                {paidHistory.map((record, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <ThemedText style={[styles.td, styles.paidColYear]}>{record.period_year}</ThemedText>
                    <ThemedText style={[styles.td, styles.paidColOR]}>{record.or_number || "—"}</ThemedText>
                    <ThemedText style={[styles.td, styles.paidColDate]}>
                      {record.paid_on ? new Date(record.paid_on).toISOString().slice(0, 10) : "—"}
                    </ThemedText>
                    <ThemedText style={[styles.td, styles.paidColStatus]}>
                      <Text style={styles.paidBadge}>PAID</Text>
                    </ThemedText>
                  </View>
                ))}
              </View>
            </ScrollView>
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
  container: { paddingTop: 0 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  
  // Cover photo & header
  coverContainer: { position: "relative", marginBottom: 16 },
  coverImage: { width: "100%", height: 220, backgroundColor: "#f3f4f6" },
  coverPlaceholder: { width: "100%", height: 220, backgroundColor: "#310101", alignItems: "center", justifyContent: "center" },
  coverPlaceholderText: { fontSize: 60, opacity: 0.3 },
  coverBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  coverBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  headerOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(49,1,1,0.85)", paddingHorizontal: 16, paddingVertical: 14 },
  headerContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  businessNameLarge: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  idDisplayLarge: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600", marginTop: 4 },
  statusBadge: { backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { color: "#310101", fontWeight: "700", fontSize: 11 },
  
  // Gallery
  galleryScroll: { marginHorizontal: -12 },
  galleryContainer: { flexDirection: "row", gap: 10, paddingHorizontal: 12 },
  galleryItem: { position: "relative", width: 100, height: 100, borderRadius: 12, overflow: "hidden", backgroundColor: "#f3f4f6" },
  galleryImage: { width: "100%", height: "100%" },
  galleryPlaceholder: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "#e5e7eb" },
  galleryPlaceholderText: { fontSize: 30, opacity: 0.5 },
  galleryOverlay: { position: "absolute", top: 6, left: 6, backgroundColor: "rgba(0,0,0,0.6)", width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  galleryIndex: { color: "#fff", fontSize: 11, fontWeight: "700" },
  
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
  // Table styles
  tableContainer: { marginHorizontal: -12 },
  tableWrapper: { paddingHorizontal: 12, minWidth: 700 },
  tableHeader: { flexDirection: "row", paddingVertical: 8, alignItems: "center", borderBottomWidth: 1, borderColor: "#eee" },
  th: { fontSize: 11, fontWeight: "700", color: "#374151", paddingHorizontal: 4 },
  thRight: { textAlign: "right" as const },
  tableRow: { flexDirection: "row", paddingVertical: 8, alignItems: "center", borderBottomWidth: 1, borderColor: "#f3f4f6" },
  td: { fontSize: 12, color: "#111827", paddingHorizontal: 4 },
  tdRight: { textAlign: "right" as const },
  bold: { fontWeight: "700" as const },
  // Column widths
  colYear: { width: 60 },
  colKind: { width: 80 },
  colFee: { width: 90 },
  colOffense: { width: 70 },
  colTotal: { width: 100 },
  colDeadline: { width: 90 },
  colDays: { width: 70 },
  // Paid history table
  paidTableWrapper: { paddingHorizontal: 12, minWidth: 400 },
  paidColYear: { width: 80 },
  paidColOR: { width: 120 },
  paidColDate: { width: 100 },
  paidColStatus: { width: 80 },
  paidBadge: { color: "#065f46", fontWeight: "700", fontSize: 11, backgroundColor: "#d1fae5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  // Footer styles
  tfootLabel: { flex: 1, textAlign: "right" as const, paddingRight: 12, fontWeight: "600" as const },
  tfootValue: { width: 120, textAlign: "right" as const, fontWeight: "700" as const },
  pillArrearsText: { color: "#7a1919", fontWeight: "700" },
  pillCurrentText: { color: "#0b5ed7", fontWeight: "700" },
  tableFooter: { flexDirection: "row", paddingTop: 10, alignItems: "center", justifyContent: "flex-end" },

});
