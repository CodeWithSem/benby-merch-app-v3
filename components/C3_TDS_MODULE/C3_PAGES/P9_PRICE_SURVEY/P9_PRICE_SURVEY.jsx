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
import Price_Surv_Input from "./modals/Price_Surv_Input";
// import Update_TR from "./modals/Update_TR";

const P9_PRICE_SURVEY = ({
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
  const [filtered_price_surv_data, set_filtered_price_surv_data] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [price_surv_data, set_price_surv_data] = useState([
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
    const surveyPath = `DB_TEST/TBL_PRICE_SURVEY/DATA/${GENERAL_USERNAME}/${GENERAL_STORE_CODE}`;
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

          set_price_surv_data(formattedList);
        } else {
          set_price_surv_data([]);
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
    const filtered_data = price_surv_data.filter((item) => {
      const date_now = new Date();
      // const month_now = get_filter_month(date_now, "now");
      // const past_month = get_filter_month(date_now, "past_3_months");
      // const tap_date = get_filter_month(
      //   convert_string_to_date(item.duration_from),
      //   "now",
      // );

      // const filter_month =
      //   tap_date === month_now || past_month.includes(tap_date);

      const search_by_text = item.product_name
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
        search_by_brand
        // && search_by_date_range()
        // && matchesEmployeeID
      );
    });
    set_filtered_price_surv_data(filtered_data);
  }, [search_query, price_surv_data, start_date, end_date, selected_brand]);

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
    const db_ref = ref(db, `/DB1_BENBY_MERCH_APP/TBL_MAINTAINABLE/SKU_BRAND`);
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
                PRICE SURVEY
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
        {/* + [Container] Price Survey Filter */}
        <View
          style={tw`w-full flex justify-center items-center mt-[100] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
        >
          <View style={tw`w-full h-[14] flex justify-center items-center`}>
            <Text style={tw`text-[4.7] text-[#028543] text-center font-bold`}>
              {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
            </Text>
          </View>
          {/* <View
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
          </View> */}
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
          {/* + [Input] Search Price Survey */}
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
          {/* - [Input] Search Price Survey */}
        </View>
        {/* - [Container] Price Survey Filter */}
        {/* + [Container] Price Survey List */}
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
                      data={filtered_price_surv_data}
                      keyExtractor={(item) => item.id.toString()}
                      contentContainerStyle={tw`pb-6 pt-2 px-3`}
                      renderItem={({ item }) => {
                        // A record is "Captured" if SRP and Competitor Price are both filled
                        const isCaptured =
                          item.srp && item.competitor_price && item.srp !== "";

                        return (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              set_selected_tr(item);
                              set_display_modal("price_surv_input");
                            }}
                            style={[
                              tw`my-2.5 bg-white rounded-2xl border p-5`,
                              isCaptured
                                ? tw`border-green-600` // Surveyed State
                                : tw`border-gray-300`, // Pending State
                            ]}
                          >
                            {/* Header: Product Details */}
                            <View
                              style={tw`flex-row justify-between items-start mb-4`}
                            >
                              <View style={tw`flex-1 mr-3`}>
                                <Text
                                  style={[
                                    tw`font-extrabold text-base tracking-tighter leading-tight`,
                                    isCaptured
                                      ? tw`text-green-600`
                                      : tw`text-gray-700`,
                                  ]}
                                >
                                  {item.product_name}
                                </Text>
                                <Text
                                  style={tw`text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5`}
                                >
                                  {item.brand} • {item.pack_size}
                                </Text>
                              </View>

                              {/* ID Badge - No Blue */}
                              <View
                                style={[
                                  tw`px-2 py-1 rounded border`,
                                  isCaptured
                                    ? tw`bg-green-100 border-green-600`
                                    : tw`bg-gray-100 border-gray-200`,
                                ]}
                              >
                                <Text
                                  style={[
                                    tw`text-[10px] font-black`,
                                    isCaptured
                                      ? tw`text-green-700`
                                      : tw`text-gray-500`,
                                  ]}
                                >
                                  {item.id}
                                </Text>
                              </View>
                            </View>

                            {/* Pricing Comparison Grid */}
                            <View
                              style={tw`flex-row items-start mb-4 bg-gray-50 rounded-xl p-3`}
                            >
                              {/* SRP */}
                              <View
                                style={tw`flex-1 items-center border-r border-gray-200`}
                              >
                                <Text
                                  style={tw`text-[9px] text-gray-400 font-bold uppercase mb-1`}
                                >
                                  SRP
                                </Text>
                                <Text
                                  style={tw`text-base font-black text-gray-700`}
                                >
                                  {item.srp ? `${item.srp}` : "—"}
                                </Text>
                              </View>

                              {/* Competitor */}
                              <View
                                style={tw`flex-1 items-center border-r border-gray-200`}
                              >
                                <Text
                                  style={tw`text-[9px] text-gray-400 font-bold uppercase mb-1`}
                                >
                                  Comp. Price
                                </Text>
                                <Text
                                  style={tw`text-base font-black text-gray-700`}
                                >
                                  {item.competitor_price
                                    ? `${item.competitor_price}`
                                    : "—"}
                                </Text>
                              </View>

                              {/* Variance */}
                              <View style={tw`flex-1 items-center`}>
                                <Text
                                  style={tw`text-[9px] text-gray-400 font-bold uppercase mb-1`}
                                >
                                  Diff
                                </Text>
                                <Text
                                  style={[
                                    tw`text-base font-black`,
                                    parseFloat(item.price_diff) > 0
                                      ? tw`text-red-500`
                                      : tw`text-green-600`,
                                  ]}
                                >
                                  {item.price_diff
                                    ? `${item.price_diff}`
                                    : "0.00"}
                                </Text>
                              </View>
                            </View>

                            {/* Footer: Promo & Status */}
                            <View
                              style={tw`flex-row justify-between items-center pt-3 border-t border-gray-50`}
                            >
                              <View>
                                <Text
                                  style={tw`text-[9px] text-gray-400 font-bold uppercase`}
                                >
                                  Promo/Discount
                                </Text>
                                <Text
                                  style={tw`text-xs font-bold text-gray-600`}
                                >
                                  {item.promo_discount || "No active promo"}
                                </Text>
                              </View>

                              <View
                                style={[
                                  tw`px-3 py-1 rounded-md border`,
                                  isCaptured
                                    ? tw`bg-green-100 border-green-600` // Surveyed State
                                    : tw`bg-gray-100 border-gray-200`, // Pending State
                                ]}
                              >
                                <Text
                                  style={[
                                    tw`text-[10px] font-black uppercase`,
                                    isCaptured
                                      ? tw`text-green-700` // Surveyed State
                                      : tw`text-gray-500`, // Pending State
                                  ]}
                                >
                                  {isCaptured ? "Surveyed" : "Pending"}
                                </Text>
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
        {/* - [Container] Price Survey List */}
      </View>
      {/* + [Date Picker] Price Survey Date Range */}
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

      {/* - [Date Picker] Price Survey Date Range */}
      <Select_Brand
        is_open={display_modal === "select_brand"}
        set_display_modal={set_display_modal}
        search_brand={search_brand}
        set_search_brand={set_search_brand}
        brand_data={brand_data}
        set_selected_brand={set_selected_brand}
      />
      <Price_Surv_Input
        is_open={display_modal === "price_surv_input"} // Changed from visible to is_open
        set_display_modal={set_display_modal} // Passing the setter directly to handle closing
        selected_item={selected_tr} // Changed from selectedItem to selected_item
        price_surv_data={price_surv_data}
        set_price_surv_data={set_price_surv_data}
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

export default P9_PRICE_SURVEY;
