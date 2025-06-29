import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
  completion_date?: string | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  recurrence_end_date?: string | null;
  home_id?: string | null;
  notes?: string | null;
  created_at: string | null;
  updated_at?: string | null;
  user_id: string | null;
  homes?: {
    name: string;
  } | null;
}

interface TasksContextType {
  tasks: TaskItem[];
  loading: boolean;
  refreshing: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<TaskItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  onRefresh: () => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) return;

    try {
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
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (taskData: Omit<TaskItem, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id }])
        .select(`
          *,
          homes (
            name
          )
        `)
        .single();

      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      Alert.alert('Success', 'Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const updateTask = async (id: string, updates: Partial<TaskItem>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          homes (
            name
          )
        `)
        .single();

      if (error) throw error;

      setTasks(prev => prev.map(task => task.id === id ? data : task));
      Alert.alert('Success', 'Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== id));
      Alert.alert('Success', 'Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchTasks(); // Refetch to get related data
          } else if (payload.eventType === 'UPDATE') {
            fetchTasks(); // Refetch to get related data
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value: TasksContextType = {
    tasks,
    loading,
    refreshing,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    onRefresh,
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
} 