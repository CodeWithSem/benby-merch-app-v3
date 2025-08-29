import React, { useState } from "react";
import { db } from "../../assets/scripts/firebase";
import { get, set, ref, update } from "firebase/database";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import tw from "twrnc";

const C1_LOGIN_MODULE = ({
  app_version,
  db_version_path,
  expo_push_notif_token,
  get_location,
  set_ui_navigation,
  set_user_account_data,
}) => {
  const verify_version = async () => {
    try {
      set_is_login_loading(true);
      const response = await get(ref(db, db_version_path));
      let data = response.val();
      if (data) {
        handle_login(username, password);
      } else {
        alert("This APK is outdated");
        set_is_login_loading(false);
      }
    } catch (error) {
      alert(error);
    }
  };

  const [is_login_loading, set_is_login_loading] = useState(false);
  const [invalid_cred, set_invalid_cred] = useState(false);
  const [username, set_username] = useState("");
  const [password, set_password] = useState("");
  const [show_password, set_show_password] = useState(false);

  const handle_login = async (u_name, pass) => {
    try {
      const response = await get(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_USER/ACCOUNT/${u_name}`)
      );
      let data = response.val();
      if (data !== null) {
        if (pass === data.a2_Password) {
          add_expo_push_token(data);
          // get_user_data(data.a3_Ref_ID);
        } else {
          // Incorrect password
          set_invalid_cred(true);
          set_is_login_loading(false);
        }
      } else {
        // Username does not exist
        set_invalid_cred(true);
        set_is_login_loading(false);
      }
    } catch (error) {
      alert(error);
      set_invalid_cred(true);
      set_is_login_loading(false);
    }
  };

  const add_expo_push_token = async (data) => {
    const push_notif_data = {
      username: data.a1_Username,
      token: expo_push_notif_token,
    };
    try {
      await update(
        ref(
          db,
          `/DB2_BENBY_MERCH_APP/TBL_PUSH_NOTIFICATION/USERS/${data.a1_Username}`
        ),
        push_notif_data
      );
      get_user_data(data.a3_Ref_ID);
    } catch (error) {
      alert(error);
    }
  };

  const get_user_data = async (id) => {
    try {
      const response = await get(
        ref(db, `/DB1_BENBY_MERCH_APP/TBL_USER/DATA/${id}`)
      );
      let data = response.val();
      if (data !== null) {
        set_user_account_data(data);
        set_invalid_cred(false);
        get_location();
        setTimeout(() => {
          set_is_login_loading(false);
          set_ui_navigation("mcp_module");
        }, 4000);
      } else {
        // User data does not exist
        alert("Check Internet Connection");
        set_is_login_loading(false);
      }
    } catch (error) {
      alert("Check Internet Connection");
      set_is_login_loading(false);
    }
  };
  // RETURN ORIGIN
  return (
    <React.Fragment>
      <ImageBackground
        source={require("../../assets/images/ui/Background.jpg")}
        style={[styles.imageBackground]}
      >
        <View
          style={[tw`flex justify-center items-center`, styles.main_container]}
        >
          <View style={[styles.card]}>
            <View style={tw`w-full h-[21] justify-center items-center`}>
              <Image
                source={require("../../assets/images/ui/benby-logo.png")}
                style={[tw`h-full mr-[4]`, { tintColor: "green" }]}
                resizeMode="contain"
              />
            </View>
            <View style={tw`w-full justify-center items-center`}>
              <Text
                style={[
                  tw`text-[7] text-center font-bold text-[#028543] tracking-[0.2]`,
                ]}
              >
                BEST-IN-CLASS{"\n"}EXECUTION
              </Text>
            </View>
            <View style={tw`w-full justify-center items-center`}>
              <View
                style={tw`bg-black/5 flex-row justify-center border-[0.4] border-[#D4D4D4] rounded-lg w-full h-[14] my-[7] pr-[10]`}
              >
                <View style={tw`w-[12] justify-center items-center pl-1`}>
                  <FontAwesome6 name={"circle-user"} size={24} color={"gray"} />
                </View>
                <TextInput
                  autoCapitalize="none"
                  selectionColor="#028543"
                  placeholder="Username"
                  placeholderTextColor={`#CDCDCD`}
                  style={[tw`flex-1 text-[4.2] flex-6 tracking-[0.2] h-full`]}
                  value={username || ""}
                  onChangeText={(text) => set_username(text)}
                ></TextInput>
              </View>
            </View>
            <View style={tw`w-full justify-center items-center`}>
              <View
                style={tw`bg-black/5 flex-row justify-center border-[0.4] border-[#D4D4D4] rounded-lg w-full h-[14] my-[7] pr-[10]`}
              >
                <View style={tw`w-[12] justify-center items-center pl-1`}>
                  <FontAwesome name={"lock"} size={24} color={"gray"} />
                </View>
                <TextInput
                  autoCapitalize="none"
                  selectionColor="#028543"
                  secureTextEntry={show_password ? false : true}
                  placeholder="Password"
                  placeholderTextColor={`#CDCDCD`}
                  style={[tw`flex-1 text-[4.2] tracking-[0.2] h-full`]}
                  value={password || ""}
                  onChangeText={(text) => set_password(text)}
                />
                <TouchableOpacity
                  style={tw`w-[10] justify-center items-center`}
                  onPress={() => set_show_password(!show_password)}
                >
                  {/* <FontAwesome name={"lock"} size={24} color={"gray"} /> */}

                  {show_password ? (
                    <MaterialIcons
                      name={"visibility"}
                      size={20}
                      color={"gray"}
                    />
                  ) : (
                    <MaterialIcons
                      name={"visibility-off"}
                      size={20}
                      color={"gray"}
                    />
                  )}
                </TouchableOpacity>

                {/* <TouchableOpacity
                  style={{
                    height: "100%",
                    width: 50,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={() => set_show_password(!show_password)}
                >
                  {show_password ? (
                    <MaterialIcons
                      name={"visibility"}
                      size={20}
                      color={"#FFF"}
                    />
                  ) : (
                    <MaterialIcons
                      name={"visibility-off"}
                      size={20}
                      color={"#FFF"}
                    />
                  )}
                </TouchableOpacity> */}
              </View>
            </View>
            <View style={tw`w-full justify-center items-center h-[5]`}>
              {invalid_cred ? (
                <Text style={tw`tracking-[0.1] text-[red] text-[3.2]`}>
                  Invalid Credentials. Please try again.
                </Text>
              ) : null}
            </View>
            <View style={tw`w-full justify-center items-center mt-[15]`}>
              <TouchableOpacity
                style={tw`bg-[#028543] justify-center items-center rounded-lg w-full h-[14]`}
                onPress={() => verify_version()}
                disabled={is_login_loading}
              >
                {!is_login_loading ? (
                  <Text
                    style={tw`text-[5] text-[#fff] tracking-[0.7] font-bold`}
                  >
                    LOGIN
                  </Text>
                ) : null}

                {is_login_loading ? (
                  <ActivityIndicator size={24} color="#FFF" />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={tw`absolute left-[4] bottom-[4]`}>
          <Text style={tw`text-[#DCDCDC] text-[16px]`}>{app_version}</Text>
        </View>
      </ImageBackground>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    flex: 1,
    height: 900,
    width: "100%",
  },
  main_container: {
    flex: 1,
    flexDirection: "column",
  },
  card: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 10,
    alignItems: "center",
  },
  font_poppins: {
    fontFamily: "Poppins",
  },
});

export default C1_LOGIN_MODULE;
