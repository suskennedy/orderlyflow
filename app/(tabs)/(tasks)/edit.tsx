import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from '../../../components/DatePicker';
import { useTasks } from '../../../lib/contexts/TasksContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useVendors } from '../../../lib/contexts/VendorsContext';

const FREQUENCY_OPTIONS = [
  'Weekly',
  'Monthly', 
  'Quarterly',
  'Yearly',
  'Custom'
];

export default function EditTaskScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { tasks, updateTask } = useTasks();
  const { vendors } = useVendors();
  const params = useLocalSearchParams();
  
  const taskName = params.taskName as string;
  const task = tasks.find(t => t.title === taskName);

  const [formData, setFormData] = useState({
    title: '',
    suggestedFrequency: '',
    startDate: '',
    frequency: '',
    assignedUser: '',
    assignedVendor: '',
  });

  const [loading, setLoading] = useState(false);

  // Update form data when task is found
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        suggestedFrequency: task.suggested_frequency || '',
        startDate: task.due_date || task.next_due || '',
        frequency: task.recurrence_pattern || '',
        assignedUser: '',
        assignedVendor: task.assigned_vendor_id || '',
      });
    }
  }, [task]);

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Task</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Task not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    setLoading(true);
    try {
      console.log('=== TASK UPDATE DEBUG ===');
      console.log('Original task:', task);
      console.log('Form data:', formData);
      
      // Determine if this should be a recurring task based on frequency
      const isRecurring = formData.frequency && formData.frequency !== 'Custom';
      
      // Calculate next due date based on frequency and start date
      let nextDue = formData.startDate;
      if (isRecurring && formData.startDate) {
        const startDate = new Date(formData.startDate);
        let nextDate = new Date(startDate);
        
        switch (formData.frequency) {
          case 'Weekly':
            nextDate.setDate(startDate.getDate() + 7);
            break;
          case 'Monthly':
            nextDate.setMonth(startDate.getMonth() + 1);
            break;
          case 'Quarterly':
            nextDate.setMonth(startDate.getMonth() + 3);
            break;
          case 'Yearly':
            nextDate.setFullYear(startDate.getFullYear() + 1);
            break;
          default:
            nextDate = startDate;
        }
        nextDue = nextDate.toISOString().split('T')[0];
      }

      const taskUpdates = {
        title: formData.title.trim(),
        suggested_frequency: formData.suggestedFrequency,
        due_date: formData.startDate,
        next_due: nextDue,
        recurrence_pattern: formData.frequency,
        is_recurring: isRecurring || null,
        is_recurring_task: isRecurring || null,
        assigned_vendor_id: formData.assignedVendor || null,
        // Set recurrence interval and unit based on frequency
        recurrence_interval: isRecurring ? 1 : null,
        recurrence_unit: isRecurring ? 
          (formData.frequency === 'Weekly' ? 'weeks' : 
           formData.frequency === 'Monthly' ? 'months' : 
           formData.frequency === 'Quarterly' ? 'months' : 
           formData.frequency === 'Yearly' ? 'years' : null) : null,
      };

      console.log('Task updates to be applied:', taskUpdates);
      console.log('Task ID:', task.id);
      console.log('=== END TASK UPDATE DEBUG ===');

      await updateTask(task.id, taskUpdates);
      
      console.log('Task and calendar events updated successfully');
      
      Alert.alert('Success', 'Task updated successfully! Calendar events have been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Task</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Task Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Task Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
            placeholder="Enter task name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Suggested Replacement */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Suggested Replacement</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            value={formData.suggestedFrequency}
            onChangeText={(text) => setFormData({ ...formData, suggestedFrequency: text })}
            placeholder="e.g., 6 months"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Attach User */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Attach User</Text>
          <View style={[styles.dropdownButton, { 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }]}>
            <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
              Attach user
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </View>
        </View>

        {/* Attach Vendor */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Attach Vendor</Text>
          <View style={[styles.dropdownButton, { 
            backgroundColor: colors.surface,
            borderColor: colors.border 
          }]}>
            <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
              Attach vendor
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Start Date</Text>
          <DatePicker
            label=""
            value={formData.startDate || null}
            placeholder="MM/DD/YYYY"
            onChange={(dateString) => setFormData({ ...formData, startDate: dateString || '' })}
            helperText=""
            isOptional={true}
          />
        </View>

        {/* Frequency */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Frequency</Text>
          <View style={styles.frequencyOptions}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.frequencyChip,
                  { 
                    backgroundColor: formData.frequency === option ? colors.primary : colors.surface,
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setFormData({ ...formData, frequency: option })}
              >
                <Text style={[
                  styles.frequencyChipText,
                  { color: formData.frequency === option ? colors.background : colors.text }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
  },
  frequencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  frequencyChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 