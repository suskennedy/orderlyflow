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
import { supabase } from '../../../lib/supabase';

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
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    color: 'blue',
    all_day: false,
    task_id: '',
  });

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

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (!formData.start_time) {
      Alert.alert('Error', 'Please enter a start time');
      return;
    }

    if (!formData.all_day && !formData.end_time) {
      Alert.alert('Error', 'Please enter an end time or mark as all day');
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        start_time: formData.start_time,
        end_time: formData.all_day ? formData.start_time : formData.end_time,
        location: formData.location || null,
        color: formData.color,
        all_day: formData.all_day,
        task_id: formData.task_id || null,
        user_id: user?.id,
      };

      const { error } = await supabase.from('calendar_events').insert([eventData]);

      if (error) throw error;

      Alert.alert('Success', 'Calendar event added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding calendar event:', error);
      Alert.alert('Error', 'Failed to add calendar event');
    } finally {
      setLoading(false);
    }
  };

  // Set default start time to current time
  useEffect(() => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      start_time: formatDateTimeForInput(now),
      end_time: formatDateTimeForInput(oneHourLater),
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
            <Text style={styles.label}>Start {formData.all_day ? 'Date' : 'Date & Time'} *</Text>
            <TextInput
              style={styles.input}
              placeholder={formData.all_day ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:MM"}
              value={formData.start_time}
              onChangeText={(text) => setFormData({ ...formData, start_time: text })}
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.helperText}>
              {formData.all_day ? "Format: 2024-01-15" : "Format: 2024-01-15T14:30"}
            </Text>
          </View>
          
          {!formData.all_day && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date & Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DDTHH:MM"
                value={formData.end_time}
                onChangeText={(text) => setFormData({ ...formData, end_time: text })}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.helperText}>Format: 2024-01-15T16:30</Text>
            </View>
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
}); 