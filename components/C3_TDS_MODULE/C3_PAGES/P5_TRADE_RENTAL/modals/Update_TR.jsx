import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import * as FileSystem from "expo-file-system/legacy";
import TAP_CAMERA from "../CAMERA/TAP_CAMERA";

const DUMMY_REMARKS = [
  "PERMIT ISSUE",
  "STOCKS ISSUE",
  "POSM ISSUE",
  "CANCELLED",
];

const Update_TR = ({
  is_open,
  set_display_modal,
  selected_item,
  onUpdate,
  GENERAL_USERNAME,
}) => {
  const [temp_status, set_temp_status] = useState(null);
  const [selected_remark, setSelected_remark] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset local state when modal opens
  useEffect(() => {
    if (is_open) {
      set_temp_status(null); // Reset to force user to choose YES or NO
      setSelected_remark(selected_item?.remarks || "");
    }
  }, [is_open, selected_item]);

  const handleFinalSubmit = async (status, evidence = "") => {
    setIsProcessing(true);
    let finalPayload = evidence;

    if (status === "YES" && evidence.startsWith("file://")) {
      try {
        // 2. Use the legacy method with the string 'base64'
        const base64 = await FileSystem.readAsStringAsync(evidence, {
          encoding: "base64",
        });
        finalPayload = base64;
      } catch (err) {
        console.error("Error converting image:", err);
        alert("Failed to process image evidence.");
        setIsProcessing(false);
        return;
      }
    }

    onUpdate(status, finalPayload);
    setIsProcessing(false);
    set_display_modal(null);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={is_open}
      onRequestClose={() => !isProcessing && set_display_modal(null)}
    >
      <View style={tw`flex-1 justify-end bg-black/20`}>
        <Pressable
          style={tw`absolute inset-0`}
          onPress={() => !isProcessing && set_display_modal(null)}
        />

        <View style={tw`bg-white rounded-t-3xl shadow-2xl max-h-[95%]`}>
          <View
            style={tw`w-12 h-1.5 bg-gray-200 rounded-full self-center mt-4 mb-2`}
          />

          <View style={tw`p-6`}>
            {isProcessing ? (
              <View style={tw`items-center py-10`}>
                <ActivityIndicator size="large" color="#028543" />
                <Text style={tw`mt-4 text-gray-500`}>
                  Finalizing Evidence...
                </Text>
              </View>
            ) : (
              <>
                <Text style={tw`text-xl font-bold text-gray-800 mb-1`}>
                  Update Execution
                </Text>
                <Text style={tw`text-gray-500 text-sm mb-6`}>
                  Target:{" "}
                  <Text style={tw`font-bold text-[#028543]`}>
                    {selected_item?.activity}
                  </Text>
                </Text>

                {/* Execution Toggle - Hide if a selection is made to give space to Camera/Remarks */}
                {!temp_status && (
                  <View style={tw`flex-row gap-x-3 mb-6`}>
                    <TouchableOpacity
                      onPress={() => set_temp_status("YES")}
                      style={tw`flex-1 flex-row items-center justify-center p-4 rounded-2xl border-2 border-gray-100 bg-gray-50`}
                    >
                      <Text style={tw`font-bold text-gray-500`}>
                        YES (Capture)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => set_temp_status("NO")}
                      style={tw`flex-1 flex-row items-center justify-center p-4 rounded-2xl border-2 border-gray-100 bg-gray-50`}
                    >
                      <Text style={tw`font-bold text-gray-500`}>
                        NO (Reason)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* CASE 1: YES - Show the camera component */}
                {temp_status === "YES" && (
                  <TAP_CAMERA
                    GENERAL_USERNAME={GENERAL_USERNAME}
                    onConfirm={(combinedUri) =>
                      handleFinalSubmit("YES", combinedUri)
                    }
                    onCancel={() => set_temp_status(null)}
                  />
                )}

                {/* CASE 2: NO - Show remarks */}
                {temp_status === "NO" && (
                  <View>
                    <Text style={tw`text-gray-800 font-bold mb-3`}>
                      Select Reason for "NO"
                    </Text>
                    <ScrollView style={tw`max-h-60 mb-4`}>
                      <View style={tw`gap-y-2`}>
                        {DUMMY_REMARKS.map((remark, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => setSelected_remark(remark)}
                            style={tw`flex-row items-center p-3 rounded-xl border ${
                              selected_remark === remark
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200"
                            }`}
                          >
                            <Text
                              style={tw`text-sm ${selected_remark === remark ? "text-red-700 font-medium" : "text-gray-600"}`}
                            >
                              {remark}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <View style={tw`flex-row gap-x-3`}>
                      <TouchableOpacity
                        onPress={() => set_temp_status(null)}
                        style={tw`flex-1 py-4 bg-gray-100 rounded-2xl items-center`}
                      >
                        <Text style={tw`text-gray-600 font-bold`}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        disabled={!selected_remark}
                        onPress={() => handleFinalSubmit("NO", selected_remark)}
                        style={tw`flex-2 py-4 rounded-2xl items-center ${selected_remark ? "bg-red-500" : "bg-gray-300"}`}
                      >
                        <Text style={tw`text-white font-bold`}>
                          Confirm "NO"
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {!temp_status && (
                  <TouchableOpacity
                    onPress={() => set_display_modal(null)}
                    style={tw`py-4 bg-gray-100 rounded-2xl items-center mt-2`}
                  >
                    <Text style={tw`text-gray-600 font-bold`}>Close</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default Update_TR;
