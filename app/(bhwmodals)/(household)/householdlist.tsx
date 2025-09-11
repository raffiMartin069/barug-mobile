import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedBottomSheet from "@/components/ThemedBottomSheet";
import ThemedButton from "@/components/ThemedButton";
import ThemedCard from "@/components/ThemedCard";
import ThemedChip from "@/components/ThemedChip";
import ThemedIcon from "@/components/ThemedIcon";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { FamilyRepository } from "@/repository/familyRepository";
import { HouseholdRepository } from "@/repository/householdRepository";
import { HouseholdListService } from "@/services/householdList";
import { useHouseMateStore } from "@/store/houseMateStore";
import { MgaKaHouseMates } from "@/types/houseMates";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

type Member = {
  id: string;
  name: string;
  relation: string;
  age: number;
  sex: "Male" | "Female";
};

type Family = {
  familyNum: string;
  headName: string;
  type: string;
  nhts: string | boolean;
  indigent: string | boolean;
  monthlyIncome: string;
  sourceIncome: string;
  members: Member[];
};

type Household = {
  id: string;
  householdNum: string;
  householdHead: string;
  address: string;
  houseType: string;
  houseOwnership: string;
  families: Family[];
};

const HouseholdList = () => {
  const router = useRouter();

  const [households, setHouseholds] = useState<Household[]>([]);
  const setMemberId = useHouseMateStore((state: MgaKaHouseMates) => state.setMemberId);
  const setHouseholdId = useHouseMateStore((state: MgaKaHouseMates) => state.setHouseholdId);
  const setFamilyId = useHouseMateStore((state: MgaKaHouseMates) => state.setFamilyId);

  const isFocused = useIsFocused();

  useEffect(() => {
    console.log(isFocused ? "HouseholdList is focused" : "HouseholdList is not focused");
    if (!isFocused) return;

    const householdRepository = new HouseholdRepository();
    const familyRepository = new FamilyRepository();
    const service = new HouseholdListService(
      familyRepository,
      householdRepository
    );
    const fetchHouseholds = async () => {
      const rawData = await service.execute();
      if (!rawData) return;

      const transformed: Household[] = rawData.map((item: any) => {
        const parsed = JSON.parse(item.members);

        return {
          id: String(item.household_id),
          householdNum: item.household_num,
          householdHead: item.household_head_name,
          address: item.address,
          houseType: parsed.household.house_type,
          houseOwnership: parsed.household.house_ownership,
          families: parsed.families.map((fam: any) => ({
            familyNum: fam.family_num,
            headName: fam.family_head_name,
            type: fam.household_type,
            nhts: fam.nhts_status,
            indigent: fam.indigent_status,
            monthlyIncome: fam.monthly_income,
            sourceIncome: fam.source_of_income,
            members: fam.members.map((m: any, idx: number) => ({
              id: `${m.person_id}-${idx}`,
              name: m.full_name,
              relation: "",
              age: 0,
              sex: "Male",
            })),
          })),
        };
      });

      setHouseholds(transformed);

      setSelectedHousehold(prev => {
      if (!prev) return prev;
      const found = transformed.find(h => h.id === prev.id);
      return found ?? prev;
    });
    };
    fetchHouseholds();
  }, [isFocused]);

  // ---------- bottom sheet + member states ----------
  const [open, setOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null
  );

  const [familyIndex, setFamilyIndex] = useState(0);
  const familiesScrollRef = useRef<ScrollView>(null);

  const openSheet = (item: Household) => {
    setSelectedHousehold(item);
    setOpen(true);
    setFamilyIndex(0);
    setTimeout(() => {
      familiesScrollRef.current?.scrollTo({ x: 0, animated: false });
    }, 0);
  };

  const closeSheet = () => setOpen(false);

  const onFamiliesScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setFamilyIndex(idx);
  };

  const onPressMember = (fam: Family, mem: Member) => {
    closeSheet();
    setMemberId(Number(mem.id.split("-")[0]));
    setFamilyId(Number(fam.familyNum.split("-")[1]));
    setHouseholdId(Number(fam.familyNum.split("-")[0]));
    // refactored:
    // navigation works with /memberprofile but it does not mount the component which causes console.logs or useEffect not to execute.
    router.push({
      pathname: "/(bhwmodals)/(family)/memberprofile",
    });
  };

  const onPressAddMember = async (id: string) => {
    setFamilyId(Number(id));
    router.push({
      pathname: "/(bhwmodals)/(family)/addmember",
    });
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: "flex-start" }} safe={true}>
      <ThemedAppBar title="List of Household" />

      <KeyboardAvoidingView>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          <Spacer height={20} />

          {households.map((hh) => (
            <View key={hh.id}>
              <Pressable onPress={() => openSheet(hh)}>
                <ThemedCard>
                  <View style={styles.rowContainer}>
                    <View style={styles.rowSubContainer}>
                      <ThemedIcon
                        name={"home"}
                        bgColor={"#310101"}
                        containerSize={40}
                        size={18}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <ThemedText
                          style={{ fontWeight: "700" }}
                          subtitle={true}
                        >
                          {hh.householdNum}
                        </ThemedText>
                        <ThemedText style={{ color: "#475569" }}>
                          Household Head: {hh.householdHead}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} />
                  </View>

                  <View
                    style={[
                      styles.rowSubContainer,
                      { paddingBottom: 5, paddingTop: 5 },
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#475569"
                    />
                    <ThemedText style={{ marginLeft: 10, color: "#475569" }}>
                      {hh.address}
                    </ThemedText>
                  </View>

                  <View style={styles.rowSubContainer}>
                    <Ionicons name="people-outline" size={16} color="#475569" />
                    <ThemedText style={{ marginLeft: 10, color: "#475569" }}>
                      {hh.families.length} Families
                    </ThemedText>
                  </View>

                  <Spacer height={15} />

                  <ThemedButton submit={false} onPress={() => openSheet(hh)}>
                    <ThemedText non_btn={true}>View Details</ThemedText>
                  </ThemedButton>
                </ThemedCard>
              </Pressable>

              <Spacer />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- Bottom Sheet --------- */}
      <ThemedBottomSheet visible={open} onClose={closeSheet}>
        {selectedHousehold && (
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 8 }}>
              <ThemedText subtitle>{selectedHousehold.householdNum}</ThemedText>
              <ThemedText style={{ color: "#475569" }}>
                {selectedHousehold.householdHead}
              </ThemedText>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              {/* Household Info */}
              <View style={{ marginTop: 6 }}>
                <ThemedText style={{ fontWeight: "700", marginBottom: 6 }}>
                  Household Information
                </ThemedText>
                <View style={styles.kvRow}>
                  <ThemedText>Household Head</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.householdHead}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>Household No.</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.householdNum}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>House Type</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.houseType}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>House Ownership</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.houseOwnership}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>Home Address</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.address}
                  </ThemedText>
                </View>
              </View>

              {/* Families */}
              <View style={{ marginTop: 16 }}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>
                    Families in this Household
                  </ThemedText>

                  <ThemedChip
                    label={"Add Family Unit"}
                    onPress={() => router.push("/createfamily")}
                    filled={false}
                  />
                </View>

                <ScrollView
                  ref={familiesScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onFamiliesScroll}
                  scrollEventThrottle={16}
                >
                  {selectedHousehold.families.map((fam) => (
                    <View
                      key={fam.familyNum}
                      style={{ width: SCREEN_WIDTH - 16, paddingRight: 16 }}
                    >
                      <View style={styles.familyCover}>
                        <Ionicons
                          name="home-outline"
                          size={20}
                          color="#475569"
                        />
                        <View style={{ marginLeft: 10 }}>
                          <ThemedText style={{ fontWeight: "700" }}>
                            {fam.familyNum}
                          </ThemedText>
                          <ThemedText
                            style={{ color: "#64748b", marginTop: 2 }}
                          >
                            Family Head:{" "}
                            <ThemedText style={{ fontWeight: "700" }}>
                              {fam.headName}
                            </ThemedText>
                          </ThemedText>
                          <View style={styles.badgesRow}>
                            <View style={styles.badge}>
                              <ThemedText style={styles.badgeText}>
                                Type: {fam.type}
                              </ThemedText>
                            </View>
                            <View style={styles.badge}>
                              <ThemedText style={styles.badgeText}>
                                NHTS: {String(fam.nhts)}
                              </ThemedText>
                            </View>
                            <View style={styles.badge}>
                              <ThemedText style={styles.badgeText}>
                                Indigent: {String(fam.indigent)}
                              </ThemedText>
                            </View>
                            <View style={styles.badge}>
                              <ThemedText style={styles.badgeText}>
                                Monthly Income: {fam.monthlyIncome}
                              </ThemedText>
                            </View>
                            <View style={styles.badge}>
                              <ThemedText style={styles.badgeText}>
                                Source of Income: {fam.sourceIncome}
                              </ThemedText>
                            </View>
                          </View>
                        </View>
                      </View>

                      <Spacer height={10} />

                      <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>
                          Members
                        </ThemedText>
                        <ThemedChip
                          label={"Add Member"}
                          onPress={() => onPressAddMember(fam.familyNum)}
                          filled={false}
                        />
                      </View>

                      {fam.members.length > 0 ? (
                        <View style={styles.memberGrid}>
                          {fam.members.map((m) => (
                            <ThemedChip
                              key={m.id}
                              label={m.name}
                              onPress={() => onPressMember(fam, m)}
                            />
                          ))}
                        </View>
                      ) : (
                        <ThemedText
                          style={{ color: "#64748b", fontStyle: "italic" }}
                        >
                          There is no family member in this family.
                        </ThemedText>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}
      </ThemedBottomSheet>
    </ThemedView>
  );
};

export default HouseholdList;

const styles = StyleSheet.create({
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
  kvRow: {},
  kvKey: { color: "#64748b", minWidth: 120 },
  kvVal: {
    fontWeight: "600",
    color: "#0f172a",
    flexShrink: 1,
    textAlign: "right",
  },

  familyCover: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9EDEF",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  memberGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeText: { fontSize: 12, color: "#334155" },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: { fontWeight: "700", flexShrink: 1 },
});
