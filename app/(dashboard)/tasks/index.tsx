import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Task {
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
  homes?: {
    name: string;
  } | null;
}

export default function TasksScreen() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          homes (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const { error } = await supabase.from('tasks').insert([
        {
          title: newTask.title,
          description: newTask.description || null,
          priority: newTask.priority,
          category: newTask.category,
          status: 'pending',
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      setNewTask({ title: '', description: '', priority: 'medium', category: 'general' });
      setShowAddForm(false);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'cancelled': return '#EF4444';
      case 'pending': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case 'maintenance': return 'hammer';
      case 'cleaning': return 'sparkles';
      case 'inspection': return 'search';
      case 'repair': return 'build';
      case 'landscaping': return 'leaf';
      case 'security': return 'shield-checkmark';
      case 'utilities': return 'flash';
      case 'insurance': return 'document-text';
      case 'financial': return 'card';
      case 'legal': return 'document';
      default: return 'checkmark-circle';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDateString: string | null) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  const renderTaskCard = ({ item }: { item: Task }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskIconContainer}>
          <Ionicons 
            name={getCategoryIcon(item.category) as any} 
            size={20} 
            color={getPriorityColor(item.priority)} 
          />
        </View>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.taskDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.statusButton, { backgroundColor: `${getStatusColor(item.status)}20` }]}
          onPress={() => {
            if (item.status === 'pending') updateTaskStatus(item.id, 'in_progress');
            else if (item.status === 'in_progress') updateTaskStatus(item.id, 'completed');
          }}
        >
          <Ionicons 
            name={
              item.status === 'completed' ? 'checkmark-circle' :
              item.status === 'in_progress' ? 'play-circle' :
              item.status === 'cancelled' ? 'close-circle' :
              'time'
            } 
            size={24} 
            color={getStatusColor(item.status)} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.taskMeta}>
        <View style={styles.metaRow}>
          <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(item.priority)}20` }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
              {item.priority?.toUpperCase()}
            </Text>
          </View>
          
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
          
          {item.is_recurring && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={12} color="#8B5CF6" />
              <Text style={styles.recurringText}>Recurring</Text>
            </View>
          )}
        </View>

        {(item.due_date || item.homes?.name) && (
          <View style={styles.metaRow}>
            {item.due_date && (
              <View style={styles.dueDateContainer}>
                <Ionicons 
                  name="calendar" 
                  size={14} 
                  color={isOverdue(item.due_date) ? '#EF4444' : '#6B7280'} 
                />
                <Text style={[
                  styles.dueDateText,
                  isOverdue(item.due_date) && styles.overdueText
                ]}>
                  {formatDate(item.due_date)}
                </Text>
              </View>
            )}
            
            {item.homes?.name && (
              <View style={styles.homeContainer}>
                <Ionicons name="home" size={14} color="#6B7280" />
                <Text style={styles.homeText}>{item.homes.name}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {item.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-done-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Tasks Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create tasks to manage your property maintenance and activities
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={() => router.push('/(dashboard)/tasks/add')}
      >
        <Text style={styles.emptyButtonText}>Add Your First Task</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tasks</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="Task title"
            value={newTask.title}
            onChangeText={(text) => setNewTask({ ...newTask, title: text })}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={newTask.description}
            onChangeText={(text) => setNewTask({ ...newTask, description: text })}
            multiline
            numberOfLines={3}
          />
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={addTask}>
              <Text style={styles.saveButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={tasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          tasks.length === 0 && styles.emptyContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {tasks.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(dashboard)/tasks/add')}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#4F46E5',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  taskMeta: {
    gap: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
  },
  recurringText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  overdueText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  homeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
}); 