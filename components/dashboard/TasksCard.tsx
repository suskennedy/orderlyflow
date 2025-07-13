import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  const isCompleted = task.status === 'completed' || task.status === 'Completed';

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return '#6B7280';
    
    switch (priority.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      case 'urgent': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const priorityColor = getPriorityColor(task.priority);

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => onToggleStatus(task)}
        >
          <View style={[
            styles.checkbox,
            isCompleted && styles.checkedBox
          ]}>
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={[styles.title, isCompleted && styles.completedText]}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={[styles.description, isCompleted && styles.completedText]}>
              {task.description}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(task)}
        >
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.meta}>
          {task.priority && (
            <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                {task.priority.toUpperCase()}
              </Text>
            </View>
          )}
          {task.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{task.category}</Text>
            </View>
          )}
        </View>
        {task.due_date && (
          <Text style={styles.dueDate}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>

      {task.homes && (
        <Text style={styles.homeText}>🏠 {task.homes.name}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  completedCard: {
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F3F4F6',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
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
    backgroundColor: '#EEF2FF',
  },
  categoryText: {
    fontSize: 10,
    color: '#4F46E5',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  dueDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  homeText: {
    fontSize: 12,
    color: '#6B7280',
  },
});