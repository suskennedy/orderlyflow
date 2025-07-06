import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";

export default function AuthLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      <Stack
        screenOptions={{
          headerShown: false, // Hide all headers from Expo Router
          contentStyle: {
            backgroundColor: "#EEF2FF",
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