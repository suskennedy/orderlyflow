import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
  buttonText: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onButtonPress?: () => void;
  navigateTo?: string;
}

export default function EmptyState({
  title,
  message,
  buttonText,
  iconName,
  onButtonPress,
  navigateTo,
}: EmptyStateProps) {
  const handlePress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else if (navigateTo) {
      router.push(navigateTo as RelativePathString);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name={iconName} size={64} color="#D1D5DB" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});