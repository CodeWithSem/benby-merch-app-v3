import React from "react";
import { StyleSheet, View, Text } from "react-native";

const C0_NAVIGATION = () => {
  // RETURN ORIGIN
  return (
    <React.Fragment>
      <View style={styles.container}>
        <Text>Open up App.js to start working on your app!</Text>
        {/* <StatusBar style="auto" /> */}
      </View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default C0_NAVIGATION;
