import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import AppearanceSection from '../settings/AppearanceSection';
import HouseholdManagementSection from '../settings/HouseholdManagementSection';
import LegalLinksSection from '../settings/LegalLinksSection';
import NotificationsSection from '../settings/NotificationsSection';
import SupportSection from '../settings/SupportSection';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <AppearanceSection />
          <NotificationsSection />
          <HouseholdManagementSection />
          <SupportSection />
          <LegalLinksSection />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
});