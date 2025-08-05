import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/contexts/ThemeContext";
import { useAuth } from "../lib/hooks/useAuth";

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    // User is authenticated, redirect to dashboard
    return <Redirect href="/(tabs)/(dashboard)" />;
  } else {
    // User is not authenticated, redirect to sign in
    return <Redirect href="/(auth)/signin" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});