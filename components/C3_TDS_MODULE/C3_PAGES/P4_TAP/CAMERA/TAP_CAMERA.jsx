import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
} from "react-native";
import tw from "twrnc";
import { FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";
import AFTER_IMG_CAMERA from "./AFTER_IMG_CAMERA";
import BEFORE_IMG_CAMERA_1 from "./BEFORE_IMG_CAMERA_1";

const TAP_CAMERA = ({
  update_before_img_ind,
  selected_tap,
  set_show_tap_camera,
}) => {
  const [show_after_img_camera, set_show_after_img_camera] = useState(false);
  const [show_before_img_camera, set_show_before_img_camera] = useState(false);
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

  const verify_images = () => {
    if (!beforeUri && !afterUri) {
      Alert.alert("Invalid Image", "Please select BEFORE and AFTER images");
    } else if (!beforeUri) {
      Alert.alert("Invalid Image", "Please select BEFORE image");
    } else if (!afterUri) {
      Alert.alert("Invalid Image", "Please select AFTER image");
    } else {
      captureAndSave();
    }
  };

  const captureAndSave = async () => {
    if (!imagesLoaded.before || !imagesLoaded.after) {
      Alert.alert("Saving Image", "Please wait for images to fully load.");
      return;
    }

    try {
      const uri = await viewShotRef.current.capture();

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Cannot save image.");
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      // update_implemented_tap(selected_tap);
      update_before_img_ind(selected_tap.a1_ID);
    } catch (err) {
      console.error("Capture error:", err);
      Alert.alert("Error", "Failed to save image.");
    }
  };

  const choose_before_img_option = () => {
    Alert.alert(
      "Choose an option",
      "What would you like to do?",
      [
        {
          text: "Import photo",
          onPress: () => {
            pickImage("before");
          },
        },
        {
          text: "Take picture",
          onPress: () => {
            set_show_before_img_camera(true);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const choose_after_img_option = () => {
    Alert.alert(
      "Choose an option",
      "What would you like to do?",
      [
        {
          text: "Import photo",
          onPress: () => {
            pickImage("after");
          },
        },
        {
          text: "Take picture",
          onPress: () => {
            set_show_after_img_camera(true);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
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
                onPress={choose_before_img_option}
              >
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
                style={tw`flex h-full w-full justify-center items-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] p-[4]`}
                onPress={choose_after_img_option}
              >
                {afterUri ? (
                  <React.Fragment>
                    <Image
                      source={{ uri: afterUri }}
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
        <View
          style={[
            tw`flex flex-row justify-center items-center w-full gap-[2] p-[12]`,
          ]}
        >
          <TouchableOpacity
            style={[
              tw`flex-1 h-[12] justify-center items-center bg-[#028543] rounded-lg`,
            ]}
            onPress={verify_images}
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
            onPress={() => set_show_tap_camera(false)}
          >
            <Text
              style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
            >
              CANCEL
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {show_after_img_camera ? (
        <AFTER_IMG_CAMERA
          set_show_after_img_camera={set_show_after_img_camera}
          setAfterUri={setAfterUri}
        />
      ) : null}
      {show_before_img_camera ? (
        <BEFORE_IMG_CAMERA_1
          set_show_before_img_camera={set_show_before_img_camera}
          setBeforeUri={setBeforeUri}
        />
      ) : null}
      {/* Hidden off-screen rendering */}
      <View style={styles.hidden}>
        {beforeUri && afterUri && (
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 1, result: "tmpfile" }}
          >
            <View style={styles.hidden_combinedContainer}>
              <Image
                source={{ uri: beforeUri }}
                style={styles.hidden_image}
                onLoadEnd={() =>
                  setImagesLoaded((prev) => ({ ...prev, before: true }))
                }
              />
              <Image
                source={{ uri: afterUri }}
                style={styles.hidden_image}
                onLoadEnd={() =>
                  setImagesLoaded((prev) => ({ ...prev, after: true }))
                }
              />
            </View>
          </ViewShot>
        )}
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
  hidden: {
    position: "absolute",
    top: -1000,
    left: -1000,
    width: 800,
    height: 400,
  },
  hidden_combinedContainer: {
    flexDirection: "row",
    width: 800,
    height: 400,
  },
  hidden_image: {
    width: 400,
    height: 400,
  },
});

export default TAP_CAMERA;
