import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface ThemeSwitcherProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function ThemeSwitcher({ size = 'medium', showLabel = true }: ThemeSwitcherProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'small':
        return { iconSize: 20, containerSize: 36, fontSize: 12 };
      case 'large':
        return { iconSize: 28, containerSize: 48, fontSize: 16 };
      default:
        return { iconSize: 24, containerSize: 40, fontSize: 14 };
    }
  };

  const { iconSize, containerSize, fontSize } = getSize();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
        }
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        {
          backgroundColor: isDark ? '#6366F1' : '#F3F4F6',
          width: containerSize,
          height: containerSize,
        }
      ]}>
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={iconSize}
          color={isDark ? '#FFFFFF' : '#F59E0B'}
        />
      </View>
      {showLabel && (
        <Text style={[
          styles.label,
          {
            fontSize,
            color: isDark ? '#F8FAFC' : '#111827',
          }
        ]}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    marginTop: 4,
    fontWeight: '600',
  },
}); 