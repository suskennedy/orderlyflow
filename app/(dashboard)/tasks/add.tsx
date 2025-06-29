import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useDashboard } from '../../../lib/hooks/useDashboard';
import { supabase } from '../../../lib/supabase';

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const TASK_STATUSES = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const TASK_CATEGORIES = [
  'Maintenance',
  'Repair',
  'Cleaning',
  'Inspection',
  'Upgrade',
  'Seasonal',
  'Emergency',
  'Other',
];

interface Home {
  id: string;
  name: string;
}

export default function AddTaskScreen() {
  const { user } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [homes, setHomes] = useState<Home[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: '',
    home_id: '',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_end_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchHomes();
  }, []);

  const fetchHomes = async () => {
    try {
      const { data, error } = await supabase
        .from('homes')
        .select('id, name')
        .eq('user_id', user?.id as string)
        .order('name');

      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert([
        {
          title: formData.title,
          description: formData.description || null,
          category: formData.category || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          home_id: formData.home_id || null,
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : null,
          recurrence_end_date: formData.is_recurring ? formData.recurrence_end_date : null,
          notes: formData.notes || null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      // Refresh dashboard stats
      await fetchDashboardStats();

      Alert.alert('Success', 'Task added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return '#10B981';
      case 'Medium': return '#F59E0B';
      case 'High': return '#EF4444';
      case 'Urgent': return '#DC2626';
      default: return '#6B7280';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Task</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Fix leaky faucet in kitchen"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed description of the task..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => setFormData({ ...formData, category: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="Select a category..." value="" />
                {TASK_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Settings</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.priority}
                  onValueChange={(itemValue) => setFormData({ ...formData, priority: itemValue })}
                  style={styles.picker}
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <Picker.Item key={priority} label={priority} value={priority} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
                  style={styles.picker}
                >
                  {TASK_STATUSES.map((status) => (
                    <Picker.Item key={status} label={status} value={status} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Due Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.due_date}
              onChangeText={(text) => setFormData({ ...formData, due_date: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign to Home</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.home_id}
                onValueChange={(itemValue) => setFormData({ ...formData, home_id: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="Select a home..." value="" />
                {homes.map((home) => (
                  <Picker.Item key={home.id} label={home.name} value={home.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurring Task</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Make this a recurring task</Text>
            <Switch
              value={formData.is_recurring}
              onValueChange={(value) => setFormData({ ...formData, is_recurring: value })}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor={formData.is_recurring ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>
          
          {formData.is_recurring && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recurrence Pattern</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Weekly, Monthly, Every 3 months"
                  value={formData.recurrence_pattern}
                  onChangeText={(text) => setFormData({ ...formData, recurrence_pattern: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Recurrence End Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD (optional)"
                  value={formData.recurrence_end_date}
                  onChangeText={(text) => setFormData({ ...formData, recurrence_end_date: text })}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes, instructions, or reminders..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
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
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  bottomSpacing: {
    height: 120,
  },
}); 