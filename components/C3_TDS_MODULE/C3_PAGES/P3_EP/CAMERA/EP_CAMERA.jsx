import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import ViewShot from "react-native-view-shot";
import axios from "axios";
import { formate_date } from "../../../../../assets/scripts/functions/format_value";
import AFTER_IMG_CAMERA from "./AFTER_IMG_CAMERA";
import BEFORE_IMG_CAMERA_1 from "./BEFORE_IMG_CAMERA_1";

// Pwede mong i-import ang sub-camera components mo kung hiwalay sila tulad ng sa TAP:
// import AFTER_IMG_CAMERA from "./AFTER_IMG_CAMERA";
// import BEFORE_IMG_CAMERA_1 from "./BEFORE_IMG_CAMERA_1";

const EP_CAMERA = ({
  selected_ep_data,
  temp_ep_id,
  set_show_camera_roll,
  store_code,
  user_id,
  update_ep_with_picture_remarks,
  update_exec_planner_status,
}) => {
  const [show_after_img_camera, set_show_after_img_camera] = useState(false);
  const [show_before_img_camera, set_show_before_img_camera] = useState(false);
  const [show_reference_modal, set_show_reference_modal] = useState(false);
  const [beforeUri, setBeforeUri] = useState(null);
  const [afterUri, setAfterUri] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({
    before: false,
    after: false,
  });
  const [is_save_img_loading, set_is_save_img_loading] = useState(false);
  const [ep_image_data, set_ep_image_data] = useState({});
  const [ep_image_loading, set_ep_image_loading] = useState(false);

  const viewShotRef = useRef(null);

  // --- IMAGE PICKER FROM GALLERY ---
  const pickImage = async (type) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "Permission to access camera roll is required!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      try {
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
      } catch (error) {
        console.error("Error resizing image: ", error);
      }
    }
  };

  // --- VALIDATION BEFORE UPLOAD ---
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

  // --- API UPLOAD FUNCTION (MAINTAINING EP ENDPOINTS & PAYLOAD) ---
  const upload_image_api = async () => {
    const date_now = new Date();
    if (!imagesLoaded.before || !imagesLoaded.after) {
      Alert.alert(
        "Saving Image",
        "Please wait for images to fully load inside ViewShot.",
      );
      return;
    }
    try {
      set_is_save_img_loading(true);

      // I-capture ang pinagsamang ViewShot bilang isang solong imahe
      const uri = await viewShotRef.current.capture();
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const filename = uri.split("/").pop();

      // Dito pinanatili ang eksaktong fields para sa PostEPImages API
      const ep_image_payload = {
        AttachmentFile: base64,
        AttachmentFileName: filename,
        AttachmentContentType: "image",
        DateCreated: formate_date(date_now, "mm/dd/yyyy"),
        EmployeeID: user_id, // Galing sa orihinal mong props
        EPID: temp_ep_id, // Galing sa orihinal mong props
      };

      const response = await axios.post(
        "https://benbyextportal.com/insert/api/PostEPImages",
        ep_image_payload,
      );

      if (response.status >= 200 && response.status <= 210) {
        // Ininvoke ang orihinal mong callbacks para sa EP module state updates
        update_ep_with_picture_remarks(selected_ep_data);
        update_exec_planner_status(selected_ep_data, "with_picture", 0);

        set_is_save_img_loading(false);
        setBeforeUri(null);
        setAfterUri(null);
        set_show_camera_roll(false); // Isara ang container view roll
        Alert.alert("Success", "EP Image pushed successfully.");
      } else {
        set_is_save_img_loading(false);
        Alert.alert(
          "Upload Failed",
          "There was an error uploading the image. Please try again.",
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      set_is_save_img_loading(false);
      Alert.alert(
        "Upload Failed",
        "There was an error processing the image. Please try again.",
      );
    }
  };

  // --- SELECTION ALERTS ---
  const choose_before_img_option = () => {
    Alert.alert(
      "Choose an option",
      "What would you like to do for BEFORE image?",
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
      "What would you like to do for AFTER image?",
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

  // --- GET REFERENCE PHOTO VIA API (EP SPECIFIC) ---
  const get_image = async () => {
    // const ep_id = "2207032";
    const ep_id = temp_ep_id.toString();
    set_ep_image_loading(true);
    try {
      const response = await axios.get(
        `https://benbyextportal.com/home/api/get/GetPlannedImageEP?F1=${ep_id}&F2=0&F3=0&F4=0`,
      );

      if (response.data && response.data.length > 0) {
        set_ep_image_data(response.data[0]);
      } else {
        Alert.alert(
          "No Image Found",
          "There was no reference image found for this EP.",
        );
      }
    } catch (err) {
      Alert.alert("Error", "There was an error fetching the EP image API.");
    } finally {
      set_ep_image_loading(false);
    }
  };

  useEffect(() => {
    get_image();
  }, []);

  return (
    <React.Fragment>
      <View style={[tw`flex w-full h-full gap-[4] pt-[15]`, styles.overlay]}>
        {/* HEADER SECTION (REFERENCE BUTTON) */}
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

        {/* BEFORE IMAGE SLOT */}
        <View style={[tw`flex-1 w-full p-[4]`]}>
          <View style={[tw`flex justify-center items-center w-full h-[14]`]}>
            <Text style={tw`text-[4] tracking-[0.1] text-[#028543] font-bold`}>
              BEFORE IMAGE
            </Text>
          </View>
          <View style={[tw`flex justify-center items-center w-full`]}>
            <View style={[tw`h-[55] w-[70]`]}>
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
                  <FontAwesome name="camera" size={62} color={"#028543"} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* AFTER IMAGE SLOT */}
        <View style={[tw`flex-1 w-full p-[4]`]}>
          <View style={[tw`flex justify-center items-center w-full h-[14]`]}>
            <Text style={tw`text-[4] tracking-[0.1] text-[#028543] font-bold`}>
              AFTER IMAGE
            </Text>
          </View>
          <View style={[tw`flex justify-center items-center w-full`]}>
            <View style={[tw`h-[55] w-[70]`]}>
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
                  <FontAwesome name="camera" size={62} color={"#028543"} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* CONTROL ACTION BUTTONS */}
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
            onPress={() => set_show_camera_roll(false)}
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
                EP Photo Reference
              </Text>
              <TouchableOpacity onPress={() => set_show_reference_modal(false)}>
                <Ionicons name="close-circle" size={32} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <View
              style={tw`w-full p-1 h-70 bg-white rounded-lg overflow-hidden border border-gray-300 border-dashed justify-center items-center`}
            >
              {ep_image_loading ? (
                <ActivityIndicator size="large" color="#028543" />
              ) : (
                <Image
                  source={{ uri: ep_image_data.pictureData }}
                  style={tw`w-full h-full rounded`}
                  resizeMode="cover"
                />
              )}
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

      {/* --- CAMERA HOOKS OVERLAYS --- */}
      {/* 
        Tandaan: Palitan ang mga component na ito sa kung ano ang totoong pangalan 
        ng custom sub-cameras mo para sa EP (o gumamit ng modal wrapper)
      */}
      {show_after_img_camera && (
        <View style={styles.cameraFallbackContainer}>
          <Text>After Camera Hook Active</Text>
          <AFTER_IMG_CAMERA
            set_show_after_img_camera={set_show_after_img_camera}
            setAfterUri={setAfterUri}
          />
        </View>
      )}
      {show_before_img_camera && (
        <View style={styles.cameraFallbackContainer}>
          <Text>Before Camera Hook Active</Text>
          <BEFORE_IMG_CAMERA_1
            set_show_before_img_camera={set_show_before_img_camera}
            setBeforeUri={setBeforeUri}
          />
        </View>
      )}

      {/* HIDDEN VIEWSHOT LAYER (Side-by-Side Merge Layout) */}
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    top: -2000,
    left: -2000,
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
  cameraFallbackContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#000",
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EP_CAMERA;
