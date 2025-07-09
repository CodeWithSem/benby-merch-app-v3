import React, { useEffect, useState } from "react";
import "../../global.css";
import * as Location from "expo-location";
import { View, Text, Button, TouchableOpacity } from "react-native";
import C1_LOGIN_MODULE from "../C1_LOGIN_MODULE/C1_LOGIN_MODULE";
import C2_MCP_MODULE from "../C2_MCP_MODULE/C2_MCP_MODULE";

const C0_NAVIGATION = () => {
  const app_version = "v 2.0.0";
  const db_version_path =
    "/DB2_BENBY_MERCH_APP/TBL_MAINTAINABLE/APP_VERSIONS/2-0-0/VALUE";

  const [ui_navigation, set_ui_navigation] = useState("login");

  const [location, set_location] = useState(null);

  const [user_account_data, set_user_account_data] = useState({});

  const initial_mcp_state = {
    a1_MCP_ID: 0,
    a2_SELECTED_STORE: "NO STORE SELECTED",
    a3_STORE_CODE: "",
    a4_DIVERSION: "NORMAL",
  };

  const initial_store_timelog_state = {
    Storecode: "",
    TimeIn: "",
    TimeOut: "",
    DateCreated: "",
    EmployeeID: "",
    Datetime: "",
    attachment_file_name: "",
    attachment_content_type: "",
    attachment_file: "",
    Address: "",
    Period: "",
    Week: "",
    Remarks: "",
    LongitudeRange: "",
    LatitudeRange: "",
    Latitude: "",
    Longtitude: "",
  };

  const initial_diver_remarks_state = {
    a1_ID: 0,
    a2_DESC: "SELECT REMARKS",
  };

  const initial_tds_timelog_link_state = {
    a1_ID: 0,
    a2_STORE_CODE: "",
  };

  const [general_selected_mcp, set_general_selected_mcp] =
    useState(initial_mcp_state);
  const [selected_diver_remarks, set_selected_diver_remarks] = useState(
    initial_diver_remarks_state
  );
  const [general_tds_timelog_link, set_general_tds_timelog_link] = useState(
    initial_tds_timelog_link_state
  );
  const [general_storetimelog, set_general_storetimelog] = useState(
    initial_store_timelog_state
  );

  // + Reset General Data
  const reset_general_data = () => {
    set_general_selected_mcp(initial_mcp_state);
    set_selected_diver_remarks(initial_diver_remarks_state);
    set_general_tds_timelog_link(initial_tds_timelog_link_state);
    set_general_storetimelog(initial_store_timelog_state);
  };
  // - Reset General Data

  // + Get Location
  const [error_location, set_error_location] = useState("");

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        set_error_location("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      set_location(location);
    })();
  }, []);

  const get_location = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      set_error_location("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    set_location(location);
  };

  let location_text = "Waiting...";
  if (error_location) {
    location_text = error_location;
  } else if (location) {
    location_text = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;
  }
  // - Get Location

  // RETURN ORIGIN
  return (
    <React.Fragment>
      {ui_navigation === "login" ? (
        <C1_LOGIN_MODULE
          app_version={app_version}
          db_version_path={db_version_path}
          get_location={get_location}
          set_ui_navigation={set_ui_navigation}
          set_user_account_data={set_user_account_data}
        />
      ) : null}
      {ui_navigation === "mcp" ? (
        <C2_MCP_MODULE
          app_version={app_version}
          ui_navigation={ui_navigation}
          set_ui_navigation={set_ui_navigation}
          user_account_data={user_account_data}
          general_selected_mcp={general_selected_mcp}
          set_general_selected_mcp={set_general_selected_mcp}
          location={location}
          selected_diver_remarks={selected_diver_remarks}
          set_selected_diver_remarks={set_selected_diver_remarks}
          set_general_tds_timelog_link={set_general_tds_timelog_link}
          set_general_storetimelog={set_general_storetimelog}
        />
      ) : null}
      {/* <View className="flex-1 items-center justify-center bg-white">
        <Text>Location {text}</Text>
        <TouchableOpacity
          className="bg-[#028543] justify-center items-center rounded-lg w-[150] h-[50]"
          onPress={() => get_location()}
        >
          <Text className="text-[5] text-[#FFF] tracking-[0.7] font-bold">
            Get Location
          </Text>
        </TouchableOpacity>
      </View> */}
    </React.Fragment>
  );
};

export default C0_NAVIGATION;
