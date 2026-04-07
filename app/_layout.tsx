import {
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    useFonts
} from "@expo-google-fonts/cormorant-garamond";
import {
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold
} from "@expo-google-fonts/jost";
import * as Linking from "expo-linking";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { handleAuthCallbackUrl } from "../lib/auth/handleAuthCallbackUrl";
import { ThemeProvider, useTheme } from "../lib/contexts/ThemeContext";
import { ToastProvider } from "../lib/contexts/ToastContext";
import { useHomesSubscriptionManager } from "../lib/services/homesSubscriptionManager";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark, colors } = useTheme();
  // Set up homes real-time subscriptions
  useHomesSubscriptionManager();

  const handleAuthDeepLink = React.useCallback(async (url: string | null) => {
    if (!url) return;
    const result = await handleAuthCallbackUrl(url);
    if (!result.handled) return;
    if (result.kind === 'recovery') {
      router.replace('/(auth)/reset-password' as any);
    } else {
      router.replace('/(tabs)/(dashboard)' as any);
    }
  }, []);

  React.useEffect(() => {
    Linking.getInitialURL().then((url) => {
      void handleAuthDeepLink(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      void handleAuthDeepLink(url);
    });
    return () => sub.remove();
  }, [handleAuthDeepLink]);

  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      {/* Dynamic status bar based on theme */}
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Use SafeAreaView with edges prop to handle both top and bottom system UI elements */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "left", "right", "bottom"]}
      >
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: colors.background,
                ...(Platform.OS === "android" && {
                  paddingBottom: 0,
                }),
              },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(auth)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="onboarding"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="(profile)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="invite"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </ToastProvider>
      </SafeAreaView>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
