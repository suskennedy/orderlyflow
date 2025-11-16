import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../lib/hooks/useAuth';
import { PROJECT_STATUS, PROJECT_TYPES, ProjectFormData, projectFormSchema } from '../../lib/schemas/projectSchema';
import { useFamilyStore } from '../../lib/stores/familyStore';
import { useHomesStore } from '../../lib/stores/homesStore';
import { useProjectsStore } from '../../lib/stores/projectsStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import DatePicker from '../DatePicker';
import PhotoUploader from '../ui/PhotoUploader';

export default function AddProjectScreen() {
  const router = useRouter();
  const { homeId } = useLocalSearchParams();
  const addProject = useProjectsStore(state => state.addProject);
  const { user } = useAuth();
  const getHomeById = useHomesStore(state => state.getHomeById);
  const vendors = useVendorsStore(state => state.vendors);
  const familyMembers = useFamilyStore(state => state.familyMembers);

  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema) as any,
    defaultValues: {
      title: '',
      project_type: 'other',
      start_date: '',
      target_completion_date: '',
      description: '',
      photos_inspiration: [],
      location_in_home: '',
      vendor_ids: [],
      assigned_user_ids: [],
      estimated_budget: undefined,
      current_spend: undefined,
      final_cost: undefined,
      status: 'not_started',
      reminders_enabled: false,
      reminder_date: '',
      notes: '',
      subtasks: [],
    },
  });

  // Load home context if needed - use ref to prevent loops
  const lastHomeIdRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    if (homeId && typeof homeId === 'string' && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      getHomeById(homeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeId]); // Only depend on homeId - getHomeById is stable

  const onSubmit: (data: ProjectFormData) => Promise<void> = async (data: ProjectFormData) => {
    if (!homeId || typeof homeId !== 'string') {
      Alert.alert('Error', 'No home selected');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        home_id: homeId,
        title: data.title,
        project_type: data.project_type,
        start_date: data.start_date || undefined,
        target_completion_date: data.target_completion_date || undefined,
        description: data.description || undefined,
        photos_inspiration: (uploadedFiles.length > 0 ? uploadedFiles : data.photos_inspiration) || undefined,
        location_in_home: data.location_in_home || undefined,
        vendor_ids: data.vendor_ids && data.vendor_ids.length ? data.vendor_ids : undefined,
        assigned_user_ids: data.assigned_user_ids && data.assigned_user_ids.length ? data.assigned_user_ids : undefined,
        estimated_budget: data.estimated_budget ?? undefined,
        current_spend: data.current_spend ?? undefined,
        final_cost: data.final_cost ?? undefined,
        status: data.status,
        reminders_enabled: data.reminders_enabled ?? false,
        reminder_date: data.reminders_enabled && data.reminder_date ? data.reminder_date : undefined,
        notes: data.notes || undefined,
        subtasks: data.subtasks && data.subtasks.length ? data.subtasks : undefined,
        created_by: user.id,
      };

      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      await addProject(homeId, user.id, payload as any);
      Alert.alert('Success', 'Project added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error adding project:', error);
      Alert.alert('Error', 'Failed to add project');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (results: { url: string }[]) => {
    const urls = results.map(r => r.url);
    setUploadedFiles(prev => [...prev, ...urls]);
  };

  const removeVendor = (id: string) => {
    const current = watch('vendor_ids') || [];
    setValue('vendor_ids', current.filter(v => v !== id));
  };

  const addVendor = (id: string) => {
    const current = watch('vendor_ids') || [];
    if (!current.includes(id)) setValue('vendor_ids', [...current, id]);
  };

  const removeUser = (id: string) => {
    const current = watch('assigned_user_ids') || [];
    setValue('assigned_user_ids', current.filter(v => v !== id));
  };

  const addUser = (id: string) => {
    const current = watch('assigned_user_ids') || [];
    if (!current.includes(id)) setValue('assigned_user_ids', [...current, id]);
  };

  const addSubtask = () => {
    const current = watch('subtasks') || [];
    setValue('subtasks', [...current, { title: '', is_done: false }]);
  };

  const updateSubtask = (index: number, field: 'title' | 'is_done' | 'due_date' | 'reminder_date', value: any) => {
    const current = watch('subtasks') || [];
    const copy = [...current];
    copy[index] = { ...copy[index], [field]: value };
    setValue('subtasks', copy);
  };

  const removeSubtask = (index: number) => {
    const current = watch('subtasks') || [];
    setValue('subtasks', current.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Project</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          {/* Project Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Title *</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter project title"
                  placeholderTextColor="#999"
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          {/* Project Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Type *</Text>
            <View style={styles.categoryGrid}>
              {PROJECT_TYPES.map((type) => (
                <Controller
                  key={type}
                  control={control}
                  name="project_type"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[styles.categoryButton, value === type && styles.categoryButtonSelected]}
                      onPress={() => onChange(type)}
                    >
                      <Text style={[styles.categoryButtonText, value === type && styles.categoryButtonTextSelected]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
            {errors.project_type && <Text style={styles.errorText}>{errors.project_type.message}</Text>}
          </View>

          {/* Dates */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Start Date</Text>
              <Controller
                control={control}
                name="start_date"
                render={({ field: { onChange, value } }) => (
                  <DatePicker label="" value={value || ''} onChange={onChange} placeholder="Select start date" />
                )}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Target Completion Date</Text>
              <Controller
                control={control}
                name="target_completion_date"
                render={({ field: { onChange, value } }) => (
                  <DatePicker label="" value={value || ''} onChange={onChange} placeholder="Select target date" />
                )}
              />
              {errors.target_completion_date && (
                <Text style={styles.errorText}>{errors.target_completion_date.message}</Text>
              )}
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project Description</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter project description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              )}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
          </View>

          {/* Photos / Inspiration */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos / Inspiration</Text>
            <PhotoUploader
              onUploadComplete={handleUploadComplete}
              onUploadStart={() => {}}
              onUploadError={(e) => Alert.alert('Upload Error', e)}
              targetFolder="projects"
              userId={user?.id}
              existingFiles={uploadedFiles}
              disabled={loading}
            />
          </View>

          {/* Location in Home */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location in Home</Text>
            <Controller
              control={control}
              name="location_in_home"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.location_in_home && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter location"
                  placeholderTextColor="#999"
                />
              )}
            />
            {errors.location_in_home && <Text style={styles.errorText}>{errors.location_in_home.message}</Text>}
          </View>

          {/* Vendors - multi-select chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vendors / Contractors</Text>
            <View style={styles.categoryGrid}>
              {vendors.map((v) => {
                const current = watch('vendor_ids') || [];
                const active = current.includes(v.id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.categoryButton, active && styles.categoryButtonSelected]}
                    onPress={() => (active ? removeVendor(v.id) : addVendor(v.id))}
                  >
                    <Text style={[styles.categoryButtonText, active && styles.categoryButtonTextSelected]}>
                      {v.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* User assignment - multi-select chips */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>User Assignment</Text>
            <View style={styles.categoryGrid}>
              {(familyMembers || []).map((m: any) => {
                const current = watch('assigned_user_ids') || [];
                const active = current.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.categoryButton, active && styles.categoryButtonSelected]}
                    onPress={() => (active ? removeUser(m.id) : addUser(m.id))}
                  >
                    <Text style={[styles.categoryButtonText, active && styles.categoryButtonTextSelected]}>
                      {m.user?.display_name || m.user?.full_name || 'User'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Budget fields */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Estimated Budget</Text>
              <Controller
                control={control}
                name="estimated_budget"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.estimated_budget && styles.inputError]}
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                    onBlur={onBlur}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.estimated_budget && <Text style={styles.errorText}>{errors.estimated_budget.message}</Text>}
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Current Spend</Text>
              <Controller
                control={control}
                name="current_spend"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.current_spend && styles.inputError]}
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                    onBlur={onBlur}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.current_spend && <Text style={styles.errorText}>{errors.current_spend.message}</Text>}
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Final Cost</Text>
            <Controller
              control={control}
              name="final_cost"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.final_cost && styles.inputError]}
                  value={value?.toString() || ''}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                  onBlur={onBlur}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              )}
            />
            {errors.final_cost && <Text style={styles.errorText}>{errors.final_cost.message}</Text>}
          </View>

          {/* Subtasks / Milestones */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sub-tasks / Milestones</Text>
            {watch('subtasks')?.map((task, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <TextInput
                  style={[styles.input]}
                  value={task.title}
                  onChangeText={(t) => updateSubtask(idx, 'title', t)}
                  placeholder={`Milestone ${idx + 1}`}
                  placeholderTextColor="#999"
                />
                <View style={{ height: 10 }} />
                <DatePicker
                  label="Due Date"
                  value={task.due_date || ''}
                  onChange={(d) => updateSubtask(idx, 'due_date', d || '')}
                  placeholder="Select due date"
                />
                <View style={{ height: 10 }} />
                <DatePicker
                  label="Reminder Date"
                  value={task.reminder_date || ''}
                  onChange={(d) => updateSubtask(idx, 'reminder_date', d || '')}
                  placeholder="Select reminder date"
                />
                <View style={{ height: 10 }} />
                <TouchableOpacity onPress={() => removeSubtask(idx)}>
                  <Text style={{ color: '#e74c3c', fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addSubtask} style={[styles.categoryButton, { alignSelf: 'flex-start' }]}>
              <Text style={styles.categoryButtonText}>+ Add Sub-task</Text>
            </TouchableOpacity>
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusGrid}>
              {PROJECT_STATUS.map((s) => (
                <Controller
                  key={s}
                  control={control}
                  name="status"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[styles.statusButton, value === s && styles.statusButtonSelected]}
                      onPress={() => onChange(s)}
                    >
                      <Text style={[styles.statusButtonText, value === s && styles.statusButtonTextSelected]}>
                        {s.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
          </View>

          {/* Reminders toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reminders / Deadlines</Text>
            <Controller
              control={control}
              name="reminders_enabled"
              render={({ field: { onChange, value } }) => (
                <View style={styles.reminderContainer}>
                  <TouchableOpacity
                    style={[styles.reminderButton, value && styles.reminderButtonSelected]}
                    onPress={() => onChange(!value)}
                  >
                    <Text style={[styles.reminderButtonText, value && styles.reminderButtonTextSelected]}>
                      {value ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* Reminder Date - only show when reminders are enabled */}
          {watch('reminders_enabled') && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reminder Date</Text>
              <Controller
                control={control}
                name="reminder_date"
                render={({ field: { onChange, value } }) => (
                  <DatePicker
                    label=""
                    value={value || ''}
                    onChange={onChange}
                    placeholder="Select reminder date"
                  />
                )}
              />
            </View>
          )}

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea, errors.notes && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter additional notes"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              )}
            />
            {errors.notes && <Text style={styles.errorText}>{errors.notes.message}</Text>}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit as any)}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Project'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2c3e50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40, // Same width as back button to center the title
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  pickerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusButtonSelected: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  statusButtonTextSelected: {
    color: '#fff',
  },
  reminderContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  reminderButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  reminderButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  reminderButtonText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  reminderButtonTextSelected: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
  },
});
