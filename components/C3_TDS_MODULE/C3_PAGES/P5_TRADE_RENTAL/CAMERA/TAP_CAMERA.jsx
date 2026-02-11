import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import tw from "twrnc";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import ViewShot from "react-native-view-shot";

const TAP_CAMERA = ({ onConfirm, onCancel }) => {
  const [beforeUri, setBeforeUri] = useState(null);
  const [afterUri, setAfterUri] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const [imagesRendered, setImagesRendered] = useState({
    before: false,
    after: false,
  });

  const viewShotRef = useRef(null);

  const handlePickImage = async (type) => {
    if (localLoading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });

      if (!result.canceled) {
        setLocalLoading(true);

        const resized = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 400, height: 400 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );

        if (type === "before") {
          setImagesRendered((p) => ({ ...p, before: false }));
          setBeforeUri(resized.uri);
        } else {
          setImagesRendered((p) => ({ ...p, after: false }));
          setAfterUri(resized.uri);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Could not load image.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!beforeUri || !afterUri) {
      return Alert.alert("Error", "Please select both images.");
    }

    setLocalLoading(true);

    try {
      // 1. Give the UI 500ms to paint the images into the ViewShot canvas
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 2. Capture the view
      const combinedUri = await viewShotRef.current.capture();

      if (!combinedUri) throw new Error("Capture returned null");

      onConfirm(combinedUri);
    } catch (error) {
      console.error("Capture Error:", error);
      Alert.alert("Error", "Failed to capture images. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <View style={tw`w-full bg-white`}>
      {/* VISIBLE UI - NO CHANGES MADE HERE */}
      <View style={tw`flex-row gap-4 mb-6`}>
        {/* Before Box */}
        <View style={tw`flex-1 items-center`}>
          <Text style={tw`text-[3] font-bold text-gray-400 mb-2 uppercase`}>
            Before
          </Text>
          <TouchableOpacity
            onPress={() => handlePickImage("before")}
            style={tw`w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed ${beforeUri ? "border-green-500" : "border-gray-200"} justify-center items-center overflow-hidden`}
          >
            {beforeUri ? (
              <Image
                source={{ uri: beforeUri }}
                style={tw`w-full h-full`}
                onLoadEnd={() =>
                  setImagesRendered((p) => ({ ...p, before: true }))
                }
              />
            ) : (
              <MaterialIcons name="add-a-photo" size={32} color="#028543" />
            )}
          </TouchableOpacity>
        </View>

        {/* After Box */}
        <View style={tw`flex-1 items-center`}>
          <Text style={tw`text-[3] font-bold text-gray-400 mb-2 uppercase`}>
            After
          </Text>
          <TouchableOpacity
            onPress={() => handlePickImage("after")}
            style={tw`w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed ${afterUri ? "border-green-500" : "border-gray-200"} justify-center items-center overflow-hidden`}
          >
            {afterUri ? (
              <Image
                source={{ uri: afterUri }}
                style={tw`w-full h-full`}
                onLoadEnd={() =>
                  setImagesRendered((p) => ({ ...p, after: true }))
                }
              />
            ) : (
              <MaterialIcons name="add-a-photo" size={32} color="#028543" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={tw`flex-row gap-3`}>
        <TouchableOpacity
          onPress={onCancel}
          style={tw`flex-1 h-12 justify-center items-center rounded-xl bg-gray-100`}
        >
          <Text style={tw`text-gray-500 font-bold`}>CANCEL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={
            localLoading || !imagesRendered.before || !imagesRendered.after
          }
          style={tw`flex-2 h-12 justify-center items-center bg-[#028543] rounded-xl ${!imagesRendered.before || !imagesRendered.after ? "opacity-50" : ""}`}
        >
          {localLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={tw`text-white font-bold`}>CONFIRM</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* REVISED HIDDEN CONTAINER - Restored width/height but added pointerEvents fix */}
      <View style={styles.hiddenContainer} pointerEvents="none">
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.8 }}>
          <View style={styles.combinedCanvas}>
            <View style={styles.pane}>
              {beforeUri && (
                <Image source={{ uri: beforeUri }} style={styles.fullImg} />
              )}
              <View style={styles.labelTag}>
                <Text style={styles.tagText}>BEFORE</Text>
              </View>
            </View>
            <View style={styles.pane}>
              {afterUri && (
                <Image source={{ uri: afterUri }} style={styles.fullImg} />
              )}
              <View style={styles.labelTag}>
                <Text style={styles.tagText}>AFTER</Text>
              </View>
            </View>
          </View>
        </ViewShot>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: "absolute",
    top: -1000,
    left: 0,
    // Restored full size so ViewShot can see the images
    width: 800,
    height: 400,
    overflow: "hidden",
    opacity: 0,
  },
  combinedCanvas: {
    flexDirection: "row",
    width: 800,
    height: 400,
    backgroundColor: "black",
  },
  pane: {
    width: 400,
    height: 400,
    position: "relative",
    borderRightWidth: 2,
    borderColor: "white",
  },
  fullImg: { width: 400, height: 400 },
  labelTag: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tagText: { color: "white", fontWeight: "bold", fontSize: 24 },
});

export default TAP_CAMERA;
