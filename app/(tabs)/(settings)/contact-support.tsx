import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';

export default function ContactSupportScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [priority, setPriority] = useState('medium');

  const priorityLevels = [
    { id: 'low', label: 'Low', color: '#10B981', description: 'General question or minor issue' },
    { id: 'medium', label: 'Medium', color: '#F59E0B', description: 'Need help with a feature' },
    { id: 'high', label: 'High', color: '#EF4444', description: 'Urgent issue affecting my work' },
  ];

  const handleLiveChat = () => {
    Alert.alert(
      'Live Chat with Flo',
      'Starting live chat with Flo, our AI assistant...',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Chat', 
          onPress: () => {
            // Navigate to Flo chat interface
            Alert.alert('Flo Chat', 'Welcome! I\'m Flo, your AI assistant. How can I help you today?');
          }
        }
      ]
    );
  };

  const handleSubmitTicket = () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    Alert.alert(
      'Support Ticket Submitted',
      'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      [
        { text: 'OK', onPress: () => router.back() }
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Contact Support</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderLiveChatOption = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <View style={styles.chatHeader}>
        <View style={[styles.chatIcon, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.primary} />
        </View>
        <View style={styles.chatInfo}>
          <Text style={[styles.chatTitle, { color: colors.text }]}>Live Chat with Flo</Text>
          <Text style={[styles.chatDescription, { color: colors.textSecondary }]}>
            Get instant help from our AI assistant
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[styles.chatButton, { backgroundColor: colors.primary }]}
        onPress={handleLiveChat}
      >
        <Ionicons name="chatbubble-outline" size={20} color="white" />
        <Text style={styles.chatButtonText}>Start Chat with Flo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPrioritySelector = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority Level</Text>
      
      {priorityLevels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.priorityOption,
            {
              backgroundColor: priority === level.id ? level.color + '15' : colors.background,
              borderColor: priority === level.id ? level.color : colors.border
            }
          ]}
          onPress={() => setPriority(level.id)}
        >
          <View style={styles.priorityContent}>
            <View style={[styles.priorityIndicator, { backgroundColor: level.color }]} />
            <View style={styles.priorityInfo}>
              <Text style={[
                styles.priorityLabel,
                { color: priority === level.id ? level.color : colors.text }
              ]}>
                {level.label}
              </Text>
              <Text style={[styles.priorityDescription, { color: colors.textSecondary }]}>
                {level.description}
              </Text>
            </View>
          </View>
          {priority === level.id && (
            <Ionicons name="checkmark-circle" size={24} color={level.color} />
          )}
        </TouchableOpacity>
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
          {renderLiveChatOption()}

          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Submit Support Ticket</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Send us a detailed message and we&apos;ll get back to you soon.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject *</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={subject}
                onChangeText={setSubject}
                placeholder="Brief description of your issue"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Message *</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue in detail..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitTicket}
            >
              <Ionicons name="send-outline" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            </TouchableOpacity>
          </View>

          {renderPrioritySelector()}
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  chatIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  priorityOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  priorityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityInfo: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  priorityDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
