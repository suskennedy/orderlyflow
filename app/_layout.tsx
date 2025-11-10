import { Stack } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../lib/contexts/ThemeContext";
import { ToastProvider } from "../lib/contexts/ToastContext";

function AppContent() {
  const { isDark, colors } = useTheme();

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
