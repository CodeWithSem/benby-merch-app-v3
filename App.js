import { useEffect, useState } from "react";
import * as Font from "expo-font";
import C0_NAVIGATION from "./components/C0_NAVIGATION/C0_NAVIGATION";
import { SafeAreaView } from "react-native-safe-area-context";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      // Alias the PatrickHand font as "Poppins"
      Poppins: require("./assets/fonts/PatrickHand-Regular.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return null; // Loading screen or spinner
  }
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <C0_NAVIGATION />
    </SafeAreaView>
  );
}
