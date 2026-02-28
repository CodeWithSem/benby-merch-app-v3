import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import { FontAwesome, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { formate_date } from "../../../../../assets/scripts/functions/format_value";
import tw from "twrnc";
import { ref, update } from "firebase/database";
import { db } from "../../../../../assets/scripts/firebase";

const SOS_Input = ({
  is_open,
  set_display_modal,
  selected_item,
  sos_data,
  set_sos_data,
  user_id,
}) => {
  const [facingCount, setFacingCount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [images, setImages] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");
  const cameraRef = useRef(null);

  // Sync state with selected item when modal opens
  useEffect(() => {
    if (is_open && selected_item) {
      setFacingCount(selected_item.facing_count || "");
      setRemarks(selected_item.remarks || "");
      setImages(selected_item.photos || []);
      setUploadStatus("");
      setIsProcessing(false);
      setShowCamera(false);
    }
  }, [is_open, selected_item]);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      setImages((prev) => [...prev, resized.uri]);
      setShowCamera(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (uri) => {
    setImages((prev) => prev.filter((img) => img !== uri));
  };

  const handleSave = async () => {
    if (!facingCount) {
      Alert.alert("Required", "Please enter a facing count.");
      return;
    }

    setIsProcessing(true);
    const date_now = new Date();

    // Helper to ensure MM/DD/YYYY format
    const formatToMMDDYYYY = (date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    try {
      // 1. Upload Images to API
      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        if (uri.startsWith("http")) continue;

        setUploadStatus(`Uploading image ${i + 1} of ${images.length}...`);
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const filename = uri.split("/").pop();
        const as_image_data = {
          attachment_file: base64,
          attachment_file_name: filename,
          attachment_content_type: "image",
          Datecreated: formatToMMDDYYYY(date_now),
          SOSID: parseInt(selected_item.id || 0),
        };

        await axios.post(
          "https://benbyextportal.com/insert/api/PostSOSDetailsImage",
          as_image_data,
        );
      }

      // 2. Prepare Updated Object
      const updatedEntry = {
        ...selected_item,
        facing_count: facingCount,
        remarks: remarks,
      };

      // 3. Update Main Firebase Data (Nested Path)
      setUploadStatus("Saving to database...");
      const dbPath = `DB_TEST/TBL_SHARE_OF_SHELF/DATA/${selected_item.tds_code}/${selected_item.store_code}/${selected_item.id}`;
      await update(ref(db, dbPath), updatedEntry);

      // 4. Save to SOS History (Flat Path with Overwrite Series)
      setUploadStatus("Updating History...");

      /** * CREATE SERIES KEY: TdsCode_StoreCode_RecordID
       * This flat key allows for easy tracking and overwriting of specific record history.
       **/
      const historySeriesKey = `${selected_item.tds_code}_${selected_item.store_code}_${selected_item.id}`;

      const historyData = {
        [historySeriesKey]: {
          iD: selected_item.id,
          code: selected_item.tds_code,
          storecode: selected_item.store_code,
          dateVist: selected_item.date_visit,
          brand: selected_item.brand,
          category: selected_item.category,
          channel: selected_item.channel,
          facingCount: facingCount,
          remarks: remarks,
          dateUpload: selected_item.date_uploaded,
          uploadBy: selected_item.uploaded_by,
          audit_date: formatToMMDDYYYY(date_now),
        },
      };

      const historyRef = ref(db, "DB_TEST/TBL_SOS_HISTORY/DATA");
      await update(historyRef, historyData);

      // 5. Update Local State for FlatList
      const updatedData = sos_data.map((item) =>
        item.id === selected_item.id ? updatedEntry : item,
      );
      set_sos_data(updatedData);

      setIsProcessing(false);
      set_display_modal(null);
      Alert.alert("Success", "Share of Shelf audit has been saved.");
    } catch (error) {
      console.error("Save failed:", error);
      Alert.alert(
        "Error",
        "Could not save data. Please check your connection.",
      );
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={is_open}
      onRequestClose={() => !isProcessing && set_display_modal(null)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={tw`flex-1`}
      >
        <View style={tw`flex-1 justify-end bg-black/40`}>
          {showCamera ? (
            <View style={tw`flex-1 bg-black`}>
              <CameraView
                style={tw`flex-1`}
                facing={cameraFacing}
                ref={cameraRef}
              >
                <View style={tw`flex-1 justify-between p-8`}>
                  <TouchableOpacity onPress={() => setShowCamera(false)}>
                    <AntDesign name="close" size={30} color="white" />
                  </TouchableOpacity>
                  <View
                    style={tw`flex-row justify-center items-center gap-x-10`}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setCameraFacing((f) =>
                          f === "back" ? "front" : "back",
                        )
                      }
                    >
                      <MaterialIcons
                        name="switch-camera"
                        size={32}
                        color="white"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={takePicture}
                      style={tw`w-18 h-18 bg-white rounded-full border-4 border-gray-400`}
                    />
                    <View style={tw`w-10`} />
                  </View>
                </View>
              </CameraView>
            </View>
          ) : (
            <>
              <Pressable
                style={tw`absolute inset-0`}
                onPress={() => !isProcessing && set_display_modal(null)}
              />

              <View style={tw`bg-white rounded-t-3xl shadow-2xl`}>
                <View
                  style={tw`w-12 h-1.5 bg-gray-200 rounded-full self-center mt-4 mb-2`}
                />

                <ScrollView contentContainerStyle={tw`p-6`}>
                  {isProcessing ? (
                    <View style={tw`items-center py-10`}>
                      <ActivityIndicator size="large" color="#028543" />
                      <Text style={tw`mt-4 text-gray-500 font-medium`}>
                        {uploadStatus || "Processing..."}
                      </Text>
                    </View>
                  ) : (
                    <View>
                      <View
                        style={tw`flex-row justify-between items-start mb-6`}
                      >
                        <View style={tw`flex-1`}>
                          <Text
                            style={tw`text-xl font-bold text-gray-900 leading-tight`}
                          >
                            {selected_item?.brand}
                          </Text>
                          <Text
                            style={tw`text-gray-500 text-xs font-bold uppercase mt-1 tracking-wider`}
                          >
                            {selected_item?.category} • {selected_item?.channel}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => set_display_modal(null)}
                          style={tw`absolute right-0 top-0 p-1 z-100`}
                        >
                          <AntDesign name="close" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                      </View>

                      {/* Input Section */}
                      <View style={tw`mb-5`}>
                        <Text
                          style={tw`text-[10px] text-gray-400 font-bold uppercase mb-2`}
                        >
                          Facing Count
                        </Text>
                        <TextInput
                          style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 text-xl font-black text-gray-800`}
                          keyboardType="numeric"
                          value={facingCount}
                          onChangeText={setFacingCount}
                          placeholder="0"
                        />
                      </View>

                      <View style={tw`mb-5`}>
                        <Text
                          style={tw`text-[10px] text-gray-400 font-bold uppercase mb-2`}
                        >
                          Remarks
                        </Text>
                        <TextInput
                          style={tw`bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 min-h-[100px] text-sm`}
                          multiline
                          textAlignVertical="top"
                          value={remarks}
                          onChangeText={setRemarks}
                          placeholder="Add notes here..."
                        />
                      </View>

                      {/* Photo Section */}
                      <View style={tw`mb-8`}>
                        <Text
                          style={tw`text-[10px] text-gray-400 font-bold uppercase mb-3`}
                        >
                          Evidence Photos ({images.length})
                        </Text>
                        <View style={tw`flex-row flex-wrap gap-3`}>
                          {images.map((uri, idx) => (
                            <View key={idx} style={tw`relative`}>
                              <Image
                                source={{ uri }}
                                style={tw`w-20 h-20 rounded-xl bg-gray-100`}
                              />
                              <TouchableOpacity
                                onPress={() => removeImage(uri)}
                                style={tw`absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-sm`}
                              >
                                <AntDesign
                                  name="close"
                                  size={12}
                                  color="white"
                                />
                              </TouchableOpacity>
                            </View>
                          ))}
                          <TouchableOpacity
                            onPress={() => setShowCamera(true)}
                            style={tw`w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl items-center justify-center bg-gray-50`}
                          >
                            <FontAwesome
                              name="camera"
                              size={20}
                              color="#9ca3af"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={pickImage}
                            style={tw`w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl items-center justify-center bg-gray-50`}
                          >
                            <FontAwesome
                              name="image"
                              size={20}
                              color="#9ca3af"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={tw`flex-row gap-x-3 pb-6`}>
                        <TouchableOpacity
                          onPress={() => set_display_modal(null)}
                          style={tw`flex-1 py-4 bg-gray-100 border border-gray-200 rounded-xl items-center justify-center`}
                        >
                          <Text style={tw`text-gray-600 font-bold`}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleSave}
                          style={tw`flex-2 py-4 bg-[#028543] rounded-xl items-center justify-center`}
                        >
                          <Text style={tw`text-white font-bold`}>
                            Save Data
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SOS_Input;
