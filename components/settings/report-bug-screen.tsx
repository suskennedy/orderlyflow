import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function ReportBugScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [bugDescription, setBugDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [email, setEmail] = useState('');
  const [severity, setSeverity] = useState('medium');

  const severityLevels = [
    { id: 'low', label: 'Low', color: '#10B981', description: 'Minor issue, workaround available' },
    { id: 'medium', label: 'Medium', color: '#F59E0B', description: 'Affects functionality but not critical' },
    { id: 'high', label: 'High', color: '#EF4444', description: 'Significant impact on usage' },
    { id: 'critical', label: 'Critical', color: '#DC2626', description: 'App crashes or major feature broken' },
  ];

  const handleSubmit = () => {
    if (!bugDescription.trim()) {
      Alert.alert('Error', 'Please describe the bug');
      return;
    }

    Alert.alert(
      'Bug Report Submitted',
      'Thank you for reporting this bug! We\'ll investigate and fix it as soon as possible.',
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
      <Text style={[styles.title, { color: colors.text }]}>Report a Bug</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderSeveritySelector = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Severity Level</Text>
      
      {severityLevels.map((level) => (
        <TouchableOpacity
          key={level.id}
          style={[
            styles.severityOption,
            {
              backgroundColor: severity === level.id ? level.color + '15' : colors.background,
              borderColor: severity === level.id ? level.color : colors.border
            }
          ]}
          onPress={() => setSeverity(level.id)}
        >
          <View style={styles.severityContent}>
            <View style={[styles.severityIndicator, { backgroundColor: level.color }]} />
            <View style={styles.severityInfo}>
              <Text style={[
                styles.severityLabel,
                { color: severity === level.id ? level.color : colors.text }
              ]}>
                {level.label}
              </Text>
              <Text style={[styles.severityDescription, { color: colors.textSecondary }]}>
                {level.description}
              </Text>
            </View>
          </View>
          {severity === level.id && (
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
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bug Details</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Help us understand and fix the issue by providing detailed information.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email (Optional)</Text>
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bug Description *</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={bugDescription}
                onChangeText={setBugDescription}
                placeholder="Describe what went wrong..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Steps to Reproduce</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={steps}
                onChangeText={setSteps}
                placeholder="1. Open the app\n2. Navigate to...\n3. Tap on..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Expected Behavior</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={expectedBehavior}
                onChangeText={setExpectedBehavior}
                placeholder="What should have happened?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Actual Behavior</Text>
              <TextInput
                style={[styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={actualBehavior}
                onChangeText={setActualBehavior}
                placeholder="What actually happened?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.error }]}
              onPress={handleSubmit}
            >
              <Ionicons name="bug-outline" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Bug Report</Text>
            </TouchableOpacity>
          </View>

          {renderSeveritySelector()}
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
    minHeight: 100,
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
  severityOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  severityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  severityInfo: {
    flex: 1,
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  severityDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
