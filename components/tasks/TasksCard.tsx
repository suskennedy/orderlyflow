import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  due_date: string | null;
  is_recurring: boolean | null;
  recurrence_pattern: string | null;
  home_id: string | null;
  notes: string | null;
  created_at: string | null;
  homes?: { name: string } | null;
}

interface TaskCardProps {
  task: Task;
  onDelete: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
}

export default function TaskCard({ task, onDelete, onToggleStatus }: TaskCardProps) {
  const { colors } = useTheme();
  const isCompleted = task.status === 'completed' || task.status === 'Completed';

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return colors.textTertiary;
    
    switch (priority.toLowerCase()) {
      case 'high': return colors.error;
      case 'medium': return colors.warning;
      case 'low': return colors.success;
      case 'urgent': return colors.error;
      default: return colors.textTertiary;
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.surface },
      isCompleted && { backgroundColor: colors.surfaceVariant }
    ]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.checkboxContainer, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => onToggleStatus(task)}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.border },
            isCompleted && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]}>
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={[
            styles.title, 
            { color: colors.text },
            isCompleted && { color: colors.textTertiary, textDecorationLine: 'line-through' }
          ]}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={[
              styles.description, 
              { color: colors.textSecondary },
              isCompleted && { color: colors.textTertiary, textDecorationLine: 'line-through' }
            ]}>
              {task.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
          onPress={() => onDelete(task)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.meta}>
          {task.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '15' }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
          )}
          {task.category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{task.category}</Text>
            </View>
          )}
        </View>
        {task.due_date && (
          <Text style={[styles.dueDate, { color: colors.textTertiary }]}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>

      {task.homes && (
        <Text style={[styles.homeText, { color: colors.textTertiary }]}>🏠 {task.homes.name}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxContainer: {
    padding: 8,
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dueDate: {
    fontSize: 12,
  },
  homeText: {
    fontSize: 12,
  },
});