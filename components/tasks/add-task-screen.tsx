import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
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
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { TaskFormData, taskFormSchema, transformTaskFormData } from '../../lib/schemas/tasks/taskFormSchema';
import { useHomesStore } from '../../lib/stores/homesStore';
import { useTasksStore } from '../../lib/stores/tasksStore';
import DatePicker from '../DatePicker';
import TaskSpinner from '../ui/TaskSpinner';

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
  const createCustomTask = useTasksStore(state => state.createCustomTask);
  const homes = useHomesStore(state => state.homes);
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  
  // React Hook Form setup
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as unknown as Resolver<TaskFormData>,
    defaultValues: {
      title: '',
      description: '',
      category: undefined,
      priority: 'medium',
      status: 'pending',
      due_date: '',
      home_id: homeId || '',
      is_recurring: false,
      recurrence_pattern: undefined,
      recurrence_end_date: '',
      assigned_user_id: '',
      assigned_vendor_id: '',
      room_location: '',
      notes: '',
    },
  });

  const formData = watch();
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Alert.alert('Authentication Required', 'Please log in to add tasks.');
      router.replace('/(auth)/signin');
    }
  }, [authLoading, isAuthenticated]);



  const onSubmit = useCallback(async (data: TaskFormData) => {
    // Check if user is authenticated
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add tasks');
      return;
    }
    
    setLoading(true);
    try {
      const taskData = transformTaskFormData(data);

      // Create custom task directly in home_tasks table
      if (data.home_id) {
        await createCustomTask(data.home_id, {
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          due_date: taskData.due_date,
          priority: taskData.priority,
          assigned_user_id: taskData.assigned_user_id,
          assigned_vendor_id: taskData.assigned_vendor_id,
          notes: taskData.notes,
          room_location: taskData.room_location,
          is_recurring: taskData.is_recurring,
          recurrence_pattern: taskData.recurrence_pattern,
          recurrence_end_date: taskData.recurrence_end_date,
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
  }, [user, createCustomTask]);

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
          onPress={handleSubmit(onSubmit)}
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
              style={[
                styles.input, 
                { 
                  borderColor: errors.title ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }
              ]}
              placeholder="e.g., Fix leaky faucet in kitchen"
              value={formData.title}
              onChangeText={(text) => {
                setValue('title', text);
                if (errors.title) clearErrors('title');
              }}
              placeholderTextColor={colors.textTertiary}
            />
            {errors.title && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.title.message}
              </Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  borderColor: errors.description ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }
              ]}
              placeholder="Detailed description of the task..."
              value={formData.description || ''}
              onChangeText={(text) => {
                setValue('description', text);
                if (errors.description) clearErrors('description');
              }}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
            {errors.description && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.description.message}
              </Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.surface,
              borderColor: errors.category ? colors.error : colors.border 
            }]}>
              <Picker
                selectedValue={formData.category || ''}
                onValueChange={(itemValue) => {
                  setValue('category', itemValue as any);
                  if (errors.category) clearErrors('category');
                }}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Select a category..." value="" />
                {TASK_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
            {errors.category && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.category.message}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Task Settings</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
              <View style={[styles.pickerContainer, { 
                backgroundColor: colors.surface,
                borderColor: errors.priority ? colors.error : colors.border 
              }]}>
                <Picker
                  selectedValue={formData.priority}
                  onValueChange={(itemValue) => {
                    setValue('priority', itemValue);
                    if (errors.priority) clearErrors('priority');
                  }}
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
                borderColor: errors.status ? colors.error : colors.border 
              }]}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(itemValue) => {
                    setValue('status', itemValue);
                    if (errors.status) clearErrors('status');
                  }}
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
              value={formData.due_date || null}
              placeholder="Select a due date"
              onChange={(dateString: string | null) => {
                setValue('due_date', dateString || '');
                if (errors.due_date) clearErrors('due_date');
              }}
              helperText="When this task should be completed (will appear in calendar)"
              isOptional={true}
              testID="due-date-picker"
            />
            {errors.due_date && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.due_date.message}
              </Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Assign to Home</Text>
            <View style={[styles.pickerContainer, { 
              backgroundColor: colors.surface,
              borderColor: errors.home_id ? colors.error : colors.border 
            }]}>
              <Picker
                selectedValue={formData.home_id}
                onValueChange={(itemValue) => {
                  setValue('home_id', itemValue);
                  if (errors.home_id) clearErrors('home_id');
                }}
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
                {errors.home_id.message}
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
              onValueChange={(value) => {
                setValue('is_recurring', value);
                if (errors.is_recurring) clearErrors('is_recurring');
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={formData.is_recurring ? colors.textInverse : colors.surface}
            />
          </View>
          {errors.is_recurring && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.is_recurring.message}
            </Text>
          )}
          
          {formData.is_recurring && (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Recurrence Pattern</Text>
                <View style={[styles.pickerContainer, { 
                  backgroundColor: colors.surface,
                  borderColor: errors.recurrence_pattern ? colors.error : colors.border 
                }]}>
                  <Picker
                    selectedValue={formData.recurrence_pattern || ''}
                    onValueChange={(itemValue) => {
                      setValue('recurrence_pattern', itemValue as any);
                      if (errors.recurrence_pattern) clearErrors('recurrence_pattern');
                    }}
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
                    {errors.recurrence_pattern.message}
                  </Text>
                )}
              </View>
              <View style={styles.inputGroup}>
                <DatePicker
                  label="Recurrence End Date"
                  value={formData.recurrence_end_date || null}
                  placeholder="Select an end date (optional)"
                  onChange={(dateString: string | null) => {
                    setValue('recurrence_end_date', dateString || '');
                    if (errors.recurrence_end_date) clearErrors('recurrence_end_date');
                  }}
                  helperText="When recurring task should stop"
                  isOptional={true}
                  testID="recurrence-end-date-picker"
                />
                {errors.recurrence_end_date && (
                  <Text style={[styles.errorText, { color: colors.error }]}>
                    {errors.recurrence_end_date.message}
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[
                styles.input, 
                styles.textArea, 
                { 
                  borderColor: errors.notes ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }
              ]}
              placeholder="Any additional notes, instructions, or reminders..."
              value={formData.notes || ''}
              onChangeText={(text) => {
                setValue('notes', text);
                if (errors.notes) clearErrors('notes');
              }}
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
            />
            {errors.notes && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.notes.message}
              </Text>
            )}
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