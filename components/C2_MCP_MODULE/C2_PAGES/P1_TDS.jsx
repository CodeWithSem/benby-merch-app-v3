import React, { useEffect, useRef, useState } from "react";

import { db } from "../../../assets/scripts/firebase";
import { set, get, ref, onValue } from "firebase/database";

import { Modal } from "../../../assets/elements/Modal";

import tw from "twrnc";

import * as FileSystem from "expo-file-system";

import * as ImageManipulator from "expo-image-manipulator";

import { CameraView, useCameraPermissions } from "expo-camera";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
  format_diser_time_sched,
  formate_date,
  convert_string_to_date,
} from "../../../assets/scripts/functions/format_value";

import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Image,
  Button,
  View,
  Text,
  Switch,
  TextInput,
  TouchableOpacity,
  Pressable,
  FlatList,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

const P1_TDS = ({
  app_version,
  set_ui_navigation,
  user_account_data,
  general_selected_mcp,
  set_general_selected_mcp,
  location,
  current_location,
  get_current_location,
  selected_diver_remarks,
  set_selected_diver_remarks,
  set_general_tds_timelog_link,
  set_general_storetimelog,
}) => {
  const txtcol_primary = "text-[#028543]";
  const fz_performance = "text-[3.4] text-[#404040]";

  const TBL_MCP_PATH = "/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA";

  const current_date = new Date();

  const [is_show_mcp, set_is_show_mcp] = useState(false);
  const [is_today_mcp, set_is_today_mcp] = useState(false);
  const [is_mcp_modal_open, set_is_mcp_modal_open] = useState(false);
  const [selected_diver_store, set_selected_diver_store] = useState({
    a1_ID: 0,
    a2_SELECTED_STORE: "",
    a3_STORE_CODE: "",
    a4_DIVERSION: "",
  });
  const [is_mcp_diver_modal_open, set_is_mcp_diver_modal_open] =
    useState(false);
  const [is_select_chain_modal_open, set_is_select_chain_modal_open] =
    useState(false);
  const [is_select_store_modal_open, set_is_select_store_modal_open] =
    useState(false);
  const [diver_modal_open, set_diver_modal_open] = useState(false);
  const [invalid_remarks, set_invalid_remarks] = useState(false);
  const [is_logout_modal_open, set_is_logout_modal_open] = useState(false);
  const [is_camera_null, set_is_camera_null] = useState(false);
  const [btn_camera_disable, set_btn_camera_disable] = useState(false);

  const [start_date, set_start_date] = useState(null);
  const [start_date_string, set_start_date_string] = useState("");
  const [is_start_date_picker_show, set_is_start_date_picker_show] =
    useState(false);

  const [end_date, set_end_date] = useState(null);
  const [end_date_string, set_end_date_string] = useState("");
  const [is_end_date_picker_show, set_is_end_date_picker_show] =
    useState(false);

  const [is_diversion, set_is_diversion] = useState(false);

  const diver_remarks = [
    {
      a1_ID: 1,
      a2_DESC: "VIP VISIT",
    },
    {
      a1_ID: 2,
      a2_DESC: "MEETING",
    },
    {
      a1_ID: 3,
      a2_DESC: "NO DISER - FOLDERING",
    },
    {
      a1_ID: 4,
      a2_DESC: "NO DISER - REPLENISHMENT",
    },
    {
      a1_ID: 5,
      a2_DESC: "NO DISER - SPECIAL INTRO",
    },
    {
      a1_ID: 6,
      a2_DESC: "DELIVERY ISSUE",
    },
  ];

  // + [Back Handler] Back button
  useEffect(() => {
    const onBackPress = () => {
      // 1. If MCP view is open, close it
      if (is_show_mcp) {
        set_is_show_mcp(false);
        return true;
      }

      const has_selected_store =
        general_selected_mcp.a2_SELECTED_STORE !== "NO STORE SELECTED";
      if (has_selected_store) {
        clear_camera();
        set_show_camera(false);
        set_is_show_mcp(false);
        return true;
      }

      set_is_logout_modal_open(true);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove();
  }, [is_show_mcp, show_camera, general_selected_mcp]);
  // - [Back Handler] Back button

  // + [Fetch Data] MCP List
  const [raw_mcp_data, set_raw_mcp_data] = useState([]);
  const [mcp_data, set_mcp_data] = useState([]);
  const [search_query, set_search_query] = useState("");
  const [refresh_mcp_data, set_refresh_mcp_data] = useState(false);

  useEffect(() => {
    const dbRef = ref(db, `${TBL_MCP_PATH}/${user_account_data.e1_PC}`);
    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        const data_array = data ? Object.values(data) : [];
        set_raw_mcp_data(data_array);
      },
      (error) => {
        console.error("Error fetching MCP data:", error);
        set_raw_mcp_data([]);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = raw_mcp_data.filter((item) => {
      const search_by_text =
        item.a3_SoldCode?.toLowerCase().includes(search_query.toLowerCase()) ||
        item.a4_SoldName?.toLowerCase().includes(search_query.toLowerCase());

      const shouldCheckDateRange = start_date || end_date;

      const search_by_date_range = () => {
        const convert_date_to_unix = (date_value, condition) => {
          const date = new Date(date_value);
          if (condition === "start_date") {
            date.setHours(0, 0, 0, 0);
          } else {
            date.setHours(23, 59, 59, 999);
          }
          return Math.floor(date.getTime() / 1000);
        };

        const dateString = convert_string_to_date(item.a9_PlanVisit?.trim());
        const item_date = new Date(dateString);
        const item_unix = Math.floor(item_date.getTime() / 1000);

        return (
          item_unix >= convert_date_to_unix(start_date, "start_date") &&
          item_unix <= convert_date_to_unix(end_date, "end_date")
        );
      };

      return (
        search_by_text && (shouldCheckDateRange ? search_by_date_range() : true)
      );
    });

    set_mcp_data(filtered);
  }, [raw_mcp_data, search_query, refresh_mcp_data, start_date, end_date]);
  // - [Fetch Data] MCP List

  // + [Fetch Data] Chain List
  const [raw_chain_data, set_raw_chain_data] = useState([]);
  const [chain, set_chain] = useState([]);
  const [search_query_chain, set_search_query_chain] = useState("");
  const [selected_chain, set_selected_chain] = useState("SELECT CHAIN");

  // Fetch chain data once and listen for real-time updates
  useEffect(() => {
    const dbRef = ref(
      db,
      `/DB1_BENBY_MERCH_APP/TBL_TDS_TAGGING/CHAIN_TAGGING/${user_account_data.e1_PC}`
    );

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        const data_array = data ? Object.values(data) : [];
        set_raw_chain_data(data_array);
      },
      (error) => {
        console.error("Error fetching chain data:", error);
        set_raw_chain_data([]);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered_data = raw_chain_data.filter((item) =>
      item.a2_Chain
        ?.toString()
        .toLowerCase()
        .includes(search_query_chain.toLowerCase())
    );
    set_chain(filtered_data);
  }, [search_query_chain, raw_chain_data]);
  // - [Fetch Data] Chain List

  // + [Fetch Data] Store List
  const [raw_store_data, set_raw_store_data] = useState([]);
  const [store, set_store] = useState([]);
  const [search_query_store, set_search_query_store] = useState("");
  const [selected_chain_ID, set_selected_chain_ID] = useState(-1);

  useEffect(() => {
    if (selected_chain_ID === -1) {
      set_raw_store_data([]);
      set_store([]);
      return;
    }

    const dbRef = ref(
      db,
      `/DB1_BENBY_MERCH_APP/TBL_TDS_TAGGING/DATA/${user_account_data.e1_PC}/${selected_chain_ID}`
    );

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        const data = snapshot.val();
        const data_array = data ? Object.values(data) : [];
        set_raw_store_data(data_array);
      },
      (error) => {
        console.error("Error fetching store data:", error);
        set_raw_store_data([]);
      }
    );

    return () => unsubscribe();
  }, [selected_chain_ID]);

  useEffect(() => {
    const filtered = raw_store_data.filter((item) => {
      const search_text = search_query_store.toLowerCase();
      const match_text =
        item.a2_cstName1?.toLowerCase().includes(search_text) ||
        item.a3_cstName2?.toLowerCase().includes(search_text) ||
        item.a2_Storecode?.toLowerCase().includes(search_text);

      const match_chain = selected_chain
        ? item.a4_Chain === selected_chain
        : true;

      return match_text && match_chain;
    });

    set_store(filtered);
  }, [raw_store_data, search_query_store, selected_chain]);
  // - [Fetch Data] Store List

  // + [Process] Geofence Authentication
  const get_distance_in_meters = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371000; // Radius of Earth in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const [show_geofence_loading_modal, set_show_geofence_loading_modal] =
    useState(false);

  const verify_geofence_location = async (data) => {
    set_show_geofence_loading_modal(true);
    try {
      const location = await get_current_location();

      const distance = get_distance_in_meters(
        parseFloat(location.coords.latitude),
        parseFloat(location.coords.longitude),
        14.656336,
        120.956365
      );

      // Home: 14.656336, 120.956365
      // QS Office: 14.660271445309672, 120.95047005883991

      if (distance <= 100) {
        handle_select_mcp(data);
      } else {
        alert("You are outside the allowed location range.");
      }
    } catch (error) {
      console.log(error);
    } finally {
      set_show_geofence_loading_modal(false);
    }
  };
  // - [Process] Geofence Authentication

  // + Handle Selected MCP
  const [selected_mcp, set_selected_mcp] = useState({});
  const handle_select_mcp = (data) => {
    set_selected_diver_remarks({
      a1_ID: 0,
      a2_DESC: "SELECT REMARKS",
    });
    verify_diversion(data);
  };
  // - Handle Selected MCP

  // + [Script] MCP Date Range
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
  // - [Script] MCP Date Range

  useEffect(() => {
    if (is_today_mcp) {
      set_start_date(current_date);
      set_end_date(current_date);
      set_start_date_string(formate_date(current_date, "mm/dd/yyyy"));
      set_end_date_string(formate_date(current_date, "mm/dd/yyyy"));
    } else {
      set_start_date(null);
      set_end_date(null);
      set_start_date_string("mm/dd/yyyy");
      set_end_date_string("mm/dd/yyyy");
    }
  }, [is_today_mcp]);

  useEffect(() => {
    onValue(ref(db, `${TBL_MCP_PATH}/${user_account_data.e1_PC}`), () => {
      set_refresh_mcp_data((prev) => !prev);
    });
  }, []);

  // + [Script] Camera
  const [show_camera, set_show_camera] = useState(false);
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const takePicture = async () => {
    set_btn_camera_disable(true);
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo && photo.uri) {
          const resizedImage = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 1000, height: 1000 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
          );
          const fileInfo = await FileSystem.getInfoAsync(resizedImage.uri);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            const fileSizeInMB = fileInfo.size / (1024 * 1024);
          } else {
            console.error(
              "Resized image file does not exist or is a directory"
            );
          }
          setCapturedImage(resizedImage.uri);
          set_show_camera(false);
        } else {
          console.log("Failed to take picture");
        }
      } catch (error) {
        console.error("Error taking picture: ", error);
      }
    } else {
      console.log("Camera ref is null");
    }
  };

  const clear_camera = () => {
    setCapturedImage("");
    set_is_camera_null(false);
    set_general_selected_mcp({
      a1_MCP_ID: 0,
      a2_SELECTED_STORE: "NO STORE SELECTED",
      a3_STORE_CODE: "",
      a4_DIVERSION: "NORMAL",
    });
    set_selected_diver_remarks({
      a1_ID: 0,
      a2_DESC: "SELECT REMARKS",
    });
  };
  // - [Script] Camera

  // + [Process] Diversion
  const verify_diversion = (data) => {
    const date_now = new Date();
    const formatted_date = formate_date(date_now, "mm/dd/yyyy");
    const [month, day, year] = data.a9_PlanVisit.split("/").map(Number);
    const date_value = new Date(year, month - 1, day);
    const formatted_plan_visit_date = formate_date(date_value, "mm/dd/yyyy");

    if (formatted_date === formatted_plan_visit_date) {
      set_general_selected_mcp({
        a1_MCP_ID: selected_mcp.a1_ID,
        a2_SELECTED_STORE: selected_mcp.a4_SoldName,
        a3_STORE_CODE: selected_mcp.a3_SoldCode,
        a4_DIVERSION: "NORMAL",
      });
      set_is_diversion(false);
      set_selected_mcp(data);
      setTimeout(() => {
        set_is_mcp_modal_open(true);
      }, 100);
    } else {
      set_is_diversion(true);
      set_selected_mcp(data);
      setTimeout(() => {
        set_is_mcp_modal_open(true);
      }, 100);
    }
  };
  // - [Process] Diversion
  // + [Process] Store Timelog
  const add_tds_store_timelog = async () => {
    try {
      const dateNow = new Date();
      const unixTimestamp = Math.floor(dateNow.getTime() / 1000);
      const { longitude, latitude } = location.coords;

      const id = `${unixTimestamp}_${longitude.toString().replace(".", "")}_${latitude.toString().replace(".", "")}`;
      const storeCode = general_selected_mcp.a3_STORE_CODE || "";
      const remarks = selected_diver_remarks.a1_ID || 0;
      const formattedTime = format_diser_time_sched(dateNow);
      const formattedDate = formate_date(dateNow, "mm/dd/yyyy");

      await get_tds_storelog(dateNow);

      const timelogData = {
        a1_ID: id,
        a2_Storecode: storeCode,
        a3_TimeIN: formattedTime,
        a4_TimeOUT: "",
        a5_Datecreated: formattedDate,
        a6_EmployeeID: user_account_data.e1_PC,
        a7_Datetime: formattedTime,
        a8_attachment_file_name: "",
        a9_attachment_content_type: "",
        b1_attachment_file: "",
        b2_Address: `long: ${longitude} lat: ${latitude}`,
        b3_Period: "",
        b4_Week: "",
        b5_Remarks: remarks,
        b6_LongitudeRange: "",
        b7_LatitudeRange: "",
        b8_Latitude: latitude,
        b9_Longitude: longitude,
      };

      await set(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_STORE_TIMELOGS/DATA/${id}`),
        timelogData
      );

      set_general_tds_timelog_link({
        a1_ID: id,
        a2_STORE_CODE: storeCode,
      });
    } catch (error) {
      console.error("Store Timelog Error:", error);
      alert("An error occurred while saving the timelog. Please try again.");
    }
  };

  const get_tds_storelog = async (dateNow) => {
    try {
      const longitude = location.coords.longitude;
      const latitude = location.coords.latitude;
      const storeCode = general_selected_mcp.a3_STORE_CODE || "";
      const remarks = selected_diver_remarks.a1_ID || 0;
      const formattedTime = format_diser_time_sched(dateNow);

      const imageData = await FileSystem.readAsStringAsync(
        capturedImage || "",
        {
          encoding: FileSystem.EncodingType.Base64,
        }
      );

      set_general_storetimelog({
        Storecode: storeCode,
        TimeIn: formattedTime,
        TimeOut: "",
        DateCreated: "",
        EmployeeID: user_account_data.e1_PC,
        Datetime: formattedTime,
        attachment_file_name: capturedImage?.toString(),
        attachment_content_type: "image",
        attachment_file: imageData || "",
        Address: `long: ${longitude} lat: ${latitude}`,
        Period: "",
        Week: "",
        Remarks: remarks.toString(),
        LongitudeRange: "",
        LatitudeRange: "",
        Latitude: latitude.toString(),
        Longitude: longitude.toString(),
      });
    } catch (error) {
      console.error("Get TDS Storelog Error:", error);
      alert("Failed to prepare store timelog data.");
    }
  };
  // - [Process] Store Timelog

  // + Handle Logout
  const handle_logout = () => {
    set_ui_navigation("login_module");
    set_general_selected_mcp({
      a1_MCP_ID: 0,
      a2_SELECTED_STORE: "NO STORE SELECTED",
      a3_STORE_CODE: "",
      a4_DIVERSION: "NORMAL",
    });
  };
  // - Handle Logout

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={tw`w-full h-full bg-[#fff]`}>
        <ImageBackground
          source={require("../../../assets/images/ui/header-bg-welcome.png")}
          resizeMode="contain"
          style={[
            tw`h-[36] mt-[-5] w-full flex justify-end items-center absolute`,
            styles.header_bg,
          ]}
        >
          <View style={tw`absolute right-[4] top-[12]`}>
            <Text style={tw`text-[#FFF] text-[16px]`}>{app_version}</Text>
          </View>
          <View style={tw`w-full mb-[5] flex-row justify-center items-center`}>
            <Text style={[tw`text-[#fff] tracking-[0.2]`]}>WELCOME</Text>
          </View>
          <View style={tw`w-full mb-[5] justify-center items-center px-[40]`}>
            <Text style={tw`text-[5] text-[#fff] font-bold tracking-[0.4]`}>
              {user_account_data.b1_TDS_FullName || ""}
            </Text>
          </View>
          <View style={tw`w-full mb-[10] justify-center items-center`}>
            <Text style={tw`text-[#fff] tracking-[0.2]`}>
              TDS ID : {user_account_data.e1_PC || ""}
            </Text>
          </View>
        </ImageBackground>
        {/* + MCP CONTENT =============================================================================================== */}
        {is_show_mcp ? (
          <React.Fragment>
            <View
              style={tw`w-full flex justify-center items-center mt-[150] px-[20] border-b-[0.7] border-b-[#DBDBDB]`}
            >
              {/* + [Toggle] Today MCP */}
              <View style={tw`flex w-full`}>
                <View style={tw`flex px-[60]`}>
                  <View
                    style={tw`flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] h-[10] rounded-lg`}
                  >
                    <View style={tw`flex-2 pl-4 justify-center`}>
                      <Text
                        style={tw`text-[3.7] tracking-[0.1] text-[#028543]`}
                      >
                        TODAY MCP
                      </Text>
                    </View>
                    <View style={tw`flex-1 justify-center items-center pr-[6]`}>
                      <Switch
                        trackColor={{ true: "#98D49B" }}
                        thumbColor={is_today_mcp ? "#4CB050" : "#f4f3f4"}
                        value={is_today_mcp}
                        onValueChange={() =>
                          set_is_today_mcp((prev_state) => !prev_state)
                        }
                      />
                    </View>
                  </View>
                </View>
              </View>
              {/* - [Toggle] Today MCP */}
              {/* + [Date Picker] MCP Date Range */}
              <View style={tw`flex w-full`}>
                <View style={tw`flex flex-row mt-3 mb-1`}>
                  <View style={tw`flex-1 justify-end items-center pr-2`}>
                    <Text style={tw`text-[#7E7E7E]`}>Start Date</Text>
                  </View>
                  <View style={tw`flex-1 justify-end items-center pl-2`}>
                    <Text style={tw`text-[#7E7E7E]`}>End Date</Text>
                  </View>
                </View>
                <View style={tw`flex flex-row gap-4`}>
                  <View style={tw`flex-1 items-center`}>
                    <TouchableOpacity
                      style={[
                        tw`flex w-full flex-row justify-around h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543] ${
                          is_today_mcp ? "opacity-50" : ""
                        } `,
                      ]}
                      disabled={is_today_mcp ? true : false}
                      onPress={() => {
                        set_is_start_date_picker_show(true);
                      }}
                    >
                      <View style={tw`flex flex-1 justify-center items-center`}>
                        <Text>
                          <FontAwesome
                            name="calendar"
                            size={24}
                            color={"#028543"}
                          />
                        </Text>
                      </View>
                      <View style={tw`flex flex-3 justify-center items-start`}>
                        <Text
                          style={tw`text-[4] text-[#028543] tracking-[0.3]`}
                        >
                          {start_date_string || "mm/dd/yyyy"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={tw`flex-1 items-center`}>
                    <TouchableOpacity
                      style={tw`flex w-full flex-row justify-around h-[10] bg-[#fff] rounded-lg border-[0.5] border-[#028543] ${
                        is_today_mcp ? "opacity-50" : ""
                      }`}
                      disabled={is_today_mcp ? true : false}
                      onPress={() => {
                        set_is_end_date_picker_show(true);
                      }}
                    >
                      <View style={tw`flex flex-1 justify-center items-center`}>
                        <Text>
                          <FontAwesome
                            name="calendar"
                            size={24}
                            color={"#028543"}
                          />
                        </Text>
                      </View>
                      <View style={tw`flex flex-3 justify-center items-start`}>
                        <Text
                          style={tw`text-[4] text-[#028543] tracking-[0.3]`}
                        >
                          {end_date_string || "mm/dd/yyyy"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {/* - [Date Picker] MCP Date Range */}
              {/* + [Input] Search MCP */}
              <View style={tw`flex w-full`}>
                <View
                  style={tw`h-[10] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full mt-3 mb-4`}
                >
                  <TextInput
                    value={search_query}
                    placeholder="Search..."
                    placeholderTextColor={`gray`}
                    style={tw`flex-1 text-[4.4] p-[0]`}
                    onChangeText={(text) => set_search_query(text)}
                  ></TextInput>
                  <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                    <FontAwesome name="search" size={20} color={"#028543"} />
                  </View>
                </View>
              </View>
              {/* - [Input] Search MCP */}
            </View>
            <View style={tw`w-full flex-1`}>
              <View style={tw`w-full flex-6`}>
                <View style={tw`flex w-full h-full bg-[#F0F2F5]`}>
                  <View style={tw`flex-1 justify-start items-center`}>
                    <View style={tw`w-full h-full px-[7]`}>
                      {/* FLAT LIST HERE */}
                      <FlatList
                        data={mcp_data}
                        style={tw``}
                        renderItem={({ item }) => {
                          const is_fully_complete =
                            item.z1_md_status === 1 &&
                            item.z2_osa_status === 1 &&
                            item.z3_ep_status === 1;

                          const is_partly_complete =
                            item.z1_md_status === 1 ||
                            item.z2_osa_status === 1 ||
                            item.z3_ep_status === 1;

                          const is_not_complete =
                            item.z1_md_status === 0 &&
                            item.z2_osa_status === 0 &&
                            item.z3_ep_status === 0;

                          function v_status_color() {
                            if (is_partly_complete) {
                              if (is_fully_complete) {
                                return "#29C02F";
                              } else {
                                return "#FF7A00";
                              }
                            } else if (is_not_complete) {
                              return "#D72A2A";
                            } else {
                              return "#000";
                            }
                          }

                          function v_status_bg() {
                            if (is_partly_complete) {
                              if (is_fully_complete) {
                                return "#E4FFE6";
                              } else {
                                return "#FFE7D0";
                              }
                            } else if (is_not_complete) {
                              return "#FFE4E4";
                            } else {
                              return "#000";
                            }
                          }

                          function text_status() {
                            if (is_partly_complete) {
                              if (is_fully_complete) {
                                return "Visited";
                              } else {
                                return "Partial";
                              }
                            } else if (is_not_complete) {
                              return "Not Visited";
                            } else {
                              return "#000";
                            }
                          }
                          return (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={tw`flex flex-row rounded-lg bg-[${v_status_bg()}] py-[5] pr-[10] my-[10] ml-[4] mr-[13]`}
                              onPress={() => verify_geofence_location(item)}
                            >
                              <View
                                style={tw`flex-0.47 justify-center items-center`}
                              >
                                {is_fully_complete ? (
                                  <View
                                    style={[
                                      tw`h-[12] w-[12] bg-[#29C02F] justify-center items-center`,
                                      { borderRadius: 1000 },
                                    ]}
                                  >
                                    <FontAwesome
                                      name="check"
                                      size={24}
                                      color={"#fff"}
                                    />
                                  </View>
                                ) : is_partly_complete ? (
                                  <View
                                    style={[
                                      tw`h-[12] w-[12] bg-[#FF7A00] justify-center items-center`,
                                      { borderRadius: 1000 },
                                    ]}
                                  >
                                    <FontAwesome
                                      name="check"
                                      size={24}
                                      color={"#fff"}
                                    />
                                  </View>
                                ) : null}

                                {is_not_complete ? (
                                  <View
                                    style={[
                                      tw`h-[12] w-[12] bg-[#D72A2A] justify-center items-center`,
                                      { borderRadius: 1000 },
                                    ]}
                                  >
                                    <FontAwesome
                                      name="close"
                                      size={24}
                                      color={"#fff"}
                                    />
                                  </View>
                                ) : null}
                              </View>
                              <View style={tw`flex-1`}>
                                <View
                                  style={tw`flex-1 justify-start items-start py-[5] pl-[2]`}
                                >
                                  <Text
                                    style={tw`text-[4] text-[${v_status_color()}] tracking-[0.1] font-bold`}
                                  >
                                    {item.a4_SoldName}
                                  </Text>
                                </View>
                                <View style={tw`flex-1 flex-row py-[5]`}>
                                  <View style={tw`flex-1 flex-row`}>
                                    <View
                                      style={tw`flex-1 justify-center items-center`}
                                    >
                                      <FontAwesome6
                                        name={"store"}
                                        size={18}
                                        color={`${v_status_color()}`}
                                      />
                                    </View>
                                    <View
                                      style={tw`flex-4 justify-center pl-1`}
                                    >
                                      <Text
                                        style={tw`text-[3] text-[#7E7E7E] tracking-wider`}
                                      >
                                        {item.a3_SoldCode}
                                      </Text>
                                    </View>
                                  </View>
                                  <View style={tw`flex-1 flex-row`}>
                                    <View
                                      style={tw`flex-1 justify-center items-center`}
                                    >
                                      <FontAwesome6
                                        name={"location-dot"}
                                        size={18}
                                        color={`${v_status_color()}`}
                                      />
                                    </View>
                                    <View
                                      style={tw`flex-4 justify-center pl-1`}
                                    >
                                      <Text
                                        style={tw`text-[3] text-[#7E7E7E] tracking-wider`}
                                      >
                                        {text_status()}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                                {/* + ROW 3 (Status and Actual Visit) */}
                                <View style={tw`flex-1 flex-row py-[5]`}>
                                  <View style={tw`flex-1`}>
                                    <View style={tw`flex-1 flex-row`}>
                                      <View
                                        style={tw`flex-1 justify-center items-center`}
                                      >
                                        <FontAwesome6
                                          name={"calendar-plus"}
                                          size={20}
                                          color={`${v_status_color()}`}
                                        />
                                      </View>
                                      <View
                                        style={tw`flex-4 justify-center pl-1`}
                                      >
                                        <Text
                                          style={tw`text-[2] text-[#7E7E7E] tracking-wider`}
                                        >
                                          PLAN TO VISIT
                                        </Text>
                                        <Text
                                          style={tw`text-[2.4] text-[#7E7E7E] tracking-wider`}
                                        >
                                          {item.a9_PlanVisit}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                  <View style={tw`flex-1`}>
                                    <View style={tw`flex-1 flex-row`}>
                                      <View
                                        style={tw`flex-1 justify-center items-center`}
                                      >
                                        <FontAwesome6
                                          name={"calendar-check"}
                                          size={20}
                                          color={`${v_status_color()}`}
                                        />
                                      </View>
                                      <View
                                        style={tw`flex-4 justify-center pl-1`}
                                      >
                                        <Text
                                          style={tw`text-[2] text-[#7E7E7E] tracking-wider`}
                                        >
                                          ACTUAL VISIT
                                        </Text>
                                        <Text
                                          style={tw`text-[2.4] text-[#7E7E7E] tracking-wider`}
                                        >
                                          {item.h2_Actual_Date_Visited}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                </View>
                                {/* - ROW 3 (Status and Actual Visit) */}
                              </View>
                            </TouchableOpacity>
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
                  <TouchableOpacity
                    style={tw`flex-1 w-full h-full justify-center items-center bg-[#028543] border-[0.4] border-[#028543] rounded-lg`}
                    onPress={() => {
                      set_is_show_mcp(false);
                    }}
                  >
                    <View style={tw`flex justify-center px-4`}>
                      <Text style={tw`text-[5] tracking-[0.1] text-[#FFF]`}>
                        GO BACK
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </React.Fragment>
        ) : (
          // + TDS PAGE ===============================================================================================
          <React.Fragment>
            <ScrollView style={[tw`pb-[200]`, { zIndex: 1 }]}>
              <View style={tw`mt-[150]`}>
                {general_selected_mcp.a2_SELECTED_STORE ===
                "NO STORE SELECTED" ? (
                  <View style={tw`flex px-5 mb-[10]`}>
                    <View style={tw`flex w-full px-0 mt-5 mb-2`}>
                      <Text
                        style={tw`text-[4] tracking-wide font-semibold ${txtcol_primary}`}
                      >
                        PERFORMANCE AS OF TODAY
                      </Text>
                    </View>
                    <View
                      style={tw`flex bg-[#fff] rounded-lg border-[0.5] border-[#028543] p-[10]`}
                    >
                      <View
                        style={tw`flex-1 flex-row justify-center items-center h-[8] border-b-[0.3] border-b-[#ECECEC]`}
                      >
                        <View style={tw`flex-2.8 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>
                            MCP COMPLIANCE
                          </Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>0/8</Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>0%</Text>
                        </View>
                      </View>
                      <View
                        style={tw`flex-1 flex-row justify-center items-center h-[8] border-b-[0.3] border-b-[#ECECEC]`}
                      >
                        <View style={tw`flex-2.8 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>
                            TOTAL STORES
                          </Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>2/8</Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>25%</Text>
                        </View>
                      </View>
                      <View
                        style={tw`flex-1 flex-row justify-center items-center h-[8] border-b-[0.3] border-b-[#ECECEC]`}
                      >
                        <View style={tw`flex-2.8 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>VS TOTAL</Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>2/8</Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>25%</Text>
                        </View>
                      </View>
                      <View
                        style={tw`flex-1 flex-row justify-center items-center h-[8]`}
                      >
                        <View style={tw`flex-2.8 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>
                            UNIQUE DOORS
                          </Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>8/8</Text>
                        </View>
                        <View style={tw`flex-1 justify-center items-start`}>
                          <Text style={tw`${fz_performance}`}>100%</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}

                <View style={tw`flex px-5`}>
                  <View style={tw`flex w-full px-0 mt-5 mb-2`}>
                    <Text
                      style={tw`text-[4] tracking-wide font-semibold ${txtcol_primary}`}
                    >
                      SELECTED STORE
                    </Text>
                    {general_selected_mcp.a2_SELECTED_STORE !==
                    "NO STORE SELECTED" ? (
                      <TouchableOpacity
                        style={tw`h-[7.4] w-[40] justify-center items-center absolute right-0 top-[-1.7] bg-[#028543] rounded-md`}
                        onPress={() => {
                          clear_camera();
                        }}
                      >
                        <Text
                          style={tw`text-[3.8] tracking-[0.2] text-white text-center`}
                        >
                          CHANGE STORE
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View
                    style={tw`bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
                  >
                    <View
                      style={tw`w-full flex justify-center items-center p-[10]`}
                    >
                      {general_selected_mcp.a2_SELECTED_STORE ===
                      "NO STORE SELECTED" ? (
                        <Text style={tw`text-[6.4] font-bold text-[#FF008A]`}>
                          {general_selected_mcp.a2_SELECTED_STORE}
                        </Text>
                      ) : (
                        <Text style={tw`text-[4.4] font-bold text-[#028543]`}>
                          {`${general_selected_mcp.a3_STORE_CODE} - ${general_selected_mcp.a2_SELECTED_STORE}`}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                {general_selected_mcp.a2_SELECTED_STORE ===
                "NO STORE SELECTED" ? (
                  <View style={tw`flex px-5 mt-[20]`}>
                    <TouchableOpacity
                      style={tw`flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] h-[15]`}
                      onPress={() => set_is_show_mcp(true)}
                    >
                      <View style={tw`flex-1 pl-[20] justify-center`}>
                        <Text
                          style={tw`text-[4] tracking-[0.1] text-[#028543]`}
                        >
                          SHOW MCP
                        </Text>
                      </View>
                      {/* <View style={tw`flex-1 justify-center items-end pr-[15]`}>
                           <Switch
                             trackColor={{ true: "#98D49B" }}
                             thumbColor={is_show_mcp ? "#4CB050" : "#f4f3f4"}
                             value={is_show_mcp}
                             onValueChange={() =>
                               set_is_show_mcp((prev_state) => !prev_state)
                             }
                           />
                         </View> */}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`flex flex-row justify-center h-[15] bg-[#fff] rounded-lg border-[0.5] border-[#028543] mt-[20]`}
                      onPress={() => {
                        set_is_select_chain_modal_open(true);
                      }}
                    >
                      <View style={tw`flex-5 justify-center pl-[20]`}>
                        <Text
                          style={tw`text-[4] tracking-[0.1] text-[#028543]`}
                        >
                          {selected_chain}
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
                    <TouchableOpacity
                      style={tw`flex flex-row justify-center h-[15] bg-[#fff] rounded-lg border-[0.5] border-[#028543] mt-[20]`}
                      onPress={() => {
                        set_is_select_store_modal_open(true);
                      }}
                    >
                      <View style={tw`flex-5 justify-center px-4`}>
                        <Text
                          style={tw`text-[4] tracking-[0.1] text-[#028543]`}
                        >
                          SELECT STORE
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
                    <TouchableOpacity
                      style={tw`flex flex-row justify-center h-[15] bg-[#028543] rounded-lg border-[0.5] border-[#028543] mt-[20] mb-[50]`}
                      onPress={() => {
                        set_is_logout_modal_open(true);
                      }}
                    >
                      <View style={tw`flex justify-center px-4`}>
                        <Text style={tw`text-[5] tracking-[0.1] text-[#FFF]`}>
                          LOGOUT
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : null}
                {general_selected_mcp.a2_SELECTED_STORE !==
                "NO STORE SELECTED" ? (
                  <React.Fragment>
                    <View style={tw`flex px-5 mt-[20]`}>
                      <TouchableOpacity
                        style={tw`flex flex-row justify-center items-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] p-[4] h-[80]`}
                        onPress={() => {
                          set_show_camera(true);
                          set_btn_camera_disable(false);
                        }}
                      >
                        {capturedImage ? (
                          <>
                            <Image
                              source={{ uri: capturedImage }}
                              style={tw`w-full h-full rounded-[1.5]`}
                            />
                          </>
                        ) : (
                          <FontAwesome
                            name="camera"
                            size={142}
                            color={"#028543"}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                    {is_camera_null ? (
                      <View
                        style={tw`flex justify-center items-center px-5 my-[10]`}
                      >
                        <Text style={tw`text-[4.2] text-[#D72A2A]`}>
                          Capture an image to proceed
                        </Text>
                      </View>
                    ) : null}
                    <View style={tw`flex px-5 mt-[20]`}>
                      <TouchableOpacity
                        style={tw`flex flex-row justify-center items-center bg-[#028543] rounded-lg border-[0.5] border-[#028543] h-[15]`}
                        onPress={() => {
                          if (capturedImage || capturedImage !== "") {
                            add_tds_store_timelog();
                            set_ui_navigation("tds_module");
                            set_is_camera_null(false);
                          } else {
                            set_is_camera_null(true);
                          }
                        }}
                      >
                        <Text
                          style={tw`text-[4.8] tracking-[0.4] font-bold text-[#FFF] text-center`}
                        >
                          PROCEED
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </React.Fragment>
                ) : null}
              </View>
            </ScrollView>
          </React.Fragment>
          // - TDS PAGE ===============================================================================================
        )}
        {/* - MCP CONTENT =============================================================================================== */}
        {/* + MCP MODAL ================================================================================================================== */}
        <Modal isOpen={is_mcp_modal_open}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View
              style={tw`w-full justify-center items-center py-[5] px-[15] mt-[15]`}
            >
              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040] font-bold`}
              >
                {`${selected_mcp.a3_SoldCode} - ${selected_mcp.a4_SoldName}`}
              </Text>
            </View>
            <View
              style={tw`w-full flex justify-center items-center mt-[5] gap-[2]`}
            >
              <View
                style={[
                  tw`h-[9] w-[9] bg-[#028543] justify-center items-center`,
                  { borderRadius: 1000 },
                ]}
              >
                <FontAwesome name="check" size={18} color={"#fff"} />
              </View>

              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
              >
                Location Verified
              </Text>
            </View>
            <View
              style={tw`w-full flex justify-center items-center py-[5] mb-[5] gap-[1]`}
            >
              <View
                style={tw`w-full flex flex-row justify-center items-center gap-[2]`}
              >
                <Text
                  style={tw`text-[3.2] text-center tracking-[0.2] text-[#404040]`}
                >
                  Longitude
                </Text>
                <Text
                  style={tw`text-[3.2] text-center tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.2] text-center tracking-[0.2] text-[#404040]`}
                >
                  {current_location.longitude}
                </Text>
              </View>
              <View
                style={tw`w-full flex flex-row justify-center items-center gap-[2]`}
              >
                <Text
                  style={tw`text-[3.2] text-center tracking-[0.2] text-[#404040]`}
                >
                  Latitude
                </Text>
                <Text
                  style={tw`text-[3.2] text-center tracking-[0.2] text-[#404040]`}
                >
                  :
                </Text>
                <Text
                  style={tw`text-[3.2] text-center tracking-[0.2] text-[#404040]`}
                >
                  {current_location.latitude}
                </Text>
              </View>
            </View>
            {is_diversion ? (
              <React.Fragment>
                <View
                  style={tw`w-full justify-center items-center py-[5] mt-[10]`}
                >
                  <Text
                    style={tw`text-[5.4] text-center tracking-[0.2] text-[#404040] font-bold underline`}
                  >
                    THIS MCP IS A DIVERSION
                  </Text>
                </View>
                <TouchableOpacity
                  style={tw`flex flex-row justify-center h-[12] bg-[#fff] rounded-lg border-[0.5] border-[#028543] mt-[5] mb-[15] mx-[12]`}
                  onPress={() => {
                    set_diver_modal_open(true);
                  }}
                >
                  <View style={tw`flex-5 justify-center pl-[20]`}>
                    <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                      {selected_diver_remarks.a2_DESC}
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
                {invalid_remarks ? (
                  <View>
                    <Text style={tw`text-[4.2] text-[#D72A2A] mb-[10]`}>
                      Please select a diversion remark to proceed
                    </Text>
                  </View>
                ) : null}
              </React.Fragment>
            ) : null}

            <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 
                     bg-[#028543] 
                   p-3 rounded-lg`}
                onPress={() => {
                  if (is_diversion) {
                    if (selected_diver_remarks.a1_ID !== 0) {
                      set_general_selected_mcp({
                        a1_MCP_ID: selected_mcp.a1_ID,
                        a2_SELECTED_STORE: selected_mcp.a4_SoldName,
                        a3_STORE_CODE: selected_mcp.a3_SoldCode,
                        a4_DIVERSION: "NOT_TODAY",
                      });
                      set_invalid_remarks(false);
                      set_is_mcp_modal_open(false);
                      set_is_show_mcp(false);
                    } else {
                      set_invalid_remarks(true);
                    }
                  } else {
                    set_general_selected_mcp({
                      a1_MCP_ID: selected_mcp.a1_ID,
                      a2_SELECTED_STORE: selected_mcp.a4_SoldName,
                      a3_STORE_CODE: selected_mcp.a3_SoldCode,
                      a4_DIVERSION: "NORMAL",
                    });
                    set_is_mcp_modal_open(false);
                    set_is_show_mcp(false);
                  }
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Proceed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_selected_diver_remarks({
                    a1_ID: 0,
                    a2_DESC: "SELECT REMARKS",
                  });
                  set_is_mcp_modal_open(false);
                  clear_camera();
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
        {/* - MCP MODAL ================================================================================================================== */}
        {/* + MCP DIVERSION MODAL ======================================================================================================== */}
        <Modal isOpen={is_mcp_diver_modal_open}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View
              style={tw`w-full justify-center items-center py-[5] px-[20] mt-[10]`}
            >
              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040] font-bold`}
              >
                {`${selected_diver_store.a3_STORE_CODE} - ${selected_diver_store.a2_SELECTED_STORE}`}
              </Text>
            </View>
            {is_diversion ? (
              <React.Fragment>
                <View
                  style={tw`w-full justify-center items-center py-[5] mt-[10]`}
                >
                  <Text
                    style={tw`text-[5.4] text-center tracking-[0.2] text-[#404040] font-bold underline`}
                  >
                    THIS MCP IS A DIVERSION
                  </Text>
                </View>
                {invalid_remarks ? (
                  <View>
                    <Text style={tw`text-[4.2] text-[#D72A2A] mb-[10]`}>
                      Please select a diversion remark to proceed
                    </Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={tw`flex flex-row justify-center h-[12] bg-[#fff] rounded-lg border-[0.5] border-[#028543] mt-[5] mb-[15] mx-[12]`}
                  onPress={() => {
                    set_diver_modal_open(true);
                  }}
                >
                  <View style={tw`flex-5 justify-center pl-[20]`}>
                    <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
                      {selected_diver_remarks.a2_DESC}
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
              </React.Fragment>
            ) : null}

            <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
                onPress={() => {
                  if (is_diversion) {
                    if (selected_diver_remarks.a1_ID !== 0) {
                      set_general_selected_mcp({
                        a1_MCP_ID: 0,
                        a2_SELECTED_STORE:
                          selected_diver_store.a2_SELECTED_STORE,
                        a3_STORE_CODE: selected_diver_store.a3_STORE_CODE,
                        a4_DIVERSION: "NOT_LISTED",
                      });
                      set_invalid_remarks(false);
                      set_is_mcp_modal_open(false);
                      set_is_mcp_diver_modal_open(false);
                    } else {
                      set_invalid_remarks(true);
                    }
                  }
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Proceed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_selected_diver_remarks({
                    a1_ID: 0,
                    a2_DESC: "SELECT REMARKS",
                  });
                  set_is_mcp_diver_modal_open(false);
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
        {/* - MCP DIVERSION MODAL ======================================================================================================== */}
        {/* + CHAIN SELECTION MODAL ====================================================================================================== */}
        <Modal isOpen={is_select_chain_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View
              style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
            >
              <View style={tw`flex-5`}>
                <Text
                  style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
                >
                  Chain Selection
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center pr-1`}>
                <Pressable
                  onPress={() => {
                    set_is_select_chain_modal_open(false);
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
                  value={search_query_chain}
                  placeholder="Search..."
                  placeholderTextColor={`gray`}
                  style={tw`flex-1 text-[4.4] p-[0]`}
                  onChangeText={(text) => set_search_query_chain(text)}
                ></TextInput>
                <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                  <FontAwesome name="search" size={24} color={"#028543"} />
                </View>
              </View>
              <View
                style={tw`h-[12] pl-[15] flex flex-row justify-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] w-full`}
              >
                <TextInput
                  value={search_query_chain}
                  placeholder="Search..."
                  placeholderTextColor={`gray`}
                  style={tw`flex-1 text-[4.4] p-[0]`}
                  onChangeText={(text) => set_search_query_chain(text)}
                ></TextInput>
                <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                  <FontAwesome name="search" size={24} color={"#028543"} />
                </View>
              </View>
            </View>
            <View style={tw`pl-3 pr-2 py-3 h-[70]`}>
              <FlatList
                data={chain}
                style={tw`px-3`}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                      onPress={() => {
                        set_selected_chain_ID(item.a3_ChainID);
                        set_selected_chain(item.a2_Chain);
                        set_is_select_chain_modal_open(false);
                      }}
                    >
                      <Text style={tw`text-[5] text-[#404040]`}>
                        {item.a2_Chain}
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
                  set_is_select_chain_modal_open(false);
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
        {/* - CHAIN SELECTION MODAL ====================================================================================================== */}
        {/* |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */}
        {/* + STORE SELECTION MODAL ====================================================================================================== */}
        <Modal isOpen={is_select_store_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View
              style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
            >
              <View style={tw`flex-5`}>
                <Text
                  style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
                >
                  Store Selection
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center pr-1`}>
                <Pressable
                  onPress={() => {
                    set_is_select_store_modal_open(false);
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
                  value={search_query_store}
                  placeholder="Search..."
                  placeholderTextColor={`gray`}
                  style={tw`flex-1 text-[4.4] p-[0]`}
                  onChangeText={(text) => set_search_query_store(text)}
                ></TextInput>
                <View style={tw`justify-center items-center w-[12] pb-[1]`}>
                  <FontAwesome name="search" size={24} color={"#028543"} />
                </View>
              </View>
            </View>
            <View style={tw`pl-3 pr-2 py-3 h-[70]`}>
              <FlatList
                data={store}
                style={tw`px-3`}
                renderItem={({ item, index }) => {
                  const isLastItem = index === store.length - 1;

                  return (
                    <TouchableOpacity
                      style={[
                        tw`flex justify-center bg-white py-[12]`,
                        !isLastItem && tw`border-b border-[#ECECEC]`,
                      ]}
                      onPress={() => {
                        set_selected_diver_remarks({
                          a1_ID: 0,
                          a2_DESC: "SELECT REMARKS",
                        });
                        set_selected_diver_store({
                          a1_ID: 0,
                          a2_SELECTED_STORE: `${item.a2_cstName1} - ${item.a3_cstName2}`,
                          a3_STORE_CODE: item.a2_Storecode,
                          a4_DIVERSION: "NOT_LISTED",
                        });
                        set_is_diversion(true);
                        set_is_mcp_diver_modal_open(true);
                        setTimeout(() => {
                          set_is_select_store_modal_open(false);
                        }, 100);
                      }}
                    >
                      <Text style={tw`text-[3] text-[#6F6F6F]`}>
                        {item.a2_Storecode}
                      </Text>
                      <Text style={tw`text-[5] font-bold text-[#404040]`}>
                        {item.a2_cstName1}
                      </Text>
                      <Text style={tw`text-[4] text-[#6F6F6F]`}>
                        {item.a3_cstName2}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
            <View style={tw`w-full p-3`}>
              <TouchableOpacity
                style={tw`w-full bg-[#6C757D] p-3 rounded-lg`}
                onPress={() => {
                  set_is_select_store_modal_open(false);
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
        {/* - STORE SELECTION MODAL ====================================================================================================== */}
        {/* + DIVERSION REMARKS MODAL ==================================================================================================== */}
        <Modal isOpen={diver_modal_open}>
          <View style={tw`bg-white w-full rounded-xl`}>
            <View
              style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
            >
              <View style={tw`flex-5`}>
                <Text
                  style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
                >
                  Diversion Remarks Selection
                </Text>
              </View>
              <View style={tw`flex flex-1 justify-center items-center pr-1`}>
                <Pressable
                  onPress={() => {
                    set_diver_modal_open(false);
                  }}
                >
                  <Ionicons name="close" size={32} color={"#028543"} />
                </Pressable>
              </View>
            </View>
            <View style={tw`pl-3 pr-2 py-3 h-[90]`}>
              <FlatList
                data={diver_remarks}
                style={tw`px-3`}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity
                      style={tw`flex justify-center bg-[#fff] h-[12] rounded-md my-1`}
                      onPress={() => {
                        set_selected_diver_remarks({
                          a1_ID: item.a1_ID,
                          a2_DESC: item.a2_DESC,
                        });
                        set_diver_modal_open(false);
                      }}
                    >
                      <Text style={tw`text-[5] text-[#404040]`}>
                        {item.a2_DESC}
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
                  set_diver_modal_open(false);
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
        {/* - DIVERSION REMARKS MODAL ==================================================================================================== */}
        {/* + [Modal] Geofence Authentication Loading */}
        <Modal isOpen={show_geofence_loading_modal}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3] py-[30]`}
          >
            <View style={tw`w-full justify-center items-center py-[5]`}>
              <ActivityIndicator size={44} color="#028543" />
            </View>

            <View style={tw`w-full justify-center items-center py-[5] mt-[10]`}>
              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
              >
                Verifying your location. Please wait.
              </Text>
            </View>

            {/* <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
                onPress={() => {
                  handle_logout();
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
                  handle_cancel_geofence();
                }}
              >
                <Text
                  style={tw`text-lg font-bold tracking-wider text-white text-center`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </Modal>
        {/* - [Modal] Geofence Authentication Loading */}
        {/* + LOGOUT MODAL =============================================================================================================== */}
        <Modal isOpen={is_logout_modal_open}>
          <View
            style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
          >
            <View style={tw`w-full justify-center items-center py-[5] mt-[10]`}>
              <View
                style={tw`h-[25] w-[25] rounded-[100] bg-[#028543] justify-center items-center`}
              >
                <MaterialIcons name="exit-to-app" size={52} color={"#FFF"} />
              </View>
            </View>

            <View style={tw`w-full justify-center items-center py-[5] my-[10]`}>
              <Text
                style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
              >
                Are you sure you want to logout?
              </Text>
            </View>

            <View style={tw`w-full flex-row justify-between gap-3 p-3`}>
              <TouchableOpacity
                style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
                onPress={() => {
                  handle_logout();
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
                  set_is_logout_modal_open(false);
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
        {/* - LOGOUT MODAL =============================================================================================================== */}
        {/* |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| */}
        {/* + DATE PICKER (START DATE) =================================================================================================== */}
        {is_start_date_picker_show && (
          <DateTimePicker
            // testID="dateTimePicker"
            value={start_date || new Date()}
            mode="date"
            display="default"
            onChange={start_date_on_change}
          />
        )}
        {/* - DATE PICKER (START DATE) =================================================================================================== */}
        {/* + DATE PICKER (END DATE) ===================================================================================================== */}
        {is_end_date_picker_show && (
          <DateTimePicker
            // testID="dateTimePicker"
            value={end_date || new Date()}
            mode="date"
            display="default"
            onChange={end_date_on_change}
          />
        )}
        {/* - DATE PICKER (END DATE) ===================================================================================================== */}
        {/* + CAMERA OVERLAY ============================================================================================================= */}
        {show_camera ? (
          <View style={[tw`flex w-full h-full`, styles.overlay]}>
            <View
              style={tw`flex-1 bg-[#000] border-b-[0.4] border-[#FFF]`}
            ></View>
            <View style={tw`flex-3  w-full bg-[#D4D4D4]`}>
              <CameraView
                style={styles.camera}
                facing={facing}
                ref={cameraRef}
              ></CameraView>
            </View>
            <View
              style={tw`flex-1 items-center bg-[#000] border-t-[0.4] border-[#FFF]`}
            >
              <TouchableOpacity
                style={tw`justify-center items-center w-[20] h-[20] mt-[20] rounded-[50] bg-[#FFF]`}
                onPress={takePicture}
                disabled={btn_camera_disable ? true : false}
              >
                <FontAwesome name="camera" size={32} color={"#028543"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  {
                    position: "absolute",
                    top: 20, // Position from the bottom
                    right: 20, // Position from the right
                  },
                ]}
                onPress={toggleCameraFacing}
              >
                <MaterialIcons
                  name="switch-camera"
                  size={42}
                  color={"#028543"}
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {/* - CAMERA OVERLAY ============================================================================================================= */}
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  header_bg: {
    width: "100%",
    zIndex: 2,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  overlay: {
    position: "absolute",
    zIndex: 2,
  },
  overlayText: {
    color: "#fff",
    textAlign: "center",
  },
  camera: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  message: {
    fontSize: 18,
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
});

export default P1_TDS;

// const a = {
//   a1_ID: 415987,
//   a2_TDSName: "ARIEL BANATAN",
//   a3_SoldCode: "502926",
//   a4_SoldName: "ROBINSONS SUPERMARKET CORP. - ERMITA MANILA",
//   a5_Chain: "ROBINSONS SMKT",
//   a6_TDSCategory: "CARRY ALL",
//   a7_Supervisor: "REY FACTULARIN",
//   a8_Week: "WEEK 1",
//   a9_PlanVisit: "01/29/2025",
//   b1_Dateuploaded: "01/27/2025",
//   b2_UploadedBy: "110828",
//   b2_osa_date_updated: "07/13/2025",
//   b2_osa_status: 1,
//   b3_ActualDateVisited: "",
//   b4_TDSCode: "TDS-051",
//   b5_Frequency: "F4",
//   b6_Period: "PERIOD 2",
//   b7_Manager: "HECTOR DE GUZMAN ",
//   b8_login: "",
//   b9_RangeFrom: "01/27/2025",
//   c1_RangeTo: "02/01/2025",
//   c2_SoldToStreet: "Ground Flr. Robinson Place Complex",
//   c3_City: "MML - Manila City",
//   c4_Area: "Metro Manila",
//   c5_Region: "NCR",
//   c6_StoreClass: "",
//   c7_Channel: "National Key Account",
//   z1_md_status: 1,
//   z2_osa_status: 1,
//   z3_ep_status: 0,
// };
