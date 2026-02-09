import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
} from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
// import * as FileSystem from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import tw from "twrnc";

const BEFORE_IMG_CAMERA = ({
  set_show_before_img_camera,
  update_before_img_ind,
  selected_tap,
}) => {
  const [facing, setFacing] = useState("back");
  const [show_camera_overlay, set_show_camera_overlay] = useState(false);
  const [beforeUri, setbeforeUri] = useState(null);
  const [btn_camera_disable, set_btn_camera_disable] = useState(false);
  const camera_ref = useRef(null);

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const takePicture = async () => {
    set_btn_camera_disable(true);

    if (!camera_ref.current) {
      console.error("Camera ref is null");
      set_btn_camera_disable(false);
      return;
    }

    try {
      const photo = await camera_ref.current.takePictureAsync();

      if (!photo?.uri) {
        console.log("Failed to take picture");
        set_btn_camera_disable(false);
        return;
      }

      // Resize and manipulate image
      const resizedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1000, height: 1000 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
      );

      const fileInfo = await FileSystem.getInfoAsync(resizedImage.uri);
      if (!fileInfo.exists || fileInfo.isDirectory) {
        console.error("Resized image file does not exist or is a directory");
        set_btn_camera_disable(false);
        return;
      }

      // Update state
      setbeforeUri(resizedImage.uri);
      set_show_camera_overlay(false);
    } catch (error) {
      console.error("Error taking picture: ", error);
    } finally {
      set_btn_camera_disable(false);
    }
  };

  // Function to save the image to the gallery
  const saveToGallery = async (uri) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Cannot save image.");
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      update_before_img_ind(selected_tap.a1_ID);
    } catch (err) {
      console.error("Error saving image: ", err);
      alert("Error", "Failed to save image.");
    }
  };

  const verify_image = () => {
    if (beforeUri) {
      saveToGallery(beforeUri);
    } else {
      Alert.alert("Invalid Image", "Please take a picture to proceed");
    }
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={[tw`flex w-full h-full gap-[4] pt-[45]`, styles.overlay]}>
        <View style={[tw`flex-1 w-full justify-center items-center p-[4]`]}>
          <View style={[tw`flex justify-center items-center w-full h-[14]`]}>
            <Text style={tw`text-[4] tracking-[0.1] text-[#028543]`}>
              BEFORE IMAGE
            </Text>
          </View>
          <View style={[tw`flex justify-center items-center w-full`]}>
            <View style={[tw`h-[60] w-[70]`]}>
              <TouchableOpacity
                style={tw`flex h-full w-full justify-center items-center bg-[#fff] rounded-lg border-[0.5] border-[#028543] p-[4]`}
                onPress={() => set_show_camera_overlay(true)}
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
        <View
          style={[
            tw`flex flex-row justify-center items-center w-full gap-[2] p-[12]`,
          ]}
        >
          <TouchableOpacity
            style={[
              tw`flex-1 h-[12] justify-center items-center bg-[#028543] rounded-lg`,
            ]}
            onPress={() => verify_image()}
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
            onPress={() => set_show_before_img_camera(false)}
          >
            <Text
              style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
            >
              CANCEL
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {show_camera_overlay ? (
        <View style={[tw`flex w-full h-full`, styles.camera_overlay]}>
          <View style={tw`flex-1 bg-[#000] border-b-[0.4] border-[#FFF]`}>
            <TouchableOpacity
              style={[{ position: "absolute", bottom: 20, right: 20 }]}
              onPress={() => set_show_camera_overlay(false)}
            >
              <AntDesign name="close" size={32} color={"#FF0000"} />
            </TouchableOpacity>
          </View>
          <View style={tw`flex-3  w-full bg-[#D4D4D4]`}>
            <CameraView
              style={styles.camera}
              facing={facing}
              ref={camera_ref}
            ></CameraView>
          </View>
          <View
            style={tw`flex-1 items-center bg-[#000] border-t-[0.4] border-[#FFF]`}
          >
            <TouchableOpacity
              style={tw`justify-center items-center w-[20] h-[20] mt-[20] rounded-[50] bg-[#FFF]`}
              onPress={takePicture}
              disabled={btn_camera_disable}
            >
              <FontAwesome name="camera" size={32} color={"#028543"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[{ position: "absolute", top: 20, right: 20 }]}
              onPress={toggleCameraFacing}
            >
              <MaterialIcons name="switch-camera" size={42} color={"#028543"} />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
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
  camera: {
    flex: 1,
  },
});

export default BEFORE_IMG_CAMERA;
