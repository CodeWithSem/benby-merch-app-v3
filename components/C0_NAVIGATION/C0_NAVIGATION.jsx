import React, { useEffect, useState } from "react";
import "../../global.css";
import * as Location from "expo-location";
import { View, Text, Button, TouchableOpacity } from "react-native";
import C1_LOGIN_MODULE from "../C1_LOGIN_MODULE/C1_LOGIN_MODULE";

const C0_NAVIGATION = () => {
  const app_version = "v 2.0.0";
  const db_version_path =
    "/DB2_BENBY_MERCH_APP/TBL_MAINTAINABLE/APP_VERSIONS/2-0-0/VALUE";

  const [ui_navigation, set_ui_navigation] = useState("login");

  const [user_account_data, set_user_account_data] = useState({});

  // + Get Location
  const [location, set_location] = useState(null);
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
