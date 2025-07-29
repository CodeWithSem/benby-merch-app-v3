import React, { useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import tw from "twrnc";

const AFTER_IMG_CAMERA = ({ set_show_after_img_camera, setAfterUri }) => {
  const [facing, setFacing] = useState("back");
  const [btn_camera_disable, set_btn_camera_disable] = useState(false);
  const camera_ref = useRef(null);

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const takePicture = async () => {
    set_btn_camera_disable(true);
    if (camera_ref.current) {
      try {
        const photo = await camera_ref.current.takePictureAsync();
        if (photo && photo.uri) {
          const resizedImage = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 1000, height: 1000 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
          );
          const fileInfo = await FileSystem.getInfoAsync(resizedImage.uri);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            const fileSizeInMB = fileInfo.size / (1024 * 1024);
          } else {
            console.error(
              "Resized image file does not exist or is a directory"
            );
          }
          setAfterUri(resizedImage.uri);
          set_show_after_img_camera(false);
        } else {
          console.log("Failed to take picture");
        }
      } catch (error) {
        console.error("Error taking picture: ", error);
      } finally {
        set_btn_camera_disable(false);
      }
    } else {
      console.log("Camera ref is null");
      set_btn_camera_disable(false);
    }
  };

  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={[tw`flex w-full h-full`, styles.camera_overlay]}>
        <View style={tw`flex-1 bg-[#000] border-b-[0.4] border-[#FFF]`}>
          <TouchableOpacity
            style={[{ position: "absolute", bottom: 20, right: 20 }]}
            onPress={() => set_show_after_img_camera(false)}
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
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  camera_overlay: {
    position: "absolute",
    zIndex: 3,
    backgroundColor: "#FFF",
  },
  camera: {
    flex: 1,
  },
});

export default AFTER_IMG_CAMERA;
