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
import DatePicker from '../../../components/DatePicker';
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
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [homes, setHomes] = useState<Home[]>([]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to add tasks.');
      router.replace('/(auth)/signin');
    }
  }, [authLoading, isAuthenticated]);
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
  
  const fetchHomes = async () => {
    try {
      // Make sure we have a valid user ID
      if (!user?.id) {
        console.log('No user ID available, skipping homes fetch');
        return;
      }
      
      console.log('Fetching homes for user:', user.id);
      const { data, error } = await supabase
      .from('homes')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name');
      
      if (error) throw error;
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
    }
  };// Validate date string format (YYYY-MM-DD) and ensure it's a valid date
  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    }
  }, [user]);
  const isValidDateFormat = (dateString: string) => {
    if (!dateString) return true; // Empty is allowed
    
    // Check format using regex
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    // Validate it's an actual date (e.g., not 2023-02-31)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };
  const handleSave = async () => {
    // Check if user is authenticated
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add tasks');
      return;
    }
    
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    // Dates are now properly formatted by the DatePicker component,
    // so we can remove the date format validation checks
    
    // Only validate recurrence pattern if recurring
    if (formData.is_recurring) {
      if (!formData.recurrence_pattern || formData.recurrence_pattern.trim() === '') {
        Alert.alert('Error', 'Please specify a recurrence pattern for recurring tasks');
        return;
      }
      
      // If due date and recurrence end date are provided, make sure end date is after due date
      if (formData.due_date && formData.recurrence_end_date) {
        const dueDate = new Date(formData.due_date);
        const endDate = new Date(formData.recurrence_end_date);
        
        if (endDate < dueDate) {
          Alert.alert('Error', 'Recurrence end date must be after the due date');
          return;
        }
      }
    }
    
    setLoading(true);
    try {      // Prepare task data with proper null handling for database
      const taskData = {
        title: formData.title.trim(),
        description: formData.description ? formData.description.trim() : null,
        category: formData.category || null,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        home_id: formData.home_id || null,
        is_recurring: formData.is_recurring,
        // Only include recurrence fields if this is a recurring task
        recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern.trim() : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        notes: formData.notes ? formData.notes.trim() : null,
        user_id: user?.id,
      };

      console.log('Sending task data to Supabase:', JSON.stringify(taskData, null, 2));
      
      // Insert the task with explicit error handling
      const { data, error } = await supabase.from('tasks').insert([taskData]).select();

      if (error) {
        console.error('Supabase error details:', error);
        
        // Show more specific error message based on the error code
        if (error.code === '23502') { // not_null_violation
          Alert.alert('Error', 'Required field missing. Please check all required fields.');
        } else if (error.code === '23503') { // foreign_key_violation
          Alert.alert('Error', 'Invalid reference. Please check that the home exists.');
        } else if (error.code === '22P02') { // invalid_text_representation
          Alert.alert('Error', 'Invalid data format. Please check date fields.');
        } else {
          Alert.alert('Error', `Database error: ${error.message}`);
        }
        return;
      }

      console.log('Task created successfully:', data);

      // Refresh dashboard stats
      await fetchDashboardStats();

      Alert.alert('Success', 'Task added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error adding task:', error);
      Alert.alert('Error', `Failed to add task: ${error.message || 'Unknown error'}`);
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
            <DatePicker
              label="Due Date"
              value={formData.due_date}
              placeholder="Select a due date"
              onChange={(dateString) => setFormData({ ...formData, due_date: dateString  as string})}
              helperText="When this task should be completed"
              isOptional={true}
              testID="due-date-picker"
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
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.recurrence_pattern}
                    onValueChange={(itemValue) => setFormData({ ...formData, recurrence_pattern: itemValue })}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a recurrence pattern..." value="" />
                    <Picker.Item label="Daily" value="Daily" />
                    <Picker.Item label="Weekly" value="Weekly" />
                    <Picker.Item label="Bi-weekly" value="Bi-weekly" />
                    <Picker.Item label="Monthly" value="Monthly" />
                    <Picker.Item label="Quarterly" value="Quarterly" />
                    <Picker.Item label="Semi-annually" value="Semi-annually" />
                    <Picker.Item label="Annually" value="Annually" />
                  </Picker>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <DatePicker
                  label="Recurrence End Date"
                  value={formData.recurrence_end_date}
                  placeholder="Select an end date (optional)"
                  onChange={(dateString) => setFormData({ ...formData, recurrence_end_date: dateString as string })}
                  helperText="When recurring task should stop"
                  isOptional={true}
                  testID="recurrence-end-date-picker"
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
  },  bottomSpacing: {
    height: 120,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});