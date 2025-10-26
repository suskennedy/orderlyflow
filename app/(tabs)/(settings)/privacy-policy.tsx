import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
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
      <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
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
          {renderSection('1. Information We Collect', [
            'We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.',
            'This may include your name, email address, phone number, home information, and any other information you choose to provide.',
            'We also collect information about your use of our services, including device information, usage patterns, and preferences.'
          ])}

          {renderSection('2. How We Use Your Information', [
            'We use the information we collect to provide, maintain, and improve our services.',
            'This includes processing your requests, communicating with you, and personalizing your experience.',
            'We may also use your information for security purposes, to prevent fraud, and to comply with legal obligations.'
          ])}

          {renderSection('3. Information Sharing', [
            'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.',
            'We may share your information with trusted service providers who assist us in operating our services.',
            'We may also share information when required by law or to protect our rights and the safety of our users.'
          ])}

          {renderSection('4. Data Security', [
            'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
            'However, no method of transmission over the internet or electronic storage is 100% secure.',
            'We cannot guarantee absolute security but we strive to protect your information to the best of our ability.'
          ])}

          {renderSection('5. Your Rights', [
            'You have the right to access, update, or delete your personal information.',
            'You can opt out of certain communications from us.',
            'You may also request a copy of your data or ask us to restrict processing of your information.'
          ])}

          {renderSection('6. Contact Us', [
            'If you have any questions about this Privacy Policy, please contact us at privacy@orderlyflow.com.',
            'We will respond to your inquiry within 30 days of receipt.'
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
