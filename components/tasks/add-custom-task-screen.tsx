import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Resolver, useForm } from 'react-hook-form';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { CustomTaskFormData, customTaskFormSchema, transformCustomTaskFormData } from '../../lib/schemas/tasks/customTaskFormSchema';
import DatePicker from '../DatePicker';

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

const CATEGORY_OPTIONS = [
  { label: 'Deep Cleaning', value: 'Deep Cleaning' },
  { label: 'Health + Safety', value: 'Health + Safety' },
  { label: 'Home Maintenance', value: 'Home Maintenance' },
  { label: 'Repairs', value: 'Repairs' },
  { label: 'Custom', value: 'Custom' }
];

export default function AddCustomTaskScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { createCustomTask } = useTasks();
  const { homes } = useHomes();
  const { vendors } = useVendors();
  const { showToast } = useToast();
  
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // React Hook Form setup
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<CustomTaskFormData>({
    resolver: zodResolver(customTaskFormSchema) as unknown as Resolver<CustomTaskFormData>,
    defaultValues: {  
      title: '',
      description: '',
      category: undefined,
      priority: 'medium',
      due_date: '',
      is_recurring: false,
      recurrence_pattern: undefined,
      recurrence_end_date: '',
      home_id: '',
      notes: '',
      assigned_vendor_id: '',
      assigned_user_id: '',
      instructions: '',
      estimated_cost: null,
      room_location: '',
      equipment_required: '',
      safety_notes: '',
      estimated_duration_minutes: null,
    },
  });

  const formData = watch();

  const handleVendorSelection = (vendorId: string) => {
    setValue('assigned_vendor_id', vendorId);
    if (errors.assigned_vendor_id) clearErrors('assigned_vendor_id');
    setShowVendorModal(false);
  };

  const handleHomeSelection = (homeId: string) => {
    setValue('home_id', homeId);
    if (errors.home_id) clearErrors('home_id');
    setShowHomeModal(false);
  };

  const handlePrioritySelection = (priority: string) => {
    setValue('priority', priority as any);
    if (errors.priority) clearErrors('priority');
    setShowPriorityModal(false);
  };

  const handleRecurrenceSelection = (pattern: string | null) => {
    setValue('recurrence_pattern', pattern as any);
    setValue('is_recurring', pattern !== null);
    if (errors.recurrence_pattern) clearErrors('recurrence_pattern');
    setShowRecurrenceModal(false);
  };

  const handleCategorySelection = (category: string) => {
    setValue('category', category as any);
    if (errors.category) clearErrors('category');
    setShowCategoryModal(false);
  };

  const onSubmit = async (data: CustomTaskFormData) => {
    setLoading(true);
    try {
      const taskData = transformCustomTaskFormData(data);
      await createCustomTask(data.home_id, taskData);
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
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
    readOnly: boolean = false
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
            height: multiline ? 80 : 48,
            opacity: readOnly ? 0.6 : 1
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        editable={!readOnly}
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Project</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
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
            (text) => {
              setValue('title', text);
              if (errors.title) clearErrors('title');
            },
            'Enter task title'
          )}
          {errors.title && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.title.message}
            </Text>
          )}
          
          {renderFormField(
            'Description',
            formData.description || '',
            (text) => {
              setValue('description', text);
              if (errors.description) clearErrors('description');
            },
            'Enter task description',
            true
          )}
          {errors.description && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.description.message}
            </Text>
          )}
          
          {renderDropdownField(
            'Category',
            formData.category || '',
            () => setShowCategoryModal(true),
            'Select category',
            CATEGORY_OPTIONS.find(opt => opt.value === formData.category)?.label
          )}
          {errors.category && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.category.message}
            </Text>
          )}
          
          {renderDropdownField(
            'Priority',
            formData.priority,
            () => setShowPriorityModal(true),
            'Select priority',
            PRIORITY_OPTIONS.find(opt => opt.value === formData.priority)?.label
          )}
          {errors.priority && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.priority.message}
            </Text>
          )}
        </View>

        {/* Scheduling */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Scheduling</Text>
          
          <View style={styles.formField}>
            <Text style={[styles.formLabel, { color: colors.text }]}>Due Date</Text>
            <DatePicker
              label=""
              value={formData.due_date || null}
              onChange={(date) => {
                setValue('due_date', date || '');
                if (errors.due_date) clearErrors('due_date');
              }}
              placeholder="Select due date"
            />
            {errors.due_date && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.due_date.message}
              </Text>
            )}
          </View>
          
          {renderDropdownField(
            'Recurrence',
            formData.recurrence_pattern || '',
            () => setShowRecurrenceModal(true),
            'Select recurrence pattern',
            RECURRENCE_OPTIONS.find(opt => opt.value === formData.recurrence_pattern)?.label
          )}
          {errors.recurrence_pattern && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.recurrence_pattern.message}
            </Text>
          )}
          
          {formData.is_recurring && (
            <View style={styles.formField}>
              <Text style={[styles.formLabel, { color: colors.text }]}>Recurrence End Date</Text>
              <DatePicker
                label=""
                value={formData.recurrence_end_date || null}
                onChange={(date) => {
                  setValue('recurrence_end_date', date || '');
                  if (errors.recurrence_end_date) clearErrors('recurrence_end_date');
                }}
                placeholder="Select end date (optional)"
              />
              {errors.recurrence_end_date && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.recurrence_end_date.message}
                </Text>
              )}
            </View>
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
          {errors.home_id && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.home_id.message}
            </Text>
          )}
          
          {renderDropdownField(
            'Assigned Vendor',
            formData.assigned_vendor_id || '',
            () => setShowVendorModal(true),
            'Select vendor',
            vendors.find(v => v.id === formData.assigned_vendor_id)?.name
          )}
          {errors.assigned_vendor_id && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.assigned_vendor_id.message}
            </Text>
          )}
          
          {renderFormField(
            'Room/Location',
            formData.room_location || '',
            (text) => {
              setValue('room_location', text);
              if (errors.room_location) clearErrors('room_location');
            },
            'e.g., Kitchen, Master Bathroom'
          )}
          {errors.room_location && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.room_location.message}
            </Text>
          )}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Details</Text>
          
          {renderFormField(
            'Instructions',
            formData.instructions || '',
            (text) => {
              setValue('instructions', text);
              if (errors.instructions) clearErrors('instructions');
            },
            'Enter detailed instructions',
            true
          )}
          {errors.instructions && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.instructions.message}
            </Text>
          )}
          
          {renderFormField(
            'Equipment Required',
            formData.equipment_required || '',
            (text) => {
              setValue('equipment_required', text);
              if (errors.equipment_required) clearErrors('equipment_required');
            },
            'List required equipment',
            true
          )}
          {errors.equipment_required && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.equipment_required.message}
            </Text>
          )}
          
          {renderFormField(
            'Safety Notes',
            formData.safety_notes || '',
            (text) => {
              setValue('safety_notes', text);
              if (errors.safety_notes) clearErrors('safety_notes');
            },
            'Enter safety considerations',
            true
          )}
          {errors.safety_notes && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.safety_notes.message}
            </Text>
          )}
          
          {renderFormField(
            'Estimated Cost ($)',
            formData.estimated_cost?.toString() || '',
            (text) => {
              setValue('estimated_cost', parseFloat(text));
              if (errors.estimated_cost) clearErrors('estimated_cost');
            },
            '0.00',
            false,
            'numeric'
          )}
          {errors.estimated_cost && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.estimated_cost.message}
            </Text>
          )}
          
          {renderFormField(
            'Estimated Duration (minutes)',
            formData.estimated_duration_minutes?.toString() || '',
            (text) => {
              setValue('estimated_duration_minutes', parseInt(text) || null);
              if (errors.estimated_duration_minutes) clearErrors('estimated_duration_minutes');
            },
            '60',
            false,
            'numeric'
          )}
          {errors.estimated_duration_minutes && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.estimated_duration_minutes.message}
            </Text>
          )}
          
          {renderFormField(
            'Notes',
            formData.notes || '',
            (text) => {
              setValue('notes', text);
              if (errors.notes) clearErrors('notes');
            },
            'Additional notes',
            true
          )}
          {errors.notes && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.notes.message}
            </Text>
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
        showCategoryModal,
        () => setShowCategoryModal(false),
        'Select Category',
        CATEGORY_OPTIONS,
        handleCategorySelection,
        formData.category
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
}); 