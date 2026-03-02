import React, { useState, useRef, useEffect, useMemo } from "react";
import { db } from "../../../../assets/scripts/firebase";
import { set, get, ref, onValue, update } from "firebase/database";
import {
  StyleSheet,
  Image,
  ImageBackground,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Animated,
  PanResponder,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Modal } from "../../../../assets/elements/Modal";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  formate_date,
  convert_string_to_date,
} from "../../../../assets/scripts/functions/format_value";
import tw from "twrnc";
import Select_Brand from "./modals/Select_Brand";
import Audit_Survey from "./modals/SOS_Input";
import SOS_Input from "./modals/SOS_Input";
// import Update_TR from "./modals/Update_TR";

const P8_SOS = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const GENERAL_USERNAME = user_account_data.b3_Username;
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;
  const GENERAL_CHANNEL = general_selected_mcp.a5_CHANNEL;

  const SKU_BRAND_PATH = "/DB_TEST/TBL_MAINTAINABLE/SKU_BRAND";
  const TBL_SHARE_OF_SHELF_PATH = "/DB_TEST/TBL_SHARE_OF_SHELF/DATA";

  const [selected_tr, set_selected_tr] = useState({});
  const [display_modal, set_display_modal] = useState("");

  // + [Script] Sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    Animated.timing(sidebarAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dx > 50 && !isSidebarOpen) {
          openSidebar();
        } else if (gestureState.dx < -50 && isSidebarOpen) {
          closeSidebar();
        }
      },
    }),
  ).current;
  // - [Script] Sidebar

  // + [Script] Date Range
  const [start_date, set_start_date] = useState(null);
  const [start_date_string, set_start_date_string] = useState("");
  const [is_start_date_picker_show, set_is_start_date_picker_show] =
    useState(false);
  const [end_date, set_end_date] = useState(null);
  const [end_date_string, set_end_date_string] = useState("");
  const [is_end_date_picker_show, set_is_end_date_picker_show] =
    useState(false);

  const start_date_on_change = (event, selectedDate) => {
    set_is_start_date_picker_show(false);
    const current_start_date = selectedDate || start_date;
    if (event.type === "set" && selectedDate) {
      set_start_date(current_start_date);
      set_start_date_string(
        formate_date(current_start_date, "mm/dd/yyyy") || "",
      );
    }
  };
  const end_date_on_change = (event, selectedDate) => {
    set_is_end_date_picker_show(false);
    const current_end_date = selectedDate || end_date;
    if (event.type === "set" && selectedDate) {
      set_end_date(current_end_date);
      set_end_date_string(formate_date(current_end_date, "mm/dd/yyyy") || "");
    }
  };
  // - [Script] Date Range
  const [selected_brand, set_selected_brand] = useState({
    a1_ID: 0,
    b1_DESC: "Choose Brand",
  });

  // + [Fetch Data] Trade Audit
  const [filtered_sos_data, set_filtered_sos_data] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sos_data, set_sos_data] = useState([
    // {
    //   id: "1",
    //   tds_code: "PMEHO01",
    //   store_code: "512173",
    //   date_visit: "02/28/2026",
    //   channel: "NKA",
    //   category: "PUREGOLD",
    //   brand: "NONGSHIM",
    //   facing_count: "0",
    //   remarks: "",
    //   date_upload: "02/26/2026",
    //   upload_by: "110828",
    // },
  ]);

  useEffect(() => {
    const surveyPath = `${TBL_SHARE_OF_SHELF_PATH}/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`;
    const surveyRef = ref(db, surveyPath);
    const unsubscribe = onValue(
      surveyRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const formattedList = Object.keys(data).map((key) => ({
            ...data[key],
            id: key,
          }));

          set_sos_data(formattedList);
        } else {
          set_sos_data([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Firebase Fetch Error: ", error);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [GENERAL_STORE_CODE, GENERAL_USERNAME]);

  const [search_query, set_search_query] = useState("");

  useEffect(() => {
    const filtered_data = sos_data.filter((item) => {
      const date_now = new Date();
      // const month_now = get_filter_month(date_now, "now");
      // const past_month = get_filter_month(date_now, "past_3_months");
      // const tap_date = get_filter_month(
      //   convert_string_to_date(item.duration_from),
      //   "now",
      // );

      // const filter_month =
      //   tap_date === month_now || past_month.includes(tap_date);

      const search_by_text =
        item.category
          ?.toString()
          .toLowerCase()
          .includes(search_query.toLowerCase()) ||
        item.brand
          ?.toString()
          .toLowerCase()
          .includes(search_query.toLowerCase());

      const search_by_brand =
        selected_brand.b1_DESC === "ALL" ||
        selected_brand.b1_DESC === "Choose Brand" ||
        item.brand?.toString().includes(selected_brand.b1_DESC);

      const convert_date_to_unix = (date_value, type) => {
        const date = new Date(date_value);
        date.setHours(
          type === "start_date" ? 0 : 23,
          type === "start_date" ? 0 : 59,
          type === "start_date" ? 0 : 59,
          type === "start_date" ? 0 : 999,
        );
        return Math.floor(date.getTime() / 1000);
      };

      const search_by_date_range = () => {
        if (!start_date || !end_date) return true;

        const dateString = convert_string_to_date(item.date_visit?.trim());
        const item_unix = Math.floor(new Date(dateString).getTime() / 1000);

        return (
          item_unix >= convert_date_to_unix(start_date, "start_date") &&
          item_unix <= convert_date_to_unix(end_date, "end_date")
        );
      };

      // const matchesEmployeeID = item.employee_id === user_account_data.e1_PC;

      return (
        search_by_text &&
        // filter_month &&
        search_by_brand &&
        search_by_date_range()
        // && matchesEmployeeID
      );
    });
    set_filtered_sos_data(filtered_data);
  }, [search_query, sos_data, start_date, end_date, selected_brand]);

  // + [Function] Get Filter Month
  function get_filter_month(date_value, month_condition) {
    const date = new Date(date_value);

    const month_names = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ];
    const current_month_index = date.getMonth();

    if (month_condition === "now") {
      return month_names[current_month_index];
    } else if (month_condition === "past_month") {
      const prev_month_index = (current_month_index - 1 + 12) % 12;
      return month_names[prev_month_index];
    } else if (month_condition === "past_3_months") {
      const months = [];
      for (let i = 1; i <= 2; i++) {
        const index = (current_month_index - i + 12) % 12;
        months.push(month_names[index]);
      }
      return months;
    }
  }
  // - [Function] Get Filter Month

  // 1. Keep the Firebase fetch to get the raw data
  const [raw_brand_data, set_raw_brand_data] = useState([]);
  const [search_brand, set_search_brand] = useState("");

  useEffect(() => {
    const db_ref = ref(db, `${SKU_BRAND_PATH}`);
    const unsubscribe = onValue(
      db_ref,
      (snapshot) => {
        const data = snapshot.val() || {};

        const transformed_data = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        // Add "ALL" option at the start
        set_raw_brand_data([{ a1_ID: 0, b1_DESC: "ALL" }, ...transformed_data]);
      },
      (error) => console.error("Firebase Error:", error),
    );

    return () => unsubscribe();
  }, []);

  // 2. OPTIMIZATION: Use useMemo for filtering instead of a second state + useEffect
  const brand_data = useMemo(() => {
    if (!search_brand) return raw_brand_data;

    const query = search_brand.toLowerCase();
    return raw_brand_data.filter((item) =>
      item.b1_DESC?.toLowerCase().includes(query),
    );
  }, [search_brand, raw_brand_data]);

  const is_within_past_months = (dateString) => {
    const dateNow = new Date();
    const pastMonths = get_filter_month(dateNow, "past_3_months");
    const epMonth = get_filter_month(convert_string_to_date(dateString), "now");

    return pastMonths.includes(epMonth);
  };

  const NavItem = ({ icon, label, navId, currentNav, onPress }) => {
    const isActive = currentNav === navId;

    return (
      <TouchableOpacity
        style={tw`w-full flex-row justify-start items-center py-2 px-4 mb-2 rounded-xl ${
          isActive ? "bg-[#028543] shadow-sm" : "bg-transparent"
        }`}
        onPress={onPress}
      >
        <View style={tw`w-10 h-10 justify-center items-center`}>
          <MaterialCommunityIcons
            name={icon}
            size={26}
            color={isActive ? "#FFFFFF" : "#B9B9B9"}
          />
        </View>
        <Text
          style={tw`ml-4 text-[3.8] font-bold ${
            isActive ? "text-[#FFFFFF]" : "text-[#B9B9B9]"
          }`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={tw`h-full w-full justify-start items-center bg-[#fff]`}>
        {/* + [Navigation] Sidebar */}
        <Animated.View
          style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}
          {...panResponder.panHandlers}
        >
          <View
            style={tw`h-[18] mt-[20] pr-[10] flex-row justify-between items-center`}
          >
            <Image
              source={require("../../../../assets/images/ui/benby-logo.png")} // Replace with your image path
              style={[tw`h-full ml-[10] w-[24]`, { tintColor: "green" }]}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={closeSidebar}>
              <FontAwesome5 name="angle-left" size={42} color={"#028543"} />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.sidebarText, tw`mt-[10] text-[4.2] text-[#028543]`]}
          >
            STORECODE : {GENERAL_STORE_CODE}
          </Text>
          <Text
            style={[styles.sidebarText, tw`mt-[10] text-[4.2] text-[#028543]`]}
          >
            TDS ID : {user_account_data.e1_PC}
          </Text>
          {/* + NAVIGATION BUTTONS */}
          <ScrollView style={tw`mt-8`} showsVerticalScrollIndicator={false}>
            <NavItem
              icon="storefront-outline"
              label="ON-SHELF AVAILABILITY"
              navId="osa"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("osa")}
            />

            <NavItem
              icon="account-group-outline"
              label="MERCH DEPLOYMENT"
              navId="md"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("md")}
            />

            <NavItem
              icon="calendar-text-outline"
              label="EXECUTION PLANNER"
              navId="ep"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("ep")}
            />

            <NavItem
              icon="clipboard-check-outline"
              label="TRADE RENTALS"
              navId="trade_rental"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("trade_rental")}
            />

            <NavItem
              icon="clipboard-check-outline"
              label="AUDIT SURVEY"
              navId="audit_survey"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("audit_survey")}
            />

            <NavItem
              icon="package-variant"
              label="SHARE OF SHELF"
              navId="share_of_shelf"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("share_of_shelf")}
            />

            <NavItem
              icon="cash-multiple"
              label="PRICE SURVEY"
              navId="price_survey"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("price_survey")}
            />

            <NavItem
              icon="truck-delivery-outline"
              label="RETURN TO VENDOR"
              navId="rtv"
              currentNav={tds_ui_navigation}
              onPress={() => set_tds_ui_navigation("rtv")}
            />

            <NavItem
              icon="clipboard-list-outline"
              label="NERM INVENTORY"
              navId="nerm"
              currentNav={tds_ui_navigation}
              onPress={() => alert("Under Development")}
            />
          </ScrollView>
          {/* - NAVIGATION BUTTONS */}
        </Animated.View>
        {/* - [Navigation] Sidebar */}
        {/* + [UI] Header */}
        <View
          style={[
            tw`bg-[#028543] w-full pt-4 pb-4 px-2 absolute top-0 rounded-b-[30px] shadow-lg`,
          ]}
        >
          <View style={tw`w-full flex-row justify-between items-center px-4`}>
            <TouchableOpacity
              style={tw`w-12 h-12 justify-center items-center bg-white/10 rounded-xl`}
              onPress={openSidebar}
            >
              <MaterialIcons name="menu" size={28} color="#FFF" />
            </TouchableOpacity>
            <View style={tw`flex-1 justify-center items-center px-2`}>
              <Text
                style={tw`text-white text-[4] font-black tracking-wide text-center uppercase`}
              >
                SHARE OF SHELF
              </Text>
            </View>

            {/* Right Icon: Home */}
            <TouchableOpacity
              style={tw`w-12 h-12 justify-center items-center bg-white/10 rounded-xl`}
              onPress={() => set_tds_ui_navigation("main_page")}
            >
              <FontAwesome name="home" size={26} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        {/* - [UI] Header */}
        {/* + [Container] SOS Filter */}
        <View
          style={tw`w-full flex justify-center items-center mt-[100] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
        >
          <View style={tw`w-full h-[14] flex justify-center items-center`}>
            <Text style={tw`text-[4.7] text-[#028543] text-center font-bold`}>
              {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
            </Text>
          </View>
          <View
            style={tw`w-full flex-row justify-between gap-[5] items-center mt-[10]`}
          >
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={tw`text-[3.4] text-[#028543]`}>START DATE</Text>
            </View>
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={tw`text-[3.4] text-[#028543]`}>END DATE</Text>
            </View>
          </View>
          <View
            style={tw`w-full h-[13] flex-row justify-between gap-[5] items-center`}
          >
            <View style={tw`flex-1 h-full justify-center items-center`}>
              <TouchableOpacity
                style={tw`flex w-full flex-row justify-around h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                onPress={() => {
                  set_is_start_date_picker_show(true);
                }}
              >
                <View style={tw`flex flex-0.7 justify-center items-center`}>
                  <Text>
                    <FontAwesome name="calendar" size={24} color={"#028543"} />
                  </Text>
                </View>
                <View style={tw`flex flex-2 justify-center items-start`}>
                  <Text style={tw`text-[4] text-[#028543] tracking-[0.3]`}>
                    {start_date_string || "mm/dd/yyyy"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View style={tw`flex-1 h-full justify-center items-center`}>
              <TouchableOpacity
                style={tw`flex w-full flex-row justify-around h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                onPress={() => {
                  set_is_end_date_picker_show(true);
                }}
              >
                <View style={tw`flex flex-0.7 justify-center items-center`}>
                  <Text>
                    <FontAwesome name="calendar" size={24} color={"#028543"} />
                  </Text>
                </View>
                <View style={tw`flex flex-2 justify-center items-start`}>
                  <Text style={tw`text-[4] text-[#028543] tracking-[0.3]`}>
                    {end_date_string || "mm/dd/yyyy"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {/* - [Date Picker] Date Range */}
          {/* + [Selection] Brand */}
          <View style={tw`w-full h-[13] justify-center items-center`}>
            <TouchableOpacity
              style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
              onPress={() => set_display_modal("select_brand")}
            >
              <View style={tw`flex-5 justify-center pl-[20]`}>
                <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                  {selected_brand.b1_DESC}
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center`}>
                <Text>
                  <FontAwesome
                    name="chevron-down"
                    size={15}
                    color={"#028543"}
                  />
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* - [Selection] Brand */}
          {/* + [Input] Search SOS */}
          <View style={tw`w-full h-[13] justify-center items-center mb-[10]`}>
            <View
              style={tw`h-[10] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
            >
              <TextInput
                placeholder="Search..."
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4] p-[0]`}
                onChangeText={(text) => set_search_query(text)}
              ></TextInput>
              <View style={tw`justify-center items-center w-[12] pb-[2]`}>
                <FontAwesome name="search" size={20} color={"#028543"} />
              </View>
            </View>
          </View>
          {/* - [Input] Search SOS */}
        </View>
        {/* - [Container] SOS Filter */}
        {/* + [Container] SOS List */}
        <View style={tw`w-full flex-1`}>
          <View style={tw`w-full flex-6`}>
            <View style={tw`flex w-full h-full bg-[#F0F2F5]`}>
              <View style={tw`flex-1 justify-start items-center`}>
                <View style={tw`w-full h-full px-[7]`}>
                  {isLoading ? (
                    <View style={tw`flex-1 justify-center items-center py-20`}>
                      <ActivityIndicator size="large" color="#028543" />
                      <Text style={tw`mt-4 text-gray-500 font-medium`}>
                        Fetching Data...
                      </Text>
                    </View>
                  ) : (
                    <FlatList
                      data={filtered_sos_data}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={tw`pb-6 pt-2 px-3`}
                      renderItem={({ item }) => {
                        const isCaptured =
                          item.facing_count &&
                          item.facing_count !== "0" &&
                          item.facing_count !== "";

                        return (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              set_selected_tr(item);
                              set_display_modal("sos_entry");
                            }}
                            style={[
                              tw`px-4 my-2.5 bg-white rounded-2xl border p-5`,
                              isCaptured
                                ? tw`border-green-600`
                                : tw`border-gray-300`,
                            ]}
                          >
                            <View>
                              {/* Header Row */}
                              <View
                                style={tw`flex-row justify-between items-start mb-5`}
                              >
                                <View style={tw`flex-1 mr-3`}>
                                  <Text
                                    style={[
                                      tw`font-extrabold text-xl tracking-tighter leading-tight`,
                                      isCaptured
                                        ? tw`text-green-600`
                                        : tw`text-gray-700`,
                                    ]}
                                  >
                                    {item.brand}
                                  </Text>
                                  <Text
                                    style={tw`text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5`}
                                  >
                                    {item.category} • {item.channel}
                                  </Text>
                                </View>

                                <View
                                  style={[
                                    tw`px-2 py-1 rounded border`,
                                    isCaptured
                                      ? tw`bg-green-100 border-green-500`
                                      : tw`bg-gray-100 border-gray-200`,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      tw`text-[10px] font-black`,
                                      isCaptured
                                        ? tw`text-green-700`
                                        : tw`text-gray-600`,
                                    ]}
                                  >
                                    {item.id}
                                  </Text>
                                </View>
                              </View>

                              {/* ASYMMETRIC ALIGNED DATA SECTION */}
                              <View style={tw`flex-row items-start mb-5`}>
                                {/* Left Column: Facing Count (30% width) */}
                                <View style={tw`flex-initial w-24`}>
                                  <Text
                                    style={tw`text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-1`}
                                  >
                                    Facing Count
                                  </Text>
                                  <View
                                    style={tw`flex-row items-center min-h-[32px]`}
                                  >
                                    <Text
                                      style={tw`text-2xl font-black ${isCaptured ? "text-green-600" : "text-gray-900"}`}
                                    >
                                      {item.facing_count}
                                    </Text>
                                  </View>
                                </View>

                                {/* Right Column: Remarks (70% width) */}
                                <View
                                  style={tw`flex-1 pl-4 border-l border-gray-100`}
                                >
                                  <Text
                                    style={tw`text-[10px] text-gray-400 font-bold uppercase tracking-tighter mb-1`}
                                  >
                                    Remarks
                                  </Text>
                                  <View style={tw`justify-center min-h-[32px]`}>
                                    <Text
                                      style={tw`text-sm font-semibold text-gray-700 leading-snug`}
                                      numberOfLines={2}
                                      ellipsizeMode="tail"
                                    >
                                      {item.remarks || (
                                        <Text
                                          style={tw`text-gray-300 italic font-normal`}
                                        >
                                          No remarks added
                                        </Text>
                                      )}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* Bottom Footer */}
                              <View
                                style={tw`flex-row justify-between items-center pt-4 border-t border-gray-50`}
                              >
                                <View style={tw`flex-row items-center`}>
                                  <Text
                                    style={tw`text-[10px] text-gray-400 uppercase`}
                                  >
                                    DATE VISIT:{" "}
                                    <Text
                                      style={tw`text-gray-600 tracking-[1px]`}
                                    >
                                      {item.date_visit}
                                    </Text>
                                  </Text>
                                </View>

                                {isCaptured ? (
                                  <View
                                    style={tw`bg-green-100 px-3 py-1 rounded-md border border-green-500`}
                                  >
                                    <Text
                                      style={tw`text-[10px] font-black text-green-700 uppercase`}
                                    >
                                      Captured
                                    </Text>
                                  </View>
                                ) : (
                                  <View
                                    style={tw`bg-gray-100 px-3 py-1 rounded-md border border-gray-200`}
                                  >
                                    <Text
                                      style={tw`text-[10px] font-black text-gray-500 uppercase`}
                                    >
                                      Pending
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
          <View
            style={tw`w-full py-[10] justify-center items-center border-t-[0.7] border-t-[#DBDBDB]`}
          >
            <View
              style={tw`flex flex-row justify-center items-center h-[12] px-[25]`}
            >
              <TouchableOpacity
                style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                // onPress={() => set_display_modal("save_tap")}
              >
                <Text
                  style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                >
                  SAVE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* - [Container] SOS List */}
      </View>
      {/* + [Date Picker] SOS Date Range */}
      {is_start_date_picker_show && (
        <DateTimePicker
          value={start_date || new Date()}
          mode="date"
          display="default"
          onChange={start_date_on_change}
        />
      )}
      {is_end_date_picker_show && (
        <DateTimePicker
          value={end_date || new Date()}
          mode="date"
          display="default"
          onChange={end_date_on_change}
        />
      )}

      {/* - [Date Picker] SOS Date Range */}
      <Select_Brand
        is_open={display_modal === "select_brand"}
        set_display_modal={set_display_modal}
        search_brand={search_brand}
        set_search_brand={set_search_brand}
        brand_data={brand_data}
        set_selected_brand={set_selected_brand}
      />
      <SOS_Input
        is_open={display_modal === "sos_entry"} // Changed from visible to is_open
        set_display_modal={set_display_modal} // Passing the setter directly to handle closing
        selected_item={selected_tr} // Changed from selectedItem to selected_item
        sos_data={sos_data}
        set_sos_data={set_sos_data}
        user_id={GENERAL_USERNAME}
      />
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  header_bg: {
    width: "100%",
    zIndex: 2,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    backgroundColor: "#FFF",
    padding: 15,
    zIndex: 4,
    borderRightWidth: 2,
    borderColor: "#f1f1f1",
  },
  sidebarText: {
    fontSize: 20,
    color: "white",
  },
  closeButtonText: {
    fontSize: 18,
    color: "red",
    marginTop: 20,
  },
  mainContent: {
    flex: 1,
    padding: 20,
  },
});

export default P8_SOS;
