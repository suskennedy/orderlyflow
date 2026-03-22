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
import { ThemeProvider, useTheme } from "../lib/contexts/ThemeContext";
import { ToastProvider } from "../lib/contexts/ToastContext";
import { useHomesSubscriptionManager } from "../lib/services/homesSubscriptionManager";
import { supabase } from "../lib/supabase";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isDark, colors } = useTheme();
  // Set up homes real-time subscriptions
  useHomesSubscriptionManager();

  // Handle password-recovery deep links (cold start + warm open)
  const handlePasswordRecoveryUrl = React.useCallback(async (url: string) => {
    if (!url.includes('type=recovery') && !url.includes('reset-password')) return;
    // Tokens arrive in the URL fragment: #access_token=xxx&refresh_token=yyy&type=recovery
    const hash = url.split('#')[1] ?? url.split('?')[1] ?? '';
    const params = Object.fromEntries(new URLSearchParams(hash));
    if (params.access_token && params.refresh_token) {
      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (!error) {
        router.replace('/(auth)/reset-password' as any);
      }
    }
  }, []);

  React.useEffect(() => {
    // Cold start: app was closed when user tapped the link
    Linking.getInitialURL().then((url) => {
      if (url) handlePasswordRecoveryUrl(url);
    });
    // Warm open: app was in background
    const sub = Linking.addEventListener('url', ({ url }) => handlePasswordRecoveryUrl(url));
    return () => sub.remove();
  }, [handlePasswordRecoveryUrl]);

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
