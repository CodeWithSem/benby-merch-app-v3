import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image } from "react-native";
import tw from "twrnc";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";

const P4_TAP = ({
  tds_ui_navigation,
  set_tds_ui_navigation,
  general_selected_mcp,
  user_account_data,
}) => {
  const [beforeUri, setBeforeUri] = useState(null);
  const [afterUri, setAfterUri] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({
    before: false,
    after: false,
  });

  const viewShotRef = useRef(null);

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (type === "before") {
        setBeforeUri(resized.uri);
        setImagesLoaded((prev) => ({ ...prev, before: false }));
      } else {
        setAfterUri(resized.uri);
        setImagesLoaded((prev) => ({ ...prev, after: false }));
      }
    }
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={[tw`flex w-full h-full gap-[4] pt-[45]`, styles.overlay]}>
        <View style={[tw`flex-1 w-full p-[4]`]}>
          <View style={[tw`flex justify-center items-center w-full h-[14]`]}>
            <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
              BEFORE IMAGE
            </Text>
          </View>
          <View style={[tw`flex justify-center items-center w-full`]}>
            <View style={[tw`h-[60] w-[70]`]}>
              <TouchableOpacity
                style={tw`flex h-full w-full justify-center items-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] p-[4]`}
                onPress={() => pickImage("before")}
              >
                {/* <FontAwesome name="camera" size={82} color={"#028543"} /> */}
                {beforeUri ? (
                  <React.Fragment>
                    <Image
                      source={{ uri: beforeUri }}
                      style={tw`w-full h-full rounded-[1.5]`}
                    />
                  </React.Fragment>
                ) : (
                  <FontAwesome name="camera" size={82} color={"#028543"} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={[tw`flex-1 w-full p-[4]`]}>
          <View style={[tw`flex justify-center items-center w-full h-[14]`]}>
            <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
              AFTER IMAGE
            </Text>
          </View>
          <View style={[tw`flex justify-center items-center w-full`]}>
            <View style={[tw`h-[60] w-[70]`]}>
              <TouchableOpacity
                style={tw`flex h-full w-full justify-center items-center bg-[#fff] rounded-lg border-[0.5] border-[#028543]`}
              >
                <FontAwesome name="camera" size={82} color={"#028543"} />
                {/* {capturedImage ? (
                  <>
                    <Image
                      source={{ uri: capturedImage }}
                      style={tw`w-full h-full rounded-[1.5]`}
                    />
                  </>
                ) : (
                  <FontAwesome name="camera" size={142} color={"#028543"} />
                )} */}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View
          style={[
            tw`flex flex-row justify-center items-center w-full gap-[2] p-[12]`,
          ]}
        >
          <TouchableOpacity
            style={[
              tw`flex-1 h-[12] justify-center items-center bg-[#028543] rounded-lg`,
            ]}
          >
            <Text
              style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
            >
              SAVE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              tw`flex-1 h-[12] justify-center items-center bg-[#6C757D] rounded-lg`,
            ]}
          >
            <Text
              style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
            >
              CANCEL
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    zIndex: 2,
    backgroundColor: "#FFF",
  },
  camera_overlay: {
    position: "absolute",
    zIndex: 3,
    backgroundColor: "#FFF",
  },
});

export default P4_TAP;
