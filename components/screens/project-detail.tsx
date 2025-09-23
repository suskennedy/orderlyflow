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
import { useProjects } from '../../lib/contexts/ProjectsContext';
import { useAuth } from '../../lib/hooks/useAuth';
import DatePicker from '../DatePicker';

const PROJECT_CATEGORIES = [
  'Renovation',
  'Addition',
  'Remodel',
  'Kitchen',
  'Bathroom',
  'Basement',
  'Attic',
  'Outdoor',
  'Other',
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const STATUS_OPTIONS = [
  { label: 'Planning', value: 'planning' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'On Hold', value: 'on_hold' },
];

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { projects, updateProject, deleteProject } = useProjects();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    status: 'planning',
    estimated_budget: '',
    actual_budget: '',
    start_date: '',
    end_date: '',
    completion_date: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id && projects.length > 0) {
      const foundProject = projects.find((p: any) => p.id === id);
      if (foundProject) {
        setProject(foundProject);
        setFormData({
          title: foundProject.title || '',
          description: foundProject.description || '',
          category: foundProject.category || '',
          priority: foundProject.priority || 'medium',
          status: foundProject.status || 'planning',
          estimated_budget: foundProject.estimated_budget?.toString() || '',
          actual_budget: foundProject.actual_budget?.toString() || '',
          start_date: foundProject.start_date || '',
          end_date: foundProject.end_date || '',
          completion_date: foundProject.completion_date || '',
          notes: foundProject.notes || '',
        });
      }
    }
  }, [id, projects]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.estimated_budget && isNaN(Number(formData.estimated_budget))) {
      newErrors.estimated_budget = 'Estimated budget must be a valid number';
    }

    if (formData.actual_budget && isNaN(Number(formData.actual_budget))) {
      newErrors.actual_budget = 'Actual budget must be a valid number';
    }

    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!project) return;

    setLoading(true);

    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: formData.status as 'planning' | 'in_progress' | 'completed' | 'on_hold',
        estimated_budget: formData.estimated_budget ? Number(formData.estimated_budget) : undefined,
        actual_budget: formData.actual_budget ? Number(formData.actual_budget) : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        completion_date: formData.completion_date || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await updateProject(project.id, updateData);
      setIsEditing(false);
      Alert.alert('Success', 'Project updated successfully');
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!project) return;

            try {
              await deleteProject(project.id);
              router.back();
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
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

  if (!project) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading project details...</Text>
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
            {isEditing ? 'Edit Project' : 'Project Details'}
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
                placeholder="Enter project title"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.displayText}>{project.title}</Text>
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
                placeholder="Enter project description"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.displayText}>{project.description || 'No description'}</Text>
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
                  {PROJECT_CATEGORIES.map((category) => (
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
              <Text style={styles.displayText}>{project.category || 'No category'}</Text>
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
                  {PRIORITY_OPTIONS.find(p => p.value === project.priority)?.label || 'Medium'}
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
                  {STATUS_OPTIONS.find(s => s.value === project.status)?.label || 'Planning'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Estimated Budget</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, errors.estimated_budget && styles.inputError]}
                  value={formData.estimated_budget}
                  onChangeText={(value) => handleInputChange('estimated_budget', value)}
                  placeholder="Enter estimated budget"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.displayText}>
                  {project.estimated_budget ? `$${project.estimated_budget.toFixed(2)}` : 'Not set'}
                </Text>
              )}
              {errors.estimated_budget && <Text style={styles.errorText}>{errors.estimated_budget}</Text>}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Actual Budget</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, errors.actual_budget && styles.inputError]}
                  value={formData.actual_budget}
                  onChangeText={(value) => handleInputChange('actual_budget', value)}
                  placeholder="Enter actual budget"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.displayText}>
                  {project.actual_budget ? `$${project.actual_budget.toFixed(2)}` : 'Not set'}
                </Text>
              )}
              {errors.actual_budget && <Text style={styles.errorText}>{errors.actual_budget}</Text>}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Start Date</Text>
              {isEditing ? (
                <DatePicker
                  date={formData.start_date}
                  onDateChange={(date) => handleInputChange('start_date', date)}
                  placeholder="Select start date"
                />
              ) : (
                <Text style={styles.displayText}>
                  {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                </Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>End Date</Text>
              {isEditing ? (
                <DatePicker
                  date={formData.end_date}
                  onDateChange={(date) => handleInputChange('end_date', date)}
                  placeholder="Select end date"
                />
              ) : (
                <Text style={styles.displayText}>
                  {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                </Text>
              )}
              {errors.end_date && <Text style={styles.errorText}>{errors.end_date}</Text>}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Completion Date</Text>
            {isEditing ? (
              <DatePicker
                date={formData.completion_date}
                onDateChange={(date) => handleInputChange('completion_date', date)}
                placeholder="Select completion date"
              />
            ) : (
              <Text style={styles.displayText}>
                {project.completion_date ? new Date(project.completion_date).toLocaleDateString() : 'Not set'}
              </Text>
            )}
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
              <Text style={styles.displayText}>{project.notes || 'No notes'}</Text>
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
              <Text style={styles.deleteButtonText}>Delete Project</Text>
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
