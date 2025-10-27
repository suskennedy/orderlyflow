import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { Database } from '../../supabase-types';
import DatePicker from '../DatePicker';
import TaskSpinner from '../ui/TaskSpinner';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

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

interface AddTaskScreenProps {
  homeId?: string;
}

export default function AddTaskScreen({ homeId }: AddTaskScreenProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { createCustomTask } = useTasks();
  const { homes } = useHomes();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  
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
    home_id: homeId || '',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_end_date: '',
    notes: '',
    assigned_user_id: '',
    assigned_vendor_id: '',
    room_location: '',
  });
  
  // Validation states
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Memoized validation
  const validateForm = useCallback(() => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (!formData.home_id) {
      newErrors.home_id = 'Please select a home for this task';
    }

    if (formData.is_recurring && !formData.recurrence_pattern.trim()) {
      newErrors.recurrence_pattern = 'Please specify recurrence pattern';
    }

    if (formData.due_date && formData.recurrence_end_date) {
      const dueDate = new Date(formData.due_date);
      const endDate = new Date(formData.recurrence_end_date);
      
      if (endDate < dueDate) {
        newErrors.recurrence_end_date = 'End date must be after due date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Memoized form field updater
  const updateFormField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);



  const handleSave = useCallback(async () => {
    // Check if user is authenticated
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add tasks');
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
      return;
    }
    
    setLoading(true);
    try {
      // Create the task data using database types (simplified schema)
        const taskData = {
        title: formData.title.trim(),
        description: formData.description ? formData.description.trim() : null,
        category: formData.category || null,
        subcategory: null, // TODO:  eslint-disable-line @typescript-eslint/no-unused-vars
      } as TaskInsert;

      // Create custom task directly in home_tasks table
      if (formData.home_id) {
        await createCustomTask(formData.home_id, {
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          due_date: formData.due_date || null,
          priority: formData.priority || null,
          assigned_user_id: formData.assigned_user_id || null,
          assigned_vendor_id: formData.assigned_vendor_id || null,
          notes: formData.notes || null,
          room_location: formData.room_location || null,
          is_recurring: formData.is_recurring || false,
          recurrence_pattern: formData.recurrence_pattern || null,
          recurrence_end_date: formData.recurrence_end_date || null,
        });
      }

      // Show success and navigate back
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error adding task:', error);
      Alert.alert('Error', `Failed to create task: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, formData, validateForm, errors, createCustomTask]);

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Task</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Details</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Task Title *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="e.g., Fix leaky faucet in kitchen"
              value={formData.title}
              onChangeText={(text) => updateFormField('title', text)}
              placeholderTextColor={colors.textTertiary}
            />
            {errors.title && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.title}
              </Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="Detailed description of the task..."
              value={formData.description}
              onChangeText={(text) => updateFormField('description', text)}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }]}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => updateFormField('category', itemValue)}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Select a category..." value="" />
                {TASK_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Settings</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
              <View style={[styles.pickerContainer, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}>
                <Picker
                  selectedValue={formData.priority}
                  onValueChange={(itemValue) => updateFormField('priority', itemValue)}
                  style={[styles.picker, { color: colors.text }]}
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <Picker.Item key={priority} label={priority} value={priority} />
                  ))}
                </Picker>
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Status</Text>
              <View style={[styles.pickerContainer, { 
                backgroundColor: colors.surface,
                borderColor: colors.border 
              }]}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(itemValue) => updateFormField('status', itemValue)}
                  style={[styles.picker, { color: colors.text }]}
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
              onChange={(dateString: string | null) => updateFormField('due_date', dateString || '')}
              helperText="When this task should be completed (will appear in calendar)"
              isOptional={true}
              testID="due-date-picker"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Assign to Home</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }]}>
              <Picker
                selectedValue={formData.home_id}
                onValueChange={(itemValue) => updateFormField('home_id', itemValue)}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Select a home..." value="" />
                {homes.map((home) => (
                  <Picker.Item key={home.id} label={home.name} value={home.id} />
                ))}
              </Picker>
            </View>
            {errors.home_id && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.home_id}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recurring Task</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Make this a recurring task</Text>
            <Switch
              value={formData.is_recurring}
              onValueChange={(value) => updateFormField('is_recurring', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={formData.is_recurring ? colors.textInverse : colors.surface}
            />
          </View>
          
          {formData.is_recurring && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Recurrence Pattern</Text>
                <View style={[styles.pickerContainer, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border 
                }]}>
                  <Picker
                    selectedValue={formData.recurrence_pattern}
                    onValueChange={(itemValue) => updateFormField('recurrence_pattern', itemValue)}
                    style={[styles.picker, { color: colors.text }]}
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
                {errors.recurrence_pattern && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.recurrence_pattern}
                  </Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <DatePicker
                  label="Recurrence End Date"
                  value={formData.recurrence_end_date}
                  placeholder="Select an end date (optional)"
                  onChange={(dateString: string | null) => updateFormField('recurrence_end_date', dateString || '')}
                  helperText="When recurring task should stop"
                  isOptional={true}
                  testID="recurrence-end-date-picker"
                />
              </View>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="Any additional notes, instructions, or reminders..."
              value={formData.notes}
              onChangeText={(text) => updateFormField('notes', text)}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
        
        {/* Task Spinner */}
        <TaskSpinner 
          visible={loading} 
          message="Creating task..." 
          type="saving" 
        />
    </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    backgroundColor: 'transparent',
    color: '#000000', // Fallback color for better visibility
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
    flex: 1,
  },
  bottomSpacing: {
    height: 120,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});