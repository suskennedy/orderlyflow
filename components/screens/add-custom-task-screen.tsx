import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useHomes } from '../../lib/hooks/useHomes';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
];

const RECURRENCE_OPTIONS = [
  { label: 'No Recurrence', value: null },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-weekly', value: 'bi-weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-annually', value: 'semi-annually' },
  { label: 'Annually', value: 'annually' }
];

const TASK_TYPE_OPTIONS = [
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Repair', value: 'repair' },
  { label: 'Inspection', value: 'inspection' },
  { label: 'Custom', value: 'custom' }
];

export default function AddCustomTaskScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { addTask } = useTasks();
  const { homes } = useHomes();
  const { vendors } = useVendors();
  const { showToast } = useToast();
  
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showTaskTypeModal, setShowTaskTypeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    priority: 'medium',
    due_date: '',
    is_recurring: false,
    recurrence_pattern: null as string | null,
    recurrence_end_date: '',
    home_id: '',
    notes: '',
    assigned_vendor_id: '',
    assigned_user_id: '',
    instructions: '',
    estimated_cost: '',
    room_location: '',
    equipment_required: '',
    safety_notes: '',
    estimated_duration_minutes: '',
    task_type: 'custom',
    priority_level: 'medium'
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVendorSelection = (vendorId: string) => {
    updateFormData('assigned_vendor_id', vendorId);
    setShowVendorModal(false);
  };

  const handleHomeSelection = (homeId: string) => {
    updateFormData('home_id', homeId);
    setShowHomeModal(false);
  };

  const handlePrioritySelection = (priority: string) => {
    updateFormData('priority', priority);
    updateFormData('priority_level', priority);
    setShowPriorityModal(false);
  };

  const handleRecurrenceSelection = (pattern: string | null) => {
    updateFormData('recurrence_pattern', pattern);
    updateFormData('is_recurring', pattern !== null);
    setShowRecurrenceModal(false);
  };

  const handleTaskTypeSelection = (taskType: string) => {
    updateFormData('task_type', taskType);
    setShowTaskTypeModal(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
        subcategory: formData.subcategory.trim() || null,
        priority: formData.priority,
        priority_level: formData.priority_level,
        due_date: formData.due_date || null,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.recurrence_pattern,
        recurrence_end_date: formData.recurrence_end_date || null,
        home_id: formData.home_id || null,
        notes: formData.notes.trim() || null,
        assigned_vendor_id: formData.assigned_vendor_id || null,
        assigned_user_id: formData.assigned_user_id || null,
        instructions: formData.instructions.trim() || null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        room_location: formData.room_location.trim() || null,
        equipment_required: formData.equipment_required.trim() || null,
        safety_notes: formData.safety_notes.trim() || null,
        estimated_duration_minutes: formData.estimated_duration_minutes ? parseInt(formData.estimated_duration_minutes) : null,
        task_type: formData.task_type,
        is_active: true,
        status: 'pending'
      };

      await addTask(taskData);
      showToast('Custom task created successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error creating custom task:', error);
      showToast('Failed to create task. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { label: string; value: any }[],
    onSelect: (value: any) => void,
    selectedValue: any
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  selectedValue === option.value && { backgroundColor: colors.primaryLight }
                ]}
                onPress={() => onSelect(option.value)}
              >
                <Text style={[
                  styles.modalOptionText,
                  { color: selectedValue === option.value ? colors.primary : colors.text }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderFormField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    multiline: boolean = false,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default'
  ) => (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: colors.text }]}>{label}</Text>
      <TextInput
        style={[
          styles.formInput,
          { 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border,
            height: multiline ? 80 : 48
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderDropdownField = (
    label: string,
    value: string,
    onPress: () => void,
    placeholder: string,
    selectedLabel?: string
  ) => (
    <View style={styles.formField}>
      <Text style={[styles.formLabel, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownButton, { 
          backgroundColor: colors.background,
          borderColor: colors.border 
        }]}
        onPress={onPress}
      >
        <Text style={[
          styles.dropdownButtonText,
          { color: selectedLabel ? colors.text : colors.textSecondary }
        ]}>
          {selectedLabel || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Custom Task</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Saving...</Text>
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          {renderFormField(
            'Task Title *',
            formData.title,
            (text) => updateFormData('title', text),
            'Enter task title'
          )}
          
          {renderFormField(
            'Description',
            formData.description,
            (text) => updateFormData('description', text),
            'Enter task description',
            true
          )}
          
          {renderFormField(
            'Category',
            formData.category,
            (text) => updateFormData('category', text),
            'e.g., Maintenance, Cleaning'
          )}
          
          {renderFormField(
            'Subcategory',
            formData.subcategory,
            (text) => updateFormData('subcategory', text),
            'e.g., Kitchen, Bathroom'
          )}
          
          {renderDropdownField(
            'Task Type',
            formData.task_type,
            () => setShowTaskTypeModal(true),
            'Select task type',
            TASK_TYPE_OPTIONS.find(opt => opt.value === formData.task_type)?.label
          )}
          
          {renderDropdownField(
            'Priority',
            formData.priority,
            () => setShowPriorityModal(true),
            'Select priority',
            PRIORITY_OPTIONS.find(opt => opt.value === formData.priority)?.label
          )}
        </View>

        {/* Scheduling */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduling</Text>
          
          {renderFormField(
            'Due Date',
            formData.due_date,
            (text) => updateFormData('due_date', text),
            'MM/DD/YYYY'
          )}
          
          {renderDropdownField(
            'Recurrence',
            formData.recurrence_pattern || '',
            () => setShowRecurrenceModal(true),
            'Select recurrence pattern',
            RECURRENCE_OPTIONS.find(opt => opt.value === formData.recurrence_pattern)?.label
          )}
          
          {formData.is_recurring && renderFormField(
            'Recurrence End Date',
            formData.recurrence_end_date,
            (text) => updateFormData('recurrence_end_date', text),
            'MM/DD/YYYY (optional)'
          )}
        </View>

        {/* Assignment */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Assignment</Text>
          
          {renderDropdownField(
            'Home',
            formData.home_id,
            () => setShowHomeModal(true),
            'Select home',
            homes.find(h => h.id === formData.home_id)?.name
          )}
          
          {renderDropdownField(
            'Assigned Vendor',
            formData.assigned_vendor_id,
            () => setShowVendorModal(true),
            'Select vendor',
            vendors.find(v => v.id === formData.assigned_vendor_id)?.name
          )}
          
          {renderFormField(
            'Room/Location',
            formData.room_location,
            (text) => updateFormData('room_location', text),
            'e.g., Kitchen, Master Bathroom'
          )}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Details</Text>
          
          {renderFormField(
            'Instructions',
            formData.instructions,
            (text) => updateFormData('instructions', text),
            'Enter detailed instructions',
            true
          )}
          
          {renderFormField(
            'Equipment Required',
            formData.equipment_required,
            (text) => updateFormData('equipment_required', text),
            'List required equipment',
            true
          )}
          
          {renderFormField(
            'Safety Notes',
            formData.safety_notes,
            (text) => updateFormData('safety_notes', text),
            'Enter safety considerations',
            true
          )}
          
          {renderFormField(
            'Estimated Cost ($)',
            formData.estimated_cost,
            (text) => updateFormData('estimated_cost', text),
            '0.00',
            false,
            'numeric'
          )}
          
          {renderFormField(
            'Estimated Duration (minutes)',
            formData.estimated_duration_minutes,
            (text) => updateFormData('estimated_duration_minutes', text),
            '60',
            false,
            'numeric'
          )}
          
          {renderFormField(
            'Notes',
            formData.notes,
            (text) => updateFormData('notes', text),
            'Additional notes',
            true
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {renderModal(
        showVendorModal,
        () => setShowVendorModal(false),
        'Select Vendor',
        vendors.map(v => ({ label: v.name, value: v.id })),
        handleVendorSelection,
        formData.assigned_vendor_id
      )}
      
      {renderModal(
        showHomeModal,
        () => setShowHomeModal(false),
        'Select Home',
        homes.map(h => ({ label: h.name, value: h.id })),
        handleHomeSelection,
        formData.home_id
      )}
      
      {renderModal(
        showPriorityModal,
        () => setShowPriorityModal(false),
        'Select Priority',
        PRIORITY_OPTIONS,
        handlePrioritySelection,
        formData.priority
      )}
      
      {renderModal(
        showRecurrenceModal,
        () => setShowRecurrenceModal(false),
        'Select Recurrence',
        RECURRENCE_OPTIONS,
        handleRecurrenceSelection,
        formData.recurrence_pattern
      )}
      
      {renderModal(
        showTaskTypeModal,
        () => setShowTaskTypeModal(false),
        'Select Task Type',
        TASK_TYPE_OPTIONS,
        handleTaskTypeSelection,
        formData.task_type
      )}

      {/* Toast */}
      {/* Toast is now managed by ToastContext */}
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
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  dropdownButtonText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalList: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 