
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CallToAction: React.FC = () => {
  const router = useRouter();   
  const handleCreateAccount = (): void => {
    router.push("/(auth)/signup");
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Never forget important home details again</Text>
      <Text style={styles.subtitle}>
        Join thousands of homeowners who use our tool to stay organized
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateAccount}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Create Your Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#1E40AF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 36,
    textAlign: "center",
    opacity: 0.9,
    maxWidth: 500,
    lineHeight: 26,
  },
  button: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.2)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  buttonText: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default CallToAction;