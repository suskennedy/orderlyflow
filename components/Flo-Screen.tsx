import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/contexts/ThemeContext';

export default function FloScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Flo</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your AI Assistant</Text>
      </View>
      
      <View style={[styles.chatContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.welcomeMessage, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="chatbubble" size={48} color={colors.primary} />
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            Hi! I am Flo, your home management assistant. How can I help you today?
          </Text>
        </View>
        
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: colors.text }]}>Quick Questions:</Text>
          <View style={styles.suggestionsList}>
            <Text style={[styles.suggestion, { color: colors.primary }]}>• How do I add a new task?</Text>
            <Text style={[styles.suggestion, { color: colors.primary }]}>• When should I replace my air filter?</Text>
            <Text style={[styles.suggestion, { color: colors.primary }]}>• How do I schedule a vendor appointment?</Text>
            <Text style={[styles.suggestion, { color: colors.primary }]}>• What maintenance tasks are due this week?</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  welcomeMessage: {
    alignItems: 'center',
    padding: 30,
    borderRadius: 12,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  suggestionsContainer: {
    flex: 1,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  suggestionsList: {
    gap: 12,
  },
  suggestion: {
    fontSize: 16,
    lineHeight: 22,
  },
}); 