import React, { Dispatch, useEffect, useState, useRef } from "react";
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
} from "react-native";
import tw from "twrnc";
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
import EP_CAMERA from "./CAMERA/EP_CAMERA";
import {
  ep_implemented_remarks,
  ep_correct_loc_remarks,
  ep_correct_plan_remarks,
} from "./ep_remarks";

const P3_EP = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;

  const [temp_ep_id, set_temp_ep_id] = useState(0);

  const [exec_planner_completion_status, set_exec_planner_completion_status] =
    useState(0);

  const [ep_completion_status_manual, set_ep_completion_status_manual] =
    useState(0);

  const [show_camera_roll, set_show_camera_roll] = useState(false);
  const [is_save_modal_open, set_is_save_modal_open] = useState(false);

  const TBL_EXECUTION_PLANNER_PATH =
    "/DB1_BENBY_MERCH_APP/TBL_EXECUTION_PLANNER_1/DATA";

  // + SKU BRAND VARIABLES
  const [is_select_brand_modal_open, set_is_select_brand_modal_open] =
    useState(false);

  const [selected_ep_data, set_selected_ep_data] = useState({});
  const [imp_md_open, set_imp_md_open] = useState(false);
  const [cor_loc_md_open, set_cor_loc_md_open] = useState(false);
  const [cor_plan_md_open, set_cor_plan_md_open] = useState(false);
  const [imp_confirm_md_open_1, set_imp_confirm_md_open_1] = useState(false);
  const [imp_confirm_md_open_2, set_imp_confirm_md_open_2] = useState(false);
  const [selected_imp_ep, set_selected_imp_ep] = useState({
    activity: "",
    brand: "",
  });
  const [selected_brand, set_selected_brand] = useState({
    a1_ID: 0,
    b1_DESC: "Choose Brand",
  });
  // - SKU BRAND VARIABLES

  // + START DATE VARIABLE
  const [start_date, set_start_date] = useState(null);
  const [start_date_string, set_start_date_string] = useState("");
  const [is_start_date_picker_show, set_is_start_date_picker_show] =
    useState(false);
  // - START DATE VARIABLE

  // + END DATE VARIABLE
  const [end_date, set_end_date] = useState(null);
  const [end_date_string, set_end_date_string] = useState("");
  const [is_end_date_picker_show, set_is_end_date_picker_show] =
    useState(false);
  // - END DATE VARIABLE

  // + [Fetch Data] Execution Planner
  const [exec_planner_data, set_exec_planner_data] = useState([]);
  const [raw_exec_planner_data, set_raw_exec_planner_data] = useState([]);
  const [search_query, set_search_query] = useState("");
  const [exec_planner_data_info, set_exec_planner_data_info] = useState({});

  useEffect(() => {
    const db_ref = ref(
      db,
      `${TBL_EXECUTION_PLANNER_PATH}/${GENERAL_STORE_CODE}`
    );

    const unsubscribe = onValue(
      db_ref,
      (snapshot) => {
        const data = snapshot.val() || {};
        const data_array = Object.values(data);

        set_raw_exec_planner_data(data_array);
        set_exec_planner_data(data_array);
        set_exec_planner_data_info({ total_count: data_array.length });
      },
      (error) => {
        console.error("Error fetching execution planner data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered_data = raw_exec_planner_data.filter((item) => {
      const date_now = new Date();
      const month_now = get_filter_month(date_now, "now");
      const past_month = get_filter_month(date_now, "past_month");
      const ep_date = get_filter_month(
        convert_string_to_date(item.a7_DurationFrom),
        "now"
      );

      const filter_month = ep_date === month_now || ep_date === past_month;

      const search_by_text = item.c3_Activity
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

    set_exec_planner_data(filtered_data);
  }, [
    search_query,
    raw_exec_planner_data,
    start_date,
    end_date,
    selected_brand,
  ]);
  // - [Fetch Data] Execution Planner

  // + SIDEBAR ===================================================
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-300)).current; // Initial position off-screen

  // Open Sidebar
  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(sidebarAnim, {
      toValue: 0,
      duration: 300, // Duration of the animation in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  };

  // Close Sidebar
  const closeSidebar = () => {
    setSidebarOpen(false);
    Animated.timing(sidebarAnim, {
      toValue: -300,
      duration: 300, // Duration of the animation in milliseconds
      useNativeDriver: true, // Use native driver for better performance
    }).start();
  };

  // PanResponder to detect swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dx > 50 && !isSidebarOpen) {
          // Detect swipe to open
          openSidebar();
        } else if (gestureState.dx < -50 && isSidebarOpen) {
          // Detect swipe to close
          closeSidebar();
        }
      },
    })
  ).current;
  // - SIDEBAR ===================================================
  // + UPDATE EP STATUS ==========================================
  const update_exec_planner_status = async (
    ep_data,
    ep_indication,
    ep_current_status
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
      let exec_planner_indication = {};

      if (ep_indication === "implemented") {
        exec_planner_indication = {
          b2_Check1: verify_ep_status(ep_current_status),
          e4_Check1Remarks: "",
        };
      } else if (ep_indication === "correct_location") {
        exec_planner_indication = {
          b3_Check2: verify_ep_status(ep_current_status),
          e5_Check2Remarks: "",
        };
      } else if (ep_indication === "correct_planogram") {
        exec_planner_indication = {
          b4_Check3: verify_ep_status(ep_current_status),
          e6_Check3Remarks: "",
        };
      } else if (ep_indication === "with_picture") {
        exec_planner_indication = {
          b5_Check4: verify_ep_status(ep_current_status),
        };
      }
      await update(
        ref(
          db,
          `${TBL_EXECUTION_PLANNER_PATH}/${GENERAL_STORE_CODE}/${ep_data.a1_ID}`
        ),
        exec_planner_indication
      )
        .then(() => {
          update(
            ref(
              db,
              `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
            ),
            {
              z3_ep_status: 0,
            }
          );
        })
        .catch((error) => {
          alert("Error updating data. Please check your internet.");
          console.log("Error updating data: ", error);
        });
      update_ep_completion_manual("not_done");
      // set_refresh_exec_planner_data(!refresh_exec_planner_data);
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  // - UPDATE EP STATUS ==========================================
  // + UPDATE EP HISTORY STATUS
  const update_ep_history_status = async (
    ep_data,
    ep_indication,
    ep_current_status
  ) => {
    function verify_ep_status(status) {
      switch (status) {
        case 0:
          return 1;
        case 1:
          return 0;
      }
    }

    const date_now = new Date();
    let ep_history_data = {
      a1_ID: ep_data.a1_ID,
      a2_Dateupdated: formate_date(date_now, "mm/dd/yyyy"),
      a3_TDSCode: user_account_data.e1_PC,
      a4_Time: get_time(date_now),
      a5_Implemented: ep_data.b2_Check1,
      a6_CorrectLocation: ep_data.b3_Check2,
      a7_CorrectPlanogram: ep_data.b4_Check3,
      a8_WithPicture: ep_data.b5_Check4,
      b1_ImplementedRemarks: ep_data.e4_Check1Remarks || 0,
      b2_CorrectLocationRemarks: ep_data.e5_Check2Remarks || 0,
      b3_CorrectPlanogramRemarks: ep_data.e6_Check3Remarks || 0,
    };
    try {
      let exec_planner_indication = {};

      if (ep_indication === "implemented") {
        ep_history_data = {
          ...ep_history_data,
          a5_Implemented: verify_ep_status(ep_current_status),
          b1_ImplementedRemarks: 0,
        };
      } else if (ep_indication === "correct_location") {
        ep_history_data = {
          ...ep_history_data,
          a6_CorrectLocation: verify_ep_status(ep_current_status),
          b2_CorrectLocationRemarks: 0,
        };
      } else if (ep_indication === "correct_planogram") {
        ep_history_data = {
          ...ep_history_data,
          a7_CorrectPlanogram: verify_ep_status(ep_current_status),
          b3_CorrectPlanogramRemarks: 0,
        };
      }

      await set(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_EP_HISTORY/DATA/${ep_data.a1_ID}`),
        ep_history_data
      );
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  // - UPDATE EP HISTORY STATUS
  // + UPDATE OSA COMPLETION =====================================

  const get_exec_planner_completion_status = () => {
    if (GENERAL_DIVERSION !== "NOT_LISTED") {
      onValue(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        (snapshot) => {
          let data = snapshot.val();
          set_exec_planner_completion_status(data.z3_ep_status);
        }
      );
    }
  };

  const update_exec_planner_completion = async () => {
    try {
      await update(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        {
          z3_ep_status: 1,
        }
      ).catch((error) => {
        alert("Error updating data. Please check your internet.");
        console.log("Error updating data: ", error);
      });
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    } finally {
      set_is_save_modal_open(false);
    }
  };

  const get_ep_completion_status_manual = () => {
    const date_now = new Date();
    const path = `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}`;
    onValue(ref(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          if (
            formate_date(date_now, "mm/dd/yyyy") === data.b3_ep_date_updated
          ) {
            set_ep_completion_status_manual(data.b3_ep_status);
          } else {
            set_ep_completion_status_manual(0);
          }
        } else {
          console.log("NOT EXISTING");
        }
      } else {
        console.log("NOT EXISTING");
        set_ep_completion_status_manual(0);
      }
    });
  };

  const update_ep_completion_manual = async (progress_remarks) => {
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
            b3_ep_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            b3_ep_status: 1,
          }
        );
      } catch (error) {
        console.log("Error updating data: ", error);
      } finally {
        set_is_save_modal_open(false);
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
            b3_ep_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            b3_ep_status: 0,
          }
        );
      } catch (error) {
        console.log("Error updating data: ", error);
      } finally {
        set_is_save_modal_open(false);
      }
    }
  };

  // - UPDATE OSA COMPLETION =====================================

  // + UPDATE EP REMARKS =========================================
  const update_EP_remarks = async (ep_data, ep_indication, ep_remarks) => {
    try {
      let exec_planner_indication = {};

      if (ep_indication === "implemented") {
        exec_planner_indication = {
          e4_Check1Remarks: ep_remarks,
        };
      } else if (ep_indication === "correct_location") {
        exec_planner_indication = {
          e5_Check2Remarks: ep_remarks,
        };
      } else if (ep_indication === "correct_planogram") {
        exec_planner_indication = {
          e6_Check3Remarks: ep_remarks,
        };
      }
      await update(
        ref(
          db,
          `${TBL_EXECUTION_PLANNER_PATH}/${GENERAL_STORE_CODE}/${ep_data.a1_ID}`
        ),
        exec_planner_indication
      )
        .then(() => {
          update(
            ref(
              db,
              `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA//${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
            ),
            {
              z3_ep_status: 0,
            }
          );
        })
        .catch((error) => {
          alert("Error updating data. Please check your internet.");
          console.log("Error updating data: ", error);
        });
      update_ep_completion_manual("not_done");
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };
  // - UPDATE EP REMARKS =========================================

  // + UPDATE EP HISTORY STATUS
  const update_ep_history_remarks = async (
    ep_data,
    ep_indication,
    ep_remarks
  ) => {
    const date_now = new Date();
    let ep_history_data = {
      a1_ID: ep_data.a1_ID,
      a2_Dateupdated: formate_date(date_now, "mm/dd/yyyy"),
      a3_TDSCode: user_account_data.e1_PC,
      a4_Time: get_time(date_now),
      a5_Implemented: ep_data.b2_Check1,
      a6_CorrectLocation: ep_data.b3_Check2,
      a7_CorrectPlanogram: ep_data.b4_Check3,
      a8_WithPicture: ep_data.b5_Check4,
      b1_ImplementedRemarks: ep_data.e4_Check1Remarks || 0,
      b2_CorrectLocationRemarks: ep_data.e5_Check2Remarks || 0,
      b3_CorrectPlanogramRemarks: ep_data.e6_Check3Remarks || 0,
    };
    try {
      let exec_planner_indication = {};

      if (ep_indication === "implemented") {
        exec_planner_indication = {
          ...ep_history_data,
          b1_ImplementedRemarks: ep_remarks,
        };
      } else if (ep_indication === "correct_location") {
        exec_planner_indication = {
          ...ep_history_data,
          b2_CorrectLocationRemarks: ep_remarks,
        };
      } else if (ep_indication === "correct_planogram") {
        exec_planner_indication = {
          ...ep_history_data,
          b3_CorrectPlanogramRemarks: ep_remarks,
        };
      }

      await set(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_EP_HISTORY/DATA/${ep_data.a1_ID}`),
        exec_planner_indication
      );
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    }
  };

  const update_ep_with_picture_remarks = async (ep_data) => {
    const date_now = new Date();
    let ep_history_data = {
      a1_ID: ep_data.a1_ID,
      a2_Dateupdated: formate_date(date_now, "mm/dd/yyyy"),
      a3_TDSCode: user_account_data.e1_PC,
      a4_Time: get_time(date_now),
      a5_Implemented: ep_data.b2_Check1,
      a6_CorrectLocation: ep_data.b3_Check2,
      a7_CorrectPlanogram: ep_data.b4_Check3,
      a8_WithPicture: 1,
      b1_ImplementedRemarks: ep_data.e4_Check1Remarks || 0,
      b2_CorrectLocationRemarks: ep_data.e5_Check2Remarks || 0,
      b3_CorrectPlanogramRemarks: ep_data.e6_Check3Remarks || 0,
    };

    try {
      await set(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_EP_HISTORY/DATA/${ep_data.a1_ID}`),
        ep_history_data
      );
    } catch (error) {
      console.log("Error in updating EP with picture: " + error);
    }
  };
  // - UPDATE EP HISTORY STATUS

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
  // + GET EP REMARKS ============================================
  const [imp_remarks, set_imp_remarks] = useState([]);
  const [cor_loc_remarks, set_cor_loc_remarks] = useState([]);
  const [cor_plan_remarks, set_cor_plan_remarks] = useState([]);

  const get_ep_remarks = async () => {
    try {
      const response = await get(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_MAINTAINABLE/EP_REMARKS`)
      );
      let data = response.val();

      const transformed_data = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
        }))
        .filter((item) => item !== undefined);

      const implemented_remarks = transformed_data.filter(
        (item) => item.a3_Category === "IMPLEMENTED"
      );
      const correct_location_remarks = transformed_data.filter(
        (item) => item.a3_Category === "CORRECT LOCATION"
      );
      const correct_planogram_remarks = transformed_data.filter(
        (item) => item.a3_Category === "CORRECT PLANOGRAM"
      );

      set_imp_remarks(implemented_remarks);
      set_cor_loc_remarks(correct_location_remarks);
      set_cor_plan_remarks(correct_planogram_remarks);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  // - GET EP REMARKS ============================================
  // + START DATE ON CHANGE ======================================
  const [date_range, set_date_range] = useState({
    start_date: 0,
    end_date: 0,
  });

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
  // - START DATE ON CHANGE ======================================
  // + END DATE ON CHANGE ========================================
  const end_date_on_change = (event, selectedDate) => {
    set_is_end_date_picker_show(false);
    const current_end_date = selectedDate || end_date;
    if (event.type === "set" && selectedDate) {
      set_end_date(current_end_date);
      set_end_date_string(formate_date(current_end_date, "mm/dd/yyyy") || "");
    }
  };
  // - END DATE ON CHANGE ========================================

  useEffect(() => {
    get_exec_planner_completion_status();
    get_ep_completion_status_manual();
    get_ep_remarks();
  }, []);

  // + FILTER CURRENT MONTH AND PAST MONTH
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
    }
  }
  // - FILTER CURRENT MONTH AND PAST MONTH

  const handle_open_camera_roll = (id) => {
    set_temp_ep_id(id);
    set_show_camera_roll(true);
  };

  function get_ep_implemented_remarks_by_id(selected_remarks) {
    const remark = ep_implemented_remarks.find(
      (item) => item.a1_ID === selected_remarks
    );
    return remark ? remark.b1_DESC : undefined;
  }

  function get_ep_correct_loc_remarks_by_id(selected_remarks) {
    const remark = ep_correct_loc_remarks.find(
      (item) => item.a1_ID === selected_remarks
    );
    return remark ? remark.b1_DESC : undefined;
  }

  function get_ep_correct_plan_remarks_by_id(selected_remarks) {
    const remark = ep_correct_plan_remarks.find(
      (item) => item.a1_ID === selected_remarks
    );
    return remark ? remark.b1_DESC : undefined;
  }

  // RETURN ORIGIN
  return (
    <View style={tw`h-full w-full justify-start items-center bg-[#fff]`}>
      {/* + SIDEBAR */}
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
      {/* - SIDEBAR */}
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
              EXECUTION PLANNER
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
      <View
        style={tw`w-full flex justify-center items-center mt-[118] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
      >
        <View style={tw`w-full h-[14] flex justify-center items-center`}>
          <Text style={tw`text-[4.7] text-[#028543] text-center font-bold`}>
            {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
          </Text>
        </View>
        {/* + DATE RANGE */}
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
        {/* - DATE RANGE */}
        {/* + CHOOSE BRAND BUTTON */}
        <View style={tw`w-full h-[13] justify-center items-center`}>
          <TouchableOpacity
            style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
            onPress={() => set_is_select_brand_modal_open(true)}
          >
            <View style={tw`flex-5 justify-center pl-[20]`}>
              <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                {selected_brand.b1_DESC}
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center`}>
              <Text>
                <FontAwesome name="chevron-down" size={15} color={"#028543"} />
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        {/* - CHOOSE BRAND BUTTON */}
        {/* + SEARCH SKU */}
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
        {/* - SEARCH SKU */}
      </View>
      <View style={tw`w-full flex-1`}>
        <View style={tw`w-full flex-6`}>
          <View style={tw`flex w-full h-full bg-[#F0F2F5]`}>
            <View style={tw`flex-1 justify-start items-center`}>
              <View style={tw`w-full h-full px-[7]`}>
                {/* FLAT LIST HERE */}
                <FlatList
                  data={exec_planner_data}
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
                                {/* {item.a1_ID} {item.c3_Activity} */}
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
                                    if (item.b2_Check1 === 0) {
                                      // update_exec_planner_status(
                                      //   item.a1_ID,
                                      //   "implemented",
                                      //   item.b2_Check1
                                      // );
                                      set_selected_imp_ep({
                                        activity: item.c3_Activity,
                                        brand: item.a4_Brand,
                                      });
                                      set_selected_ep_data(item);
                                      set_imp_confirm_md_open_1(true);
                                    }
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
                                      set_selected_ep_data(item);
                                      set_imp_md_open(true);
                                    }}
                                  >
                                    <View
                                      style={tw`flex-5 justify-center pl-[10]`}
                                    >
                                      <Text
                                        style={tw`text-[3.4] tracking-[0.1] text-[#028543]`}
                                      >
                                        {get_ep_implemented_remarks_by_id(
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
                                  activeOpacity={1}
                                  onPress={() => {
                                    if (item.b2_Check1 === 1) {
                                      update_exec_planner_status(
                                        item,
                                        "correct_location",
                                        item.b3_Check2
                                      );
                                      update_ep_history_status(
                                        item,
                                        "correct_location",
                                        item.b3_Check2
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
                                      set_selected_ep_data(item);
                                      set_cor_loc_md_open(true);
                                    }}
                                  >
                                    <View
                                      style={tw`flex-5 justify-center pl-[10]`}
                                    >
                                      <Text
                                        style={tw`text-[3.4] tracking-[0.1] text-[#028543]`}
                                      >
                                        {get_ep_correct_loc_remarks_by_id(
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
                                  activeOpacity={1}
                                  onPress={() => {
                                    if (item.b2_Check1 === 1) {
                                      update_exec_planner_status(
                                        item,
                                        "correct_planogram",
                                        item.b4_Check3
                                      );
                                      update_ep_history_status(
                                        item,
                                        "correct_planogram",
                                        item.b4_Check3
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
                                      set_selected_ep_data(item);
                                      set_cor_plan_md_open(true);
                                    }}
                                  >
                                    <View
                                      style={tw`flex-5 justify-center pl-[10]`}
                                    >
                                      <Text
                                        style={tw`text-[3.4] tracking-[0.1] text-[#028543]`}
                                      >
                                        {get_ep_correct_plan_remarks_by_id(
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
                                      item.b5_Check4 === 0 ? "FFF" : "028543"
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
                                    With Picture
                                  </Text>
                                </View>
                              </View>
                              <View
                                style={tw`flex-1 h-full justify-center items-center`}
                              >
                                <TouchableOpacity
                                  style={tw`h-full justify-center items-end`}
                                  onPress={() => {
                                    set_selected_ep_data(item);
                                    handle_open_camera_roll(item.a1_ID);
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
                {exec_planner_completion_status === 0 ? (
                  <TouchableOpacity
                    style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                    onPress={() => {
                      set_is_save_modal_open(true);
                    }}
                  >
                    <Text
                      style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                    >
                      SAVE
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {exec_planner_completion_status === 1 ? (
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
                {ep_completion_status_manual === 0 ? (
                  <TouchableOpacity
                    style={tw`flex-1 w-full h-full justify-center items-center bg-[#FFF] border-[0.4] border-[#028543] rounded-lg`}
                    onPress={() => {
                      set_is_save_modal_open(true);
                    }}
                  >
                    <Text
                      style={tw`text-[4.2] text-[#028543] font-bold tracking-[0.4] text-center`}
                    >
                      SAVE
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {ep_completion_status_manual === 1 ? (
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
        {/* <View
          style={tw`w-full flex-1 justify-center items-center border-t-[0.7] border-t-[#DBDBDB]`}
        >
          <View
            style={tw`flex flex-row justify-center items-center gap-4 h-[12] mt-[15]`}
          >
            <TouchableOpacity
              style={tw`h-[10] w-[24] flex-row justify-center items-center bg-[${
                current_page === 1 ? "#FFF" : "#028543"
              }] rounded-md`}
              onPress={() => handle_page_change(current_page - 1)}
              disabled={current_page === 1}
            >
              <View style={tw`flex-1 justify-center items-center`}>
                <FontAwesome name="chevron-left" size={18} color={"#FFF"} />
              </View>
              <View style={tw`flex-2 justify-center items-center`}>
                <Text style={tw`text-[4] text-[#FFF] tracking-[0.2] mr-[7]`}>
                  PREV
                </Text>
              </View>
            </TouchableOpacity>
            <View
              style={tw`h-[10] w-[38] justify-center items-center rounded-md`}
            >
              <Text style={tw`text-[4.2] text-[#A3A3A3]`}>
                Page {current_page} - {total_pages}
              </Text>
            </View>
            <TouchableOpacity
              style={tw`h-[10] w-[24] flex-row justify-center items-center bg-[${
                current_page === total_pages ? "#FFF" : "#028543"
              }] rounded-md`}
              onPress={() => handle_page_change(current_page + 1)}
              disabled={current_page === total_pages}
            >
              <View style={tw`flex-2 justify-center items-center`}>
                <Text style={tw`text-[4] text-[#FFF] tracking-[0.2] ml-[5]`}>
                  NEXT
                </Text>
              </View>
              <View style={tw`flex-1 justify-center items-center`}>
                <FontAwesome name="chevron-right" size={18} color={"#FFF"} />
              </View>
            </TouchableOpacity>
          </View>
        </View> */}
      </View>
      {/* + BRAND SELECTION MODAL ============================================================================================ */}
      <Modal isOpen={is_select_brand_modal_open}>
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
                  set_is_select_brand_modal_open(false);
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
                        set_is_select_brand_modal_open(false);
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
                set_is_select_brand_modal_open(false);
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
      {/* - BRAND SELECTION MODAL ============================================================================================ */}
      {/* + IMPLEMENTED REMARKS MODAL ======================================================================================== */}
      <Modal isOpen={imp_md_open}>
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
                  set_imp_md_open(false);
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          {/* <View style={tw`flex w-full flex flex-row px-4 mt-[20]`}>
            <View
              style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
            >
              <TextInput
                placeholder="Search..." 
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4]`}
              ></TextInput>
              <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                <FontAwesome name="search" size={24} color={"#028543"} />
              </View>
            </View>
          </View> */}
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={ep_implemented_remarks}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      update_EP_remarks(
                        selected_ep_data,
                        "implemented",
                        item.a1_ID
                      );
                      update_ep_history_remarks(
                        selected_ep_data,
                        "implemented",
                        item.a1_ID
                      );
                      setTimeout(() => {
                        set_imp_md_open(false);
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
                set_imp_md_open(false);
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
      {/* - IMPLEMENTED REMARKS MODAL ======================================================================================== */}
      {/* + CORRECT LOCATION MODAL =========================================================================================== */}
      <Modal isOpen={cor_loc_md_open}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              <Text
                style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Correct Location
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_cor_loc_md_open(false);
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          {/* <View style={tw`flex w-full flex flex-row px-4 mt-[20]`}>
            <View
              style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
            >
              <TextInput
                placeholder="Search..." 
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4]`}
              ></TextInput>
              <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                <FontAwesome name="search" size={24} color={"#028543"} />
              </View>
            </View>
          </View> */}
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={ep_correct_loc_remarks}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      update_EP_remarks(
                        selected_ep_data,
                        "correct_location",
                        item.a1_ID
                      );
                      update_ep_history_remarks(
                        selected_ep_data,
                        "correct_location",
                        item.a1_ID
                      );
                      setTimeout(() => {
                        set_cor_loc_md_open(false);
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
                set_cor_loc_md_open(false);
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
      {/* - CORRECT LOCATION MODAL =========================================================================================== */}
      {/* + CORRECT PLANOGRAM MODAL ========================================================================================== */}
      <Modal isOpen={cor_plan_md_open}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              <Text
                style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Correct Planogram
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_cor_plan_md_open(false);
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          {/* <View style={tw`flex w-full flex flex-row px-4 mt-[20]`}>
            <View
              style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
            >
              <TextInput
                placeholder="Search..." 
                placeholderTextColor={`gray`}
                style={tw`flex-1 text-[4.4]`}
              ></TextInput>
              <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                <FontAwesome name="search" size={24} color={"#028543"} />
              </View>
            </View>
          </View> */}
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={ep_correct_plan_remarks}
              style={tw`px-3`}
              renderItem={({ item }) => {
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      update_EP_remarks(
                        selected_ep_data,
                        "correct_planogram",
                        item.a1_ID
                      );
                      update_ep_history_remarks(
                        selected_ep_data,
                        "correct_planogram",
                        item.a1_ID
                      );
                      setTimeout(() => {
                        set_cor_plan_md_open(false);
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
                set_cor_plan_md_open(false);
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
      {/* - CORRECT PLANOGRAM MODAL ========================================================================================== */}
      {/* + IMPLEMENT CONFIRMATION MODAL ===================================================================================== */}
      <Modal isOpen={imp_confirm_md_open_1}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] px-[15]`}
          >
            {/* <Text
              style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
            >
              Implementation Confirmation
            </Text> */}
            <View
              style={tw`flex py-[7] px-[10] w-full justify-center items-center bg-[#028543] rounded-md`}
            >
              <Text style={tw`text-[#FFF] text-[4] text-center tracking-[0.1]`}>
                {selected_imp_ep.activity}
              </Text>
            </View>
          </View>
          <View style={tw`mt-[10] justify-center items-center`}>
            <Text style={tw`text-[3.2] text-[#6C757D]`}>BRAND</Text>
          </View>
          <View style={tw`mt-[2] justify-center items-center `}>
            <Text style={tw`text-[5.4] text-[#028543] font-bold`}>
              {selected_imp_ep.brand}
            </Text>
          </View>
          <View style={tw`mt-[20] mb-[15] justify-center items-center`}>
            <Text style={tw`text-[4.7] text-[#6C757D]`}>
              Are you sure this is your brand?
            </Text>
          </View>
          <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
              onPress={() => {
                // update_exec_planner_status(selected_ep_data, "implemented", 0);
                // setTimeout(() => {
                //   set_imp_confirm_md_open_1(false);
                // }, 100);
                set_imp_confirm_md_open_1(false);
                setTimeout(() => {
                  set_imp_confirm_md_open_2(true);
                }, 100);
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_imp_confirm_md_open_1(false);
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ======================================================================================= */}
      <Modal isOpen={imp_confirm_md_open_2}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View style={tw`flex flex-row justify-center items-center mt-[15]`}>
            <Text
              style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
            >
              Implementation Confirmation
            </Text>
          </View>
          <View
            style={tw`pl-3 pr-2 py-5 justify-center items-center text-[#028543]`}
          >
            <Text style={tw`text-[4]`}>
              This Execution Planner has been Implemented?
            </Text>
          </View>
          <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
              onPress={() => {
                update_exec_planner_status(selected_ep_data, "implemented", 0);
                update_ep_history_status(selected_ep_data, "implemented", 0);
                setTimeout(() => {
                  set_imp_confirm_md_open_2(false);
                }, 100);
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Confirm
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
              onPress={() => {
                set_imp_confirm_md_open_2(false);
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* - IMPLEMENT CONFIRMATION MODAL ===================================================================================== */}
      {/* + DATE PICKER (START DATE) ========================================================================================= */}
      {is_start_date_picker_show && (
        <DateTimePicker
          // testID="dateTimePicker1"
          value={start_date || new Date()}
          mode="date"
          display="default"
          onChange={start_date_on_change}
        />
      )}
      {/* - DATE PICKER (START DATE) ========================================================================================= */}
      {/* + DATE PICKER (END DATE) =========================================================================================== */}
      {is_end_date_picker_show && (
        <DateTimePicker
          // testID="dateTimePicker2"
          value={end_date || new Date()}
          mode="date"
          display="default"
          onChange={end_date_on_change}
        />
      )}
      {/* - DATE PICKER (END DATE) ===========================================================================================  */}
      {/* + SAVE MODAL ======================================================================================================= */}
      <Modal isOpen={is_save_modal_open}>
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
              Are you sure you want to save this EP?
            </Text>
          </View>

          <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
              onPress={() => {
                if (GENERAL_DIVERSION === "NOT_LISTED") {
                  update_ep_completion_manual("done");
                } else {
                  update_exec_planner_completion();
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
                set_is_save_modal_open(false);
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
      {/* - SAVE MODAL ======================================================================================================= */}
      {/* + CAMERA MODULE ====================================================================================================  */}
      {show_camera_roll ? (
        <EP_CAMERA
          selected_ep_data={selected_ep_data}
          temp_ep_id={temp_ep_id}
          set_show_camera_roll={set_show_camera_roll}
          store_code={GENERAL_STORE_CODE}
          user_id={user_account_data.e1_PC}
          update_ep_with_picture_remarks={update_ep_with_picture_remarks}
          update_exec_planner_status={update_exec_planner_status}
        />
      ) : null}
      {/* - CAMERA MODULE ====================================================================================================  */}
    </View>
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

export default P3_EP;
