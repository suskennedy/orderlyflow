import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function InfoScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const helpSections = [
    {
      title: 'Getting Started',
      items: [
        'Add your first home in the Homes section',
        'Create tasks in the Lists section',
        'Add contacts in the Vendors section',
        'Schedule events in the Calendar section',
        'Ask Flo for help with any questions'
      ]
    },
    {
      title: 'Quick Actions',
      items: [
        'Use Quick Links on the home screen for common actions',
        'Tap the Flo button to get AI assistance',
        'Use the search bar in Vendors to find contacts quickly',
        'Create recurring tasks for regular maintenance'
      ]
    },
    {
      title: 'Task Management',
      items: [
        'Tasks are organized by categories: Home Maintenance, Deep Cleaning, Repairs, Projects',
        'Set due dates and priorities for tasks',
        'Mark tasks as completed when done',
        'Create recurring tasks for regular maintenance items'
      ]
    },
    {
      title: 'Vendor Management',
      items: [
        'Add vendor contacts with company name, contact person, and details',
        'Categorize vendors (Plumber, Electrician, etc.)',
        'Set primary and secondary contact preferences',
        'Use the Call, Email, or Schedule buttons for quick actions'
      ]
    },
    {
      title: 'Calendar Integration',
      items: [
        'Tasks with due dates automatically appear in your calendar',
        'Recurring tasks create multiple calendar events',
        'View all your home management events in one place',
        'Sync with your device calendar for reminders'
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>How to Use</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={[styles.welcomeCard, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="information-circle" size={48} color={colors.primary} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome to OrderlyFlow</Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Your complete home management solution. Here is how to get the most out of the app.
          </Text>
        </View>

        {helpSections.map((section, index) => (
          <View key={index} style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            {section.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.itemContainer}>
                <Ionicons name="checkmark-circle" size={16} color={colors.secondary} />
                <Text style={[styles.itemText, { color: colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={[styles.contactSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Need More Help?</Text>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            Tap the Flo button in the bottom navigation to ask questions and get personalized assistance.
          </Text>
          <TouchableOpacity
            style={[styles.floButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(dashboard)/(homes)/flo' as RelativePathString)}
          >
            <Ionicons name="chatbubble" size={20} color={colors.textInverse} />
            <Text style={[styles.floButtonText, { color: colors.textInverse }]}>Ask Flo</Text>
          </TouchableOpacity>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  contactSection: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  floButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  floButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 