import React, { useEffect, useState } from "react";
import * as Location from "expo-location";
import C1_LOGIN_MODULE from "../C1_LOGIN_MODULE/C1_LOGIN_MODULE";
import C2_MCP_MODULE from "../C2_MCP_MODULE/C2_MCP_MODULE";
import C3_TDS_MODULE from "../C3_TDS_MODULE/C3_TDS_MODULE";

const C0_NAVIGATION = ({ expo_push_notif_token }) => {
  const app_version = "v 2.0.1";
  const db_version_path =
    "/DB2_BENBY_MERCH_APP/TBL_MAINTAINABLE/APP_VERSIONS/2-0-1/VALUE";

  const [ui_navigation, set_ui_navigation] = useState("login_module");

  const [location, set_location] = useState(null);

  const [user_account_data, set_user_account_data] = useState({});

  const initial_mcp_state = {
    a1_MCP_ID: 0,
    a2_SELECTED_STORE: "NO STORE SELECTED",
    a3_STORE_CODE: "",
    a4_DIVERSION: "NORMAL",
    a5_CHANNEL: "",
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
  // + [Script] Geofencing
  const [current_location, set_current_location] = useState({
    longitude: "",
    latitude: "",
    status: "",
  });

  const get_current_location = async () => {
    set_current_location({
      longitude: "",
      latitude: "",
      status: "waiting",
    });

    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission to access location was denied");
      set_current_location((prev) => ({
        ...prev,
        status: "denied",
      }));
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      set_current_location({
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        status: "complete",
      });
      return location;
    } catch (error) {
      console.error("Error getting location:", error);
      set_current_location({ longitude: "", latitude: "", status: "" });
    }
  };
  // - [Script] Geofencing

  // RETURN ORIGIN
  return (
    <React.Fragment>
      {ui_navigation === "login_module" ? (
        <C1_LOGIN_MODULE
          app_version={app_version}
          db_version_path={db_version_path}
          expo_push_notif_token={expo_push_notif_token}
          get_location={get_location}
          set_ui_navigation={set_ui_navigation}
          set_user_account_data={set_user_account_data}
        />
      ) : null}
      {ui_navigation === "mcp_module" ? (
        <C2_MCP_MODULE
          app_version={app_version}
          set_ui_navigation={set_ui_navigation}
          user_account_data={user_account_data}
          general_selected_mcp={general_selected_mcp}
          set_general_selected_mcp={set_general_selected_mcp}
          location={location}
          current_location={current_location}
          get_current_location={get_current_location}
          selected_diver_remarks={selected_diver_remarks}
          set_selected_diver_remarks={set_selected_diver_remarks}
          set_general_tds_timelog_link={set_general_tds_timelog_link}
          set_general_storetimelog={set_general_storetimelog}
        />
      ) : null}
      {ui_navigation === "tds_module" ? (
        <C3_TDS_MODULE
          app_version={app_version}
          set_ui_navigation={set_ui_navigation}
          reset_general_data={reset_general_data}
          user_account_data={user_account_data}
          general_selected_mcp={general_selected_mcp}
          set_general_selected_mcp={set_general_selected_mcp}
          general_tds_timelog_link={general_tds_timelog_link}
          general_storetimelog={general_storetimelog}
        />
      ) : null}
    </React.Fragment>
  );
};

export default C0_NAVIGATION;
