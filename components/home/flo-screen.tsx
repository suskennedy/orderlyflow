import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import AppLayout from '../layouts/AppLayout';

export default function FloScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <AppLayout showFooter={true}>
      {/* Header */}
      <View style={[
        styles.header,
        { 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 20,
          paddingBottom: 20
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Flo Assistant</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.welcomeCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="chatbubble-ellipses" size={48} color={colors.primary} />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>
            Hi! I am Flo
          </Text>
          <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
            Your AI assistant for home management. I can help you with tasks, maintenance schedules, and organizing your home.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            What can I help you with?
          </Text>
          
          <View style={styles.featuresGrid}>
            <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="list" size={32} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>Task Management</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Create and organize home maintenance tasks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="calendar" size={32} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>Scheduling</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Set up maintenance schedules and reminders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="people" size={32} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>Vendor Help</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Find and manage service providers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.featureCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="home" size={32} color={colors.primary} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>Home Tips</Text>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                Get advice on home maintenance and organization
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.chatSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chatTitle, { color: colors.text }]}>
            Start a conversation
          </Text>
          <Text style={[styles.chatText, { color: colors.textSecondary }]}>
            Ask me anything about home management, and I will help you get organized!
          </Text>
          
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              router.push('/(tabs)/(flo)/chat' as any);
            }}
          >
            <Ionicons name="chatbubble" size={20} color={colors.background} />
            <Text style={[styles.chatButtonText, { color: colors.background }]}>
              Chat with Flo
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chatSection: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  chatText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
