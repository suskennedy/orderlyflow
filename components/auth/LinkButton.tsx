import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface LinkButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
}

export default function LinkButton({ title, onPress, disabled = false, color }: LinkButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { opacity: disabled ? 0.5 : 1 }]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, { color: color || colors.primary, fontFamily: 'Jost_600SemiBold' }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});