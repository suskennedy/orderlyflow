import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
import { useRepairs } from '../../lib/contexts/RepairsContext';
import { useAuth } from '../../lib/hooks/useAuth';
import DatePicker from '../DatePicker';

const REPAIR_CATEGORIES = [
  'Emergency',
  'Routine',
  'Cosmetic',
  'Plumbing',
  'Electrical',
  'HVAC',
  'Structural',
  'Appliance',
  'Other',
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function RepairDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { repairs, updateRepair, deleteRepair } = useRepairs();
  const { user } = useAuth();

  const [repair, setRepair] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'pending',
    estimated_cost: '',
    actual_cost: '',
    due_date: '',
    completed_date: '',
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
          description: foundRepair.description || '',
          category: foundRepair.category || '',
          priority: foundRepair.priority || 'medium',
          status: foundRepair.status || 'pending',
          estimated_cost: foundRepair.estimated_cost?.toString() || '',
          actual_cost: foundRepair.actual_cost?.toString() || '',
          due_date: foundRepair.due_date || '',
          completed_date: foundRepair.completed_date || '',
          notes: foundRepair.notes || '',
        });
      }
    }
  }, [id, repairs]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.estimated_cost && isNaN(Number(formData.estimated_cost))) {
      newErrors.estimated_cost = 'Estimated cost must be a valid number';
    }

    if (formData.actual_cost && isNaN(Number(formData.actual_cost))) {
      newErrors.actual_cost = 'Actual cost must be a valid number';
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
        description: formData.description.trim() || undefined,
        category: formData.category,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: formData.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        estimated_cost: formData.estimated_cost ? Number(formData.estimated_cost) : undefined,
        actual_cost: formData.actual_cost ? Number(formData.actual_cost) : undefined,
        due_date: formData.due_date || undefined,
        completed_date: formData.completed_date || undefined,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter repair title"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.displayText}>{repair.title}</Text>
            )}
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Enter repair description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.displayText}>{repair.description || 'No description'}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            {isEditing ? (
              <>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerText}>
                    {formData.category || 'Select category'}
                  </Text>
                </View>
                <View style={styles.categoryGrid}>
                  {REPAIR_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryButton,
                        formData.category === category && styles.categoryButtonSelected,
                      ]}
                      onPress={() => handleInputChange('category', category)}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          formData.category === category && styles.categoryButtonTextSelected,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </>
            ) : (
              <Text style={styles.displayText}>{repair.category || 'No category'}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Priority</Text>
              {isEditing ? (
                <>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {PRIORITY_OPTIONS.find(p => p.value === formData.priority)?.label}
                    </Text>
                  </View>
                  <View style={styles.priorityGrid}>
                    {PRIORITY_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.priorityButton,
                          formData.priority === option.value && styles.priorityButtonSelected,
                        ]}
                        onPress={() => handleInputChange('priority', option.value)}
                      >
                        <Text
                          style={[
                            styles.priorityButtonText,
                            formData.priority === option.value && styles.priorityButtonTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.displayText}>
                  {PRIORITY_OPTIONS.find(p => p.value === repair.priority)?.label || 'Medium'}
                </Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Status</Text>
              {isEditing ? (
                <>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerText}>
                      {STATUS_OPTIONS.find(s => s.value === formData.status)?.label}
                    </Text>
                  </View>
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
                </>
              ) : (
                <Text style={styles.displayText}>
                  {STATUS_OPTIONS.find(s => s.value === repair.status)?.label || 'Pending'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Estimated Cost</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, errors.estimated_cost && styles.inputError]}
                  value={formData.estimated_cost}
                  onChangeText={(value) => handleInputChange('estimated_cost', value)}
                  placeholder="Enter estimated cost"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.displayText}>
                  {repair.estimated_cost ? `$${repair.estimated_cost.toFixed(2)}` : 'Not set'}
                </Text>
              )}
              {errors.estimated_cost && <Text style={styles.errorText}>{errors.estimated_cost}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Actual Cost</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, errors.actual_cost && styles.inputError]}
                  value={formData.actual_cost}
                  onChangeText={(value) => handleInputChange('actual_cost', value)}
                  placeholder="Enter actual cost"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.displayText}>
                  {repair.actual_cost ? `$${repair.actual_cost.toFixed(2)}` : 'Not set'}
                </Text>
              )}
              {errors.actual_cost && <Text style={styles.errorText}>{errors.actual_cost}</Text>}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Due Date</Text>
              {isEditing ? (
                <DatePicker
                  date={formData.due_date}
                  onDateChange={(date) => handleInputChange('due_date', date)}
                  placeholder="Select due date"
                />
              ) : (
                <Text style={styles.displayText}>
                  {repair.due_date ? new Date(repair.due_date).toLocaleDateString() : 'Not set'}
                </Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Completed Date</Text>
              {isEditing ? (
                <DatePicker
                  date={formData.completed_date}
                  onDateChange={(date) => handleInputChange('completed_date', date)}
                  placeholder="Select completed date"
                />
              ) : (
                <Text style={styles.displayText}>
                  {repair.completed_date ? new Date(repair.completed_date).toLocaleDateString() : 'Not set'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
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
              <Text style={styles.displayText}>{repair.notes || 'No notes'}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  displayText: {
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  priorityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  priorityButtonSelected: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  priorityButtonText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  priorityButtonTextSelected: {
    color: '#fff',
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
    fontSize: 14,
    marginTop: 4,
  },
});
