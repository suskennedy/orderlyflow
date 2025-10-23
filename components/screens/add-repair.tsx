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
    View
} from 'react-native';
import { useFamily } from '../../lib/contexts/FamilyContext';
import { useRepairs } from '../../lib/contexts/RepairsContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { useHomes } from '../../lib/hooks/useHomes';
import { RepairFormData, repairFormSchemaWithValidation } from '../../lib/schemas/repairSchema';
import { UploadResult } from '../../lib/services/uploadService';
import DatePicker from '../DatePicker';
import MediaPreview from '../ui/MediaPreview';
import PhotoUploader from '../ui/PhotoUploader';

const STATUS_OPTIONS = [
  { label: 'To Do', value: 'to_do' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Complete', value: 'complete' },
];

export default function AddRepairScreen() {
  const router = useRouter();
  const { homeId } = useLocalSearchParams();
  const { addRepair } = useRepairs();
  const { user } = useAuth();
  const { getHomeById } = useHomes();
  const { vendors } = useVendors();
  const { familyMembers } = useFamily();

  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<RepairFormData>({
    resolver: zodResolver(repairFormSchemaWithValidation),
    defaultValues: {
      title: '',
      vendor_id: '',
      user_id: '',
      date_reported: new Date().toISOString().split('T')[0], // Today's date
      description_issue: '',
      location_in_home: '',
      cost_estimate: undefined,
      final_cost: undefined,
      schedule_reminder: false,
      reminder_date: '',
      notes: '',
      status: 'to_do',
    },
  });

  const scheduleReminder = watch('schedule_reminder');

  // Get the home object when component mounts
  useEffect(() => {
    if (homeId && typeof homeId === 'string') {
      const home = getHomeById(homeId);
      if (home) {
        // Home is already available if it matches currentHome
      }
    }
  }, [homeId, getHomeById]);

  const onSubmit = async (data: RepairFormData) => {
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
      const repairData = {
        home_id: homeId,
        title: data.title,
        vendor_id: data.vendor_id || undefined,
        user_id: data.user_id || undefined,
        date_reported: data.date_reported || new Date().toISOString().split('T')[0],
        description_issue: data.description_issue || undefined,
        photos_videos: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        location_in_home: data.location_in_home || undefined,
        cost_estimate: data.cost_estimate || undefined,
        final_cost: data.final_cost || undefined,
        schedule_reminder: data.schedule_reminder || false,
        reminder_date: data.schedule_reminder ? data.reminder_date : undefined,
        notes: data.notes || undefined,
        status: data.status,
        created_by: user.id,
      };

      await addRepair(repairData);
      Alert.alert('Success', 'Repair added successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error adding repair:', error);
      Alert.alert('Error', 'Failed to add repair');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (results: UploadResult[]) => {
    const newUrls = results.map(result => result.url);
    setUploadedFiles(prev => [...prev, ...newUrls]);
  };

  const handleUploadStart = () => {
    setUploadingFiles(true);
  };

  const handleUploadError = (error: string) => {
    Alert.alert('Upload Error', error);
    setUploadingFiles(false);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
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
          <Text style={styles.title}>Add Repair</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title of Repair *</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter repair title"
                  placeholderTextColor="#999"
                />
              )}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}
          </View>

          {/* Vendor/User Assignment */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Vendor</Text>
              <Controller
                control={control}
                name="vendor_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {value ? vendors.find(v => v.id === value)?.name || 'Select vendor' : 'Select vendor'}
                    </Text>
                  </View>
                )}
              />
              <View style={styles.vendorGrid}>
                {vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.vendorButton,
                      watch('vendor_id') === vendor.id && styles.vendorButtonSelected,
                    ]}
                    onPress={() => {
                      setValue('vendor_id', vendor.id);
                      setValue('user_id', ''); // Clear user selection
                    }}
                  >
                    <Text
                      style={[
                        styles.vendorButtonText,
                        watch('vendor_id') === vendor.id && styles.vendorButtonTextSelected,
                      ]}
                    >
                      {vendor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>User</Text>
              <Controller
                control={control}
                name="user_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {value ? familyMembers.find(m => m.id === value)?.display_name || 'Select user' : 'Select user'}
                    </Text>
                  </View>
                )}
              />
              <View style={styles.userGrid}>
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.userButton,
                      watch('user_id') === member.id && styles.userButtonSelected,
                    ]}
                    onPress={() => {
                      setValue('user_id', member.id);
                      setValue('vendor_id', ''); // Clear vendor selection
                    }}
                  >
                    <Text
                      style={[
                        styles.userButtonText,
                        watch('user_id') === member.id && styles.userButtonTextSelected,
                      ]}
                    >
                      {member.display_name || member.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Date Reported */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date Reported</Text>
            <Controller
              control={control}
              name="date_reported"
              render={({ field: { onChange, value } }) => (
                <DatePicker
                  label=""
                  value={value || ''}
                  onChange={onChange}
                  placeholder="Select date reported"
                />
              )}
            />
          </View>

          {/* Description of Issue */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description of Issue</Text>
            <Controller
              control={control}
              name="description_issue"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, styles.textArea, errors.description_issue && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter description of the issue"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              )}
            />
            {errors.description_issue && <Text style={styles.errorText}>{errors.description_issue.message}</Text>}
          </View>

          {/* Photos/Videos Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos / Videos</Text>
            <PhotoUploader
              onUploadComplete={handleUploadComplete}
              onUploadStart={handleUploadStart}
              onUploadError={handleUploadError}
              maxFiles={10}
              existingFiles={uploadedFiles}
              disabled={loading || uploadingFiles}
              targetFolder="repairs"
              userId={user?.id}
            />
            {uploadedFiles.length > 0 && (
              <MediaPreview
                files={uploadedFiles}
                onRemove={handleRemoveFile}
                showRemoveButton={!loading && !uploadingFiles}
              />
            )}
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
                  placeholder="Enter location in home"
                  placeholderTextColor="#999"
                />
              )}
            />
            {errors.location_in_home && <Text style={styles.errorText}>{errors.location_in_home.message}</Text>}
          </View>

          {/* Cost Estimate and Final Cost */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Cost Estimate</Text>
              <Controller
                control={control}
                name="cost_estimate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.cost_estimate && styles.inputError]}
                    value={value?.toString() || ''}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : undefined)}
                    onBlur={onBlur}
                    placeholder="Enter cost estimate"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.cost_estimate && <Text style={styles.errorText}>{errors.cost_estimate.message}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
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
                    placeholder="Enter final cost"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.final_cost && <Text style={styles.errorText}>{errors.final_cost.message}</Text>}
            </View>
          </View>

          {/* Schedule Reminder */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schedule Reminder</Text>
            <Controller
              control={control}
              name="schedule_reminder"
              render={({ field: { onChange, value } }) => (
                <View style={styles.reminderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.reminderButton,
                      value && styles.reminderButtonSelected,
                    ]}
                    onPress={() => onChange(!value)}
                  >
                    <Text
                      style={[
                        styles.reminderButtonText,
                        value && styles.reminderButtonTextSelected,
                      ]}
                    >
                      {value ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>

          {/* Reminder Date */}
          {scheduleReminder && (
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

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusGrid}>
              {STATUS_OPTIONS.map((option) => (
                <Controller
                  key={option.value}
                  control={control}
                  name="status"
                  render={({ field: { onChange, value } }) => (
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        value === option.value && styles.statusButtonSelected,
                      ]}
                      onPress={() => onChange(option.value)}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          value === option.value && styles.statusButtonTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              ))}
            </View>
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
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Repair'}
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
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  vendorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vendorButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  vendorButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  vendorButtonText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  vendorButtonTextSelected: {
    color: '#fff',
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  userButtonSelected: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  userButtonText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  userButtonTextSelected: {
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  statusButtonSelected: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  statusButtonTextSelected: {
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