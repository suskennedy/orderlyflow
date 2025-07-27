import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  paddingTop?: number;
  onAddPress?: () => void;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showHomeButton?: boolean;
  showDecorativeIcons?: boolean;
}

export default function ScreenHeader({
  title,
  subtitle,
  paddingTop = 0,
  onAddPress,
  showBackButton = false,
  onBackPress,
  showHomeButton = false,
  showDecorativeIcons = false,
}: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleHomePress = () => {
    router.back();
  };

  return (
    <View style={[
      styles.header,
      {
        paddingTop: paddingTop || insets.top + 16,
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
      }
    ]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.background }]}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        
      </View>

      <View style={styles.centerSection}>
        <View style={styles.titleContainer}>
          {showDecorativeIcons && (
            <View style={[styles.titleIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="home" size={20} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightSection}>
        {onAddPress && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={onAddPress}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '400',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});