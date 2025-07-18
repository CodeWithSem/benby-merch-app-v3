import React, { useRef, useState } from "react";
import {
  View,
  Button,
  StyleSheet,
  ScrollView,
  Text,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as MediaLibrary from "expo-media-library";
import ViewShot from "react-native-view-shot";

const ASD = () => {
  const [beforeUri, setBeforeUri] = useState(null);
  const [afterUri, setAfterUri] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState({
    before: false,
    after: false,
  });

  const viewShotRef = useRef(null);

  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
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

  const captureAndSave = async () => {
    if (!imagesLoaded.before || !imagesLoaded.after) {
      Alert.alert("⏳ Wait", "Please wait for images to fully load.");
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
      Alert.alert("✅ Success", "Combined image saved to gallery.");
    } catch (err) {
      console.error("Capture error:", err);
      Alert.alert("❌ Error", "Failed to save image.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Image Combiner</Text>

      <Button title="Pick BEFORE Image" onPress={() => pickImage("before")} />
      <Button title="Pick AFTER Image" onPress={() => pickImage("after")} />

      {/* Hidden off-screen rendering */}
      <View style={styles.hidden}>
        {beforeUri && afterUri && (
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 1, result: "tmpfile" }}
          >
            <View style={styles.combinedContainer}>
              <Image
                source={{ uri: beforeUri }}
                style={styles.image}
                onLoadEnd={() =>
                  setImagesLoaded((prev) => ({ ...prev, before: true }))
                }
              />
              <Image
                source={{ uri: afterUri }}
                style={styles.image}
                onLoadEnd={() =>
                  setImagesLoaded((prev) => ({ ...prev, after: true }))
                }
              />
            </View>
          </ViewShot>
        )}
      </View>

      {beforeUri && afterUri && (
        <Button title="💾 Save Combined Image" onPress={captureAndSave} />
      )}
    </ScrollView>
  );
};

export default ASD;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
  },
  hidden: {
    position: "absolute",
    top: -1000,
    left: -1000,
    width: 800,
    height: 400,
  },
  combinedContainer: {
    flexDirection: "row",
    width: 800,
    height: 400,
  },
  image: {
    width: 400,
    height: 400,
  },
});
