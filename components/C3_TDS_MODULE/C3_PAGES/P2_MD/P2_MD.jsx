import React, { useEffect, useState, useRef } from "react";
import { db } from "../../../../assets/scripts/firebase";
import { set, get, ref, onValue, remove, update } from "firebase/database";
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
import {
  sample_deploy_status,
  sample_attn_status,
} from "./dummy-merch-deploy-data";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  formate_date,
  convert_string_to_date,
  format_deploy_status,
  format_attendance_status,
} from "../../../../assets/scripts/functions/format_value";

const P2_MD = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const date_now = new Date();
  const GENERAL_MCP_ID = general_selected_mcp.a1_MCP_ID;
  const GENERAL_SELECTED_STORE = general_selected_mcp.a2_SELECTED_STORE;
  const GENERAL_STORE_CODE = general_selected_mcp.a3_STORE_CODE;
  const GENERAL_DIVERSION = general_selected_mcp.a4_DIVERSION;

  const [merch_deploy_completion_status, set_merch_deploy_completion_status] =
    useState(0);

  const [md_completion_status_manual, set_md_completion_status_manual] =
    useState(0);

  const [is_select_dep_stat_modal_open, set_is_select_dep_stat_modal_open] =
    useState(false);
  const [is_select_attn_stat_modal_open, set_is_select_attn_stat_modal_open] =
    useState(false);
  const [is_save_modal_open, set_is_save_modal_open] = useState(false);

  useEffect(() => {
    get_md_completion_status();
    get_md_completion_status_manual();
  }, []);

  // + [Fetch Data] Schedule Data
  const [schedule_data, set_schedule_data] = useState([]);
  const [search_query, set_search_query] = useState("");
  const [raw_schedule_data, set_raw_schedule_data] = useState([]);
  const [schedule_data_info, set_schedule_data_info] = useState({});

  useEffect(() => {
    const db_ref = ref(
      db,
      `/DB1_BENBY_MERCH_APP/TBL_MERCH_DEPLOYMENT_1/DATA/${GENERAL_STORE_CODE}`
    );

    const unsubscribe = onValue(
      db_ref,
      (snapshot) => {
        const data = snapshot.val() || {};
        const values = Object.values(data);

        set_raw_schedule_data(values);
        set_schedule_data(values);
        set_schedule_data_info({ total_count: values.length });
      },
      (error) => {
        console.error("Error fetching schedule data:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered_data = raw_schedule_data.filter((item) => {
      const search_by_text = item.b1_MerchandiserFullName
        ?.toLowerCase()
        .includes(search_query.toLowerCase());

      const filter_store_code =
        item.a3_Storecode === general_selected_mcp.a3_STORE_CODE;

      return search_by_text && filter_store_code;
    });

    set_schedule_data(filtered_data);
  }, [search_query, raw_schedule_data]);
  // - [Fetch Data] Schedule Data

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

  // + [Update Data] Deployment Status
  const [deploy_status_date, set_deploy_status_date] = useState(null);
  const [is_dep_stat_date_picker_show, set_is_dep_stat_date_picker_show] =
    useState(false);
  const [temp_md_data, set_temp_md_data] = useState({});
  const [temp_md_id, set_temp_md_id] = useState(0);
  const [temp_dep_status_id, set_temp_dep_status_id] = useState(0);

  const deploy_status_date_on_change = (event, selected_date) => {
    const current_deploy_status_date = selected_date || deploy_status_date;
    set_is_dep_stat_date_picker_show(false);
    if (event.type === "set" && selected_date) {
      set_deploy_status_date(current_deploy_status_date);
      update_dep_status(
        temp_md_id,
        temp_dep_status_id,
        current_deploy_status_date
      );
    }
  };

  const update_dep_status = async (id, status, date) => {
    const date_now = new Date();
    try {
      let data_format = {};
      if (status === 1 || status === 4) {
        data_format = {
          c4_DeployStatus: status,
          c5_DeployStatusDate: formate_date(date, "mm/dd/yyyy"),
          z2_DateUpdated: formate_date(date_now, "mm/dd/yyyy"),
        };
      } else if (status === 2 || status === 3) {
        data_format = {
          c4_DeployStatus: status,
          c5_DeployStatusDate: formate_date(date, "mm/dd/yyyy"),
          z2_DateUpdated: formate_date(date_now, "mm/dd/yyyy"),
        };
      }
      await update(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MERCH_DEPLOYMENT_1/DATA/${GENERAL_STORE_CODE}/${id}`
        ),
        data_format
      );

      await update(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        {
          z1_md_status: 0,
        }
      );

      update_md_completion_manual("not_done");
    } catch (error) {
      console.log("Error updating data: ", error);
    } finally {
      update_md_history(temp_md_data);
    }
  };
  // - [Update Data] Deployment Status

  // + [Update Data] Attendance Status
  const update_attn_status = async (id, status) => {
    try {
      await update(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MERCH_DEPLOYMENT_1/DATA/${GENERAL_STORE_CODE}/${id}`
        ),
        { c6_AttnStatus: status }
      ).catch((error) => {
        alert("Error updating data. Please check your internet.");
        console.log("Error updating data: ", error);
      });
    } catch (error) {
      alert("Error updating data. Please check your internet.");
      console.log("Error updating data: ", error);
    } finally {
      update_md_history(temp_md_data);
    }
  };
  // - [Update Data] Attendance Status

  // + [Update Data] MD Completion Status
  const get_md_completion_status = () => {
    if (GENERAL_DIVERSION !== "NOT_LISTED") {
      onValue(
        ref(
          db,
          `DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        (snapshot) => {
          let data = snapshot.val();
          set_merch_deploy_completion_status(data.z1_md_status);
        }
      );
    }
  };
  // - [Update Data] MD Completion Status

  // + [Fetch Data] MD Completion Status (Manual)
  const get_md_completion_status_manual = () => {
    const date_now = new Date();
    const path = `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}/${user_account_data.e1_PC}`;
    onValue(ref(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          if (
            formate_date(date_now, "mm/dd/yyyy") === data.b1_md_date_updated
          ) {
            set_md_completion_status_manual(data.b1_md_status);
          } else {
            set_md_completion_status_manual(0);
          }
        } else {
          console.log("NOT EXISTING");
        }
      } else {
        console.log("NOT EXISTING");
        set_md_completion_status_manual(0);
      }
    });
  };
  // - [Fetch Data] MD Completion Status (Manual)

  // + [Update Data] MD Completion (Manual)
  const update_md_completion_manual = async (progress_remarks) => {
    const date_now = new Date();

    if (progress_remarks === "done") {
      try {
        await update(
          ref(
            db,
            `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}/${user_account_data.e1_PC}`
          ),
          {
            a1_ID: GENERAL_STORE_CODE,
            b1_md_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            b1_md_status: 1,
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
            `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${GENERAL_STORE_CODE}/${user_account_data.e1_PC}`
          ),
          {
            a1_ID: GENERAL_STORE_CODE,
            b1_md_date_updated: formate_date(date_now, "mm/dd/yyyy"),
            b1_md_status: 0,
          }
        );
      } catch (error) {
        console.log("Error updating data: ", error);
      } finally {
        set_is_save_modal_open(false);
      }
    }
  };
  // - [Update Data] MD Completion (Manual)

  // + [Update Data] MD Completion
  const update_md_completion = async () => {
    try {
      await update(
        ref(
          db,
          `DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${GENERAL_MCP_ID}`
        ),
        {
          z1_md_status: 1,
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
  // - [Update Data] MD Completion

  function verify_date_update(md_date, deploy_status) {
    const date_now = new Date();
    const date_value = new Date(convert_string_to_date(md_date || ""));
    if (
      formate_date(date_now, "mm/dd/yyyy") ===
      formate_date(date_value, "mm/dd/yyyy")
    ) {
      return deploy_status;
    } else {
      return 0;
    }
  }

  const update_md_history = async (temp_md_data) => {
    try {
      const response = await get(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MERCH_DEPLOYMENT_1/DATA/${GENERAL_STORE_CODE}/${temp_md_data.a1_ID}`
        )
      );
      let data = response.val();
      function deploy_status_condition(dep_status) {
        if (dep_status === 1) {
          if (data.c6_AttnStatus === 0) {
            return "";
          } else {
            return format_attendance_status(data.c6_AttnStatus);
          }
        } else if (dep_status === 2 || dep_status === 3) {
          return data.c5_DeployStatusDate;
        } else {
          return "";
        }
      }
      const date_now = new Date();
      const formatted_date = formate_date(date_now, "mm/dd/yyyy");
      const date_id = formate_date(date_now, "mm-dd-yyyy");
      const md_history_data = {
        tdsID: user_account_data.e1_PC,
        timeIn: "",
        timeOut: "",
        diserName: data.b1_MerchandiserFullName,
        remarks1: format_deploy_status(data.c4_DeployStatus),
        remarks2: deploy_status_condition(data.c4_DeployStatus),
        remarks3: data.a3_Storecode,
        benbyId: data.a2_BenbyID,
        diserID: data.a7_PlantillaCode,
        datetoday: formatted_date,
      };
      await set(
        ref(
          db,
          `/DB1_BENBY_MERCH_APP/TBL_MD_HISTORY/DATA/${date_id}/${md_history_data.diserID}`
        ),
        md_history_data
      );
    } catch (error) {
      console.log(error);
    }
  };

  // RETURN ORIGIN
  return (
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
            source={require("../../../../assets/images/ui/benby-logo.png")}
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
            <Text style={tw`text-[4.2] text-center tracking-[0.2] text-[#FFF]`}>
              MERCHANDISER{"\n"}DEPLOYMENT
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
        <View style={tw`w-full flex justify-center items-center py-[10]`}>
          <Text
            style={tw`text-[4.7] font-bold tracking-[0.1] text-[#028543] text-center`}
          >
            {GENERAL_STORE_CODE} - {GENERAL_SELECTED_STORE}
          </Text>
        </View>
        {/* + [Input] Search MD */}
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
        {/* - [Input] Search MD */}
      </View>
      <View style={tw`w-full flex-1`}>
        <View style={tw`w-full flex-7`}>
          <View style={tw`flex w-full h-full bg-[#F0F2F5]`}>
            <View style={tw`flex-1 justify-start items-center`}>
              <View style={tw`flex-1 px-[6]`}>
                <FlatList
                  data={schedule_data}
                  style={tw`px-[10]`}
                  renderItem={({ item }) => {
                    function handle_login_stat_color(value) {
                      switch (value) {
                        case 0:
                          return "DE4343";
                        case 1:
                          return "22B600";
                        default:
                          return "";
                      }
                    }

                    function handle_login_stat(value) {
                      switch (value) {
                        case 0:
                          return "OFF DUTY";
                        case 1:
                          return "ON DUTY";
                        default:
                          return "";
                      }
                    }

                    const merch_sched_on_duty = item.b7_DiserSchedule;
                    const merch_sched_off_duty = item.b6_DayOff;

                    const on_duty_sched_array = merch_sched_on_duty.split(",");
                    const off_duty_sched_array =
                      merch_sched_off_duty.split(",");

                    function verify_sched_on_duty(sched) {
                      return on_duty_sched_array.includes(sched);
                    }

                    function verify_sched_off_duty(sched) {
                      return off_duty_sched_array.includes(sched);
                    }

                    function display_on_duty_bg(spec_sched) {
                      if (verify_sched_on_duty(spec_sched)) {
                        return "22B600";
                      } else {
                        if (verify_sched_off_duty(spec_sched)) {
                          return "DE4343";
                        } else {
                          return "929292";
                        }
                      }
                    }

                    function verify_day() {
                      const date_now = new Date();
                      const day_num = date_now.getDay();
                      const days_of_week = [
                        "SUN",
                        "MON",
                        "TUE",
                        "WED",
                        "THU",
                        "FRI",
                        "SAT",
                      ];
                      return days_of_week[day_num];
                    }

                    const days = [
                      { short: "MON", full: "MONDAY" },
                      { short: "TUE", full: "TUESDAY" },
                      { short: "WED", full: "WEDNESDAY" },
                      { short: "THU", full: "THURSDAY" },
                      { short: "FRI", full: "FRIDAY" },
                      { short: "SAT", full: "SATURDAY" },
                      { short: "SUN", full: "SUNDAY" },
                    ];

                    return (
                      <View
                        style={tw`py-[7] px-[12] rounded-lg bg-[#FFF] shadow-md my-[10] mx-[5]`}
                        key={item.a1_ID}
                      >
                        <View
                          style={tw`flex-1.5 w-full justify-start items-start`}
                        >
                          <Text style={tw`text-[4.7] font-bold text-[#028543]`}>
                            {item.b1_MerchandiserFullName}
                          </Text>
                        </View>
                        <View
                          style={tw`flex-1 w-full justify-start items-start`}
                        >
                          <Text style={tw`text-[3.7] text-[#028543]`}>
                            DEPLOYED
                          </Text>
                        </View>
                        <View
                          style={tw`flex-1 py-[5] w-full justify-start items-start`}
                        >
                          <TouchableOpacity
                            style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                            onPress={() => {
                              set_temp_md_data(item);
                              set_temp_md_id(item.a1_ID);
                              set_is_select_dep_stat_modal_open(true);
                            }}
                          >
                            <View style={tw`flex-5 justify-center pl-[20]`}>
                              <Text
                                style={tw`text-[4] tracking-[0.1] text-[#028543]`}
                              >
                                {format_deploy_status(
                                  verify_date_update(
                                    item.z2_DateUpdated,
                                    item.c4_DeployStatus
                                  )
                                )}
                              </Text>
                            </View>
                            <View
                              style={tw`flex-1 justify-center items-center`}
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
                        </View>
                        {verify_date_update(
                          item.z2_DateUpdated,
                          item.c4_DeployStatus
                        ) !== 0 ? (
                          <React.Fragment>
                            {item.c4_DeployStatus === 2 ||
                            item.c4_DeployStatus === 3 ? (
                              <View
                                style={tw`flex-1 py-[5] w-full justify-start items-start`}
                              >
                                <TouchableOpacity
                                  style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                                  onPress={() => {
                                    set_deploy_status_date(
                                      convert_string_to_date(
                                        item.c5_DeployStatusDate
                                      )
                                    );
                                    set_is_dep_stat_date_picker_show(true);
                                  }}
                                >
                                  <View
                                    style={tw`flex justify-center items-center mx-[10]`}
                                  >
                                    <Text>
                                      <FontAwesome
                                        name="calendar"
                                        size={24}
                                        color={"#028543"}
                                      />
                                    </Text>
                                  </View>
                                  <View
                                    style={tw`flex flex-1 justify-center items-start`}
                                  >
                                    <Text
                                      style={tw`text-[4] text-[#028543] tracking-[0.4]`}
                                    >
                                      {item.c5_DeployStatusDate || "mm/dd/yyyy"}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </View>
                            ) : null}
                            {item.c4_DeployStatus === 1 ? (
                              <View
                                style={tw`flex-1 py-[5] w-full justify-start items-start`}
                              >
                                <TouchableOpacity
                                  style={tw`flex flex-row justify-center h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                                  onPress={() => {
                                    set_temp_md_id(item.a1_ID);
                                    set_temp_md_data(item);
                                    set_is_select_attn_stat_modal_open(true);
                                  }}
                                >
                                  <View
                                    style={tw`flex-5 justify-center pl-[20]`}
                                  >
                                    <Text
                                      style={tw`text-[4] tracking-[0.1] text-[#028543]`}
                                    >
                                      {format_attendance_status(
                                        item.c6_AttnStatus
                                      )}
                                    </Text>
                                  </View>
                                  <View
                                    style={tw`flex-1 justify-center items-center`}
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
                              </View>
                            ) : null}
                          </React.Fragment>
                        ) : null}
                        <View style={tw`flex-1 flex-row w-full mt-[10]`}>
                          <View
                            style={tw`flex-1 h-full flex justify-start items-start`}
                          >
                            <Text style={tw`text-[2.8] text-[#7D7D7D]`}>
                              TOTAL HOURS
                            </Text>
                            <Text style={tw`text-[4] font-bold`}>
                              {item.b9_TotalHours}
                            </Text>
                          </View>
                          <View
                            style={tw`flex-1 h-full flex justify-start items-start`}
                          >
                            <Text style={tw`text-[2.8] text-[#7D7D7D]`}>
                              TOTAL DAYS
                            </Text>
                            <Text style={tw`text-[4] font-bold`}>
                              {item.c1_TotalDays}
                            </Text>
                          </View>
                        </View>
                        <View style={tw`flex-1 flex-row w-full mt-[10]`}>
                          <View
                            style={tw`flex-1 h-full flex justify-start items-start`}
                          >
                            <Text style={tw`text-[2.8] text-[#7D7D7D]`}>
                              TIME SCHEDULE
                            </Text>
                            <Text style={tw`text-[4] font-bold`}>
                              {item.c2_TimeIN} - {item.c3_TimeOUT}
                            </Text>
                          </View>
                          <View
                            style={tw`flex-1 h-full flex justify-start items-start`}
                          >
                            <Text style={tw`text-[2.8] text-[#7D7D7D]`}>
                              REAL-TIME STATUS
                            </Text>
                            <View
                              style={tw`flex justify-center items-center bg-[#${handle_login_stat_color(
                                item.z1_LoginStatus
                              )}] w-[20] py-[3]`}
                            >
                              <Text
                                style={tw`text-[2.5] tracking-[0.2] text-[#FFF] font-bold`}
                              >
                                {handle_login_stat(item.z1_LoginStatus)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={tw`flex-1 w-full mt-[10] mb-[5]`}>
                          <Text style={tw`text-[2.8] text-[#7D7D7D]`}>
                            DISER SCHEDULE
                          </Text>
                          <View
                            style={tw`w-full flex-row justify-between items-center p-[2]`}
                          >
                            {days.map(({ short, full }) => {
                              const isToday = verify_day() === short;
                              const borderColor = isToday
                                ? `#${display_on_duty_bg(full)}`
                                : "#FFF";
                              const bgColor = `#${display_on_duty_bg(full)}`;

                              return (
                                <View
                                  key={short}
                                  style={tw`p-[3] justify-center items-center border-[0.4] border-[${borderColor}]`}
                                >
                                  <View
                                    style={tw`w-[9] h-[5] bg-[${bgColor}] justify-center items-center`}
                                  >
                                    <Text style={tw`text-[3] text-[#fff]`}>
                                      {short}
                                    </Text>
                                  </View>
                                </View>
                              );
                            })}
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
        {/* + [Button] Save MD */}
        <View
          style={tw`w-full py-[10] justify-center items-center border-t-[0.7] border-t-[#DBDBDB]`}
        >
          <View
            style={tw`flex flex-row justify-center items-center h-[12] px-[25]`}
          >
            {GENERAL_DIVERSION !== "NOT_LISTED" ? (
              <React.Fragment>
                {merch_deploy_completion_status === 0 ? (
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
                {merch_deploy_completion_status === 1 ? (
                  <View
                    style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                  >
                    <FontAwesome name="check" size={32} color={"#fff"} />
                  </View>
                ) : null}
              </React.Fragment>
            ) : null}

            {GENERAL_DIVERSION === "NOT_LISTED" ? (
              <React.Fragment>
                {md_completion_status_manual === 0 ? (
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
                {md_completion_status_manual === 1 ? (
                  <View
                    style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                  >
                    <FontAwesome name="check" size={32} color={"#fff"} />
                  </View>
                ) : null}
              </React.Fragment>
            ) : null}
          </View>
        </View>
        {/* - [Button] Save MD */}
      </View>
      {/* + [Modal] Deployment Status Selection */}
      <Modal isOpen={is_select_dep_stat_modal_open}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              <Text
                style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Deployment Status Selection
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_is_select_dep_stat_modal_open(false);
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={sample_deploy_status}
              style={tw`px-3`}
              renderItem={({ item }) => {
                const handle_select_deploy_status = (temp_md_id) => {
                  if (item.a1_ID === 1 || item.a1_ID === 4) {
                    update_dep_status(temp_md_id, item.a1_ID, date_now);
                  } else if (item.a1_ID === 2 || item.a1_ID === 3) {
                    set_deploy_status_date(date_now);
                    set_temp_dep_status_id(item.a1_ID);
                    set_is_dep_stat_date_picker_show(true);
                  }
                };

                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      handle_select_deploy_status(temp_md_id);
                      setTimeout(
                        () => set_is_select_dep_stat_modal_open(false),
                        100
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
              onPress={() => set_is_select_dep_stat_modal_open(false)}
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
      {/* - [Modal] Deployment Status Selection */}
      {/* + [Modal] Attendance Remarks Selection */}
      <Modal isOpen={is_select_attn_stat_modal_open}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              <Text
                style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Attendance Remarks Selection
              </Text>
            </View>
            <View style={tw`flex flex-1 justify-center items-center pr-1`}>
              <Pressable
                onPress={() => {
                  set_is_select_attn_stat_modal_open(false);
                }}
              >
                <Ionicons name="close" size={32} color={"#028543"} />
              </Pressable>
            </View>
          </View>
          <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
            <FlatList
              data={sample_attn_status}
              style={tw`px-3`}
              renderItem={({ item }) => {
                const handle_select_attn_status = () => {
                  update_attn_status(temp_md_id, item.a1_ID);
                };
                return (
                  <TouchableOpacity
                    style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                    onPress={() => {
                      handle_select_attn_status();
                      setTimeout(
                        () => set_is_select_attn_stat_modal_open(false),
                        100
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
              onPress={() => set_is_select_attn_stat_modal_open(false)}
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
      {/* - [Modal] Attendance Remarks Selection */}
      {/* + [Date Picker] Deployment Date */}
      {is_dep_stat_date_picker_show && (
        <DateTimePicker
          // testID="dateTimePicker"
          value={deploy_status_date || new Date()}
          mode="date"
          display="default"
          onChange={deploy_status_date_on_change}
        />
      )}
      {/* - [Date Picker] Deployment Date */}
      {/* + [Modal] Save MD Confirmation */}
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
              Are you sure you want to save this MD?
            </Text>
          </View>

          <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
            <TouchableOpacity
              style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
              onPress={() => {
                if (GENERAL_DIVERSION === "NOT_LISTED") {
                  update_md_completion_manual("done");
                } else {
                  update_md_completion();
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
      {/* - [Modal] Save MD Confirmation */}
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

export default P2_MD;
