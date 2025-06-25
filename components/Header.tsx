import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

const Header: React.FC = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>
        <Text style={styles.highlight}>Home</Text> Organizing Tool
      </Text>
      <Text style={styles.subtitle}>
        The intelligent solution to simplify and manage all your home details in one place
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginTop: Platform.OS === 'ios' ? 20 : 30,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1F2937", // text-gray-800
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 44,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  highlight: {
    color: "#2563EB", // text-blue-600
  },
  subtitle: {
    fontSize: 18,
    color: "#4B5563", // text-gray-600
    textAlign: "center",
    maxWidth: 500,
    lineHeight: 26,
    ...Platform.select({
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
});

export default Header;