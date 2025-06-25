import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Define props types
interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

// Feature Item Component
const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <View style={styles.featureItem}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#2563EB" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const FeaturesCard: React.FC = () => {
  const features: Feature[] = [
    {
      icon: "home",
      title: "Multi-Home Management",
      description: "Manage multiple properties from a single account",
    },
    {
      icon: "people",
      title: "Vendor Management",
      description: "Keep track of service providers and contractors",
    },
    {
      icon: "list",
      title: "Task Management",
      description: "Schedule and track maintenance and cleaning tasks",
    },
    {
      icon: "calendar",
      title: "Calendar Integration",
      description: "Sync with Google and Apple Calendar",
    },
    {
      icon: "phone-portrait",
      title: "Mobile Friendly",
      description: "Access your home information from any device",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Powerful Features</Text>
      <View style={styles.featuresContainer}>
        {features.map((feature, index) => (
          <FeatureItem
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 28,
  },
  featuresContainer: {
    gap: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  iconContainer: {
    backgroundColor: "#DBEAFE",
    borderRadius: 30,
    padding: 12,
    marginRight: 18,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
});

export default FeaturesCard;