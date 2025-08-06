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
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';
import DatePicker from '../DatePicker';

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
  const { addTask } = useTasks();
  const { colors } = useTheme();
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
  };

  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    }
  }, [user]);

  // Helper function to create calendar events for tasks
  const createCalendarEventsForTask = async (taskData: {
    id: string;
    title: string;
    description?: string | null;
    priority: string | null;
    due_date?: string | null;
    is_recurring?: boolean | null;
    recurrence_pattern?: string | null;
    recurrence_end_date?: string | null;
    notes?: string | null;
  }) => {
    if (!user?.id) return;

    try {
      // Use today's date if no due date is provided
      const eventDate = taskData.due_date || new Date().toISOString().split('T')[0];
      
      // Check if calendar event already exists for this task
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('task_id', taskData.id)
        .eq('user_id', user.id);

      if (existingEvents && existingEvents.length > 0) {
        console.log('Calendar event already exists for task:', taskData.id);
        return;
      }

      // Determine event color based on priority
      const getEventColor = (priority: string | null) => {
        switch (priority?.toLowerCase()) {
          case 'urgent': return 'red';
          case 'high': return 'orange';
          case 'medium': return 'blue';
          case 'low': return 'green';
          default: return 'gray';
        }
      };

      const eventColor = getEventColor(taskData.priority);

      // Create the base calendar event
      const calendarEvent = {
        title: `Task: ${taskData.title}`,
        description: taskData.description || `Task: ${taskData.title}${taskData.notes ? `\n\nNotes: ${taskData.notes}` : ''}`,
        start_time: `${eventDate}T09:00:00`, // Default to 9 AM
        end_time: `${eventDate}T10:00:00`,   // Default to 10 AM
        location: null,
        color: eventColor,
        all_day: false,
        task_id: taskData.id,
        user_id: user.id,
        is_recurring: taskData.is_recurring || false,
        recurrence_pattern: taskData.recurrence_pattern || null,
        recurrence_end_date: taskData.recurrence_end_date || null,
      };

      // Insert the calendar event
      const { error } = await supabase
        .from('calendar_events')
        .insert([calendarEvent]);

      if (error) {
        console.error('Error creating calendar event for task:', error);
      }

      // If it's a recurring task, create recurring events
      if (taskData.is_recurring && taskData.recurrence_pattern) {
        await createRecurringCalendarEvents(taskData, eventColor);
      }
    } catch (error) {
      console.error('Error creating calendar events for task:', error);
    }
  };

  // Helper function to create recurring calendar events
  const createRecurringCalendarEvents = async (taskData: {
    id: string;
    title: string;
    description?: string | null;
    priority: string | null;
    due_date?: string | null;
    is_recurring?: boolean | null;
    recurrence_pattern?: string | null;
    recurrence_end_date?: string | null;
    notes?: string | null;
  }, eventColor: string) => {
    if (!taskData.is_recurring || !taskData.recurrence_pattern || !user?.id) {
      console.log('Skipping recurring calendar events - missing required fields:', {
        is_recurring: taskData.is_recurring,
        recurrence_pattern: taskData.recurrence_pattern,
        user_id: user?.id
      });
      return;
    }

    try {
      console.log('Creating recurring calendar events for task:', taskData.title, 'pattern:', taskData.recurrence_pattern);
      
      // Use today's date if no due date is provided
      const startDate = new Date(taskData.due_date || new Date().toISOString().split('T')[0]);
      const endDate = taskData.recurrence_end_date ? new Date(taskData.recurrence_end_date) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
      
      console.log('Recurring task date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pattern: taskData.recurrence_pattern
      });
      
      // Check if recurring events already exist for this task
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('id')
        .eq('task_id', taskData.id)
        .eq('user_id', user.id);

      if (existingEvents && existingEvents.length > 0) {
        console.log('Recurring calendar events already exist for task:', taskData.id, 'count:', existingEvents.length);
        return;
      }
      
      const events = [];
      let currentDate = new Date(startDate);
      let eventCount = 0;
      
      while (currentDate <= endDate && eventCount < 100) { // Limit to 100 events to prevent infinite loops
        const eventDate = currentDate.toISOString().split('T')[0];
        
        const calendarEvent = {
          title: `Task: ${taskData.title}`,
          description: taskData.description || `Recurring Task: ${taskData.title}${taskData.notes ? `\n\nNotes: ${taskData.notes}` : ''}`,
          start_time: `${eventDate}T09:00:00`,
          end_time: `${eventDate}T10:00:00`,
          location: null,
          color: eventColor,
          all_day: false,
          task_id: taskData.id,
          user_id: user.id,
          is_recurring: taskData.is_recurring || false,
          recurrence_pattern: taskData.recurrence_pattern || null,
          recurrence_end_date: taskData.recurrence_end_date || null,
        };

        events.push(calendarEvent);
        eventCount++;

        // Calculate next occurrence based on pattern (case-insensitive)
        const pattern = taskData.recurrence_pattern.toLowerCase();
        switch (pattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'bi-weekly':
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'quarterly':
            currentDate.setMonth(currentDate.getMonth() + 3);
            break;
          case 'semi-annually':
            currentDate.setMonth(currentDate.getMonth() + 6);
            break;
          case 'annually':
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      console.log(`Creating ${events.length} recurring calendar events for task: ${taskData.title}`);

      // Insert all recurring events
      if (events.length > 0) {
        const { error } = await supabase
          .from('calendar_events')
          .insert(events);

        if (error) {
          console.error('Error creating recurring calendar events:', error);
        } else {
          console.log('Successfully created recurring calendar events:', events.length);
        }
      } else {
        console.log('No recurring events to create for task:', taskData.title);
      }
    } catch (error) {
      console.error('Error creating recurring calendar events:', error);
    }
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
    try {
      // Create the task object
      const newTask = {
        id: Date.now().toString(), // Temporary ID, will be replaced by Supabase
        title: formData.title.trim(),
        description: formData.description ? formData.description.trim() : null,
        category: formData.category || null,
        priority: formData.priority,
        status: formData.status,
        due_date: formData.due_date || null,
        home_id: formData.home_id || null,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern.trim() : null,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        notes: formData.notes ? formData.notes.trim() : null,
        user_id: user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Immediately add to local state for UI update
      addTask(newTask);

      // Then save to Supabase
      const { data, error } = await supabase.from('tasks').insert([
        {
          title: formData.title.trim(),
          description: formData.description ? formData.description.trim() : null,
          category: formData.category || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
          home_id: formData.home_id || null,
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern.trim() : null,
          recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
          notes: formData.notes ? formData.notes.trim() : null,
          user_id: user?.id,
        },
      ]).select();

      if (error) throw error;

      // Create calendar events for the new task
      if (data && data[0]) {
        await createCalendarEventsForTask(data[0]);
      }

      // Navigate back - note we don't need to alert since UI already updated
      router.back();
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
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor={colors.textTertiary}
            />
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
              onChangeText={(text) => setFormData({ ...formData, description: text })}
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
                onValueChange={(itemValue) => setFormData({ ...formData, category: itemValue })}
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
                  onValueChange={(itemValue) => setFormData({ ...formData, priority: itemValue })}
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
                  onValueChange={(itemValue) => setFormData({ ...formData, status: itemValue })}
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
              onChange={(dateString: string | null) => setFormData({ ...formData, due_date: dateString || '' })}
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
                onValueChange={(itemValue) => setFormData({ ...formData, home_id: itemValue })}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Select a home..." value="" />
                {homes.map((home) => (
                  <Picker.Item key={home.id} label={home.name} value={home.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recurring Task</Text>
          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>Make this a recurring task</Text>
            <Switch
              value={formData.is_recurring}
              onValueChange={(value) => setFormData({ ...formData, is_recurring: value })}
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
                    onValueChange={(itemValue) => setFormData({ ...formData, recurrence_pattern: itemValue })}
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
              </View>
              <View style={styles.inputGroup}>
                <DatePicker
                  label="Recurrence End Date"
                  value={formData.recurrence_end_date}
                  placeholder="Select an end date (optional)"
                  onChange={(dateString: string | null) => setFormData({ ...formData, recurrence_end_date: dateString || '' })}
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
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholderTextColor={colors.textTertiary}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
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
});