import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy"; // Added for API
import axios from "axios"; // Added for API
import { FontAwesome, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { formate_date } from "../../../../../assets/scripts/functions/format_value"; // Ensure this path is correct
import tw from "twrnc";

const Audit_Survey = ({
  is_open,
  set_display_modal,
  selected_item,
  as_data,
  set_as_data,
  user_id, // Ensure user_id is passed as a prop
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tempAnswers, setTempAnswers] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // Track upload progress

  const [images, setImages] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState("back");
  const cameraRef = useRef(null);

  const questions = selected_item?.survey_list || [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (is_open && selected_item) {
      const existingAnswers = selected_item.survey_list || [];
      setTempAnswers([...existingAnswers]);
      setImages(selected_item.photos || []);
      setUploadStatus("");

      const isAlreadyCompleted =
        existingAnswers.length > 0 &&
        existingAnswers.every((q) => q.answer === "YES" || q.answer === "NO");

      if (isAlreadyCompleted) {
        setIsReviewing(true);
      } else {
        setIsReviewing(false);
        setCurrentIndex(0);
      }
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

  const handleAnswer = (answer) => {
    let newAnswers = [...tempAnswers];
    newAnswers[currentIndex] = { ...currentQuestion, answer: answer };
    setTempAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsReviewing(true);
    }
  };

  // --- INTEGRATED API UPLOAD ---
  const finalizeAudit = async () => {
    setIsProcessing(true);
    const date_now = new Date();

    try {
      // 1. Upload each image sequentially
      for (let i = 0; i < images.length; i++) {
        const uri = images[i];
        setUploadStatus(`Uploading image ${i + 1} of ${images.length}...`);

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
          EPID: selected_item.id,
        };

        await axios.post(
          "https://benbyextportal.com/insert/api/PostEPImages",
          ep_image_data,
        );
      }

      // 2. Update local state once uploads are complete
      setUploadStatus("Saving survey data...");
      const updatedData = as_data.map((item) => {
        if (item.id === selected_item.id) {
          return { ...item, survey_list: tempAnswers, photos: images };
        }
        return item;
      });

      set_as_data(updatedData);
      setIsProcessing(false);
      set_display_modal(null);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error uploading images. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    const resetAnswers = tempAnswers.map((q) => ({ ...q, answer: null }));
    setTempAnswers(resetAnswers);
    setImages([]);
    setCurrentIndex(0);
    setIsReviewing(false);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={is_open}
      onRequestClose={() => !isProcessing && set_display_modal(null)}
    >
      <View style={tw`flex-1 justify-end bg-black/20`}>
        {showCamera ? (
          <View style={tw`flex-1 bg-black`}>
            <CameraView style={tw`flex-1`} facing={facing} ref={cameraRef}>
              <View style={tw`flex-1 justify-between p-8`}>
                <TouchableOpacity onPress={() => setShowCamera(false)}>
                  <AntDesign name="close" size={30} color="white" />
                </TouchableOpacity>
                <View style={tw`flex-row justify-center items-center gap-x-10`}>
                  <TouchableOpacity
                    onPress={() =>
                      setFacing((f) => (f === "back" ? "front" : "back"))
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

            <View style={tw`bg-white rounded-t-3xl shadow-2xl max-h-[90%]`}>
              <View
                style={tw`w-12 h-1.5 bg-gray-200 rounded-full self-center mt-4 mb-2`}
              />

              <View style={tw`p-6`}>
                {isProcessing ? (
                  <View style={tw`items-center py-10`}>
                    <ActivityIndicator size="large" color="#028543" />
                    <Text style={tw`mt-4 text-gray-500 font-medium`}>
                      {uploadStatus || "Finalizing..."}
                    </Text>
                  </View>
                ) : isReviewing ? (
                  <View>
                    {/* --- X BUTTON TO GO BACK --- */}
                    <TouchableOpacity
                      onPress={() => setIsReviewing(false)}
                      style={tw`absolute right-0 top-0 p-1 z-100`}
                    >
                      <AntDesign name="close" size={18} color="#9ca3af" />
                    </TouchableOpacity>

                    <Text style={tw`text-xl font-bold text-gray-800 mb-1`}>
                      {selected_item?.survey_list?.every((q) => q.answer)
                        ? "Audit Results"
                        : "Review Responses"}
                    </Text>
                    <Text style={tw`text-gray-500 text-xs mb-5 uppercase`}>
                      Target: {selected_item?.activity}
                    </Text>

                    <ScrollView style={tw`max-h-80`}>
                      {tempAnswers.map((item, index) => (
                        <View
                          key={index}
                          style={tw`flex-row justify-between items-center py-4 border-b border-gray-100`}
                        >
                          <View style={tw`flex-1 pr-4`}>
                            <Text
                              style={tw`text-gray-400 text-[10px] font-bold`}
                            >
                              QUESTION {index + 1}
                            </Text>
                            <Text style={tw`text-gray-700 text-xs font-medium`}>
                              {item.question}
                            </Text>
                          </View>
                          <View
                            style={tw`${item.answer === "YES" ? "bg-green-100" : "bg-red-100"} px-4 py-1.5 rounded-lg`}
                          >
                            <Text
                              style={tw`text-xs font-black ${item.answer === "YES" ? "text-green-700" : "text-red-700"}`}
                            >
                              {item.answer || "N/A"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>

                    <View style={tw`mt-4 mb-6`}>
                      <Text
                        style={tw`text-gray-400 text-[10px] font-bold mb-2 uppercase`}
                      >
                        Evidence Photos ({images.length})
                      </Text>
                      <View style={tw`flex-row flex-wrap gap-2`}>
                        {images.map((uri, idx) => (
                          <View key={idx} style={tw`relative`}>
                            <Image
                              source={{ uri }}
                              style={tw`w-16 h-16 rounded-lg bg-gray-100`}
                            />
                            <TouchableOpacity
                              onPress={() => removeImage(uri)}
                              style={tw`absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white`}
                            >
                              <AntDesign name="close" size={10} color="white" />
                            </TouchableOpacity>
                          </View>
                        ))}

                        <TouchableOpacity
                          onPress={() => setShowCamera(true)}
                          style={tw`w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg items-center justify-center bg-gray-50`}
                        >
                          <FontAwesome
                            name="camera"
                            size={18}
                            color="#9ca3af"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={pickImage}
                          style={tw`w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg items-center justify-center bg-gray-50`}
                        >
                          <FontAwesome name="image" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={tw`flex-row gap-x-3`}>
                      <TouchableOpacity
                        onPress={handleRetry}
                        style={tw`flex-1 py-4 bg-gray-100 rounded-2xl items-center`}
                      >
                        <Text style={tw`text-gray-600 font-bold`}>Retry</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={finalizeAudit}
                        style={tw`flex-2 py-4 bg-[#028543] rounded-2xl items-center`}
                      >
                        <Text style={tw`text-white font-bold text-lg`}>
                          Confirm
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    {/* ... Question Screen remains exactly the same ... */}
                    <View
                      style={tw`flex-row justify-between items-center mb-1`}
                    >
                      <Text style={tw`text-xl font-bold text-gray-800`}>
                        Perform Audit
                      </Text>
                      <Text style={tw`text-[#028543] font-bold text-xs`}>
                        {currentIndex + 1} / {questions.length}
                      </Text>
                    </View>
                    <Text style={tw`text-gray-500 text-sm mb-6`}>
                      Target:{" "}
                      <Text style={tw`font-bold text-gray-700`}>
                        {selected_item?.activity}
                      </Text>
                    </Text>
                    <View
                      style={tw`h-1.5 w-full bg-gray-100 rounded-full mb-8`}
                    >
                      <View
                        style={[
                          tw`h-full bg-[#028543] rounded-full`,
                          {
                            width: `${((currentIndex + 1) / questions.length) * 100}%`,
                          },
                        ]}
                      />
                    </View>
                    <View
                      style={tw`min-h-[120px] justify-center items-center bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200`}
                    >
                      <Text
                        style={tw`text-sm font-semibold text-gray-800 text-center`}
                      >
                        {currentQuestion?.question}
                      </Text>
                    </View>
                    <View style={tw`flex-row gap-x-3 mt-8 mb-4`}>
                      <TouchableOpacity
                        onPress={() => handleAnswer("YES")}
                        style={tw`flex-1 flex-row items-center justify-center p-5 rounded-2xl border-2 border-green-100 bg-green-50`}
                      >
                        <Text style={tw`font-black text-green-700 text-lg`}>
                          YES
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleAnswer("NO")}
                        style={tw`flex-1 flex-row items-center justify-center p-5 rounded-2xl border-2 border-red-100 bg-red-50`}
                      >
                        <Text style={tw`font-black text-red-700 text-lg`}>
                          NO
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={tw`flex-row gap-x-3 mt-2`}>
                      {currentIndex > 0 && (
                        <TouchableOpacity
                          onPress={() => setCurrentIndex(currentIndex - 1)}
                          style={tw`flex-1 py-4 bg-gray-50 rounded-2xl items-center border border-gray-200`}
                        >
                          <Text style={tw`text-gray-500 font-bold`}>
                            Previous
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => set_display_modal(null)}
                        style={tw`flex-1 py-4 bg-gray-50 rounded-2xl items-center border border-gray-200`}
                      >
                        <Text style={tw`text-gray-500 font-bold`}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

export default Audit_Survey;
