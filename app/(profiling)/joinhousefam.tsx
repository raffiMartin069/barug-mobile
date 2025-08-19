import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedButton from "@/components/ThemedButton";
import ThemedKeyboardAwareScrollView from "@/components/ThemedKeyboardAwareScrollView";
import ThemedSearchableDropdown from "@/components/ThemedSearchableDropdown";
import ThemedText from "@/components/ThemedText";
import ThemedTextInput from "@/components/ThemedTextInput";
import ThemedView from "@/components/ThemedView";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { getRequest } from "@/src/infra/api/get";
import { AuthTokenUtil } from "@/utils/authTokenUtil.ts";
import { AxiosError } from "axios";
import { DevelopmentURL } from "@/constants/devUrls";

type HouseholdData = {
  id: number;
  household_name: string;
  household_head: string;
  household_number: string;
  status: string;
};

const JoinHouseFam = () => {
  // const residents = [
  //   { label: "Juan Dela Cruz", value: "1234" },
  //   { label: "Maria Santos", value: "5678" },
  //   { label: "Juan Dela Cruz", value: "1234" },
  //   { label: "Maria Santos", value: "5678" },
  //   { label: "Juan Dela Cruz", value: "1234" },
  //   { label: "Maria Santos", value: "5678" },
  //   { label: "Juan Dela Cruz", value: "1234" },
  //   { label: "Maria Santos", value: "5678" },
  // ];

  const [res, setRes] = useState();
  const [resYrs, setResYrs] = useState();
  const [household, setHousehold] = useState<HouseholdData[]>([]);
  // const [householdDisplay, setHouseholdDisplay] = 

  useEffect(() => {
    const householdData = fetchHouseholdData(setHousehold);
    householdData();
  }, []);

  // replace residents with household data
  let residents = []
  household.forEach((item) => {
    residents.push({ label: item.household_head, value: item.household_number });
  });

  for(let i = 0; i < residents.length; i++) {
    console.log(`Result: label=${residents[i].label}, value=${residents[i].value}`);
  }
  
  return (
    <ThemedView safe={true}>
      <ThemedAppBar
        title="Join Household & Family Unit"
        showNotif={false}
        showProfile={false}
      />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedSearchableDropdown
            searchplaceholder={"Search Household Number / Household Head"}
            dropdwonplaceholder={"Select your respective household"}
            data={residents}
          />

          <Spacer />

          <ThemedSearchableDropdown
            searchplaceholder={"Search Family Number / Family Head"}
            dropdwonplaceholder={"Select your respective family unit"}
            data={residents}
            order={1}
          />

          <Spacer />

          <ThemedTextInput
            placeholder="Years of Residency"
            value={resYrs}
            onChangeText={setResYrs}
            keyboardType="numeric"
          />
        </View>

        <View>
          <ThemedButton>
            <ThemedText btn={true}>Join</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default JoinHouseFam;

const styles = StyleSheet.create({});
function fetchHouseholdData(setHousehold: React.Dispatch<React.SetStateAction<HouseholdData[]>>) {
  return async () => {
    try {
      // const token = await AuthTokenUtil.getToken();
      // TEST TOKEN, NO NEED TO PANIC!
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyNTcsInVzZXJuYW1lIjoiYXJsZW5lQHlhaG9vLmNvbSIsInJvbGUiOiJQRVJTT04iLCJleHAiOjE3NTU1NzcxNTJ9.6HEJuWzVyUqaRlr1c1aDHCZvmiPfR5ZPeMXd2h_TeDo";
      const data = await getRequest(
        DevelopmentURL.BASE_URL + "/api/v1/residents/households/search/",
        "int",
        token
      );

      // Access the `message` field in the response
      const households = data.message.map((item: any) => ({
        id: item.household_id,
        household_name: item.household_head_name,
        household_head: item.household_head_name,
        household_number: item.household_num,
        status: item.household_status,
      }));

      // Update the state with the processed household data
      setHousehold(households);
    } catch (error) {
      console.error(
        `Message: ${error.response.data.error} Status Code: ${error.response.status}`
      );
    }
  };
}

