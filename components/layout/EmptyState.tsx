import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface EmptyStateProps {
  title: string;
  message: string;
  buttonText?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  navigateTo?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({
  title,
  message,
  buttonText,
  iconName = 'document-outline',
  navigateTo,
  onButtonPress,
}: EmptyStateProps) {
  const { colors } = useTheme();

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    } else if (navigateTo) {
      router.push(navigateTo as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Ionicons name={iconName} size={48} color={colors.textTertiary} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      
      {buttonText && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleButtonPress}
        >
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});