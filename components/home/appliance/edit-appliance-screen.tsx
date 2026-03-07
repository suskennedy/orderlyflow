import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { useAppliancesStore } from '../../../lib/stores/appliancesStore';
import DocumentUploader from '../../ui/DocumentUploader';

const EMPTY_ARRAY: any[] = [];
interface Appliance {
  id: string;
  type?: string | null;
  brand?: string | null;
  model?: string | null;
  manual_url?: string | null;
  warranty_url?: string | null;
  notes?: string | null;
  location?: string | null;
}

function EditApplianceScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  const applianceId = params.id as string;
  const appliances = useAppliancesStore(state => state.appliancesByHome[homeId || ''] || EMPTY_ARRAY);
  const updateAppliance = useAppliancesStore(state => state.updateAppliance);
  const fetchAppliances = useAppliancesStore(state => state.fetchAppliances);
  const setAppliances = useAppliancesStore(state => state.setAppliances);

  const lastHomeIdRef = useRef<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchAppliances(homeId);
    }
  }, [homeId, fetchAppliances]);

  // Real-time subscription
  const handleApplianceChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useAppliancesStore.getState();
    const currentAppliances = store.appliancesByHome[homeId || ''] || [];
    if (payload.eventType === 'INSERT') {
      const newAppliance = payload.new;
      if (!currentAppliances.some(a => a.id === newAppliance.id)) {
        setAppliances(homeId || '', [newAppliance, ...currentAppliances]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setAppliances(homeId || '', currentAppliances.map(a => a.id === payload.new.id ? payload.new : a));
    } else if (payload.eventType === 'DELETE') {
      setAppliances(homeId || '', currentAppliances.filter(a => a.id !== payload.old.id));
    }
  }, [homeId, setAppliances]);

  useRealTimeSubscription(
    { table: 'appliances', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleApplianceChange
  );

  const [appliance, setAppliance] = useState<Appliance | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    brand: '',
    model: '',
    location: '',
    manual_url: '',
    warranty_url: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const foundAppliance = appliances.find((a: any) => a.id === applianceId);
    if (foundAppliance) {
      setAppliance(foundAppliance);
      setFormData({
        type: foundAppliance.type || '',
        brand: foundAppliance.brand || '',
        model: foundAppliance.model || '',
        location: foundAppliance.location || '',
        manual_url: foundAppliance.manual_url || '',
        warranty_url: foundAppliance.warranty_url || '',
        notes: foundAppliance.notes || ''
      });
    }
  }, [appliances, applianceId]);

  const handleSave = async () => {
    if (!appliance) return;

    if (!formData.location.trim()) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    setIsLoading(true);
    try {
      await updateAppliance(homeId || '', applianceId, {
        type: formData.type || null,
        brand: formData.brand || null,
        model: formData.model || null,
        location: formData.location || null,
        manual_url: formData.manual_url || null,
        warranty_url: formData.warranty_url || null,
        notes: formData.notes || null
      });

      Alert.alert('Success', 'Appliance updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating appliance:', error);
      Alert.alert('Error', 'Failed to update appliance');
    } finally {
      setIsLoading(false);
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

  if (!appliance) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Appliance</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Appliance not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Appliance</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Appliance Type</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
              placeholder="Enter appliance type"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Brand</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.brand}
              onChangeText={(text) => setFormData({ ...formData, brand: text })}
              placeholder="Enter brand name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Model</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
              placeholder="Enter model number"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Location *</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Enter location"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Manual & Documentation */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual & Documentation</Text>

          <DocumentUploader
            label="Manual (PDF)"
            currentFileUrl={formData.manual_url}
            onUploadComplete={(result) => setFormData({ ...formData, manual_url: result.url })}
            userId={user?.id}
            targetFolder="appliances"
          />

          <DocumentUploader
            label="Warranty (PDF)"
            currentFileUrl={formData.warranty_url}
            onUploadComplete={(result) => setFormData({ ...formData, warranty_url: result.url })}
            userId={user?.id}
            targetFolder="appliances"
          />
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional Notes</Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Enter any additional notes or information"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function EditApplianceScreenWrapper() {
  return <EditApplianceScreen />;
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
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
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
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
