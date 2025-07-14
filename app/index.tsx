import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "../lib/contexts/ThemeContext";
import { useAuth } from "../lib/hooks/useAuth";
import { navigate } from "../lib/navigation";

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        navigate.toDashboard();
      } else {
        // User is not authenticated, redirect to sign in
        navigate.toSignIn();
      }
    }
  }, [user, loading]);

  // Show loading spinner while checking authentication
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});