import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import axios from "axios";
import {
  FontAwesome,
  AntDesign,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import tw from "twrnc";
import { ref, update } from "firebase/database";
import { db } from "../../../../../assets/scripts/firebase";
import { formate_date } from "../../../../../assets/scripts/functions/format_value";

const SOS_Input = ({
  is_open,
  set_display_modal,
  selected_item,
  sos_data,
  set_sos_data,
}) => {
  const [competitors, setCompetitors] = useState([
    {
      id: Date.now(),
      name: "",
      facing_count: "",
      total_category: "",
      total_competitor: "",
      remarks: "",
    },
  ]);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("back");
  const cameraRef = useRef(null);

  const TBL_SHARE_OF_SHELF_PATH = "/DB_TEST/TBL_SHARE_OF_SHELF/DATA";
  const TBL_SOS_HISTORY_PATH = "/DB_TEST/TBL_SOS_HISTORY/DATA";

  useEffect(() => {
    if (is_open && selected_item) {
      if (selected_item.competitors && selected_item.competitors.length > 0) {
        setCompetitors(selected_item.competitors);
      } else {
        setCompetitors([
          {
            id: Date.now(),
            name: "",
            facing_count: "",
            total_category: "",
            total_competitor: "",
            remarks: "",
          },
        ]);
      }
      setImages(selected_item.photos || []);
      setUploadStatus("");
      setIsProcessing(false);
      setShowCamera(false);
    }
  }, [is_open, selected_item]);

  const addCompetitor = () => {
    setCompetitors([
      ...competitors,
      {
        id: Date.now(),
        name: "",
        facing_count: "",
        total_category: "",
        total_competitor: "",
        remarks: "",
      },
    ]);
  };

  const removeCompetitor = (id) => {
    if (competitors.length === 1) return;
    setCompetitors(competitors.filter((c) => c.id !== id));
  };

  const updateCompetitor = (id, field, value) => {
    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

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

  const handleSave = async () => {
    const isInvalid = competitors.some(
      (c) =>
        !c.name.trim() ||
        !c.facing_count.trim() ||
        !c.total_category.trim() ||
        !c.total_competitor.trim(),
    );

    if (isInvalid) {
      Alert.alert(
        "Required",
        "Please fill up all counts for each competitor entry.",
      );
      return;
    }

    setIsProcessing(true);
    const date_now = new Date();
    const dateStr = formate_date(date_now, "mm/dd/yyyy");

    try {
      // Image Upload
      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        if (uri.startsWith("http")) continue;
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await axios.post(
          "https://benbyextportal.com/insert/api/PostSOSDetailsImage",
          {
            attachment_file: base64,
            attachment_file_name: `SOS_${selected_item.id}_${Date.now()}.jpg`,
            attachment_content_type: "image",
            Datecreated: dateStr,
            SOSID: parseInt(selected_item.id || 0),
          },
        );
      }

      const updates = {};
      const updatedEntry = {
        ...selected_item,
        competitors: competitors,
        status: "Complete",
        last_updated: dateStr,
      };

      const mainPath = `${TBL_SHARE_OF_SHELF_PATH}/${selected_item.tds_code}/${selected_item.store_code}/${selected_item.id}`;
      updates[mainPath] = updatedEntry;

      competitors.forEach((comp, index) => {
        const historyKey = `${selected_item.tds_code}_${selected_item.store_code}_${selected_item.id}_${index}`;
        updates[`${TBL_SOS_HISTORY_PATH}/${historyKey}`] = {
          iD: selected_item.id,
          code: selected_item.tds_code,
          storecode: selected_item.store_code,
          dateVist: selected_item.date_visit,
          brand: selected_item.brand,
          category: selected_item.category,
          channel: selected_item.channel,
          competitorName: comp.name,
          facingCount: comp.facing_count,
          totalCategoryCount: comp.total_category, // Added
          totalCompetitorCount: comp.total_competitor, // Added
          remarks: comp.remarks,
          dateUpload: dateStr,
          uploadBy: selected_item.uploaded_by || "",
          audit_date: dateStr,
        };
      });

      await update(ref(db), updates);

      const updatedData = sos_data.map((item) =>
        item.id === selected_item.id ? updatedEntry : item,
      );

      set_sos_data(updatedData);
      set_display_modal(null);
      Alert.alert("Success", "SOS Audit saved successfully.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderInputField = (
    label,
    value,
    placeholder,
    onChange,
    keyboardType = "default",
    multiline = false,
  ) => (
    <View style={tw`flex-1 mb-2`}>
      <Text style={tw`text-[9px] text-gray-400 font-bold uppercase mb-1 ml-1`}>
        {label}
      </Text>
      <TextInput
        style={[
          tw`bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 ${multiline ? "min-h-[60px]" : ""}`,
          {
            textAlignVertical: "center",
            includeFontPadding: false,
          },
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );

  if (showCamera) {
    return (
      <Modal visible={true}>
        <View style={tw`flex-1 bg-black`}>
          <CameraView style={tw`flex-1`} facing={cameraFacing} ref={cameraRef}>
            <View style={tw`flex-1 justify-between p-8`}>
              <TouchableOpacity onPress={() => setShowCamera(false)}>
                <AntDesign name="close" size={30} color="white" />
              </TouchableOpacity>
              <View style={tw`flex-row justify-center items-center gap-x-10`}>
                <TouchableOpacity
                  onPress={() =>
                    setCameraFacing((f) => (f === "back" ? "front" : "back"))
                  }
                >
                  <MaterialIcons name="switch-camera" size={32} color="white" />
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
      </Modal>
    );
  }

  return (
    <Modal animationType="fade" visible={is_open} transparent={false}>
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View
          style={tw`flex-row items-center px-4 py-3 border-b border-gray-100 bg-white`}
        >
          <TouchableOpacity
            onPress={() => !isProcessing && set_display_modal(null)}
            style={tw`p-2`}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={tw`ml-2 text-lg font-bold text-gray-800`}>
            SOS Audit Entry
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={tw`flex-1`}
        >
          <ScrollView contentContainerStyle={tw`p-5`}>
            {isProcessing ? (
              <View style={tw`items-center py-20`}>
                <ActivityIndicator size="large" color="#028543" />
                <Text style={tw`mt-4 text-gray-500 font-bold`}>
                  Saving Audit...
                </Text>
              </View>
            ) : (
              <View>
                {/* Header Info */}
                <View
                  style={tw`mb-5 bg-white border border-gray-200 p-4 rounded-xl`}
                >
                  <Text style={tw`text-xl font-black text-gray-900`}>
                    {selected_item?.brand}
                  </Text>
                  <Text style={tw`text-gray-500 text-xs font-bold`}>
                    {selected_item?.category} • {selected_item?.channel}
                  </Text>
                </View>

                {/* Photos */}
                <View style={tw`mb-6`}>
                  <Text
                    style={tw`text-[10px] text-gray-400 font-bold uppercase mb-3`}
                  >
                    Evidence Photos ({images.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`flex-row gap-x-2`}
                  >
                    {images.map((uri, idx) => (
                      <View key={idx} style={tw`relative`}>
                        <Image
                          source={{ uri }}
                          style={tw`w-20 h-20 rounded-lg`}
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setImages((prev) =>
                              prev.filter((img) => img !== uri),
                            )
                          }
                          style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full p-1`}
                        >
                          <AntDesign name="close" size={10} color="white" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={() => setShowCamera(true)}
                      style={tw`w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg items-center justify-center`}
                    >
                      <FontAwesome name="camera" size={20} color="#d1d5db" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={pickImage}
                      style={tw`w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg items-center justify-center`}
                    >
                      <FontAwesome name="image" size={20} color="#d1d5db" />
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* Competitors List */}
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={tw`text-xs font-black text-gray-400 uppercase`}>
                    Competitor Entries
                  </Text>
                  <TouchableOpacity
                    onPress={addCompetitor}
                    style={tw`bg-[#028543] px-3 py-1.5 rounded-lg flex-row items-center`}
                  >
                    <Ionicons name="add" size={16} color="white" />
                    <Text style={tw`text-white text-xs font-bold ml-1`}>
                      Add Competitor
                    </Text>
                  </TouchableOpacity>
                </View>

                {competitors.map((comp, index) => (
                  <View
                    key={comp.id}
                    style={tw`bg-white border border-gray-200 rounded-xl p-4 mb-5`}
                  >
                    <View
                      style={tw`flex-row justify-between items-center mb-4 pb-2 border-b border-gray-50`}
                    >
                      <View style={tw`bg-green-700 px-3 py-1 rounded`}>
                        <Text
                          style={tw`text-[10px] font-black text-white uppercase tracking-wider`}
                        >
                          Competitor {index + 1}
                        </Text>
                      </View>
                      {competitors.length > 1 && (
                        <TouchableOpacity
                          onPress={() => removeCompetitor(comp.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {renderInputField(
                      "Product Name",
                      comp.name,
                      "Enter product",
                      (val) => updateCompetitor(comp.id, "name", val),
                    )}

                    {/* Row for Counts */}
                    <View style={tw`flex-row gap-x-2`}>
                      {renderInputField(
                        "Facing Count",
                        comp.facing_count,
                        "0",
                        (val) => updateCompetitor(comp.id, "facing_count", val),
                        "numeric",
                      )}
                      {renderInputField(
                        "Total Category",
                        comp.total_category,
                        "0",
                        (val) =>
                          updateCompetitor(comp.id, "total_category", val),
                        "numeric",
                      )}
                      {renderInputField(
                        "Total Competitor",
                        comp.total_competitor,
                        "0",
                        (val) =>
                          updateCompetitor(comp.id, "total_competitor", val),
                        "numeric",
                      )}
                    </View>

                    {renderInputField(
                      "Remarks",
                      comp.remarks,
                      "Optional notes...",
                      (val) => updateCompetitor(comp.id, "remarks", val),
                      "default",
                      true,
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  onPress={handleSave}
                  style={tw`mt-2 py-4 bg-[#028543] rounded-xl items-center`}
                >
                  <Text
                    style={tw`text-white font-black uppercase tracking-widest`}
                  >
                    Submit Audit
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default SOS_Input;
