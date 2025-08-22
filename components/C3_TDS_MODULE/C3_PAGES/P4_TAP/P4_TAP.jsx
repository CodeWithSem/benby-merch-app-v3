import React, { useState, useRef, useEffect } from "react";
import { db } from "../../../../assets/scripts/firebase";
import { set, get, ref, onValue, update } from "firebase/database";
import {
  StyleSheet,
  Image,
  ImageBackground,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  TextInput,
  Animated,
  PanResponder,
  Alert,
} from "react-native";
import { Modal } from "../../../../assets/elements/Modal";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  formate_date,
  convert_string_to_date,
  get_time,
} from "../../../../assets/scripts/functions/format_value";
import {
  tap_implemented_remarks,
  tap_correct_loc_remarks,
  tap_correct_plan_remarks,
} from "./tap_remarks";
import tw from "twrnc";
import BEFORE_IMG_CAMERA from "./CAMERA/BEFORE_IMG_CAMERA";
import AFTER_IMG_CAMERA from "./CAMERA/AFTER_IMG_CAMERA";
import TAP_CAMERA from "./CAMERA/TAP_CAMERA";

const P4_TAP = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const date_now = new Date();
  const GENERAL_USERNAME = user_account_data.b3_Username;
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;
  const GENERAL_CHANNEL = general_selected_mcp.a5_CHANNEL;

  const [tap_completion_status, set_tap_completion_status] = useState(0);
  const [tap_completion_status_manual, set_tap_completion_status_manual] =
    useState(0);
  const [cor_loc_md_open, set_cor_loc_md_open] = useState(false);
  const [cor_plan_md_open, set_cor_plan_md_open] = useState(false);

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
    })
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
        formate_date(current_start_date, "mm/dd/yyyy") || ""
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

  const TBL_TRADE_AUDIT_PATH = "/DB2_BENBY_MERCH_APP/TBL_TRADE_AUDIT/DATA";

  const [show_before_img_camera, set_show_before_img_camera] = useState(false);
  const [show_tap_camera, set_show_tap_camera] = useState(false);
  const [display_modal, set_display_modal] = useState("");
  const [selected_tap, set_selected_tap] = useState({});
  const [selected_brand, set_selected_brand] = useState({
    a1_ID: 0,
    b1_DESC: "Choose Brand",
  });

  // + [Fetch Data] Trade Audit
  const [tap_data, set_tap_data] = useState([]);
  const [raw_tap_data, set_raw_tap_data] = useState([]);
  const [search_query, set_search_query] = useState("");
  const [tap_data_info, set_tap_data_info] = useState({});

  useEffect(() => {
    const db_ref = ref(db, `${TBL_TRADE_AUDIT_PATH}/${GENERAL_STORE_CODE}`);

    const unsubscribe = onValue(
      db_ref,
      (snapshot) => {
        const data = snapshot.val() || {};
        const data_array = Object.values(data);

        set_raw_tap_data(data_array);
        set_tap_data_info({ total_count: data_array.length });
      },
      (error) => {
        console.error("Error fetching execution planner data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered_data = raw_tap_data.filter((item) => {
      const date_now = new Date();
      const month_now = get_filter_month(date_now, "now");
      const past_month = get_filter_month(date_now, "past_3_months");
      const tap_date = get_filter_month(
        convert_string_to_date(item.a7_DurationFrom),
        "now"
      );

      const filter_month =
        tap_date === month_now || past_month.includes(tap_date);

      const search_by_text =
        item.c3_Activity
          ?.toString()
          .toLowerCase()
          .includes(search_query.toLowerCase()) ||
        item.d9_TypeOfActivity
          ?.toString()
          .toLowerCase()
          .includes(search_query.toLowerCase());

      const search_by_brand =
        selected_brand.b1_DESC === "ALL" ||
        selected_brand.b1_DESC === "Choose Brand" ||
        item.a4_Brand?.toString().includes(selected_brand.b1_DESC);

      const convert_date_to_unix = (date_value, type) => {
        const date = new Date(date_value);
        date.setHours(
          type === "start_date" ? 0 : 23,
          type === "start_date" ? 0 : 59,
          type === "start_date" ? 0 : 59,
          type === "start_date" ? 0 : 999
        );
        return Math.floor(date.getTime() / 1000);
      };

      const search_by_date_range = () => {
        if (!start_date || !end_date) return true;

        const dateString = convert_string_to_date(item.a7_DurationFrom?.trim());
        const item_unix = Math.floor(new Date(dateString).getTime() / 1000);

        return (
          item_unix >= convert_date_to_unix(start_date, "start_date") &&
          item_unix <= convert_date_to_unix(end_date, "end_date")
        );
      };

      const matchesEmployeeID = item.c1_EmployeeID === user_account_data.e1_PC;

      return (
        search_by_text &&
        filter_month &&
        search_by_brand &&
        search_by_date_range() &&
        matchesEmployeeID
      );
    });

    set_tap_data(filtered_data);
  }, [search_query, raw_tap_data, start_date, end_date, selected_brand]);

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
  // + [Function] Get TAP Implemented Remarks
  function get_tap_implemented_remarks_by_id(selected_remarks) {
    const remark = tap_implemented_remarks.find(
      (item) => item.a1_ID === selected_remarks
    );
    return remark ? remark.b1_DESC : undefined;
  }

  function get_tap_correct_loc_remarks_by_id(selected_remarks) {
    const remark = tap_correct_loc_remarks.find(
      (item) => item.a1_ID === selected_remarks
    );
    return remark ? remark.b1_DESC : undefined;
  }

  function get_tap_correct_plan_remarks_by_id(selected_remarks) {
    const remark = tap_correct_plan_remarks.find(
      (item) => item.a1_ID === selected_remarks
    );
    return remark ? remark.b1_DESC : undefined;
  }
  // - [Function] Get TAP Implemented Remarks
  // - [Fetch Data] Trade Audit

  // + [Fetch Data] SKU Brand
  const [brand_data, set_brand_data] = useState([]);
  const [raw_brand_data, set_raw_brand_data] = useState([]);
  const [search_brand, set_search_brand] = useState("");

  useEffect(() => {
    const db_ref = ref(db, `/DB1_BENBY_MERCH_APP/TBL_MAINTAINABLE/SKU_BRAND`);

    const unsubscribe = onValue(
      db_ref,
      (snapshot) => {
        const data = snapshot.val() || {};

        // Define the initial item
        const initial_item = {
          a1_ID: 0,
          b1_DESC: "ALL",
        };

        const transformed_data = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        const final_data = [initial_item, ...transformed_data];
        set_raw_brand_data(final_data);
        set_brand_data(final_data); // Set initial state (unfiltered)
      },
      (error) => {
        console.error("Error fetching brand data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered_data = raw_brand_data.filter((item) =>
      item.b1_DESC?.toLowerCase().includes(search_brand.toLowerCase())
    );
    set_brand_data(filtered_data);
  }, [search_brand, raw_brand_data]);
  // - [Fetch Data] SKU Brand
  // + [Fetch Data] TAP Completion Status
  const get_tap_completion_status = () => {
    if (GENERAL_DIVERSION !== "NOT_LISTED") {
      onValue(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        (snapshot) => {
          let data = snapshot.val();
          set_tap_completion_status(data.z4_tap_status || 0);
        }
      );
    }
  };

  const get_tap_completion_status_manual = () => {
    const date_now = new Date();
    const path = `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}`;
    onValue(ref(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          if (
            formate_date(date_now, "mm/dd/yyyy") === data.b4_tap_date_updated
          ) {
            set_tap_completion_status_manual(data.b4_tap_status);
          } else {
            set_tap_completion_status_manual(0);
          }
        } else {
          console.log("NOT EXISTING");
        }
      } else {
        console.log("NOT EXISTING");
        set_tap_completion_status_manual(0);
      }
    });
  };

  useEffect(() => {
    get_tap_completion_status();
    get_tap_completion_status_manual();
  }, []);
  // - [Fetch Data] TAP Completion Status
  // + [Update Data] Before Image Indication
  const update_before_img_ind = async (id) => {
    try {
      await update(
        ref(db, `${TBL_TRADE_AUDIT_PATH}/${GENERAL_STORE_CODE}/${id}`),
        {
          b2_Check_BeforeImg: 1,
        }
      );

      set_show_before_img_camera(false);
      set_show_tap_camera(false);
      reset_mcp_tap_status();
      Alert.alert(
        "Image Save",
        "You have successfully saved the image to your gallery."
      );
    } catch (error) {
      console.error("Error on updating before image:", error);
    }
  };
  // - [Update Data] Before Image Indication
  // + [Update Data] Implemented TAP
  const update_implemented_tap = async (selected_tap) => {
    try {
      await update(
        ref(
          db,
          `${TBL_TRADE_AUDIT_PATH}/${GENERAL_STORE_CODE}/${selected_tap.a1_ID}`
        ),
        {
          b2_Check1: 1,
          e4_Check1Remarks: "",
        }
      );
      update_tap_history_status(selected_tap, "implemented", 1, 0);
      set_show_tap_camera(false);
      reset_mcp_tap_status();
      Alert.alert(
        "Implementation",
        "You have successfully implemented this audit."
      );
    } catch (error) {
      console.error("Error on updating before image:", error);
    }
  };
  const reset_mcp_tap_status = async () => {
    try {
      await update(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        {
          z4_tap_status: 0,
        }
      );

      update_tap_completion_manual("not_done");
    } catch (error) {
      console.error("Error on updating MCP:", error);
    }
  };
  // - [Update Data] Implemented TAP
  // + [Update Data] Implemented TAP Remarks
  const update_tap_remarks = async (tap_data, tap_indication, tap_remarks) => {
    try {
      let tap_remarks_data = {};

      if (tap_indication === "implemented") {
        tap_remarks_data = {
          b2_Check1: 0,
          e4_Check1Remarks: tap_remarks,
        };
      }
      await update(
        ref(
          db,
          `${TBL_TRADE_AUDIT_PATH}/${GENERAL_STORE_CODE}/${tap_data.a1_ID}`
        ),
        tap_remarks_data
      );
      await reset_mcp_tap_status();
      update_tap_completion_manual("not_done");
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  // - [Update Data] Implemented TAP Remarks
  const update_other_tap_status = async (
    tap_data,
    tap_indication,
    tap_status
  ) => {
    function verify_ep_status(status) {
      switch (status) {
        case 0:
          return 1;
        case 1:
          return 0;
      }
    }
    try {
      let trade_audit_indication = {};
      if (tap_indication === "correct_location") {
        trade_audit_indication = {
          b3_Check2: verify_ep_status(tap_status),
          e5_Check2Remarks: 0,
        };
      } else if (tap_indication === "correct_planogram") {
        trade_audit_indication = {
          b4_Check3: verify_ep_status(tap_status),
          e6_Check3Remarks: 0,
        };
      }
      await update(
        ref(
          db,
          `${TBL_TRADE_AUDIT_PATH}/${GENERAL_STORE_CODE}/${tap_data.a1_ID}`
        ),
        trade_audit_indication
      );
      await reset_mcp_tap_status();
      update_tap_completion_manual("not_done");
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  const update_other_tap_remarks = async (
    tap_data,
    tap_indication,
    tap_remarks
  ) => {
    try {
      let trade_audit_indication = {};
      if (tap_indication === "correct_location") {
        trade_audit_indication = {
          b3_Check2: 0,
          e5_Check2Remarks: tap_remarks,
        };
      } else if (tap_indication === "correct_planogram") {
        trade_audit_indication = {
          b4_Check3: 0,
          e6_Check3Remarks: tap_remarks,
        };
      }
      await update(
        ref(
          db,
          `${TBL_TRADE_AUDIT_PATH}/${GENERAL_STORE_CODE}/${tap_data.a1_ID}`
        ),
        trade_audit_indication
      );
      await reset_mcp_tap_status();
      update_tap_completion_manual("not_done");
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  // + [Update Data] Implemented TAP History
  const update_tap_history_status = async (
    tap_data,
    tap_indication,
    status,
    remarks
  ) => {
    const date_now = new Date();
    let tap_history_data = {
      id: tap_data.a1_ID,
      date_updated: formate_date(date_now, "mm/dd/yyyy"),
      tds_code: user_account_data.e1_PC,
      time: get_time(date_now),
      implemented: tap_data.b2_Check1,
      implemented_remarks: tap_data.e4_Check1Remarks || 0,
      correct_location: tap_data.b3_Check2,
      correct_location_remarks: tap_data.e5_Check2Remarks || 0,
      correct_planogram: tap_data.b4_Check3,
      correct_planogram_remarks: tap_data.e6_Check3Remarks || 0,
    };
    try {
      if (tap_indication === "implemented") {
        tap_history_data = {
          ...tap_history_data,
          implemented: status,
          implemented_remarks: remarks,
        };
      } else if (tap_indication === "correct_location") {
        tap_history_data = {
          ...tap_history_data,
          correct_location: status,
          correct_location_remarks: remarks,
        };
      } else if (tap_indication === "correct_planogram") {
        tap_history_data = {
          ...tap_history_data,
          correct_planogram: status,
          correct_planogram_remarks: remarks,
        };
      }

      await set(
        ref(db, `/DB2_BENBY_MERCH_APP/TBL_TAP_HISTORY/DATA/${tap_data.a1_ID}`),
        tap_history_data
      );
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  // - [Update Data] Implemented TAP History
  // + [Update Data] MCP TAP Completion
  const update_tap_completion = async () => {
    try {
      await update(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        {
          z4_tap_status: 1,
        }
      ).catch((error) => {
        alert("Error updating data. Please check your internet.");
        console.log("Error updating data: ", error);
      });
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    } finally {
      set_display_modal("");
    }
  };

  const update_tap_completion_manual = async (progress_remarks) => {
    const date_now = new Date();

    if (progress_remarks === "done") {
      try {
        await update(
          ref(
            db,
            `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}`
          ),
          {
            a1_ID: GENERAL_STORE_CODE,
            b4_tap_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            b4_tap_status: 1,
          }
        );
      } catch (error) {
        console.log("Error updating data: ", error);
      } finally {
        set_display_modal("");
      }
    } else {
      try {
        await update(
          ref(
            db,
            `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}`
          ),
          {
            a1_ID: GENERAL_STORE_CODE,
            b4_tap_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            b4_tap_status: 0,
          }
        );
      } catch (error) {
        console.log("Error updating data: ", error);
      } finally {
        set_display_modal("");
      }
    }
  };
  // - [Update Data] MCP TAP Completion

  const implement_audit_confirm = (selected_tap) => {
    Alert.alert(
      "Confirmation",
      "Are you sure this audit is implemented?",
      [
        {
          text: "YES",
          onPress: () => {
            update_implemented_tap(selected_tap);
          },
        },
        {
          text: "NO",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const is_within_past_months = (dateString) => {
    const dateNow = new Date();
    const pastMonths = get_filter_month(dateNow, "past_3_months");
    const epMonth = get_filter_month(convert_string_to_date(dateString), "now");

    return pastMonths.includes(epMonth);
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
          <TouchableOpacity
            style={tw`w-full flex-row justify-start items-center py-[2] mt-[20]`}
            onPress={() => set_tds_ui_navigation("md")}
          >
            <View style={tw`w-[12] h-[12]`}>
              <Image
                source={require("../../../../assets/images/ui/diser-attendance.png")} // Replace with your image path
                style={tw`h-full w-full`}
                resizeMode="contain"
              />
            </View>
            <Text
              style={tw`ml-[10] text-[4.4] text-[#${
                tds_ui_navigation === "md" ? "028543" : "B9B9B9"
              }] font-bold`}
            >
              DISER DEPLOYMENT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`w-full flex-row justify-start items-center py-[2] mt-[5]`}
            onPress={() => set_tds_ui_navigation("osa")}
          >
            <View style={tw`w-[12] h-[12]`}>
              <Image
                source={require("../../../../assets/images/ui/osa.png")} // Replace with your image path
                style={tw`h-full w-full`}
                resizeMode="contain"
              />
            </View>
            <Text
              style={tw`ml-[10] text-[4.4] text-[#${
                tds_ui_navigation === "osa" ? "028543" : "B9B9B9"
              }] font-bold`}
            >
              ON SHELF AVAILABILITY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`w-full flex-row justify-start items-center py-[2] mt-[5]`}
            onPress={() => set_tds_ui_navigation("tap")}
          >
            <View style={tw`w-[12] h-[12]`}>
              <Image
                source={require("../../../../assets/images/ui/exec-planner.png")}
                style={tw`h-full w-full`}
                resizeMode="contain"
              />
            </View>
            <Text
              style={tw`ml-[10] text-[4.4] text-[#${
                tds_ui_navigation === "tap" ? "028543" : "B9B9B9"
              }] font-bold`}
            >
              TRADE AUDIT & PHOTOS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={tw`w-full flex-row justify-start items-center py-[2] mt-[5]`}
            onPress={() => set_tds_ui_navigation("ep")}
          >
            <View style={tw`w-[12] h-[12]`}>
              <Image
                source={require("../../../../assets/images/ui/exec-planner.png")}
                style={tw`h-full w-full`}
                resizeMode="contain"
              />
            </View>
            <Text
              style={tw`ml-[10] text-[4.4] text-[#${
                tds_ui_navigation === "ep" ? "028543" : "B9B9B9"
              }] font-bold`}
            >
              EXECUTION PLANNER
            </Text>
          </TouchableOpacity>
        </Animated.View>
        {/* - [Navigation] Sidebar */}
        {/* + [UI] Header */}
        <ImageBackground
          source={require("../../../../assets/images/ui/header-bg.png")}
          resizeMode="contain"
          style={[
            tw`h-[26] mt-[-5] w-full flex justify-end items-center absolute`,
            styles.header_bg,
          ]}
        >
          <View
            style={tw`w-full h-[18] flex flex-row justify-center items-center`}
          >
            <TouchableOpacity
              style={tw`flex-1 justify-center items-center h-[15]`}
              onPress={openSidebar}
            >
              <MaterialIcons name="menu" size={32} color={"#FFF"} />
            </TouchableOpacity>
            <View style={tw`flex-4 justify-center items-center h-[15] mt-[2]`}>
              <Text style={tw`text-[4.2] tracking-[0.2] text-[#FFF]`}>
                TRADE AUDIT & PHOTOS
              </Text>
            </View>
            <TouchableOpacity
              style={tw`flex-1 justify-center items-center h-[15]`}
              onPress={() => set_tds_ui_navigation("main_page")}
            >
              <FontAwesome name="home" size={32} color={"#FFF"} />
            </TouchableOpacity>
          </View>
        </ImageBackground>
        {/* - [UI] Header */}
        {/* + [Container] TAP Filter */}
        <View
          style={tw`w-full flex justify-center items-center mt-[118] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
        >
          <View style={tw`w-full h-[14] flex justify-center items-center`}>
            <Text style={tw`text-[4.7] text-[#028543] text-center font-bold`}>
              {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
            </Text>
          </View>
          {/* + [Date Picker] Date Range */}
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
          {/* + [Input] Search TAP */}
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
          {/* - [Input] Search TAP */}
        </View>
        {/* - [Container] TAP Filter */}
        {/* + [Container] TAP List */}
        <View style={tw`w-full flex-1`}>
          <View style={tw`w-full flex-6`}>
            <View style={tw`flex w-full h-full bg-[#F0F2F5]`}>
              <View style={tw`flex-1 justify-start items-center`}>
                <View style={tw`w-full h-full px-[7]`}>
                  {/* FLAT LIST HERE */}
                  <FlatList
                    data={tap_data}
                    style={tw``}
                    renderItem={({ item }) => {
                      return (
                        <View style={tw`flex justify-center px-[15] my-[10]`}>
                          <View
                            style={tw`flex rounded-lg bg-[#FFF] shadow`}
                            key={item.a1_ID}
                          >
                            <View
                              style={tw`flex-1 w-full justify-center items-center px-[7] pt-[7]`}
                            >
                              <View
                                style={tw`flex-0.8 py-[7] px-[10] w-full justify-center items-center bg-[#028543] rounded-md`}
                              >
                                <Text
                                  style={tw`text-[#FFF] text-[4] text-center tracking-[0.1]`}
                                >
                                  {item.c3_Activity}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={tw`flex-1 flex-row w-full justify-start items-start px-[10] mt-[7]`}
                            >
                              <View
                                style={tw`flex-1 h-full justify-center items-start`}
                              >
                                <Text style={tw`text-[2.6]`}>BRAND</Text>
                                <Text style={tw`text-[3.6]`}>
                                  {item.a4_Brand}
                                </Text>
                              </View>
                              <View
                                style={tw`flex-1 h-full justify-center items-start`}
                              >
                                <Text style={tw`text-[2.6]`}>
                                  TYPE OF ACTIVITY
                                </Text>
                                <Text style={tw`text-[3.6]`}>
                                  {item.d9_TypeOfActivity}
                                </Text>
                              </View>
                            </View>
                            <View
                              style={tw`flex-1 flex-row w-full justify-start items-start px-[10] mt-[7]`}
                            >
                              <View
                                style={tw`flex-1 h-full justify-center items-start`}
                              >
                                <Text style={tw`text-[2.6]`}>ID</Text>
                                <Text style={tw`text-[3.6]`}>{item.a1_ID}</Text>
                              </View>
                            </View>
                            <View style={tw`flex-4 px-[10] mt-[24] mb-[14]`}>
                              <View
                                style={tw`flex-1 flex-row justify-center items-start`}
                              >
                                <View
                                  style={tw`flex-1 h-full justify-center items-start`}
                                >
                                  <Text style={tw`text-[2.6]`}>START DATE</Text>
                                  <Text style={tw`text-[3.2]`}>
                                    {item.a7_DurationFrom}
                                  </Text>
                                </View>
                                <View
                                  style={tw`flex-1 h-full justify-center items-start`}
                                >
                                  <Text style={tw`text-[2.6]`}>END DATE</Text>
                                  <Text style={tw`text-[3.2]`}>
                                    {item.a8_DurationTo}
                                  </Text>
                                </View>
                              </View>
                              {/* <View
                                style={tw`flex-1 flex-row justify-center items-start h-[12] mt-[7]`}
                              >
                                <View
                                  style={tw`flex-1 flex-row h-full justify-center items-center`}
                                >
                                  <View
                                    style={tw`flex-0.3 h-full justify-center items-center`}
                                  >
                                    <View
                                      style={tw`border justify-center items-center h-[6] w-[6] bg-[#${
                                        item.b2_Check_BeforeImg === 0
                                          ? "FFF"
                                          : "028543"
                                      }] border-[0.4] border-[#028543]`}
                                    >
                                      <FontAwesome
                                        name="check"
                                        size={16}
                                        color={"#FFF"}
                                      />
                                    </View>
                                  </View>
                                  <View
                                    style={tw`flex-1 h-full justify-center items-start`}
                                  >
                                    <Text style={tw`text-[3.6]`}>
                                      Before Image
                                    </Text>
                                  </View>
                                </View>
                                <View
                                  style={tw`flex-1 h-full justify-center items-center`}
                                >
                                  <TouchableOpacity
                                    style={tw`h-full justify-center items-end`}
                                    onPress={() => {
                                      set_selected_tap(item);
                                      set_show_before_img_camera(true);
                                    }}
                                  >
                                    <FontAwesome
                                      name="camera"
                                      size={28}
                                      color={"#028543"}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View> */}
                              <View
                                style={tw`flex-1 flex-row justify-center items-start h-[12] mt-[7]`}
                              >
                                <View
                                  style={tw`flex-1 flex-row h-full justify-center items-center`}
                                >
                                  <TouchableOpacity
                                    style={tw`flex-0.3 h-full justify-center items-center`}
                                    activeOpacity={1}
                                    onPress={() => {
                                      if (
                                        is_within_past_months(
                                          item.a7_DurationFrom
                                        )
                                      ) {
                                        Alert.alert(
                                          "Invalid",
                                          "This EP is not editable."
                                        );
                                        return;
                                      }
                                      if (item.b2_Check1 === 0) {
                                        // update_implemented_tap(item);
                                        implement_audit_confirm(item);
                                      }
                                      // set_selected_tap(item);
                                      // set_show_tap_camera(true);
                                    }}
                                  >
                                    <View
                                      style={tw`border justify-center items-center h-[6] w-[6] bg-[#${
                                        item.b2_Check1 === 0 ? "FFF" : "028543"
                                      }] border-[0.4] border-[#028543]`}
                                    >
                                      <FontAwesome
                                        name="check"
                                        size={16}
                                        color={"#FFF"}
                                      />
                                    </View>
                                  </TouchableOpacity>
                                  <View
                                    style={tw`flex-1 h-full justify-center items-start`}
                                  >
                                    <Text style={tw`text-[3.6]`}>
                                      Implemented
                                    </Text>
                                  </View>
                                </View>
                                <View
                                  style={tw`flex-1 h-full justify-center items-start`}
                                >
                                  {item.b2_Check1 === 0 ? (
                                    <TouchableOpacity
                                      style={tw`flex flex-row justify-center py-1 bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                                      onPress={() => {
                                        if (
                                          is_within_past_months(
                                            item.a7_DurationFrom
                                          )
                                        ) {
                                          Alert.alert(
                                            "Invalid",
                                            "This Audit is not editable."
                                          );
                                          return;
                                        }
                                        set_selected_tap(item);
                                        set_display_modal("select_imp_remarks");
                                      }}
                                    >
                                      <View
                                        style={tw`flex-5 justify-center pl-[10]`}
                                      >
                                        <Text
                                          style={tw`text-[3.4] tracking-[0.1] text-[#028543]`}
                                        >
                                          {get_tap_implemented_remarks_by_id(
                                            item.e4_Check1Remarks
                                          )}
                                        </Text>
                                      </View>
                                      <View
                                        style={tw`flex flex-1 justify-center items-center`}
                                      >
                                        <Text>
                                          <FontAwesome
                                            name="chevron-down"
                                            size={15}
                                            color={"#028543"}
                                          />
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                              </View>
                              <View
                                style={tw`flex-1 flex-row justify-center items-start h-[12]`}
                              >
                                <View
                                  style={tw`flex-1 flex-row h-full justify-center items-center`}
                                >
                                  <TouchableOpacity
                                    style={tw`flex-0.3 h-full justify-center items-center`}
                                    onPress={() => {
                                      if (item.b2_Check1 === 1) {
                                        update_other_tap_status(
                                          item,
                                          "correct_location",
                                          item.b3_Check2
                                        );
                                        update_tap_history_status(
                                          item,
                                          "correct_location",
                                          1,
                                          0
                                        );
                                      }
                                    }}
                                  >
                                    <View
                                      style={tw`border justify-center items-center h-[6] w-[6] bg-[#${
                                        item.b3_Check2 === 0 ? "FFF" : "028543"
                                      }] border-[0.4] border-[#028543]`}
                                    >
                                      <FontAwesome
                                        name="check"
                                        size={16}
                                        color={"#FFF"}
                                      />
                                    </View>
                                  </TouchableOpacity>
                                  <View
                                    style={tw`flex-1 h-full justify-center items-start`}
                                  >
                                    <Text style={tw`text-[3.6]`}>
                                      Correct Location
                                    </Text>
                                  </View>
                                </View>
                                <View
                                  style={tw`flex-1 h-full justify-center items-start`}
                                >
                                  {item.b3_Check2 === 0 ? (
                                    <TouchableOpacity
                                      style={tw`flex flex-row justify-center py-1 bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                                      onPress={() => {
                                        set_selected_tap(item);
                                        set_display_modal(
                                          "select_cor_loc_remarks"
                                        );
                                        // set_cor_loc_md_open(true);
                                      }}
                                    >
                                      <View
                                        style={tw`flex-5 justify-center pl-[10]`}
                                      >
                                        <Text
                                          style={tw`text-[3.4] tracking-[0.1] text-[#028543]`}
                                        >
                                          {get_tap_correct_loc_remarks_by_id(
                                            item.e5_Check2Remarks
                                          )}
                                        </Text>
                                      </View>
                                      <View
                                        style={tw`flex flex-1 justify-center items-center`}
                                      >
                                        <Text>
                                          <FontAwesome
                                            name="chevron-down"
                                            size={15}
                                            color={"#028543"}
                                          />
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                              </View>
                              <View
                                style={tw`flex-1 flex-row justify-center items-start h-[12]`}
                              >
                                <View
                                  style={tw`flex-1 flex-row h-full justify-center items-center`}
                                >
                                  <TouchableOpacity
                                    style={tw`flex-0.3 h-full justify-center items-center`}
                                    onPress={() => {
                                      if (item.b2_Check1 === 1) {
                                        update_other_tap_status(
                                          item,
                                          "correct_planogram",
                                          item.b4_Check3
                                        );
                                        update_tap_history_status(
                                          item,
                                          "correct_planogram",
                                          1,
                                          0
                                        );
                                      }
                                    }}
                                  >
                                    <View
                                      style={tw`border justify-center items-center h-[6] w-[6] bg-[#${
                                        item.b4_Check3 === 0 ? "FFF" : "028543"
                                      }] border-[0.4] border-[#028543]`}
                                    >
                                      <FontAwesome
                                        name="check"
                                        size={16}
                                        color={"#FFF"}
                                      />
                                    </View>
                                  </TouchableOpacity>
                                  <View
                                    style={tw`flex-1 h-full justify-center items-start`}
                                  >
                                    <Text style={tw`text-[3.6]`}>
                                      Correct Planogram
                                    </Text>
                                  </View>
                                </View>
                                <View
                                  style={tw`flex-1 h-full justify-center items-start`}
                                >
                                  {item.b4_Check3 === 0 ? (
                                    <TouchableOpacity
                                      style={tw`flex flex-row justify-center py-1 bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                                      onPress={() => {
                                        set_selected_tap(item);
                                        set_display_modal(
                                          "select_cor_plan_remarks"
                                        );
                                      }}
                                    >
                                      <View
                                        style={tw`flex-5 justify-center pl-[10]`}
                                      >
                                        <Text
                                          style={tw`text-[3.4] tracking-[0.1] text-[#028543]`}
                                        >
                                          {get_tap_correct_plan_remarks_by_id(
                                            item.e6_Check3Remarks
                                          )}
                                        </Text>
                                      </View>
                                      <View
                                        style={tw`flex flex-1 justify-center items-center`}
                                      >
                                        <Text>
                                          <FontAwesome
                                            name="chevron-down"
                                            size={15}
                                            color={"#028543"}
                                          />
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  ) : null}
                                </View>
                              </View>
                              {/* + [Container] After Image */}
                              <View
                                style={tw`flex-1 flex-row justify-center items-start h-[12]`}
                              >
                                <View
                                  style={tw`flex-1 flex-row h-full justify-center items-center`}
                                >
                                  <View
                                    style={tw`flex-0.3 h-full justify-center items-center`}
                                  >
                                    <View
                                      style={tw`border justify-center items-center h-[6] w-[6] bg-[#${
                                        item.b2_Check_BeforeImg === 0
                                          ? "FFF"
                                          : "028543"
                                      }] border-[0.4] border-[#028543]`}
                                    >
                                      <FontAwesome
                                        name="check"
                                        size={16}
                                        color={"#FFF"}
                                      />
                                    </View>
                                  </View>
                                  <View
                                    style={tw`flex-1 h-full justify-center items-start`}
                                  >
                                    <Text style={tw`text-[3.6]`}>
                                      Before and After
                                    </Text>
                                  </View>
                                </View>
                                <View
                                  style={tw`flex-1 h-full justify-center items-center`}
                                >
                                  <TouchableOpacity
                                    style={tw`h-full justify-center items-end`}
                                    onPress={() => {
                                      set_selected_tap(item);
                                      set_show_tap_camera(true);
                                    }}
                                  >
                                    <FontAwesome
                                      name="camera"
                                      size={28}
                                      color={"#028543"}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              {/* - [Container] After Image */}
                            </View>
                          </View>
                        </View>
                      );
                    }}
                  />
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
              {GENERAL_DIVERSION !== "NOT_LISTED" ? (
                <React.Fragment>
                  {tap_completion_status === 0 ? (
                    <TouchableOpacity
                      style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                      onPress={() => {
                        set_display_modal("save_tap");
                      }}
                    >
                      <Text
                        style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                      >
                        SAVE
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {tap_completion_status === 1 ? (
                    <View
                      style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                    >
                      <FontAwesome name="check" size={32} color={"#fff"} />
                    </View>
                  ) : null}
                </React.Fragment>
              ) : null}

              {/* + MANUAL SELECTION */}
              {GENERAL_DIVERSION === "NOT_LISTED" ? (
                <React.Fragment>
                  {tap_completion_status_manual === 0 ? (
                    <TouchableOpacity
                      style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                      onPress={() => {
                        set_display_modal("save_tap");
                      }}
                    >
                      <Text
                        style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                      >
                        SAVE
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {tap_completion_status_manual === 1 ? (
                    <View
                      style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                    >
                      <FontAwesome name="check" size={32} color={"#fff"} />
                    </View>
                  ) : null}
                </React.Fragment>
              ) : null}
              {/* - MANUAL SELECTION */}
            </View>
          </View>
        </View>
        {/* - [Container] TAP List */}
      </View>
      {/* + [Modal] Brand Selection */}
      <Modal isOpen={display_modal === "select_brand"}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              <Text
                style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Brand Selection
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_display_modal("");
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          <View style={tw`flex w-full flex flex-row px-4 mt-[20]`}>
            <View
              style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
            >
              <TextInput
                value={search_brand}
                placeholder="Search..."
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4]`}
                onChangeText={(text) => set_search_brand(text)}
              ></TextInput>
              <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                <FontAwesome name="search" size={24} color={"#028543"} />
              </View>
            </View>
          </View>
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={brand_data}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      set_selected_brand(item);
                      setTimeout(() => {
                        set_display_modal("");
                      }, 100);
                    }}
                  >
                    <Text style={tw`text-[5] text-[#404040]`}>
                      {item.b1_DESC}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <View style={tw`w-full p-3`}>
            <TouchableOpacity
              style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_display_modal("");
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* - [Modal] Brand Selection */}
      {/* + [Modal] Implemented Remarks Selection */}
      <Modal isOpen={display_modal === "select_imp_remarks"}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              {/* set_selected_brand */}
              <Text
                style={tw`text-[4.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Implemented Remarks Selection
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_display_modal("");
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={tap_implemented_remarks}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      update_tap_remarks(
                        selected_tap,
                        "implemented",
                        item.a1_ID
                      );
                      update_tap_history_status(
                        selected_tap,
                        "implemented",
                        0,
                        item.a1_ID
                      );
                    }}
                  >
                    <Text style={tw`text-[5] text-[#404040]`}>
                      {item.b1_DESC}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <View style={tw`w-full p-3`}>
            <TouchableOpacity
              style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_display_modal("");
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* - [Modal] Implemented Remarks Selection */}
      {/* + [Modal] Correct Loc Remarks Selection */}
      <Modal isOpen={display_modal === "select_cor_loc_remarks"}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              {/* set_selected_brand */}
              <Text
                style={tw`text-[4.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Correct Location Remarks
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_display_modal("");
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={tap_correct_loc_remarks}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      update_other_tap_remarks(
                        selected_tap,
                        "correct_location",
                        item.a1_ID
                      );
                      update_tap_history_status(
                        selected_tap,
                        "correct_location",
                        0,
                        item.a1_ID
                      );
                    }}
                  >
                    <Text style={tw`text-[5] text-[#404040]`}>
                      {item.b1_DESC}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <View style={tw`w-full p-3`}>
            <TouchableOpacity
              style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_display_modal("");
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* - [Modal] Correct Loc Remarks Selection */}
      {/* + [Modal] Correct Plan Remarks Selection */}
      <Modal isOpen={display_modal === "select_cor_plan_remarks"}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              {/* set_selected_brand */}
              <Text
                style={tw`text-[4.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Correct Planogram Remarks
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_display_modal("");
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={tap_correct_plan_remarks}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      update_other_tap_remarks(
                        selected_tap,
                        "correct_planogram",
                        item.a1_ID
                      );
                      update_tap_history_status(
                        selected_tap,
                        "correct_planogram",
                        0,
                        item.a1_ID
                      );
                    }}
                  >
                    <Text style={tw`text-[5] text-[#404040]`}>
                      {item.b1_DESC}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
          <View style={tw`w-full p-3`}>
            <TouchableOpacity
              style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_display_modal("");
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* - [Modal] Correct Plan Remarks Selection */}
      {/* + [Modal] Save Confirmation */}
      <Modal isOpen={display_modal === "save_tap"}>
        <View
          style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
        >
          <View style={tw`w-full justify-center items-center py-[5] mt-[10]`}>
            <View
              style={tw`h-[25] w-[25] rounded-[100] bg-[#028543] justify-center items-center`}
            >
              <FontAwesome5 name="save" size={52} color={"#FFF"} />
            </View>
          </View>

          <View style={tw`w-full justify-center items-center py-[5] my-[10]`}>
            <Text
              style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
            >
              Are you sure you want to save this audit?
            </Text>
          </View>

          <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
              onPress={() => {
                if (GENERAL_DIVERSION === "NOT_LISTED") {
                  update_tap_completion_manual("done");
                } else {
                  update_tap_completion();
                }
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Save
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_display_modal("");
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* - [Modal] Save Confirmatino */}
      {/* + [Date Picker] TAP Date Range */}
      {is_start_date_picker_show && (
        <DateTimePicker
          // testID="dateTimePicker1"
          value={start_date || new Date()}
          mode="date"
          display="default"
          onChange={start_date_on_change}
        />
      )}
      {is_end_date_picker_show && (
        <DateTimePicker
          // testID="dateTimePicker2"
          value={end_date || new Date()}
          mode="date"
          display="default"
          onChange={end_date_on_change}
        />
      )}
      {/* - [Date Picker] TAP Date Range */}

      {show_before_img_camera ? (
        <BEFORE_IMG_CAMERA
          set_show_before_img_camera={set_show_before_img_camera}
          update_before_img_ind={update_before_img_ind}
          selected_tap={selected_tap}
        />
      ) : null}
      {show_tap_camera ? (
        <TAP_CAMERA
          update_before_img_ind={update_before_img_ind}
          selected_tap={selected_tap}
          set_show_tap_camera={set_show_tap_camera}
        />
      ) : null}
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

export default P4_TAP;

// {
//   display === "tap_camera" ? (
//     <TAP_CAMERA
//       tds_ui_navigation={tds_ui_navigation}
//       set_tds_ui_navigation={set_tds_ui_navigation}
//       general_selected_mcp={general_selected_mcp}
//       user_account_data={user_account_data}
//       set_display={set_display}
//     />
//   ) : null;
// }
// {
//   display === "" ? (
//     <React.Fragment>
//       <View style={tw`flex w-full h-full`}>
//         <View style={tw`flex-1 w-full`}></View>
//         <View style={[tw`w-full px-[14] gap-[2]`]}>
//           <TouchableOpacity
//             style={[
//               tw`h-[12] justify-center items-center bg-[#028543] rounded-lg`,
//             ]}
//             onPress={() => set_display("tap_camera")}
//           >
//             <Text
//               style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
//             >
//               TAP CAMERA
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </React.Fragment>
//   ) : null;
// }
