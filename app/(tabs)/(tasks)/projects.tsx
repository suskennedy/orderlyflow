import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';

const PROJECT_TASKS = [
  { name: 'Kitchen Remodel', suggestedFrequency: 'One-time project' },
  { name: 'Bathroom Renovation', suggestedFrequency: 'One-time project' },
  { name: 'Deck Construction', suggestedFrequency: 'One-time project' },
  { name: 'Roof Replacement', suggestedFrequency: 'Every 20-30 years' },
  { name: 'Window Replacement', suggestedFrequency: 'Every 15-20 years' },
  { name: 'HVAC System Upgrade', suggestedFrequency: 'Every 10-15 years' },
  { name: 'Electrical Panel Upgrade', suggestedFrequency: 'As needed' },
  { name: 'Plumbing System Update', suggestedFrequency: 'Every 20-30 years' },
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (taskName: string) => {
    const newSelectedTasks = new Set(selectedTasks);
    if (newSelectedTasks.has(taskName)) {
      newSelectedTasks.delete(taskName);
    } else {
      newSelectedTasks.add(taskName);
    }
    setSelectedTasks(newSelectedTasks);
  };

  const handleTaskPress = (taskName: string) => {
    // Navigate to edit task screen
    router.push(`/(tabs)/(tasks)/edit?taskName=${encodeURIComponent(taskName)}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Projects</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.categoryContent, { backgroundColor: colors.surface }]}>
          {PROJECT_TASKS.map((task, index) => (
            <TouchableOpacity
              key={index}
              style={styles.taskItem}
              onPress={() => handleTaskPress(task.name)}
              activeOpacity={0.7}
            >
              <View style={styles.taskInfo}>
                <Text style={[styles.taskName, { color: colors.text }]}>
                  {task.name}
                </Text>
                <Text style={[styles.taskFrequency, { color: colors.textSecondary }]}>
                  Suggested replace: {task.suggestedFrequency}
                </Text>
              </View>
              
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[
                    styles.toggleSwitch,
                    { backgroundColor: selectedTasks.has(task.name) ? colors.primary : colors.border }
                  ]}
                  onPress={() => toggleTask(task.name)}
                >
                  <View style={[
                    styles.toggleKnob,
                    { 
                      backgroundColor: '#FFFFFF',
                      transform: [{ translateX: selectedTasks.has(task.name) ? 22 : 2 }]
                    }
                  ]} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categoryContent: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  taskInfo: {
    flex: 1,
    marginRight: 16,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskFrequency: {
    fontSize: 14,
    fontWeight: '400',
  },
  taskActions: {
    alignItems: 'center',
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
}); 