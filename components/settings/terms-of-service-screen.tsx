import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSection = (title: string, content: string[]) => (
    <View key={title} style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {content.map((paragraph, index) => (
        <Text key={index} style={[styles.paragraph, { color: colors.textSecondary }]}>
          {paragraph}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {renderSection('1. Acceptance of Terms', [
            'By accessing and using OrderlyFlow, you accept and agree to be bound by the terms and provision of this agreement.',
            'If you do not agree to abide by the above, please do not use this service.'
          ])}

          {renderSection('2. Use License', [
            'Permission is granted to temporarily download one copy of OrderlyFlow for personal, non-commercial transitory viewing only.',
            'This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials.',
            'This license shall automatically terminate if you violate any of these restrictions and may be terminated by us at any time.'
          ])}

          {renderSection('3. Service Description', [
            'OrderlyFlow provides home management and task organization services.',
            'We reserve the right to modify, suspend, or discontinue any part of our service at any time.',
            'We do not guarantee that our service will be available at all times or free from errors.'
          ])}

          {renderSection('4. User Responsibilities', [
            'You are responsible for maintaining the confidentiality of your account and password.',
            'You agree to provide accurate and complete information when creating your account.',
            'You are responsible for all activities that occur under your account.'
          ])}

          {renderSection('5. Prohibited Uses', [
            'You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.',
            'You may not violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances.',
            'You may not transmit any worms, viruses, or any code of a destructive nature.'
          ])}

          {renderSection('6. Privacy Policy', [
            'Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.',
            'By using our service, you agree to the collection and use of information in accordance with our Privacy Policy.'
          ])}

          {renderSection('7. Limitation of Liability', [
            'In no event shall OrderlyFlow or its suppliers be liable for any damages arising out of the use or inability to use the materials on OrderlyFlow.',
            'This includes, without limitation, damages for loss of data or profit, or due to business interruption.'
          ])}

          {renderSection('8. Termination', [
            'We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability.',
            'If you wish to terminate your account, you may simply discontinue using the service.'
          ])}

          {renderSection('9. Changes to Terms', [
            'We reserve the right, at our sole discretion, to modify or replace these Terms at any time.',
            'If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.'
          ])}

          {renderSection('10. Contact Information', [
            'If you have any questions about these Terms of Service, please contact us at legal@orderlyflow.com.'
          ])}

          <View style={[styles.footer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Last updated: January 1, 2024
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
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
  section: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
