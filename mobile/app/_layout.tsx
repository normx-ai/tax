import "@/lib/i18n";
import "../global.css";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as ScreenCapture from "expo-screen-capture";
import * as Font from "expo-font";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "@/lib/theme/ThemeContext";
import ToastProvider from "@/components/ui/ToastProvider";
import { initSentry, Sentry } from "@/lib/sentry";
import { GOOGLE_FONTS_URL } from "@/lib/theme/fonts";

initSentry();
SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

function ThemedStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: "NORMX Tax",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ title: "NORMX Tax" }} />
      <Stack.Screen name="(app)" options={{ title: "NORMX Tax" }} />
      <Stack.Screen name="legal" options={{ title: "NORMX Tax" }} />
    </Stack>
  );
}

function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(Platform.OS === "web");

  useEffect(() => {
    if (Platform.OS === "web") {
      // Web : titre, favicon, polices Google Fonts CDN
      document.title = "NORMX Tax";

      const fontsLink = document.createElement("link");
      fontsLink.href = GOOGLE_FONTS_URL;
      fontsLink.rel = "stylesheet";
      document.head.appendChild(fontsLink);

      const forceContextMenu = (e: Event) => {
        e.stopImmediatePropagation();
      };
      document.addEventListener("contextmenu", forceContextMenu, true);

      SplashScreen.hideAsync();

      return () => {
        document.removeEventListener("contextmenu", forceContextMenu, true);
      };
    } else {
      // Native : charger les polices via expo-font
      Font.loadAsync({
        Inter_300Light,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold,
        Inter_900Black,
      }).then(() => {
        setFontsLoaded(true);
        SplashScreen.hideAsync();
      });

      if (!__DEV__) {
        ScreenCapture.preventScreenCaptureAsync();
        return () => {
          ScreenCapture.allowScreenCaptureAsync();
        };
      }
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <ThemedStatusBar />
          <ThemedStack />
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default Sentry.wrap(RootLayout);
