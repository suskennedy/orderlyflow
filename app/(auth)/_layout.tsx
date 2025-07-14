import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";
import { useTheme } from "../../lib/contexts/ThemeContext";

export default function AuthLayout() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true} 
      />
      <Stack
        screenOptions={{
          headerShown: false, // Hide all headers from Expo Router
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="signin" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </>
  );
}