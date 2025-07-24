import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null | undefined;
  priority?: string | null | undefined;
  category?: string | null | undefined;
  due_date?: string | null;
  frequency?: string | null;
  attach_user?: boolean | null;
  attach_vendor?: boolean | null;
  suggested_replace?: string | null;
  start_date?: string | null;
}

const TASK_CATEGORIES = [
  'Home Maintenance',
  'Deep Cleaning', 
  'Repairs',
  'Projects'
];

const FREQUENCY_OPTIONS = [
  'Weekly',
  'Monthly',
  'Quarterly', 
  'Yearly',
  'Custom'
];

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, loading, refreshing, onRefresh } = useTasks();
  const { colors } = useTheme();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Projects']); // Projects expanded by default

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getTasksByCategory = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderTaskCard = (task: Task) => (
    <View key={task.id} style={[styles.taskCard, { backgroundColor: colors.surface }]}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <View style={styles.taskCheckbox}>
            <Ionicons 
              name="ellipse-outline" 
              size={20} 
              color={colors.textSecondary} 
            />
          </View>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
          <TouchableOpacity style={styles.expandIcon}>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.taskDetails}>
        <View style={styles.taskRow}>
          <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>Attach user</Text>
          <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>Attach vendor</Text>
        </View>

        {task.suggested_replace && (
          <View style={styles.taskRow}>
            <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>
              Suggested replace: {task.suggested_replace}
            </Text>
          </View>
        )}

        <View style={styles.taskRow}>
          <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>
            Start date: {formatDate(task.start_date)}
          </Text>
        </View>

        <View style={styles.frequencySection}>
          <Text style={[styles.taskLabel, { color: colors.textSecondary }]}>Frequency</Text>
          <View style={styles.frequencyButtons}>
            {FREQUENCY_OPTIONS.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyButton,
                  { 
                    backgroundColor: task.frequency === freq ? colors.primary : colors.primaryLight,
                    borderColor: colors.primary
                  }
                ]}
              >
                <Text style={[
                  styles.frequencyButtonText,
                  { 
                    color: task.frequency === freq ? colors.background : colors.primary
                  }
                ]}>
                  {freq}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderCategorySection = (category: string) => {
    const categoryTasks = getTasksByCategory(category);
    const isExpanded = expandedCategories.includes(category);

    return (
      <View key={category} style={styles.categorySection}>
        <TouchableOpacity 
          style={[styles.categoryHeader, { backgroundColor: colors.surface }]}
          onPress={() => toggleCategory(category)}
        >
          <Text style={[styles.categoryTitle, { color: colors.text }]}>{category}</Text>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary} 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.categoryContent}>
            {categoryTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No tasks in this category
                </Text>
              </View>
            ) : (
              categoryTasks.map(renderTaskCard)
            )}
          </View>
        )}
      </View>
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        {TASK_CATEGORIES.map(renderCategorySection)}

        {/* Add a List Button */}
        <TouchableOpacity 
          style={[styles.addListButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push('/(dashboard)/tasks/add' as any)}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={[styles.addListText, { color: colors.primary }]}>Add a List</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryContent: {
    paddingLeft: 8,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  expandIcon: {
    padding: 4,
  },
  taskDetails: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLabel: {
    fontSize: 14,
  },
  frequencySection: {
    marginTop: 8,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addListText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
});