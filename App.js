import { useEffect, useState } from "react";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import C0_NAVIGATION from "./components/C0_NAVIGATION/C0_NAVIGATION";
import { SafeAreaView } from "react-native-safe-area-context";
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Poppins: require("./assets/fonts/PatrickHand-Regular.ttf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setTimeout(async () => {
          setFontsLoaded(true);
          await SplashScreen.hideAsync();
        }, 1000);
      }
    }

    prepare();
  }, []);

  if (!fontsLoaded) {
    return null; // Keep splash screen visible
  }
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
      <C0_NAVIGATION />
    </SafeAreaView>
  );
}
