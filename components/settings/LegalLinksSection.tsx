import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function LegalLinksSection() {
  const { colors } = useTheme();

  const handlePrivacyPolicy = () => {
    router.push('/(tabs)/(settings)/privacy-policy');
  };

  const handleTermsOfService = () => {
    router.push('/(tabs)/(settings)/terms-of-service');
  };

  const renderLegalItem = (
    icon: string,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity 
      style={styles.legalItem}
      onPress={onPress}
    >
      <View style={[styles.legalIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={colors.primary} 
        />
      </View>
      <Text style={[styles.legalLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text-outline" size={24} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal Links</Text>
      </View>

      {renderLegalItem(
        'shield-checkmark-outline',
        'Privacy Policy',
        handlePrivacyPolicy
      )}

      {renderLegalItem(
        'document-outline',
        'Terms of Service',
        handleTermsOfService
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  legalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  legalLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});
