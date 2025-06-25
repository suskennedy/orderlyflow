import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "react-native";

export default function AuthLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      <Stack
        screenOptions={{
          headerTintColor: "#2563EB",
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: "#EEF2FF",
          },
          headerStyle: {
            backgroundColor: "#EEF2FF",
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: "Sign In",
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: "Create Account",
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: "Reset Password",
          }}
        />
      </Stack>
    </>
  );
}