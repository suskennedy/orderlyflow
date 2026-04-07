import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { WarrantyFormData, transformWarrantyFormData, warrantyFormSchema } from '../../../lib/schemas/home/warrantyFormSchema';
import { useWarrantiesStore } from '../../../lib/stores/warrantiesStore';
import { FONTS } from '../../../lib/typography';
import { matchesHomeScopedRow } from '../../../lib/utils/realtimeHomeScoped';
import DatePicker from '../../DatePicker';

const EMPTY_ARRAY: any[] = [];

export default function EditWarrantyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const params = useLocalSearchParams();
  const warrantyId = params.id as string;

  const warranties = useWarrantiesStore(state => state.warrantiesByHome[homeId] || EMPTY_ARRAY);
  const updateWarranty = useWarrantiesStore(state => state.updateWarranty);
  const deleteWarranty = useWarrantiesStore(state => state.deleteWarranty);
  const fetchWarranties = useWarrantiesStore(state => state.fetchWarranties);
  const setWarranties = useWarrantiesStore(state => state.setWarranties);

  const lastHomeIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [warrantyFound, setWarrantyFound] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<WarrantyFormData>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: {
      item_name: '',
      room: '',
      provider: '',
      warranty_start_date: '',
      warranty_end_date: '',
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchWarranties(homeId);
    }
  }, [homeId, fetchWarranties]);

  const handleWarrantyChange = useCallback((payload: any) => {
    const store = useWarrantiesStore.getState();
    const current = store.warrantiesByHome[homeId] || [];
    const ids = current.map((w: { id: string }) => w.id);
    if (!matchesHomeScopedRow(homeId, payload, ids)) return;
    if (payload.eventType === 'INSERT') {
      if (!current.some((w: any) => w.id === payload.new.id)) setWarranties(homeId, [payload.new, ...current]);
    } else if (payload.eventType === 'UPDATE') {
      setWarranties(homeId, current.map((w: any) => w.id === payload.new.id ? payload.new : w));
    } else if (payload.eventType === 'DELETE' && payload.old?.id) {
      setWarranties(homeId, current.filter((w: any) => w.id !== payload.old.id));
    }
  }, [homeId, setWarranties]);

  useRealTimeSubscription(
    { table: 'warranties', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleWarrantyChange
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const found = warranties.find((w: any) => w.id === warrantyId);
    if (found) {
      hasLoadedRef.current = true;
      setWarrantyFound(true);
      reset({
        item_name: found.item_name || '',
        room: found.room || '',
        provider: found.provider || '',
        warranty_start_date: found.warranty_start_date || '',
        warranty_end_date: found.warranty_end_date || '',
        notes: found.notes || '',
      });
    }
  }, [warranties, warrantyId, reset]);

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

  const onSubmit = async (data: WarrantyFormData) => {
    try {
      const transformed = transformWarrantyFormData(data);
      await updateWarranty(homeId, warrantyId, transformed);
      showToast('Warranty updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating warranty:', error);
      showToast('Failed to update warranty', 'error');
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete warranty',
      'Are you sure you want to delete this warranty? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWarranty(homeId, warrantyId);
              showToast('Warranty deleted', 'success');
              router.back();
            } catch {
              showToast('Failed to delete warranty', 'error');
            }
          },
        },
      ]
    );
  };

  if (!warrantyFound) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Warranty</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Warranty not found or has been deleted.
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
        <Text style={[styles.headerTitle, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          Edit Warranty
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconHeaderButton} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Warranty Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
          <TextInput
            style={getInputStyle('item_name', !!errors.item_name)}
            value={formData.item_name || ''}
            onChangeText={text => { setValue('item_name', text); if (errors.item_name) clearErrors('item_name'); }}
            placeholder="e.g., HVAC System, Roof"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('item_name')}
            onBlur={handleBlur}
          />
          {errors.item_name && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.item_name.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Room *</Text>
          <TextInput
            style={getInputStyle('room', !!errors.room)}
            value={formData.room || ''}
            onChangeText={text => { setValue('room', text); if (errors.room) clearErrors('room'); }}
            placeholder="e.g., Kitchen, Exterior"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
          />
          {errors.room && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.room.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Provider *</Text>
          <TextInput
            style={getInputStyle('provider', !!errors.provider)}
            value={formData.provider || ''}
            onChangeText={text => { setValue('provider', text); if (errors.provider) clearErrors('provider'); }}
            placeholder="e.g., Home Warranty Company"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('provider')}
            onBlur={handleBlur}
          />
          {errors.provider && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.provider.message}</Text>}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Warranty Dates</Text>

          <DatePicker
            label="Warranty Start Date"
            value={formData.warranty_start_date || null}
            placeholder="Select start date"
            onChange={dateString => {
              setValue('warranty_start_date', dateString || '');
              if (errors.warranty_start_date) clearErrors('warranty_start_date');
            }}
            helperText="When did the warranty begin?"
            isOptional={true}
          />
          {errors.warranty_start_date && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.warranty_start_date.message}</Text>}

          <DatePicker
            label="Warranty End Date"
            value={formData.warranty_end_date || null}
            placeholder="Select end date"
            onChange={dateString => {
              setValue('warranty_end_date', dateString || '');
              if (errors.warranty_end_date) clearErrors('warranty_end_date');
            }}
            helperText="When does the warranty expire?"
            isOptional={true}
          />
          {errors.warranty_end_date && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.warranty_end_date.message}</Text>}

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
            placeholder="Any additional notes about this warranty..."
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconHeaderButton: { padding: 6, borderRadius: 8 },
  saveButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
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
});
