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
import DatePicker from '../../components/DatePicker';
import TimePicker from '../../components/TimePicker';
import { useCalendar } from '../../lib/contexts/CalendarContext';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { supabase } from '../../lib/supabase';

const EVENT_COLORS = [
  { label: 'Gray', value: 'gray' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Purple', value: 'purple' },
  { label: 'Pink', value: 'pink' },
];

interface Task {
  id: string;
  title: string;
}

export default function AddCalendarEventScreen() {
  const { user } = useAuth();
  const { addEvent } = useCalendar();
  const { homes, currentHome } = useHomes();
  const { homeTasks, createHomeTaskWithCalendar } = useTasks();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    color: 'blue',
    all_day: false,
    task_id: '',
    home_id: '',
    is_recurring: false,
    recurrence_pattern: '',
    recurrence_end_date: '',
    create_as_task: false,
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const parseTimeString = (timeStr: string | null): Date => {
    if (!timeStr) return new Date();
    
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (error) {
      return new Date();
    }
  };

  // Helper function to create recurring calendar events
  const createRecurringCalendarEvents = async (eventData: any) => {
    if (!eventData.is_recurring || !eventData.recurrence_pattern || !user?.id) {
      console.log('Skipping recurring calendar events - missing required fields');
      return;
    }

    try {
      console.log('Creating recurring calendar events for event:', eventData.title, 'pattern:', eventData.recurrence_pattern);
      
      const startDate = new Date(eventData.start_time);
      const endDate = eventData.recurrence_end_date ? new Date(eventData.recurrence_end_date) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default
      
      console.log('Recurring event date range:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pattern: eventData.recurrence_pattern
      });
      
      const events = [];
      let currentDate = new Date(startDate);
      let eventCount = 0;
      
      while (currentDate <= endDate && eventCount < 100) { // Limit to 100 events to prevent infinite loops
        const eventDate = currentDate.toISOString().split('T')[0];
        const eventTime = startDate.toTimeString().split(' ')[0]; // Get time part
        const endTime = new Date(eventData.end_time).toTimeString().split(' ')[0];
        
        const calendarEvent = {
          title: eventData.title,
          description: eventData.description,
          start_time: `${eventDate}T${eventTime}`,
          end_time: `${eventDate}T${endTime}`,
          location: eventData.location,
          color: eventData.color,
          all_day: eventData.all_day,
          task_id: eventData.task_id,
          user_id: user.id,
          is_recurring: true,
          recurrence_pattern: eventData.recurrence_pattern,
          recurrence_end_date: eventData.recurrence_end_date,
        };

        events.push(calendarEvent);
        eventCount++;

        // Calculate next occurrence based on pattern (case-insensitive)
        const pattern = eventData.recurrence_pattern.toLowerCase();
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

      console.log(`Creating ${events.length} recurring calendar events for event: ${eventData.title}`);

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
        console.log('No recurring events to create for event:', eventData.title);
      }
    } catch (error) {
      console.error('Error creating recurring calendar events:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (!formData.start_date) {
      Alert.alert('Error', 'Please select a start date');
      return;
    }

    if (!formData.all_day && (!formData.end_date || !formData.start_time || !formData.end_time)) {
      Alert.alert('Error', 'Please select both start and end times');
      return;
    }

    // Validate recurring event fields
    if (formData.is_recurring) {
      if (!formData.recurrence_pattern || formData.recurrence_pattern.trim() === '') {
        Alert.alert('Error', 'Please specify a recurrence pattern for recurring events');
        return;
      }
      
      // If recurrence end date is provided, make sure it's after start date
      if (formData.recurrence_end_date && formData.start_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.recurrence_end_date);
        
        if (endDate < startDate) {
          Alert.alert('Error', 'Recurrence end date must be after the start date');
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Combine date and time
      let start_datetime = formData.start_date;
      if (!formData.all_day && formData.start_time) {
        start_datetime = `${formData.start_date}T${formData.start_time}:00`;
      }
      
      let end_datetime = formData.all_day ? formData.start_date : formData.end_date;
      if (!formData.all_day && formData.end_time) {
        end_datetime = `${formData.end_date}T${formData.end_time}:00`;
      }
      
      // If creating as a home task, use the new calendar integration
      if (formData.create_as_task && formData.home_id) {
        const taskData = {
          title: formData.title,
          description: formData.description || null,
          category: 'other',
          priority: 'medium',
          room_location: formData.location || null,
          due_date: formData.start_date,
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern : null,
          recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        };

        const calendarOptions = {
          create_calendar_event: true,
          start_time: start_datetime,
          end_time: end_datetime,
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern : null,
          recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        };

        await createHomeTaskWithCalendar(formData.home_id, taskData, calendarOptions);
      } else {
        // Create regular calendar event
        const eventData = {
          title: formData.title,
          description: formData.description || null,
          start_time: start_datetime,
          end_time: end_datetime,
          location: formData.location || null,
          color: formData.color,
          all_day: formData.all_day,
          task_id: formData.task_id || null,
          home_id: formData.home_id || null,
          user_id: user?.id,
          is_recurring: formData.is_recurring,
          recurrence_pattern: formData.is_recurring && formData.recurrence_pattern ? formData.recurrence_pattern : null,
          recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        };

        // Add to local state for immediate UI update
        addEvent(eventData);

        // Then insert into Supabase
        const { data, error } = await supabase.from('calendar_events').insert([eventData]);

        if (error) throw error;

        // If it's a recurring event, create recurring calendar events
        if (formData.is_recurring && formData.recurrence_pattern) {
          await createRecurringCalendarEvents(eventData);
        }
      }

      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error adding calendar event:', error);
      Alert.alert('Error', 'Failed to add calendar event');
    } finally {
      setLoading(false);
    }
  };

  // Set default start date/time to current time
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const laterHours = String(oneHourLater.getHours()).padStart(2, '0');
    const laterMinutes = String(oneHourLater.getMinutes()).padStart(2, '0');
    
    setFormData(prev => ({
      ...prev,
      start_date: `${year}-${month}-${day}`,
      start_time: `${hours}:${minutes}`,
      end_date: `${year}-${month}-${day}`,
      end_time: `${laterHours}:${laterMinutes}`,
    }));
  }, []);

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
        <Text style={styles.title}>Add Calendar Event</Text>
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
          <Text style={styles.sectionTitle}>Event Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Team Meeting, Doctor Appointment"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Event details, agenda, notes..."
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Conference Room A, 123 Main St"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.label}>All Day Event</Text>
            <Switch
              value={formData.all_day}
              onValueChange={(value) => setFormData({ ...formData, all_day: value })}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor={formData.all_day ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <DatePicker
              label={`Start ${formData.all_day ? 'Date' : 'Date'}`}
              value={formData.start_date}
              placeholder="Select start date"
              onChange={(dateString) => setFormData({ ...formData, start_date: dateString as string })}
              testID="start-date-picker"
            />
          </View>
          
          {!formData.all_day && (
            <View style={styles.inputGroup}>
              <TimePicker
                label="Start Time"
                value={formData.start_time}
                placeholder="Select start time"
                onChange={(timeString) => setFormData({ ...formData, start_time: timeString as string })}
                testID="start-time-picker"
              />
            </View>
          )}
          
          {!formData.all_day && (
            <>
              <View style={styles.inputGroup}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  placeholder="Select end date"
                  onChange={(dateString) => setFormData({ ...formData, end_date: dateString as string })}
                  testID="end-date-picker"
                />
              </View>
              <View style={styles.inputGroup}>
                <TimePicker
                  label="End Time"
                  value={formData.end_time}
                  placeholder="Select end time"
                  onChange={(timeString) => setFormData({ ...formData, end_time: timeString as string})}
                  testID="end-time-picker"
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Options</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.color}
                onValueChange={(itemValue) => setFormData({ ...formData, color: itemValue })}
                style={styles.picker}
              >
                {EVENT_COLORS.map((color) => (
                  <Picker.Item key={color.value} label={color.label} value={color.value} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Home (Optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.home_id}
                onValueChange={(itemValue) => setFormData({ ...formData, home_id: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="No home selected" value="" />
                {homes.map((home) => (
                  <Picker.Item key={home.id} label={home.name} value={home.id} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Create as Home Task</Text>
            <Switch
              value={formData.create_as_task}
              onValueChange={(value) => setFormData({ ...formData, create_as_task: value })}
              trackColor={{ false: '#D1D5DB', true: '#4F46E5' }}
              thumbColor={formData.create_as_task ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Link to Task (Optional)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.task_id}
                onValueChange={(itemValue) => setFormData({ ...formData, task_id: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="No task linked" value="" />
                {tasks.map((task) => (
                  <Picker.Item key={task.id} label={task.title} value={task.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recurring Event</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Make this a recurring event</Text>
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
                  helperText="When recurring event should stop"
                  isOptional={true}
                  testID="recurrence-end-date-picker"
                />
              </View>
            </>
          )}
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
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  bottomSpacing: {
    height: 120,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});