import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useFamily } from '../../lib/contexts/FamilyContext';
import { useRepairs } from '../../lib/contexts/RepairsContext';
import { useVendors } from '../../lib/contexts/VendorsContext';
import { useAuth } from '../../lib/hooks/useAuth';
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

export default function RepairDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { repairs, updateRepair, deleteRepair } = useRepairs();
  const { vendors } = useVendors();
  const { familyMembers } = useFamily();
  const { user } = useAuth();

  const [repair, setRepair] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description_issue: '',
    location_in_home: '',
    status: 'to_do',
    cost_estimate: '',
    final_cost: '',
    date_reported: '',
    vendor_id: '',
    user_id: '',
    schedule_reminder: false,
    reminder_date: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id && repairs.length > 0) {
      const foundRepair = repairs.find((r: any) => r.id === id);
      if (foundRepair) {
        setRepair(foundRepair);
        setFormData({
          title: foundRepair.title || '',
          description_issue: foundRepair.description_issue || '',
          location_in_home: foundRepair.location_in_home || '',
          status: foundRepair.status || 'to_do',
          cost_estimate: foundRepair.cost_estimate?.toString() || '',
          final_cost: foundRepair.final_cost?.toString() || '',
          date_reported: foundRepair.date_reported || '',
          vendor_id: foundRepair.vendor_id || '',
          user_id: foundRepair.user_id || '',
          schedule_reminder: foundRepair.schedule_reminder || false,
          reminder_date: foundRepair.reminder_date || '',
          notes: foundRepair.notes || '',
        });
        setUploadedFiles(foundRepair.photos_videos || []);
      }
    }
  }, [id, repairs]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.vendor_id && !formData.user_id) {
      newErrors.vendor_id = 'Either a vendor or user must be assigned';
    }

    if (formData.cost_estimate && isNaN(Number(formData.cost_estimate))) {
      newErrors.cost_estimate = 'Cost estimate must be a valid number';
    }

    if (formData.final_cost && isNaN(Number(formData.final_cost))) {
      newErrors.final_cost = 'Final cost must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!repair) return;

    setLoading(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description_issue: formData.description_issue.trim() || undefined,
        location_in_home: formData.location_in_home.trim() || undefined,
        status: formData.status as 'to_do' | 'scheduled' | 'in_progress' | 'complete',
        cost_estimate: formData.cost_estimate ? Number(formData.cost_estimate) : undefined,
        final_cost: formData.final_cost ? Number(formData.final_cost) : undefined,
        date_reported: formData.date_reported || undefined,
        vendor_id: formData.vendor_id || undefined,
        user_id: formData.user_id || undefined,
        photos_videos: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        schedule_reminder: formData.schedule_reminder,
        reminder_date: formData.schedule_reminder && formData.reminder_date ? formData.reminder_date : undefined,
        notes: formData.notes.trim() || undefined,
      };

      await updateRepair(repair.id, updateData);
      setIsEditing(false);
      Alert.alert('Success', 'Repair updated successfully');
    } catch (error) {
      console.error('Error updating repair:', error);
      Alert.alert('Error', 'Failed to update repair');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Repair',
      'Are you sure you want to delete this repair? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!repair) return;

            try {
              await deleteRepair(repair.id);
              router.back();
            } catch (error) {
              console.error('Error deleting repair:', error);
              Alert.alert('Error', 'Failed to delete repair');
            }
          },
        },
      ]
    );
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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

  if (!repair) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading repair details...</Text>
      </View>
    );
  }

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
          <Text style={styles.title}>
            {isEditing ? 'Edit Repair' : 'Repair Details'}
          </Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Title Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Title of Repair *</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter repair title"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.displayValue}>{repair.title}</Text>
            )}
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Vendor/User Assignment Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.cardTitle}>Assignment</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Vendor</Text>
            {isEditing ? (
              <>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>
                        {formData.vendor_id ? vendors.find(v => v.id === formData.vendor_id)?.name || 'Select vendor' : 'Select vendor'}
                  </Text>
                </View>
                    <View style={styles.vendorGrid}>
                      {vendors.map((vendor) => (
                    <TouchableOpacity
                          key={vendor.id}
                      style={[
                            styles.vendorButton,
                            formData.vendor_id === vendor.id && styles.vendorButtonSelected,
                      ]}
                          onPress={() => {
                            handleInputChange('vendor_id', vendor.id);
                            handleInputChange('user_id', ''); // Clear user selection
                          }}
                    >
                      <Text
                        style={[
                              styles.vendorButtonText,
                              formData.vendor_id === vendor.id && styles.vendorButtonTextSelected,
                        ]}
                      >
                            {vendor.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
                  <Text style={styles.displayValue}>
                    {repair.vendor_id ? vendors.find(v => v.id === repair.vendor_id)?.name || 'Unknown' : 'Not assigned'}
                  </Text>
            )}
          </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>User</Text>
              {isEditing ? (
                <>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {formData.user_id ? familyMembers.find((m: any) => m.id === formData.user_id)?.user?.display_name || 'Select user' : 'Select user'}
                    </Text>
                  </View>
                    <View style={styles.userGrid}>
                      {familyMembers.map((member: any) => (
                      <TouchableOpacity
                          key={member.id}
                        style={[
                            styles.userButton,
                            formData.user_id === member.id && styles.userButtonSelected,
                        ]}
                          onPress={() => {
                            handleInputChange('user_id', member.id);
                            handleInputChange('vendor_id', ''); // Clear vendor selection
                          }}
                      >
                        <Text
                          style={[
                              styles.userButtonText,
                              formData.user_id === member.id && styles.userButtonTextSelected,
                          ]}
                        >
                            {member.user?.display_name || member.user?.full_name || 'User'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                  <Text style={styles.displayValue}>
                    {repair.user_id ? familyMembers.find((m: any) => m.id === repair.user_id)?.user?.display_name || 'Unknown' : 'Not assigned'}
                  </Text>
                )}
              </View>
            </View>
            {errors.vendor_id && <Text style={styles.errorText}>{errors.vendor_id}</Text>}
          </View>

          {/* Date Reported Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Date Reported</Text>
            {isEditing ? (
              <DatePicker
                label=""
                value={formData.date_reported}
                onChange={(date) => handleInputChange('date_reported', date)}
                placeholder="Select date reported"
              />
            ) : (
              <Text style={styles.displayValue}>
                {repair.date_reported ? new Date(repair.date_reported).toLocaleDateString() : 'Not set'}
                </Text>
              )}
            </View>

          {/* Description Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Description of Issue</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description_issue}
                onChangeText={(value) => handleInputChange('description_issue', value)}
                placeholder="Enter description of the issue"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.displayValue}>{repair.description_issue || 'No description'}</Text>
            )}
          </View>

          {/* Photos / Videos Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Photos / Videos</Text>
              {isEditing ? (
                <>
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
              </>
            ) : (
              <>
                {uploadedFiles.length > 0 ? (
                  <View style={styles.mediaGrid}>
                    {uploadedFiles.map((url, index) => (
                      <View key={index} style={styles.mediaItem}>
                        <Image source={{ uri: url }} style={styles.mediaImage} />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.displayValue}>No photos/videos uploaded</Text>
                )}
              </>
            )}
          </View>

          {/* Location Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Location in Home</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.location_in_home}
                onChangeText={(value) => handleInputChange('location_in_home', value)}
                placeholder="Enter location in home"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.displayValue}>{repair.location_in_home || 'Not specified'}</Text>
            )}
          </View>

          {/* Cost Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.cardTitle}>Cost</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Cost Estimate</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, errors.cost_estimate && styles.inputError]}
                    value={formData.cost_estimate}
                    onChangeText={(value) => handleInputChange('cost_estimate', value)}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {repair.cost_estimate ? `$${repair.cost_estimate.toFixed(2)}` : 'Not set'}
                  </Text>
                )}
                {errors.cost_estimate && <Text style={styles.errorText}>{errors.cost_estimate}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Final Cost</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, errors.final_cost && styles.inputError]}
                    value={formData.final_cost}
                    onChangeText={(value) => handleInputChange('final_cost', value)}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {repair.final_cost ? `$${repair.final_cost.toFixed(2)}` : 'Not set'}
                    </Text>
                )}
                {errors.final_cost && <Text style={styles.errorText}>{errors.final_cost}</Text>}
              </View>
            </View>
                  </View>

          {/* Status Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Status</Text>
            {isEditing ? (
                  <View style={styles.statusGrid}>
                    {STATUS_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.statusButton,
                          formData.status === option.value && styles.statusButtonSelected,
                        ]}
                        onPress={() => handleInputChange('status', option.value)}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            formData.status === option.value && styles.statusButtonTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
              ) : (
              <View style={[styles.statusBadgeLarge, getStatusColor(repair.status)]}>
                <Text style={styles.statusBadgeLargeText}>
                  {STATUS_OPTIONS.find(s => s.value === repair.status)?.label || 'To Do'}
                </Text>
              </View>
              )}
          </View>

          {/* Schedule Reminder Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Schedule Reminder</Text>
              {isEditing ? (
              <>
                <View style={styles.reminderContainer}>
                  <TouchableOpacity
                    style={[styles.reminderButton, formData.schedule_reminder && styles.reminderButtonSelected]}
                    onPress={() => handleInputChange('schedule_reminder', !formData.schedule_reminder)}
                  >
                    <Text style={[styles.reminderButtonText, formData.schedule_reminder && styles.reminderButtonTextSelected]}>
                      {formData.schedule_reminder ? 'Yes' : 'No'}
                </Text>
                  </TouchableOpacity>
            </View>
                {formData.schedule_reminder && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Reminder Date</Text>
                    <DatePicker
                      label=""
                      value={formData.reminder_date}
                      onChange={(date) => handleInputChange('reminder_date', date)}
                      placeholder="Select reminder date"
                    />
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.displayValue}>
                  {repair.schedule_reminder ? 'Enabled' : 'Disabled'}
                </Text>
                {repair.schedule_reminder && repair.reminder_date && (
                  <Text style={styles.reminderDateText}>
                    🔔 {new Date(repair.reminder_date).toLocaleDateString()}
                </Text>
              )}
              </>
              )}
            </View>

          {/* Notes Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder="Enter additional notes"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.displayValue}>{repair.notes || 'No notes'}</Text>
            )}
          </View>
        </View>

        {isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isEditing && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Repair</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'complete':
      return styles.statusComplete;
    case 'in_progress':
      return styles.statusInProgress;
    case 'scheduled':
      return styles.statusScheduled;
    default:
      return styles.statusToDo;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 8,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardView: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    height: 100,
    textAlignVertical: 'top',
  },
  displayValue: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
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
    gap: 12,
    marginBottom: 12,
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
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
  statusBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusBadgeLargeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  statusComplete: {
    backgroundColor: '#27ae60',
  },
  statusInProgress: {
    backgroundColor: '#f39c12',
  },
  statusScheduled: {
    backgroundColor: '#3498db',
  },
  statusToDo: {
    backgroundColor: '#95a5a6',
  },
  reminderContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  reminderButton: {
    paddingHorizontal: 24,
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
    fontWeight: '500',
  },
  reminderButtonTextSelected: {
    color: '#fff',
  },
  reminderDateText: {
    fontSize: 16,
    color: '#e67e22',
    fontWeight: '600',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
});
