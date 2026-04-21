import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Modal, // Dinagdag para sa Reference Photo
} from "react-native";
import tw from "twrnc";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
// import * as FileSystem from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import ViewShot from "react-native-view-shot";
import AFTER_IMG_CAMERA from "./AFTER_IMG_CAMERA";
import BEFORE_IMG_CAMERA_1 from "./BEFORE_IMG_CAMERA_1";
import { formate_date } from "../../../../../assets/scripts/functions/format_value";
import axios from "axios";
import BenbyLogo from "../../../../../assets/images/benby-apk-logo.png";

const TAP_CAMERA = ({
  GENERAL_USERNAME,
  update_before_img_ind,
  selected_tap,
  set_show_tap_camera,
}) => {
  const [show_after_img_camera, set_show_after_img_camera] = useState(false);
  const [show_before_img_camera, set_show_before_img_camera] = useState(false);
  const [show_reference_modal, set_show_reference_modal] = useState(false); // State para sa modal
  const [beforeUri, setBeforeUri] = useState(null);
  const [afterUri, setAfterUri] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({
    before: false,
    after: false,
  });
  const [is_save_img_loading, set_is_save_img_loading] = useState(false);

  const viewShotRef = useRef(null);

  // --- EXISTING FUNCTIONS (NO CHANGES) ---
  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
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
      upload_image_api();
    }
  };

  const upload_image_api = async () => {
    const date_now = new Date();
    if (!imagesLoaded.before || !imagesLoaded.after) {
      Alert.alert("Saving Image", "Please wait for images to fully load.");
      return;
    }
    try {
      set_is_save_img_loading(true);
      const uri = await viewShotRef.current.capture();
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const filename = uri.split("/").pop();
      const tap_image_data = {
        AttachmentFile: base64,
        AttachmentFileName: filename,
        AttachmentContentType: "image",
        DateCreated: formate_date(date_now, "mm/dd/yyyy"),
        EmployeeID: GENERAL_USERNAME,
        TRID: selected_tap.a1_ID,
      };

      const response = await axios.post(
        "https://benbyextportal.com/insert/api/PostTradeAuditAndPhotosImages",
        tap_image_data,
      );
      if (response.status >= 200 && response.status <= 210) {
        await update_before_img_ind(selected_tap);
        set_is_save_img_loading(false);
      } else {
        set_is_save_img_loading(false);
        Alert.alert(
          "Upload Failed",
          "There was an error on uploading the image. Please try again.",
        );
      }
    } catch (error) {
      set_is_save_img_loading(false);
      Alert.alert(
        "Upload Failed",
        "There was an error on uploading the image. Please try again.",
      );
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
        { text: "Import photo", onPress: () => pickImage("before") },
        {
          text: "Take picture",
          onPress: () => set_show_before_img_camera(true),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  const choose_after_img_option = () => {
    Alert.alert(
      "Choose an option",
      "What would you like to do?",
      [
        { text: "Import photo", onPress: () => pickImage("after") },
        {
          text: "Take picture",
          onPress: () => set_show_after_img_camera(true),
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  };

  // --- UI RENDER ---
  return (
    <React.Fragment>
      <View style={[tw`flex w-full h-full gap-[4] pt-[15]`, styles.overlay]}>
        {/* HEADER SECTION WITH REFERENCE BUTTON */}
        <View style={tw`flex-row justify-center items-center pt-4`}>
          <TouchableOpacity
            onPress={() => set_show_reference_modal(true)}
            style={tw`bg-[#028543] px-4 py-2 rounded-full flex-row items-center`}
          >
            <FontAwesome
              name="image"
              size={14}
              color="white"
              style={tw`mr-2`}
            />
            <Text style={tw`text-white font-bold text-[3]`}>
              VIEW REFERENCE
            </Text>
          </TouchableOpacity>
        </View>

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
                  <Image
                    source={{ uri: beforeUri }}
                    style={tw`w-full h-full rounded-[1.5]`}
                  />
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
                  <Image
                    source={{ uri: afterUri }}
                    style={tw`w-full h-full rounded-[1.5]`}
                  />
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
            disabled={is_save_img_loading}
          >
            <Text
              style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
            >
              {is_save_img_loading ? "SAVING..." : "SAVE"}
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

      {/* --- PHOTO REFERENCE MODAL --- */}
      <Modal
        visible={show_reference_modal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => set_show_reference_modal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-bold text-[#028543]`}>
                Photo Reference
              </Text>
              <TouchableOpacity onPress={() => set_show_reference_modal(false)}>
                <Ionicons name="close-circle" size={32} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <View
              style={tw`w-full p-2 h-80 border border-gray-300 border-dashed rounded-lg overflow-hidden`}
            >
              {/* PALITAN ITO NG ACTUAL IMAGE SOURCE MO */}
              <Image
                source={BenbyLogo}
                style={tw`w-full h-full`}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              style={tw`mt-6 bg-[#028543] py-3 rounded-lg shadow-sm`}
              onPress={() => set_show_reference_modal(false)}
            >
              <Text style={tw`text-white text-center font-bold text-lg`}>
                GOT IT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CAMERA COMPONENTS */}
      {show_after_img_camera && (
        <AFTER_IMG_CAMERA
          set_show_after_img_camera={set_show_after_img_camera}
          setAfterUri={setAfterUri}
        />
      )}
      {show_before_img_camera && (
        <BEFORE_IMG_CAMERA_1
          set_show_before_img_camera={set_show_before_img_camera}
          setBeforeUri={setBeforeUri}
        />
      )}

      {/* Hidden off-screen rendering for ViewShot */}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
