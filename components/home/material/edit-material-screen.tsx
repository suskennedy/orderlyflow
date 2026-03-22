import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { FONTS } from '../../../lib/typography';
import { useToast } from '../../../lib/contexts/ToastContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { MATERIAL_TYPES, MaterialFormData, materialFormSchema, transformMaterialFormData } from '../../../lib/schemas/home/materialFormSchema';
import { useMaterialsStore } from '../../../lib/stores/materialsStore';

const EMPTY_ARRAY: any[] = [];

export default function EditMaterialScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const params = useLocalSearchParams();
  const materialId = params.id as string;

  const materials = useMaterialsStore(state => state.materialsByHome[homeId] || EMPTY_ARRAY);
  const updateMaterial = useMaterialsStore(state => state.updateMaterial);
  const fetchMaterials = useMaterialsStore(state => state.fetchMaterials);
  const setMaterials = useMaterialsStore(state => state.setMaterials);

  const lastHomeIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [materialFound, setMaterialFound] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      type: MATERIAL_TYPES[0],
      location: '',
      brand: '',
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchMaterials(homeId);
    }
  }, [homeId, fetchMaterials]);

  const handleMaterialChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = useMaterialsStore.getState();
    const current = store.materialsByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      if (!current.some((m: any) => m.id === payload.new.id)) setMaterials(homeId, [payload.new, ...current]);
    } else if (payload.eventType === 'UPDATE') {
      setMaterials(homeId, current.map((m: any) => m.id === payload.new.id ? payload.new : m));
    } else if (payload.eventType === 'DELETE') {
      setMaterials(homeId, current.filter((m: any) => m.id !== payload.old.id));
    }
  }, [homeId, setMaterials]);

  useRealTimeSubscription(
    { table: 'materials', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleMaterialChange
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const found = materials.find((m: any) => m.id === materialId);
    if (found) {
      hasLoadedRef.current = true;
      setMaterialFound(true);
      reset({
        type: (MATERIAL_TYPES.includes(found.type as any) ? found.type : MATERIAL_TYPES[0]) as any,
        location: found.location || '',
        brand: found.brand || '',
        notes: found.notes || '',
      });
    }
  }, [materials, materialId, reset]);

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

  const onSubmit = async (data: MaterialFormData) => {
    try {
      const transformed = transformMaterialFormData(data);
      await updateMaterial(homeId, materialId, transformed);
      showToast('Material updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating material:', error);
      showToast('Failed to update material', 'error');
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (!materialFound) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Material</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Material not found or has been deleted.
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Material</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Material Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Material Type *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: errors.type ? colors.error : colors.border }]}>
            <Picker
              selectedValue={formData.type}
              onValueChange={val => setValue('type', val)}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              {MATERIAL_TYPES.map(t => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>
          {errors.type && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.type.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Location / Room *</Text>
          <TextInput
            style={getInputStyle('location', !!errors.location)}
            value={formData.location || ''}
            onChangeText={text => { setValue('location', text); if (errors.location) clearErrors('location'); }}
            placeholder="e.g., Living Room, Kitchen Backsplash"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('location')}
            onBlur={handleBlur}
          />
          {errors.location && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.location.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
          <TextInput
            style={getInputStyle('brand', !!errors.brand)}
            value={formData.brand || ''}
            onChangeText={text => { setValue('brand', text); if (errors.brand) clearErrors('brand'); }}
            placeholder="e.g., Home Depot, Shaw"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('brand')}
            onBlur={handleBlur}
          />
          {errors.brand && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.brand.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
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
            placeholder="Any additional notes about this material..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
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
  fieldError: { fontFamily: FONTS.body, fontSize: 12, marginTop: 3, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontFamily: FONTS.body, fontSize: 16, textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
});
