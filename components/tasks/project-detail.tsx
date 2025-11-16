import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useAuth } from '../../lib/hooks/useAuth';
import { useRealTimeSubscription } from '../../lib/hooks/useRealTimeSubscription';
import { useProjectsStore } from '../../lib/stores/projectsStore';

import { PROJECT_STATUS, PROJECT_TYPES } from '../../lib/schemas/projectSchema';
import { UploadResult } from '../../lib/services/uploadService';
import { useFamilyStore } from '../../lib/stores/familyStore';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import { supabase } from '../../lib/supabase';
import DatePicker from '../DatePicker';
import MediaPreview from '../ui/MediaPreview';
import PhotoUploader from '../ui/PhotoUploader';

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const projectsByHome = useProjectsStore(state => state.projectsByHome);
  const currentHomeByComponent = useProjectsStore(state => state.currentHomeByComponent);
  const setCurrentHome = useProjectsStore(state => state.setCurrentHome);
  const fetchProjects = useProjectsStore(state => state.fetchProjects);
  const updateProject = useProjectsStore(state => state.updateProject);
  const deleteProject = useProjectsStore(state => state.deleteProject);
  const setProjects = useProjectsStore(state => state.setProjects);
  const vendors = useVendorsStore(state => state.vendors);
  const familyMembers = useFamilyStore(state => state.familyMembers);
  
  // Use a component ID to track current home per component instance
  const componentIdRef = useRef(`project-detail-${Date.now()}-${Math.random()}`);
  const currentHome = currentHomeByComponent[componentIdRef.current] || null;
  const projects = currentHome ? (projectsByHome[currentHome] || []) : [];

  const [project, setProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: '',
    status: 'not_started',
    estimated_budget: '',
    current_spend: '',
    final_cost: '',
    start_date: '',
    target_completion_date: '',
    completion_date: '',
    location_in_home: '',
    vendor_ids: [] as string[],
    assigned_user_ids: [] as string[],
    reminders_enabled: false,
    reminder_date: '',
    notes: '',
    subtasks: [] as any[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Real-time subscription for projects
  const handleProjectChange = useCallback((payload: any) => {
    const projectHomeId = payload.new?.home_id || payload.old?.home_id;
    if (projectHomeId === currentHome && user?.id) {
      fetchProjects(projectHomeId, user.id);
    }
  }, [currentHome, user?.id, fetchProjects]);
  
  useRealTimeSubscription(
    { table: 'projects', event: '*' },
    handleProjectChange
  );

  // Fetch project directly if not in current array - use ref to prevent loops
  const hasFetchedRef = React.useRef(false);
  const lastIdRef = React.useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Reset if id changes
    if (id !== lastIdRef.current) {
      hasFetchedRef.current = false;
      lastIdRef.current = id as string | undefined;
      setProject(null);
    }
    
    if (!id || hasFetchedRef.current || project) return;
    
    hasFetchedRef.current = true;
    
    // First try to find in current projects array
    const foundProject = projects.find((p: any) => p.id === id);
    if (foundProject) {
      if (foundProject.home_id) {
        setCurrentHome(componentIdRef.current, foundProject.home_id);
        if (user?.id) {
          fetchProjects(foundProject.home_id, user.id);
        }
      }
      setProject(foundProject);
    } else if (user?.id) {
      // If not found, fetch from database
      const fetchProject = async () => {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id as string)
            .single();
          
          if (!error && data) {
            const projectData = data as any;
            if (projectData.home_id) {
              setCurrentHome(componentIdRef.current, projectData.home_id);
              await fetchProjects(projectData.home_id, user.id);
            }
            setProject(projectData);
          }
        } catch (error) {
          console.error('Error fetching project:', error);
          hasFetchedRef.current = false; // Reset on error
        }
      };
      fetchProject();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]); // Only depend on id and user?.id - projects array changes too frequently

  // Update form data when project is found - separate effect to avoid loops
  const lastProjectIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (project && project.id !== lastProjectIdRef.current && !isEditing) {
      lastProjectIdRef.current = project.id;
      setFormData({
        title: project.title || '',
        description: project.description || '',
        project_type: project.project_type || '',
        status: project.status || 'not_started',
        estimated_budget: project.estimated_budget?.toString() || '',
        current_spend: project.current_spend?.toString() || '',
        final_cost: project.final_cost?.toString() || '',
        start_date: project.start_date || '',
        target_completion_date: project.target_completion_date || '',
        completion_date: project.completion_date || '',
        location_in_home: project.location_in_home || '',
        vendor_ids: project.vendor_ids || [],
        assigned_user_ids: project.assigned_user_ids || [],
        reminders_enabled: project.reminders_enabled || false,
        reminder_date: project.reminder_date || '',
        notes: project.notes || '',
        subtasks: project.subtasks || [],
      });
      setUploadedFiles(project.photos_inspiration || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isEditing]); // Only depend on project id and editing state

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.project_type) {
      newErrors.project_type = 'Project type is required';
    }

    if (formData.estimated_budget && isNaN(Number(formData.estimated_budget))) {
      newErrors.estimated_budget = 'Estimated budget must be a valid number';
    }

    if (formData.current_spend && isNaN(Number(formData.current_spend))) {
      newErrors.current_spend = 'Current spend must be a valid number';
    }

    if (formData.final_cost && isNaN(Number(formData.final_cost))) {
      newErrors.final_cost = 'Final cost must be a valid number';
    }

    if (formData.start_date && formData.target_completion_date && formData.start_date > formData.target_completion_date) {
      newErrors.target_completion_date = 'Target completion date must be after start date';
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
        project_type: formData.project_type,
        status: formData.status as 'not_started' | 'in_progress' | 'completed' | 'on_hold',
        estimated_budget: formData.estimated_budget ? Number(formData.estimated_budget) : undefined,
        current_spend: formData.current_spend ? Number(formData.current_spend) : undefined,
        final_cost: formData.final_cost ? Number(formData.final_cost) : undefined,
        start_date: formData.start_date || undefined,
        target_completion_date: formData.target_completion_date || undefined,
        completion_date: formData.completion_date || undefined,
        location_in_home: formData.location_in_home.trim() || undefined,
        vendor_ids: formData.vendor_ids.length > 0 ? formData.vendor_ids : undefined,
        assigned_user_ids: formData.assigned_user_ids.length > 0 ? formData.assigned_user_ids : undefined,
        photos_inspiration: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        reminders_enabled: formData.reminders_enabled,
        reminder_date: formData.reminders_enabled && formData.reminder_date ? formData.reminder_date : undefined,
        notes: formData.notes.trim() || undefined,
        subtasks: formData.subtasks.length > 0 ? formData.subtasks : undefined,
      };

      if (!project.home_id) {
        Alert.alert('Error', 'Project has no home ID');
        return;
      }
      await updateProject(project.home_id, project.id, updateData);
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
              if (!project.home_id) {
                Alert.alert('Error', 'Project has no home ID');
                return;
              }
              await deleteProject(project.home_id, project.id);
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

  const toggleVendor = (vendorId: string) => {
    const current = formData.vendor_ids || [];
    if (current.includes(vendorId)) {
      handleInputChange('vendor_ids', current.filter(id => id !== vendorId));
    } else {
      handleInputChange('vendor_ids', [...current, vendorId]);
    }
  };

  const toggleUser = (userId: string) => {
    const current = formData.assigned_user_ids || [];
    if (current.includes(userId)) {
      handleInputChange('assigned_user_ids', current.filter(id => id !== userId));
    } else {
      handleInputChange('assigned_user_ids', [...current, userId]);
    }
  };

  const addSubtask = () => {
    const current = formData.subtasks || [];
    handleInputChange('subtasks', [...current, { title: '', is_done: false }]);
  };

  const updateSubtask = (index: number, field: string, value: any) => {
    const current = formData.subtasks || [];
    const copy = [...current];
    copy[index] = { ...copy[index], [field]: value };
    handleInputChange('subtasks', copy);
  };

  const removeSubtask = (index: number) => {
    const current = formData.subtasks || [];
    handleInputChange('subtasks', current.filter((_, i) => i !== index));
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
          {/* Title Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Project Title *</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Enter project title"
                placeholderTextColor="#999"
              />
            ) : (
              <Text style={styles.displayValue}>{project.title}</Text>
            )}
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Project Type Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Project Type *</Text>
            {isEditing ? (
              <View style={styles.categoryGrid}>
                {PROJECT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.categoryButton,
                      formData.project_type === type && styles.categoryButtonSelected,
                    ]}
                    onPress={() => handleInputChange('project_type', type)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.project_type === type && styles.categoryButtonTextSelected,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.displayValue}>
                {project.project_type ? project.project_type.charAt(0).toUpperCase() + project.project_type.slice(1) : 'No project type'}
              </Text>
            )}
            {errors.project_type && <Text style={styles.errorText}>{errors.project_type}</Text>}
          </View>

          {/* Dates Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.cardTitle}>Timeline</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Start Date</Text>
                {isEditing ? (
                  <DatePicker
                    label=""
                    value={formData.start_date}
                    onChange={(date) => handleInputChange('start_date', date)}
                    placeholder="Select start date"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Target Completion</Text>
                {isEditing ? (
                  <DatePicker
                    label=""
                    value={formData.target_completion_date}
                    onChange={(date) => handleInputChange('target_completion_date', date)}
                    placeholder="Select target date"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {project.target_completion_date ? new Date(project.target_completion_date).toLocaleDateString() : 'Not set'}
                  </Text>
                )}
                {errors.target_completion_date && <Text style={styles.errorText}>{errors.target_completion_date}</Text>}
              </View>
            </View>

            {(isEditing || project.completion_date) && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Completion Date</Text>
                {isEditing ? (
                  <DatePicker
                    label=""
                    value={formData.completion_date}
                    onChange={(date) => handleInputChange('completion_date', date)}
                    placeholder="Select completion date"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {project.completion_date ? new Date(project.completion_date).toLocaleDateString() : 'Not completed'}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Description Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
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
              <Text style={styles.displayValue}>{project.description || 'No description'}</Text>
            )}
          </View>

          {/* Photos / Inspiration Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Photos / Inspiration</Text>
            {isEditing ? (
              <>
                <PhotoUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadStart={handleUploadStart}
                  onUploadError={handleUploadError}
                  maxFiles={10}
                  existingFiles={uploadedFiles}
                  disabled={loading || uploadingFiles}
                  targetFolder="projects"
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
                  <Text style={styles.displayValue}>No photos uploaded</Text>
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
              <Text style={styles.displayValue}>{project.location_in_home || 'Not specified'}</Text>
            )}
          </View>

          {/* Vendors / Contractors Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Vendors / Contractors</Text>
            {isEditing ? (
              <View style={styles.categoryGrid}>
                {vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.categoryButton,
                      formData.vendor_ids.includes(vendor.id) && styles.categoryButtonSelected,
                    ]}
                    onPress={() => toggleVendor(vendor.id)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.vendor_ids.includes(vendor.id) && styles.categoryButtonTextSelected,
                      ]}
                    >
                      {vendor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.chipsContainer}>
                {project.vendor_ids && project.vendor_ids.length > 0 ? (
                  project.vendor_ids.map((vendorId: string) => {
                    const vendor = vendors.find(v => v.id === vendorId);
                    return vendor ? (
                      <View key={vendorId} style={styles.chip}>
                        <Text style={styles.chipText}>{vendor.name}</Text>
                      </View>
                    ) : null;
                  })
                ) : (
                  <Text style={styles.displayValue}>No vendors assigned</Text>
                )}
              </View>
            )}
          </View>

          {/* User Assignment Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>User Assignment</Text>
            {isEditing ? (
              <View style={styles.categoryGrid}>
                {familyMembers.map((member: any) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.categoryButton,
                      formData.assigned_user_ids.includes(member.id) && styles.categoryButtonSelected,
                    ]}
                    onPress={() => toggleUser(member.id)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.assigned_user_ids.includes(member.id) && styles.categoryButtonTextSelected,
                      ]}
                    >
                      {member.user?.display_name || member.user?.full_name || 'User'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.chipsContainer}>
                {project.assigned_user_ids && project.assigned_user_ids.length > 0 ? (
                  project.assigned_user_ids.map((userId: string) => {
                    const member = familyMembers.find((m: any) => m.id === userId);
                    return member ? (
                      <View key={userId} style={styles.chip}>
                        <Text style={styles.chipText}>{member.user?.display_name || member.user?.full_name || 'User'}</Text>
                      </View>
                    ) : null;
                  })
                ) : (
                  <Text style={styles.displayValue}>No users assigned</Text>
                )}
              </View>
            )}
          </View>

          {/* Budget Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.cardTitle}>Budget</Text>
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Estimated Budget</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, errors.estimated_budget && styles.inputError]}
                    value={formData.estimated_budget}
                    onChangeText={(value) => handleInputChange('estimated_budget', value)}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {project.estimated_budget ? `$${project.estimated_budget.toFixed(2)}` : 'Not set'}
                  </Text>
                )}
                {errors.estimated_budget && <Text style={styles.errorText}>{errors.estimated_budget}</Text>}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={styles.label}>Current Spend</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, errors.current_spend && styles.inputError]}
                    value={formData.current_spend}
                    onChangeText={(value) => handleInputChange('current_spend', value)}
                    placeholder="0.00"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.displayValue}>
                    {project.current_spend ? `$${project.current_spend.toFixed(2)}` : 'Not set'}
                  </Text>
                )}
                {errors.current_spend && <Text style={styles.errorText}>{errors.current_spend}</Text>}
              </View>
            </View>

            <View style={styles.inputGroup}>
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
                  {project.final_cost ? `$${project.final_cost.toFixed(2)}` : 'Not set'}
                </Text>
              )}
              {errors.final_cost && <Text style={styles.errorText}>{errors.final_cost}</Text>}
            </View>
          </View>

          {/* Sub-tasks / Milestones Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Sub-tasks / Milestones</Text>
            {isEditing ? (
              <>
                {formData.subtasks.map((task, idx) => (
                  <View key={idx} style={styles.subtaskEditItem}>
                    <TextInput
                      style={styles.input}
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
              </>
            ) : (
              <>
                {project.subtasks && project.subtasks.length > 0 ? (
                  project.subtasks.map((task: any, idx: number) => (
                    <View key={idx} style={styles.subtaskViewItem}>
                      <View style={styles.subtaskHeader}>
                        <Text style={styles.subtaskTitle}>{task.title}</Text>
                        <View style={[styles.statusBadge, task.is_done ? styles.statusCompleted : styles.statusPending]}>
                          <Text style={styles.statusBadgeText}>{task.is_done ? 'Completed' : 'Pending'}</Text>
                        </View>
                      </View>
                      {task.due_date && (
                        <Text style={styles.subtaskDate}>📅 Due: {new Date(task.due_date).toLocaleDateString()}</Text>
                      )}
                      {task.reminder_date && (
                        <Text style={styles.subtaskReminder}>🔔 Reminder: {new Date(task.reminder_date).toLocaleDateString()}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.displayValue}>No subtasks</Text>
                )}
              </>
            )}
          </View>

          {/* Status Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Status</Text>
            {isEditing ? (
              <View style={styles.statusGrid}>
                {PROJECT_STATUS.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      formData.status === status && styles.statusButtonSelected,
                    ]}
                    onPress={() => handleInputChange('status', status)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        formData.status === status && styles.statusButtonTextSelected,
                      ]}
                    >
                      {status.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={[styles.statusBadgeLarge, getStatusColor(project.status)]}>
                <Text style={styles.statusBadgeLargeText}>
                  {project.status ? project.status.replace('_', ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) : 'Not Started'}
                </Text>
              </View>
            )}
          </View>

          {/* Reminders Card */}
          <View style={[styles.card, !isEditing && styles.cardView]}>
            <Text style={styles.label}>Reminders / Deadlines</Text>
            {isEditing ? (
              <>
                <View style={styles.reminderContainer}>
                  <TouchableOpacity
                    style={[styles.reminderButton, formData.reminders_enabled && styles.reminderButtonSelected]}
                    onPress={() => handleInputChange('reminders_enabled', !formData.reminders_enabled)}
                  >
                    <Text style={[styles.reminderButtonText, formData.reminders_enabled && styles.reminderButtonTextSelected]}>
                      {formData.reminders_enabled ? 'Yes' : 'No'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {formData.reminders_enabled && (
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
                  {project.reminders_enabled ? 'Enabled' : 'Disabled'}
                </Text>
                {project.reminders_enabled && project.reminder_date && (
                  <Text style={styles.reminderDateText}>
                    🔔 {new Date(project.reminder_date).toLocaleDateString()}
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
              <Text style={styles.displayValue}>{project.notes || 'No notes'}</Text>
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

function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
      return styles.statusCompleted;
    case 'in_progress':
      return styles.statusInProgress;
    case 'on_hold':
      return styles.statusOnHold;
    default:
      return styles.statusNotStarted;
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
    borderLeftColor: '#3498db',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
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
    gap: 12,
    marginBottom: 12,
  },
  halfWidth: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  chipText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '500',
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
  subtaskEditItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subtaskViewItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subtaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  subtaskDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  subtaskReminder: {
    fontSize: 14,
    color: '#e67e22',
    fontWeight: '500',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  statusCompleted: {
    backgroundColor: '#27ae60',
  },
  statusInProgress: {
    backgroundColor: '#f39c12',
  },
  statusOnHold: {
    backgroundColor: '#95a5a6',
  },
  statusNotStarted: {
    backgroundColor: '#3498db',
  },
  statusPending: {
    backgroundColor: '#e74c3c',
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
