import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';

interface LoadingStateProps {
  message?: string;
  backgroundColor?: string;
}

export default function LoadingState({
  message = 'Loading...',
  backgroundColor,
}: LoadingStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container, 
      { backgroundColor: backgroundColor || colors.background }
    ]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});