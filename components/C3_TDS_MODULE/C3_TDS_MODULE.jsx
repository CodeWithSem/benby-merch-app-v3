import React, { useState, useEffect } from "react";
import { db } from "../../assets/scripts/firebase";
import { ref, get, query, onValue, update } from "firebase/database";
import axios from "axios";
import {
  BackHandler,
  Image,
  ImageBackground,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import tw from "twrnc";
import { Modal } from "../../assets/elements/Modal";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import {
  format_diser_time_sched,
  formate_date,
} from "../../assets/scripts/functions/format_value";
import P1_OSA from "./C3_PAGES/P1_OSA/P1_OSA";
import P2_MD from "./C3_PAGES/P2_MD/P2_MD";
import P3_EP from "./C3_PAGES/P3_EP/P3_EP";
import P4_TAP from "./C3_PAGES/P4_TAP/P4_TAP";
import P5_TRADE_RENTAL from "./C3_PAGES/P5_TRADE_RENTAL/P5_TRADE_RENTAL";
import P6_AUDIT_SURVEY from "./C3_PAGES/P6_AUDIT_SURVEY/P6_AUDIT_SURVEY";
import P8_SOS from "./C3_PAGES/P8_SOS/P8_SOS";
import P9_PRICE_SURVEY from "./C3_PAGES/P9_PRICE_SURVEY/P9_PRICE_SURVEY";
import P10_RTV from "./C3_PAGES/P10_RTV/P10_RTV";
import With_Updated_Diser from "./TRAINING_LOG/With_Updated_Diser";
import Select_Merch from "./TRAINING_LOG/Select_Merch";
import Training_Survey from "./TRAINING_LOG/Training_Survey";

const C3_TDS_MODULE = ({
  app_version,
  set_ui_navigation,
  reset_general_data,
  user_account_data,
  general_selected_mcp,
  set_general_selected_mcp,
  general_tds_timelog_link,
  general_storetimelog,
  get_current_location,
}) => {
  const [tds_ui_navigation, set_tds_ui_navigation] = useState("main_page");
  const [display_modal, set_display_modal] = useState("");

  const [mcp_progress, set_mcp_progress] = useState({
    z_md_status: 0,
    z_osa_status: 0,
    z_ep_status: 0,
    // z_tap_status: 0,
    z_tr_status: 0,
    z_as_status: 0,
    z_sos_status: 0,
    z_ps_status: 0,
    z_rtv_status: 0,
    z_nerm_status: 0,
  });

  const [is_logout_loading, set_is_logout_loading] = useState(false);
  const [is_logout_tds_modal_open, set_is_logout_tds_modal_open] =
    useState(false);

  // + [Back Handler] Back button
  useEffect(() => {
    const onBackPress = () => {
      if (tds_ui_navigation === "main_page") {
        set_is_logout_tds_modal_open(true);
        return true;
      }

      if (
        tds_ui_navigation === "osa" ||
        tds_ui_navigation === "md" ||
        tds_ui_navigation === "ep" ||
        tds_ui_navigation === "tap" ||
        // tds_ui_navigation === "trade_rental" ||
        tds_ui_navigation === "audit_survey" ||
        tds_ui_navigation === "share_of_shelf" ||
        tds_ui_navigation === "price_survey" ||
        tds_ui_navigation === "rtv"
      ) {
        set_tds_ui_navigation("main_page");
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );

    return () => backHandler.remove();
  }, [tds_ui_navigation]);
  // - [Back Handler] Back button

  // + [Fetch Data] MCP Progress
  useEffect(() => {
    const handle_mcp_prog_data = (data) => {
      if (data) {
        set_mcp_progress({
          z_md_status: data.z_md_status || 0,
          z_osa_status: data.z_osa_status || 0,
          z_ep_status: data.z_ep_status || 0,
          z_tr_status: data.z_tr_status || 0,
          z_as_status: data.z_as_status || 0,
          z_sos_status: data.z_sos_status || 0,
          z_ps_status: data.z_ps_status || 0,
          z_rtv_status: data.z_rtv_status || 0,
        });
      } else {
        console.log("MCP Progress does not exist.");
      }
    };

    const verify_mcp_date = (status, date_value) => {
      const date_now = new Date();
      return formate_date(date_now, "mm/dd/yyyy") === date_value ? status : 0;
    };

    let db_ref_path;
    if (general_selected_mcp.a4_DIVERSION !== "NOT_LISTED") {
      db_ref_path = `/DB_TEST/TBL_MCP/DATA/${user_account_data.e1_PC}/${general_selected_mcp.a1_MCP_ID}`;
    } else {
      db_ref_path = `/DB_TEST/TBL_MANUAL_SELECTION_PROGRESS/DATA/${user_account_data.e1_PC}/${general_selected_mcp.a3_STORE_CODE}`;
    }

    if (db_ref_path) {
      onValue(ref(db, db_ref_path), (snapshot) => {
        const mcp_progress_data = snapshot.val();
        if (mcp_progress_data) {
          if (general_selected_mcp.a4_DIVERSION === "NOT_LISTED") {
            const data = {
              z_md_status: verify_mcp_date(
                mcp_progress_data.z_md_status,
                mcp_progress_data.z_md_date_updated,
              ),
              z_osa_status: verify_mcp_date(
                mcp_progress_data.z_osa_status,
                mcp_progress_data.z_osa_date_updated,
              ),
              z_ep_status: verify_mcp_date(
                mcp_progress_data.z_ep_status,
                mcp_progress_data.z_ep_date_updated,
              ),
              z_tr_status: verify_mcp_date(
                mcp_progress_data.z_tr_status,
                mcp_progress_data.z_tr_date_updated,
              ),
              z_as_status: verify_mcp_date(
                mcp_progress_data.z_as_status,
                mcp_progress_data.z_as_date_updated,
              ),
              z_sos_status: verify_mcp_date(
                mcp_progress_data.z_sos_status,
                mcp_progress_data.z_sos_date_updated,
              ),
              z_ps_status: verify_mcp_date(
                mcp_progress_data.z_ps_status,
                mcp_progress_data.z_ps_date_updated,
              ),
              z_rtv_status: verify_mcp_date(
                mcp_progress_data.z_rtv_status,
                mcp_progress_data.z_rtv_date_updated,
              ),
            };
            handle_mcp_prog_data(data);
          } else {
            handle_mcp_prog_data({
              z_md_status: mcp_progress_data.z_md_status,
              z_osa_status: mcp_progress_data.z_osa_status,
              z_ep_status: mcp_progress_data.z_ep_status,
              z_tr_status: mcp_progress_data.z_tr_status,
              z_as_status: mcp_progress_data.z_as_status,
              z_sos_status: mcp_progress_data.z_sos_status,
              z_rtv_status: mcp_progress_data.z_rtv_status,
            });
          }
        }
      });
    }
  }, [general_selected_mcp, user_account_data]);
  // - [Fetch Data] MCP Progress

  // + [Process] Logout

  // const [radius, set_radius] = useState(10000000);
  const [radius, set_radius] = useState(0);

  useEffect(() => {
    onValue(
      ref(db, `DB2_BENBY_MERCH_APP/GEOFENCE_RADIUS/VALUE`),
      (snapshot) => {
        set_radius(snapshot.val());
      },
    );
  }, []);

  const [show_geofence_loading_modal, set_show_geofence_loading_modal] =
    useState(false);

  const get_distance_in_meters = (
    lat_current,
    long_current,
    lat_target,
    long_target,
  ) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371000; // Radius of Earth in meters
    const dLat = toRad(lat_target - lat_current);
    const dLon = toRad(long_target - long_current);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat_current)) *
        Math.cos(toRad(lat_target)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const verify_progress_logout = async (timelog_id) => {
    try {
      set_show_geofence_loading_modal(true);
      const geo_ref = ref(
        db,
        `/DB1_BENBY_LOC_MARKER/TBL_GEO_TAG/DATA/${user_account_data.e1_PC}/${general_selected_mcp.a3_STORE_CODE}`,
      );
      const response = await get(geo_ref);
      const geo_data = response.val();

      if (geo_data === null || geo_data.flag === 0) {
        final_logout(timelog_id);
        return;
      }
      const location = await get_current_location();
      const distance = get_distance_in_meters(
        parseFloat(location.coords.latitude),
        parseFloat(location.coords.longitude),
        parseFloat(geo_data.latitude),
        parseFloat(geo_data.longitude),
      );

      const store_loc = `STORE LOCATION\nLatitude: ${geo_data.latitude}\nLongitude: ${geo_data.longitude}`;
      const user_loc = `USER LOCATION\nLatitude: ${location.coords.latitude}\nLongitude: ${location.coords.longitude}`;
      const current_distance = `DISTANCE: ${distance.toFixed(0)} Meters`;
      const accepted_distance = `Your DISTANCE should be below ${radius} Meters`;
      if (distance <= radius) {
        final_logout(timelog_id);
      } else {
        Alert.alert(
          "Invalid Location",
          `You are outside the allowed location range.\n\nStore Code: ${general_selected_mcp.a3_STORE_CODE}\nStore Name: ${general_selected_mcp.a2_SELECTED_STORE}\n\n${current_distance}\n\n${accepted_distance}`,
          // `You are outside the allowed location range.\n\n${store_loc}\n\n${user_loc}\n\n${current_distance}\n\n${accepted_distance}`,
          [{ text: "OK", style: "cancel" }],
          { cancelable: true },
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      set_show_geofence_loading_modal(false);
    }
  };

  // const verify_progress_logout = async (timelog_id) => {
  //   set_show_geofence_loading_modal(true);

  //   try {
  //     const response = await axios.get(
  //       "https://benbyextportal.com/home/api/get/GetGEOTagging?filter1=0&filter2=0&filter3=0"
  //     );

  //     const apiData = response.data;

  //     const matched = apiData.find(
  //       (apiItem) =>
  //         apiItem.sTORECODE === general_selected_mcp.a3_STORE_CODE &&
  //         apiItem.tDSCODE === user_account_data.e1_PC
  //     );

  //     if (!matched || matched.fLAG === "0") {
  //       final_logout(timelog_id);
  //       return;
  //     }

  //     const location = await get_current_location();

  //     const distance = get_distance_in_meters(
  //       parseFloat(location.coords.latitude),
  //       parseFloat(location.coords.longitude),
  //       parseFloat(matched.lATITUDE),
  //       parseFloat(matched.lONGTITUDE)
  //     );

  //     const store_loc = `STORE LOCATION\nLatitude: ${matched.lATITUDE}\nLongitude: ${matched.lONGTITUDE}`;
  //     const user_loc = `USER LOCATION\nLatitude: ${location.coords.latitude}\nLongitude: ${location.coords.longitude}`;
  //     const current_distance = `DISTANCE: ${distance.toFixed(0)} Meters`;
  //     const accepted_distance = `Your DISTANCE should be below ${radius} Meters`;
  //     if (distance <= radius) {
  //       final_logout(timelog_id);
  //     } else {
  //       Alert.alert(
  //         "Invalid Location",
  //         // `You are outside the allowed location range.\n\n${store_loc}\n\n${user_loc}\n\n${current_distance}\n\n${accepted_distance}`,
  //         `You are outside the allowed location range.\n\nStore Code: ${general_selected_mcp.a3_STORE_CODE}\nStore Name: ${general_selected_mcp.a2_SELECTED_STORE}\n\n${current_distance}\n\n${accepted_distance}`,
  //         [{ text: "OK", style: "cancel" }],
  //         { cancelable: true }
  //       );
  //     }
  //   } catch (error) {
  //     console.log("Error verifying geofence:", error);
  //   } finally {
  //     set_show_geofence_loading_modal(false);
  //   }
  // };

  const final_logout = (timelog_id) => {
    post_geo_mon_logout(timelog_id);
    // if (
    //   mcp_progress.z_md_status === 1 &&
    //   mcp_progress.z_osa_status === 1 &&
    //   mcp_progress.z_ep_status === 1 &&
    //   mcp_progress.z_tap_status === 1
    // ) {
    //   post_geo_mon_logout(timelog_id);
    // } else {
    //   post_geo_mon_logout(timelog_id);
    //   Alert.alert(
    //     "Invalid",
    //     `Finish all the tasks before logging out.`,
    //     [{ text: "OK", style: "cancel" }],
    //     { cancelable: true }
    //   );
    // }
  };

  // const verify_progress_logout = (timelog_id) => {
  //   if (
  //     mcp_progress.z_md_status === 1 &&
  //     mcp_progress.z_osa_status === 1 &&
  //     mcp_progress.z_ep_status === 1 &&
  //     mcp_progress.z_tap_status === 1
  //   ) {
  //     post_geo_mon_logout(timelog_id);
  //   } else {
  //     Alert.alert(
  //       "Invalid",
  //       `Finish all the tasks before logging out.`,
  //       [{ text: "OK", style: "cancel" }],
  //       { cancelable: true }
  //     );
  //   }
  // };

  const post_geo_mon_logout = async (timelog_id) => {
    const storeCode = general_selected_mcp.a3_STORE_CODE || "";
    try {
      const logout_data = {
        cODE: user_account_data.e1_PC,
        sTORECODE: storeCode,
        lOGOUTSTATUS: "1",
      };
      const apiResponse = await axios.post(
        "https://benbyextportal.com/insert/api/PostGeoMonLogout",
        logout_data,
      );

      if (apiResponse.status >= 200 && apiResponse.status < 210) {
        post_geo_mon_report();
        handle_logout(timelog_id);
      } else {
        Alert.alert(
          "API Error",
          "There was an error while logging in. Please try again. PostGeoMonLogout",
          [
            {
              text: "OK",
              style: "cancel",
            },
          ],
          { cancelable: true },
        );
      }
    } catch (error) {
      Alert.alert(
        "API Error",
        "There was an error while logging out. Please try again. PostGeoMonLogout",
        [
          {
            text: "OK",
            style: "cancel",
          },
        ],
        { cancelable: true },
      );
    }
  };

  const post_geo_mon_report = async () => {
    const storeCode = general_selected_mcp.a3_STORE_CODE || "";
    try {
      const logout_data = {
        cODE: user_account_data.e1_PC,
        sTORECODE: storeCode,
        lONGTITUDE: general_storetimelog.Longitude,
        lATITUDE: general_storetimelog.Latitude,
      };
      await axios.post(
        "https://benbyextportal.com/insert/api/PostGeoMonReport",
        logout_data,
      );
    } catch (error) {
      Alert.alert(
        "API Error",
        "There was an error on logout report. PostGeoMonReport",
        [
          {
            text: "OK",
            style: "cancel",
          },
        ],
        { cancelable: true },
      );
    }
  };

  const handle_logout = async (timelog_id) => {
    const date_now = new Date();
    set_is_logout_loading(true);

    try {
      const timelog_data = {
        ...general_storetimelog,
        TimeOut: format_diser_time_sched(date_now),
      };
      const apiResponse = await axios.post(
        "https://benbyextportal.com/insert/api/PostStoreTimeLogs",
        timelog_data,
      );

      if (apiResponse.status >= 200 && apiResponse.status < 210) {
        if (timelog_id) {
          await update(
            ref(
              db,
              `/DB1_BENBY_MERCH_APP/TBL_STORE_TIMELOGS/DATA/${timelog_id}`,
            ),
            {
              a4_TimeOUT: format_diser_time_sched(date_now),
            },
          ).then(() => {
            reset_general_data();
          });
        }

        set_general_selected_mcp({
          a1_ID: 0,
          a2_SELECTED_STORE: "NO STORE SELECTED",
          a3_STORE_CODE: "",
          a4_DIVERSION: "NORMAL",
          a5_CHANNEL: "",
        });
        set_ui_navigation("mcp_module");
      } else {
        alert("Store Time Log API failed. Please try again.");
      }
    } catch (error) {
      alert("An error occurred on saving timelog. Please try again.");
    } finally {
      set_is_logout_loading(false);
    }
  };

  // - [Process] Logout

  function verify_check_status(category) {
    // Mapping the ID to your specific mcp_progress status keys
    const statusMap = {
      osa: mcp_progress?.z_osa_status,
      md: mcp_progress?.z_md_status,
      ep: mcp_progress?.z_ep_status,
      trade_rental: mcp_progress?.z_tr_status,
      audit_survey: mcp_progress?.z_as_status,
      share_of_shelf: mcp_progress?.z_sos_status,
      price_survey: mcp_progress?.z_ps_status,
      rtv: mcp_progress?.z_rtv_status,
      nerm_inventory: mcp_progress?.z_nerm_status,
    };

    // Return true if status is 1, otherwise return false
    return statusMap[category] === 1;
  }

  const MenuButton = ({ icon, label, onPress, color = "#028543" }) => (
    <TouchableOpacity
      style={tw`items-center w-[31%] mb-6`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon Container with Green Theme */}
      <View
        style={tw`w-14 h-14 bg-green-50 rounded-2xl justify-center items-center mb-2 border border-green-100 shadow-sm`}
      >
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>

      {/* Label - Keep it to 2 lines max */}
      <Text
        numberOfLines={2}
        style={tw`text-[3] text-gray-600 text-center font-bold leading-tight px-1`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const render_main_page = () => {
    return (
      <React.Fragment>
        <ImageBackground
          source={require("../../assets/images/ui/Background.jpg")} // Replace with your image path
          style={tw`w-full h-full`}
        >
          <View style={tw`absolute w-full h-full pt-4`}>
            {/* + [UI] Logo - Shifted for better breathing room */}
            <View style={tw`w-full mb-2`}>
              <View style={tw`self-start p-2 rounded-2xl`}>
                <Image
                  source={require("../../assets/images/ui/benby-logo-white.png")}
                  style={tw`w-24 h-10`}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* + [UI] Enhanced Welcome Section */}
            <View style={tw`w-full px-8 mb-5`}>
              <Text
                style={tw`text-white/70 text-base tracking-widest uppercase font-light mb-1`}
              >
                Welcome
              </Text>
              <Text
                style={tw`text-white text-2xl font-black tracking-tighter leading-tight`}
              >
                {user_account_data.b1_TDS_FullName || "User"}
              </Text>
              <View
                style={tw`flex-row items-center mt-2 bg-black/20 self-start px-3 py-1 rounded-full border border-white/10`}
              >
                <MaterialCommunityIcons
                  name="badge-account"
                  size={14}
                  color="#FFF"
                />
                <Text
                  style={tw`text-white/90 text-xs font-bold ml-2 uppercase tracking-[2px] mr-2`}
                >
                  {user_account_data.e1_PC || "---"}
                </Text>
              </View>
            </View>
            {/* + [Navigation Buttons] OSA, MD, & EP */}
            <View style={tw`flex-1 px-4 pb-2`}>
              <View style={tw`w-full bg-white rounded-3xl shadow-2xl p-6 pt-8`}>
                {/* Handle for aesthetic */}
                <View
                  style={tw`w-12 h-1 bg-gray-100 rounded-lg self-center mb-8`}
                />

                {/* 2x2 Grid Section */}
                <View
                  style={tw`flex-row flex-wrap justify-between items-start`}
                >
                  <MenuButton
                    icon="storefront-outline"
                    label={`On-Shelf\nAvailability`}
                    onPress={() => set_tds_ui_navigation("osa")}
                  />
                  <MenuButton
                    icon="account-group-outline"
                    label={`Merchandiser\nDeployment`}
                    onPress={() => set_tds_ui_navigation("md")}
                  />

                  <MenuButton
                    icon="calendar-text-outline"
                    label={`Execution\nPlanner`}
                    onPress={() => set_tds_ui_navigation("ep")}
                  />

                  <MenuButton
                    icon="clipboard-check-outline"
                    label={`Trade Audit\n& Photos`}
                    onPress={() => set_display_modal("select_trade_audit")}
                  />

                  <MenuButton
                    icon="package-variant"
                    label={`Share of\nShelf`}
                    onPress={() => set_tds_ui_navigation("share_of_shelf")}
                  />

                  <MenuButton
                    icon="cash-multiple"
                    label={`Price\nSurvey`}
                    onPress={() => set_tds_ui_navigation("price_survey")}
                  />

                  <MenuButton
                    icon="truck-delivery-outline"
                    label={`Return to\nVendor`}
                    onPress={() => set_tds_ui_navigation("rtv")}
                  />

                  <MenuButton
                    icon="clipboard-list-outline"
                    label={`NERM\nInventory`}
                    onPress={() => alert("Under Development")}
                    // onPress={() => set_tds_ui_navigation("nerm_inventory")}
                  />
                </View>

                {/* Logout Section */}
                <View style={tw`mt-4 pt-6 border-t border-gray-50`}>
                  <TouchableOpacity
                    style={tw`w-full bg-[#028543] py-4 rounded-lg flex-row justify-center items-center`}
                    onPress={() => set_is_logout_tds_modal_open(true)}
                  >
                    <MaterialCommunityIcons
                      name="logout"
                      size={20}
                      color="white"
                      style={tw`mr-2`}
                    />
                    <Text
                      style={tw`text-base font-bold text-white tracking-wide uppercase`}
                    >
                      LOGOUT
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* - [Navigation Buttons] OSA, MD, & EP */}
          </View>

          {/* + [Modal] LOGOUT CONFIRM */}
          <Modal isOpen={is_logout_tds_modal_open}>
            <View
              style={tw`bg-white w-[95%] rounded-[30px] p-6 items-center shadow-2xl`}
            >
              {/* Header Section */}
              <View style={tw`items-center mb-6`}>
                <View
                  style={tw`h-20 w-20 rounded-full bg-red-50 justify-center items-center mb-4`}
                >
                  <MaterialIcons name="exit-to-app" size={42} color="#ef4444" />
                </View>
                <Text style={tw`text-xl font-bold text-gray-800`}>
                  End Session?
                </Text>
                <Text style={tw`text-gray-400 text-sm text-center mt-1`}>
                  Review your task progress before logging out.
                </Text>
              </View>

              {/* + MCP INDICATION GRID */}
              <View
                style={tw`w-full bg-gray-50 rounded-2xl px-2 pt-5 pb-1 mb-6`}
              >
                <View style={tw`flex-row flex-wrap justify-between`}>
                  {[
                    { id: "osa", label: "OSA" },
                    { id: "md", label: "MD" },
                    { id: "ep", label: "EP" },
                    { id: "trade_rental", label: "TR" },
                    { id: "audit_survey", label: "AS" },
                    { id: "share_of_shelf", label: "SOS" },
                    { id: "price_survey", label: "Price" },
                    { id: "rtv", label: "RTV" },
                    { id: "nerm_inventory", label: "NERM" },
                  ].map((item) => {
                    const isDone = verify_check_status(item.id);
                    return (
                      <View key={item.id} style={tw`w-[33%] items-center mb-2`}>
                        <View
                          style={tw`h-10 w-10 rounded-lg justify-center items-center border-2 
                ${isDone ? "bg-[#028543] border-[#028543]" : "bg-white border-gray-200"}`}
                        >
                          <FontAwesome
                            name={isDone ? "check" : "clock-o"}
                            size={16}
                            color={isDone ? "#FFF" : "#D1D5DB"}
                          />
                        </View>
                        <Text
                          style={tw`text-[2.5] mt-1 font-bold text-gray-500 uppercase`}
                        >
                          {item.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              {/* - MCP INDICATION GRID */}

              {/* Actions */}
              <View style={tw`w-full flex-row gap-3`}>
                <TouchableOpacity
                  style={tw`flex-1 bg-[#028543] py-4 rounded-xl justify-center items-center`}
                  onPress={handle_open_training_log}
                  // onPress={() =>
                  //   verify_progress_logout(general_tds_timelog_link.a1_ID)
                  // }
                >
                  {is_logout_loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text
                      style={tw`text-white font-bold text-center uppercase tracking-wider`}
                    >
                      Confirm
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`flex-1 bg-gray-100 border border-gray-200 py-4 rounded-xl justify-center items-center`}
                  onPress={() => set_is_logout_tds_modal_open(false)}
                >
                  <Text
                    style={tw`text-gray-500 font-bold text-center uppercase tracking-wider`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* - [Modal] LOGOUT CONFIRM */}
          <View style={tw`absolute left-[4] bottom-[1]`}>
            <Text style={tw`text-[#DCDCDC] text-[16px]`}>{app_version}</Text>
          </View>
        </ImageBackground>
      </React.Fragment>
    );
  };

  const handle_open_trade_rental = () => {
    set_display_modal("");
    set_tds_ui_navigation("tap");
  };
  const handle_open_audit_survey = () => {
    set_display_modal("");
    set_tds_ui_navigation("audit_survey");
  };

  const handle_open_training_log = () => {
    set_display_modal("with_updated_diser");
  };

  const [selected_merch_data, set_selected_merch_data] = useState(null);

  const handle_merchandiser_submit = (selected_merch) => {
    set_selected_merch_data(selected_merch);
    set_display_modal("training_survey"); // Buksan ang survey modal
  };

  const handle_survey_complete = async (final_answers) => {
    if (!final_answers || final_answers.length === 0) return;

    try {
      const updates = {};
      const BASE_PATH = "/DB_TEST/TBL_TL_HISTORY/DATA";

      final_answers.forEach((item) => {
        // Construct the specific ID Path
        const combined_id = `${item.tds_code}_${item.store_code}_${item.plantilla_code}_${item.id}`;

        updates[`${BASE_PATH}/${combined_id}`] = {
          id: item.id,
          tds_code: item.tds_code,
          store_code: item.store_code,
          plantilla_code: item.plantilla_code,
          survey: item.survey,
          module: item.module,
          answer: item.answer,
          row_no: item.row_no,
          date_uploaded: item.date_uploaded, // Orihinal na upload date
          survey_date: item.survey_date, // Petsa kung kailan sinagutan
          uploaded_by: item.uploaded_by,
        };
      });

      await update(ref(db), updates);
      console.log("SUCCESS");
      verify_progress_logout(general_tds_timelog_link.a1_ID);
      return { success: true };
    } catch (error) {
      console.error("Error saving TL History:", error);
    }
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      {tds_ui_navigation === "main_page" ? render_main_page() : null}
      {tds_ui_navigation === "osa" ? (
        <P1_OSA
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "md" ? (
        <P2_MD
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "ep" ? (
        <P3_EP
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "tap" ? (
        <P4_TAP
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "trade_rental" ? (
        <P5_TRADE_RENTAL
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "audit_survey" ? (
        <P6_AUDIT_SURVEY
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "share_of_shelf" ? (
        <P8_SOS
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "price_survey" ? (
        <P9_PRICE_SURVEY
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}
      {tds_ui_navigation === "rtv" ? (
        <P10_RTV
          tds_ui_navigation={tds_ui_navigation}
          set_tds_ui_navigation={set_tds_ui_navigation}
          general_selected_mcp={general_selected_mcp}
          user_account_data={user_account_data}
        />
      ) : null}

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
        </View>
      </Modal>
      {/* - [Modal] Geofence Authentication Loading */}
      {/* + [Modal] Trade Audit Selection */}
      <Modal isOpen={display_modal === "select_trade_audit"}>
        <View style={tw`bg-white w-full rounded-xl`}>
          <View
            style={tw`flex flex-row justify-center items-center mt-[15] pl-5`}
          >
            <View style={tw`flex-5`}>
              <Text
                style={tw`text-[5.4] tracking-[0.1] font-bold text-[#028543]`}
              >
                Trade Audit Selection
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
          <View style={tw`flex w-full flex gap-4 px-3 my-[20]`}>
            <TouchableOpacity
              style={tw`w-full flex justify-center items-center bg-[#028543] p-3 rounded-lg h-[24]`}
              onPress={() => {
                handle_open_trade_rental();
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Trade Rentals
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`w-full flex justify-center items-center bg-[#028543] p-3 rounded-lg h-[24]`}
              onPress={() => {
                handle_open_audit_survey();
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-white text-center`}
              >
                Audit Survey
              </Text>
            </TouchableOpacity>
          </View>
          <View style={tw`w-full p-3`}>
            <TouchableOpacity
              style={tw`w-full bg-gray-100 border border-gray-300 p-3 rounded-lg`}
              onPress={() => {
                set_display_modal("");
              }}
            >
              <Text
                style={tw`text-lg font-bold tracking-wider text-gray-500 text-center`}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <With_Updated_Diser
        is_open={display_modal === "with_updated_diser"}
        on_cancel={() => set_display_modal("")}
        on_yes={() => set_display_modal("select_merch")}
        on_no={() => verify_progress_logout(general_tds_timelog_link.a1_ID)}
      />
      <Select_Merch
        is_open={display_modal === "select_merch"}
        selected_store_code={general_selected_mcp.a3_STORE_CODE}
        on_cancel={() => set_display_modal("")}
        on_confirm={handle_merchandiser_submit}
        on_save={() => verify_progress_logout(general_tds_timelog_link.a1_ID)}
      />
      <Training_Survey
        is_open={display_modal === "training_survey"}
        tds_code={user_account_data.e1_PC}
        store_code={general_selected_mcp.a3_STORE_CODE}
        selected_merch_data={selected_merch_data}
        on_cancel={() => set_display_modal("")}
        on_complete={handle_survey_complete}
      />
    </React.Fragment>
  );
};

export default C3_TDS_MODULE;
