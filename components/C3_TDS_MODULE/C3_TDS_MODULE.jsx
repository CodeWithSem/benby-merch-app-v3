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
import P7_RTV from "./C3_PAGES/P7_RTV/P7_RTV";

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
    z1_md_status: 0,
    z2_osa_status: 0,
    z3_ep_status: 0,
    z4_tap_status: 0,
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
        tds_ui_navigation === "trade_rental" ||
        tds_ui_navigation === "audit_survey"
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
          z1_md_status: data.z1_md_status || 0,
          z2_osa_status: data.z2_osa_status || 0,
          z3_ep_status: data.z3_ep_status || 0,
          z4_tap_status: data.z4_tap_status || 0,
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
      db_ref_path = `/DB1_BENBY_MERCH_APP/TBL_MCP_1/DATA/${user_account_data.e1_PC}/${general_selected_mcp.a1_MCP_ID}`;
    } else {
      db_ref_path = `/DB1_BENBY_MERCH_APP/TBL_MANUAL_SELECTION_PROGRESS/DATA/${general_selected_mcp.a3_STORE_CODE}/${user_account_data.e1_PC}`;
    }

    if (db_ref_path) {
      onValue(ref(db, db_ref_path), (snapshot) => {
        const mcp_progress_data = snapshot.val();
        if (mcp_progress_data) {
          if (general_selected_mcp.a4_DIVERSION === "NOT_LISTED") {
            const data = {
              z1_md_status: verify_mcp_date(
                mcp_progress_data.b1_md_status,
                mcp_progress_data.b1_md_date_updated,
              ),
              z2_osa_status: verify_mcp_date(
                mcp_progress_data.b2_osa_status,
                mcp_progress_data.b2_osa_date_updated,
              ),
              z3_ep_status: verify_mcp_date(
                mcp_progress_data.b3_ep_status,
                mcp_progress_data.b3_ep_date_updated,
              ),
              z4_tap_status: verify_mcp_date(
                mcp_progress_data.b4_tap_status,
                mcp_progress_data.b4_tap_date_updated,
              ),
            };
            handle_mcp_prog_data(data);
          } else {
            handle_mcp_prog_data({
              z1_md_status: mcp_progress_data.z1_md_status,
              z2_osa_status: mcp_progress_data.z2_osa_status,
              z3_ep_status: mcp_progress_data.z3_ep_status,
              z4_tap_status: mcp_progress_data.z4_tap_status,
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
  //         // `You are outside the allowed location range.\n\n${store_loc}\n\n${user_loc}\n\n${current_distance}\n\n${accepted_distance}`, hereeee
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
    //   mcp_progress.z1_md_status === 1 &&
    //   mcp_progress.z2_osa_status === 1 &&
    //   mcp_progress.z3_ep_status === 1 &&
    //   mcp_progress.z4_tap_status === 1
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
  //     mcp_progress.z1_md_status === 1 &&
  //     mcp_progress.z2_osa_status === 1 &&
  //     mcp_progress.z3_ep_status === 1 &&
  //     mcp_progress.z4_tap_status === 1
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
    if (category === "md") {
      if (mcp_progress.z1_md_status === 1) {
        return "bg-[#028543]";
      } else {
        return "bg-[#FFF]";
      }
    } else if (category === "osa") {
      if (mcp_progress.z2_osa_status === 1) {
        return "bg-[#028543]";
      } else {
        return "bg-[#FFF]";
      }
    } else if (category === "ep") {
      if (mcp_progress.z3_ep_status === 1) {
        return "bg-[#028543]";
      } else {
        return "bg-[#FFF]";
      }
    } else if (category === "tap") {
      if (mcp_progress.z4_tap_status === 1) {
        return "bg-[#028543]";
      } else {
        return "bg-[#FFF]";
      }
    } else {
      return "";
    }
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
          <View style={tw`absolute w-full justify-center items-center h-full`}>
            {/* + [UI] Logo */}
            <View
              style={tw`w-full flex-1 justify-center items-start mt-[42] px-[20]`}
            >
              <Image
                source={require("../../assets/images/ui/benby-logo-white.png")} // Replace with your image path
                style={tw`w-[30]`}
                resizeMode="center"
              />
            </View>
            {/* - [UI] Logo */}
            <View style={tw`w-full flex-2 justify-center items-start px-[20]`}>
              <View style={tw`flex-3 w-full justify-center items-start`}>
                <Text
                  style={tw`text-[15] tracking-[0.2] text-[#fff] font-bold`}
                >
                  Welcome
                </Text>
              </View>
              <View style={tw`flex-2 w-full justify-center items-start`}>
                <Text style={tw`text-[6] tracking-[0.2] text-[#fff] font-bold`}>
                  {user_account_data.b1_TDS_FullName || ""}
                </Text>
              </View>
              <View style={tw`flex-1.5 w-full justify-center items-start`}>
                <Text
                  style={tw`text-[3.7] font-extralight tracking-[0.3] text-[#fff]`}
                >
                  USER ID: {user_account_data.e1_PC || ""}
                </Text>
              </View>
            </View>
            {/* + [Navigation Buttons] OSA, MD, & EP */}
            <View style={tw`w-full flex-8 justify-end px-5 pb-10`}>
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
                    icon="truck-delivery-outline"
                    label={`Return to\nVendor`}
                    onPress={() => set_tds_ui_navigation("rtv")}
                  />

                  <MenuButton
                    icon="cash-multiple"
                    label={`Price\nSurvey`}
                    onPress={() => set_tds_ui_navigation("price_survey")}
                  />

                  <MenuButton
                    icon="package-variant"
                    label={`Share of\nShelf`}
                    onPress={() => set_tds_ui_navigation("share_of_shelf")}
                  />
                  <MenuButton
                    icon="clipboard-list-outline"
                    label={`NERM\nInventory`}
                    onPress={() => set_tds_ui_navigation("share_of_shelf")}
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

          {/* + [Modal] Logout Confirmation */}
          <Modal isOpen={is_logout_tds_modal_open}>
            <View
              style={tw`bg-white flex justify-center items-center w-full rounded-xl px-[3]`}
            >
              <View
                style={tw`w-full justify-center items-center py-[5] mt-[10]`}
              >
                <View
                  style={tw`h-[25] w-[25] rounded-[100] bg-[#028543] justify-center items-center`}
                >
                  <MaterialIcons name="exit-to-app" size={52} color={"#FFF"} />
                </View>
              </View>

              <View
                style={tw`w-full justify-center items-center py-[5] my-[10]`}
              >
                <Text
                  style={tw`text-[4.4] text-center tracking-[0.2] text-[#404040]`}
                >
                  Are you sure you want to logout?
                </Text>
              </View>
              {/* + MCP INDICATION */}

              <View
                style={tw`w-full justify-center items-center py-[5] pl-[20] mt-[10]`}
              >
                <View style={tw`flex-row justify-center items-center`}>
                  <View style={tw`flex-0.4 justify-center items-center`}>
                    <View
                      style={tw`border justify-center items-center h-[6] w-[6] border-[0.4] border-[#028543] ${verify_check_status(
                        "md",
                      )}`}
                    >
                      <FontAwesome name="check" size={16} color={"#FFF"} />
                    </View>
                  </View>
                  <View style={tw`flex-1 justify-center items-start`}>
                    <Text style={tw`text-[4.2]`}>Merchandiser Deployment</Text>
                  </View>
                </View>
              </View>
              <View
                style={tw`w-full justify-center items-center py-[5] pl-[20] mt-[10]`}
              >
                <View style={tw`flex-row justify-center items-center`}>
                  <View style={tw`flex-0.4 justify-center items-center`}>
                    <View
                      style={tw`border justify-center items-center h-[6] w-[6] border-[0.4] border-[#028543] ${verify_check_status(
                        "osa",
                      )}`}
                    >
                      <FontAwesome name="check" size={16} color={"#FFF"} />
                    </View>
                  </View>
                  <View style={tw`flex-1 justify-center items-start`}>
                    <Text style={tw`text-[4.2]`}>On-Shelf Availability</Text>
                  </View>
                </View>
              </View>
              <View
                style={tw`w-full justify-center items-center py-[5] pl-[20] mt-[10]`}
              >
                <View style={tw`flex-row justify-center items-center`}>
                  <View style={tw`flex-0.4 justify-center items-center`}>
                    <View
                      style={tw`border justify-center items-center h-[6] w-[6] border-[0.4] border-[#028543] ${verify_check_status(
                        "tap",
                      )}`}
                    >
                      <FontAwesome name="check" size={16} color={"#FFF"} />
                    </View>
                  </View>
                  <View style={tw`flex-1 justify-center items-start`}>
                    <Text style={tw`text-[4.2]`}>Trade Audit & Photos</Text>
                  </View>
                </View>
              </View>
              <View
                style={tw`w-full justify-center items-center py-[5] pl-[20] mt-[10]`}
              >
                <View style={tw`flex-row justify-center items-center`}>
                  <View style={tw`flex-0.4 justify-center items-center`}>
                    <View
                      style={tw`border justify-center items-center h-[6] w-[6] border-[0.4] border-[#028543] ${verify_check_status(
                        "ep",
                      )}`}
                    >
                      <FontAwesome name="check" size={16} color={"#FFF"} />
                    </View>
                  </View>
                  <View style={tw`flex-1 justify-center items-start`}>
                    <Text style={tw`text-[4.2]`}>Execution Planner</Text>
                  </View>
                </View>
              </View>

              {/* - MCP INDICATION */}
              <View style={tw`w-full flex-row justify-between gap-3 p-3 mt-3`}>
                {is_logout_loading ? (
                  <View style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}>
                    <ActivityIndicator size="small" color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={tw`flex-1 bg-[#028543] p-3 rounded-lg`}
                    onPress={() => {
                      verify_progress_logout(general_tds_timelog_link.a1_ID);
                      // handle_logout(general_tds_timelog_link.a1_ID);
                    }}
                  >
                    <Text
                      style={tw`text-lg font-bold tracking-wider text-white text-center`}
                    >
                      Confirm
                    </Text>
                  </TouchableOpacity>
                )}

                {is_logout_loading ? (
                  <View style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}>
                    <Text
                      style={tw`text-lg font-bold tracking-wider text-white text-center`}
                    >
                      Cancel
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={tw`flex-1 bg-[#6C757D] p-3 rounded-lg`}
                    onPress={() => {
                      set_is_logout_tds_modal_open(false);
                    }}
                  >
                    <Text
                      style={tw`text-lg font-bold tracking-wider text-white text-center`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>
          {/* - [Modal] Logout Confirmation */}
          <View style={tw`absolute left-[4] bottom-[1]`}>
            <Text style={tw`text-[#DCDCDC] text-[16px]`}>{app_version}</Text>
          </View>
        </ImageBackground>
      </React.Fragment>
    );
  };

  const handle_open_trade_rental = () => {
    set_display_modal("");
    set_tds_ui_navigation("trade_rental");
  };
  const handle_open_audit_survey = () => {
    set_display_modal("");
    set_tds_ui_navigation("audit_survey");
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
      {tds_ui_navigation === "rtv" ? (
        <P7_RTV
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
      {/* - [Modal] Trade Audit Selection */}
    </React.Fragment>
  );
};

export default C3_TDS_MODULE;
