import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface FoundationOption {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface FoundationSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

const foundationOptions: FoundationOption[] = [
  {
    id: 'crawl',
    title: 'Crawl Space',
    description: 'Elevated foundation with accessible space underneath',
    icon: 'home-outline',
  },
  {
    id: 'slab',
    title: 'Concrete Slab',
    description: 'Direct concrete foundation on ground level',
    icon: 'layers-outline',
  },
  {
    id: 'basement',
    title: 'Basement',
    description: 'Below-ground foundation with full-height space',
    icon: 'business-outline',
  },
  {
    id: 'pier',
    title: 'Pier & Beam',
    description: 'Elevated foundation supported by piers',
    icon: 'construct-outline',
  },
];

export default function FoundationSelector({
  label,
  value,
  onChange,
  isFocused = false,
  onFocus,
  onBlur,
}: FoundationSelectorProps) {
  const { colors } = useTheme();

  const handleOptionPress = (optionId: string) => {
    onChange(optionId);
    onFocus?.();
  };

  const getContainerStyle = () => [
    styles.container,
    {
      borderColor: isFocused ? colors.primary : colors.border,
      borderWidth: isFocused ? 2 : 1,
    },
  ];

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      
      <View style={[styles.container, getContainerStyle()]}>
        <View style={styles.optionsGrid}>
          {foundationOptions.map((option) => {
            const isSelected = value === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleOptionPress(option.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected ? colors.textInverse : colors.primaryLight,
                  },
                ]}>
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isSelected ? colors.primary : colors.primary}
                  />
                </View>
                
                <Text style={[
                  styles.optionTitle,
                  { color: isSelected ? colors.textInverse : colors.text },
                ]}>
                  {option.title}
                </Text>
                
                <Text style={[
                  styles.optionDescription,
                  { color: isSelected ? colors.textInverse + '80' : colors.textSecondary },
                ]} numberOfLines={2}>
                  {option.description}
                </Text>
                
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: colors.textInverse }]}>
                    <Ionicons name="checkmark" size={12} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  container: {
    borderRadius: 12,
    padding: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 