import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useToast } from '../../../lib/contexts/ToastContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { APPLIANCE_TYPES, ApplianceFormData, applianceFormSchema, transformApplianceFormData } from '../../../lib/schemas/home/applianceFormSchema';
import { useAppliancesStore } from '../../../lib/stores/appliancesStore';
import { FONTS } from '../../../lib/typography';
import DocumentUploader from '../../ui/DocumentUploader';

const EMPTY_ARRAY: any[] = [];

function EditApplianceScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const homeId = params.homeId as string;
  const applianceId = params.id as string;
  const appliances = useAppliancesStore(state => state.appliancesByHome[homeId || ''] || EMPTY_ARRAY);
  const updateAppliance = useAppliancesStore(state => state.updateAppliance);
  const fetchAppliances = useAppliancesStore(state => state.fetchAppliances);
  const setAppliances = useAppliancesStore(state => state.setAppliances);

  const lastHomeIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [applianceFound, setApplianceFound] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<ApplianceFormData>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: {
      type: APPLIANCE_TYPES[0],
      brand: '',
      model: '',
      location: '',
      manual_url: '',
      warranty_url: '',
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchAppliances(homeId);
    }
  }, [homeId, fetchAppliances]);

  const handleApplianceChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useAppliancesStore.getState();
    const current = store.appliancesByHome[homeId || ''] || [];
    if (payload.eventType === 'INSERT') {
      if (!current.some((a: any) => a.id === payload.new.id)) setAppliances(homeId, [payload.new, ...current]);
    } else if (payload.eventType === 'UPDATE') {
      setAppliances(homeId, current.map((a: any) => a.id === payload.new.id ? payload.new : a));
    } else if (payload.eventType === 'DELETE') {
      setAppliances(homeId, current.filter((a: any) => a.id !== payload.old.id));
    }
  }, [homeId, setAppliances]);

  useRealTimeSubscription(
    { table: 'appliances', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleApplianceChange
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const found = appliances.find((a: any) => a.id === applianceId);
    if (found) {
      hasLoadedRef.current = true;
      setApplianceFound(true);
      reset({
        type: (APPLIANCE_TYPES.includes(found.type as any) ? found.type : APPLIANCE_TYPES[0]) as any,
        brand: found.brand || '',
        model: found.model || '',
        location: found.location || '',
        manual_url: found.manual_url || '',
        warranty_url: found.warranty_url || '',
        notes: found.notes || '',
      });
    }
  }, [appliances, applianceId, reset]);

  const handleFocus = (fieldName: string) => setFocusedField(fieldName);
  const handleBlur = () => setFocusedField(null);

  const getInputStyle = (fieldName: string, hasError?: boolean) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.textInput,
      {
        backgroundColor: colors.surface,
        color: colors.text,
        borderColor: hasError ? colors.error : isFocused ? colors.primary : colors.border,
        borderWidth: hasError || isFocused ? 2 : 1,
      },
    ];
  };

  const onSubmit = async (data: ApplianceFormData) => {
    try {
      const transformed = transformApplianceFormData(data);
      await updateAppliance(homeId, applianceId, transformed);
      showToast('Appliance updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating appliance:', error);
      showToast('Failed to update appliance', 'error');
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (!applianceFound) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Appliance</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Appliance Type *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: errors.type ? colors.error : colors.border }]}>
            <Picker
              selectedValue={formData.type}
              onValueChange={val => setValue('type', val)}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              {APPLIANCE_TYPES.map(type => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
          {errors.type && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.type.message}</Text>}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
              <TextInput
                style={getInputStyle('brand', !!errors.brand)}
                value={formData.brand || ''}
                onChangeText={text => { setValue('brand', text); if (errors.brand) clearErrors('brand'); }}
                placeholder="e.g., Samsung, LG"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => handleFocus('brand')}
                onBlur={handleBlur}
              />
              {errors.brand && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.brand.message}</Text>}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Model</Text>
              <TextInput
                style={getInputStyle('model', !!errors.model)}
                value={formData.model || ''}
                onChangeText={text => { setValue('model', text); if (errors.model) clearErrors('model'); }}
                placeholder="e.g., WF45R6100AW"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => handleFocus('model')}
                onBlur={handleBlur}
              />
              {errors.model && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.model.message}</Text>}
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
          <TextInput
            style={getInputStyle('location', !!errors.location)}
            value={formData.location || ''}
            onChangeText={text => { setValue('location', text); if (errors.location) clearErrors('location'); }}
            placeholder="e.g., Kitchen, Basement"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('location')}
            onBlur={handleBlur}
          />
          {errors.location && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.location.message}</Text>}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Manual & Documentation</Text>

          <DocumentUploader
            label="Manual (PDF)"
            currentFileUrl={formData.manual_url}
            onUploadComplete={result => { setValue('manual_url', result.url); if (errors.manual_url) clearErrors('manual_url'); }}
            onRemove={async () => {
              try {
                await updateAppliance(homeId, applianceId, { manual_url: null });
                setValue('manual_url', '');
                clearErrors('manual_url');
                showToast('Manual removed', 'success');
              } catch {
                showToast('Failed to remove manual', 'error');
              }
            }}
            userId={user?.id}
            targetFolder="appliances"
          />
          {errors.manual_url && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.manual_url.message}</Text>}

          <DocumentUploader
            label="Warranty (PDF)"
            currentFileUrl={formData.warranty_url}
            onUploadComplete={result => { setValue('warranty_url', result.url); if (errors.warranty_url) clearErrors('warranty_url'); }}
            onRemove={async () => {
              try {
                await updateAppliance(homeId, applianceId, { warranty_url: null });
                setValue('warranty_url', '');
                clearErrors('warranty_url');
                showToast('Warranty document removed', 'success');
              } catch {
                showToast('Failed to remove warranty file', 'error');
              }
            }}
            userId={user?.id}
            targetFolder="appliances"
          />
          {errors.warranty_url && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.warranty_url.message}</Text>}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>

          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: errors.notes ? colors.error : focusedField === 'notes' ? colors.primary : colors.border,
                borderWidth: errors.notes || focusedField === 'notes' ? 2 : 1,
              },
            ]}
            value={formData.notes || ''}
            onChangeText={text => { setValue('notes', text); if (errors.notes) clearErrors('notes'); }}
            placeholder="Any additional notes about this appliance..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            onFocus={() => handleFocus('notes')}
            onBlur={handleBlur}
          />
          {errors.notes && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.notes.message}</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function EditApplianceScreenWrapper() {
  return <EditApplianceScreen />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: { padding: 8, borderRadius: 8 },
  headerTitle: { fontFamily: FONTS.heading, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, fontWeight: '600' },
  headerRight: { width: 60 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  form: { gap: 16 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  textInput: { fontFamily: FONTS.body, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 100 },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  fieldError: { fontFamily: FONTS.body, fontSize: 12, marginTop: 3, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontFamily: FONTS.body, fontSize: 16, textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
});
