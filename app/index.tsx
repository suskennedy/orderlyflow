import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/contexts/ThemeContext";
import { useAuth } from "../lib/hooks/useAuth";
import { useOnboarding } from "../lib/hooks/useOnboarding";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { isOnboardingCompleted, isLoading: onboardingLoading } = useOnboarding();
  const { colors } = useTheme();

  const loading = authLoading || onboardingLoading;

  if (loading) {
    // Show loading spinner while checking authentication and onboarding status
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    // User is authenticated, redirect to dashboard
    return <Redirect href="/(tabs)/(dashboard)" />;
  } else if (isOnboardingCompleted === false) {
    // User is not authenticated and hasn't seen onboarding, redirect to onboarding
    return <Redirect href="/onboarding" />;
  } else {
    // User is not authenticated but has seen onboarding, redirect to sign in
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