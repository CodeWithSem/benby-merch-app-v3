import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Text,
  ActivityIndicator,
} from "react-native";
import { formate_date } from "../../../../../assets/scripts/functions/format_value";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import tw from "twrnc";
import axios from "axios";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
// import * as FileSystem from "expo-file-system";

const EP_CAMERA = ({
  selected_ep_data,
  temp_ep_id,
  set_show_camera_roll,
  store_code,
  user_id,
  update_ep_with_picture_remarks,
  update_exec_planner_status,
}) => {
  const camera_ref = useRef(null);
  const [facing, setFacing] = useState("back");
  const [images, set_images] = useState([]);
  const [show_camera, set_show_camera] = useState(false);
  const [loading_upload_image, set_loading_upload_image] = useState(false);

  const take_picture = async () => {
    if (camera_ref.current) {
      try {
        const photo = await camera_ref.current.takePictureAsync();
        if (photo && photo.uri) {
          const resizedImage = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 800, height: 800 } }],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
          );
          set_images((prev_images) => [...prev_images, resizedImage.uri]);
          set_show_camera(false);
        } else {
          console.error("No photo taken or URI is undefined");
        }
      } catch (error) {
        console.error("Error taking picture: ", error);
      }
    } else {
      console.error("Camera reference is null");
    }
  };

  const pick_image = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1], // Aspect ratio of 1:1 (square)
      quality: 1, // Highest quality
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      try {
        const selectedImageUri = result.assets[0].uri;
        const resizedImage = await ImageManipulator.manipulateAsync(
          selectedImageUri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
        );
        set_images((prev_images) => [...prev_images, resizedImage.uri]);
      } catch (error) {
        console.error("Error resizing the image: ", error);
      }
    } else {
      console.log("No image selected or action canceled");
    }
  };

  const delete_image = (uri) => {
    set_images((prev_images) => prev_images.filter((image) => image !== uri));
  };

  const upload_image_api = async () => {
    set_loading_upload_image(true);
    const date_now = new Date();
    try {
      for (const uri of images) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const filename = uri.split("/").pop();

        const ep_image_data = {
          AttachmentFile: base64,
          AttachmentFileName: filename,
          AttachmentContentType: "image",
          DateCreated: formate_date(date_now, "mm/dd/yyyy"),
          EmployeeID: user_id,
          EPID: temp_ep_id,
        };
        await axios
          .post(
            "https://benbyextportal.com/insert/api/PostEPImages",
            ep_image_data,
          )
          .then(() => {
            set_loading_upload_image(false);
            update_ep_with_picture_remarks(selected_ep_data);
            update_exec_planner_status(selected_ep_data, "with_picture", 0);
            set_show_camera(false);
            set_show_camera_roll(false);
            set_images([]);
            console.log("Success: Image pushed");
          });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const render_item = ({ item }) => {
    if (item === "ADD_IMAGE") {
      return (
        <TouchableOpacity style={styles.add_image_button} onPress={pick_image}>
          <FontAwesome name="image" size={32} color={"#028543"} />
        </TouchableOpacity>
      );
    }

    if (!item || item === "null" || item === "undefined") {
      return null;
    }

    return (
      <View style={styles.image_container}>
        <Image
          source={{ uri: item }}
          style={styles.image}
          onError={() => console.error(`Failed to load image: ${item}`)} // Error handling
        />
        <TouchableOpacity
          style={styles.delete_button}
          onPress={() => delete_image(item)}
        >
          <FontAwesome name="trash" size={20} color={"#FF0000"} />
        </TouchableOpacity>
      </View>
    );
  };

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // RETURN ORIGIN
  return (
    <React.Fragment>
      {show_camera ? (
        <View style={[tw`flex w-full h-full`, styles.camera_overlay]}>
          <View style={tw`flex-1 bg-[#000] border-b-[0.4] border-[#FFF]`}>
            <TouchableOpacity
              style={[{ position: "absolute", bottom: 20, right: 20 }]}
              onPress={() => set_show_camera(false)}
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
              onPress={take_picture}
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
      ) : (
        <View style={[tw`flex w-full h-full`, styles.overlay]}>
          <View style={tw`flex-1 mt-[50] mb-[10] items-center`}>
            <FlatList
              data={[...images, "ADD_IMAGE"]}
              keyExtractor={(item) => item}
              renderItem={render_item}
              numColumns={3}
              columnWrapperStyle={styles.column_wrapper}
              style={tw`mt-4`}
            />
          </View>
          <View style={tw`flex-0.4 justify-center items-center gap-[3]`}>
            <TouchableOpacity
              style={styles.camera_image_button}
              onPress={() => set_show_camera(true)}
            >
              <FontAwesome name="camera" size={32} color={"#028543"} />
            </TouchableOpacity>
            {loading_upload_image ? (
              <View
                style={[
                  tw`w-80 h-[12] justify-center items-center bg-[#028543] rounded-lg`,
                ]}
              >
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  tw`w-80 h-[12] justify-center items-center bg-[#028543] rounded-lg`,
                ]}
                onPress={upload_image_api}
              >
                <Text
                  style={tw`text-lg font-bold tracking-[0.5] text-white text-center`}
                >
                  SAVE
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                tw`w-80 h-[12] justify-center items-center bg-[#6C757D] rounded-lg`,
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
      )}
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
  image_container: {},
  image: {
    width: 110,
    height: 110,
    borderRadius: 8,
    margin: 4,
  },
  delete_button: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 5,
  },
  column_wrapper: {
    justifyContent: "flex-start",
  },
  add_image_button: {
    width: 110,
    height: 110,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#028543",
    borderRadius: 8,
    backgroundColor: "#D4D4D4",
  },

  camera_image_button: {
    width: 80,
    height: 80,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#028543",
    borderRadius: 100,
    backgroundColor: "#D4D4D4",
  },
});

export default EP_CAMERA;
