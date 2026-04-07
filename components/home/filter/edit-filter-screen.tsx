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
import { FilterFormInput, filterFormSchema, transformFilterFormData } from '../../../lib/schemas/home/filterFormSchema';
import { useFiltersStore } from '../../../lib/stores/filtersStore';
import { FONTS } from '../../../lib/typography';
import { matchesHomeScopedRow } from '../../../lib/utils/realtimeHomeScoped';
import DatePicker from '../../DatePicker';

const EMPTY_ARRAY: any[] = [];

function EditFilterScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const params = useLocalSearchParams();
  const filterId = params.id as string;

  const filters = useFiltersStore(state => state.filtersByHome[homeId] || EMPTY_ARRAY);
  const updateFilter = useFiltersStore(state => state.updateFilter);
  const deleteFilter = useFiltersStore(state => state.deleteFilter);
  const fetchFilters = useFiltersStore(state => state.fetchFilters);
  const setFilters = useFiltersStore(state => state.setFilters);

  const lastHomeIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [filterFound, setFilterFound] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<FilterFormInput>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      name: '',
      room: '',
      type: '',
      brand: '',
      model: '',
      size: '',
      last_replaced: '',
      replacement_frequency: '',
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchFilters(homeId);
    }
  }, [homeId, fetchFilters]);

  const handleFilterChange = useCallback((payload: any) => {
    const store = useFiltersStore.getState();
    const current = store.filtersByHome[homeId] || [];
    const ids = current.map((f: { id: string }) => f.id);
    if (!matchesHomeScopedRow(homeId, payload, ids)) return;
    if (payload.eventType === 'INSERT') {
      const normalized = { ...payload.new, room: payload.new.room ?? payload.new.location ?? null };
      if (!current.some((f: any) => f.id === normalized.id)) setFilters(homeId, [normalized, ...current]);
    } else if (payload.eventType === 'UPDATE') {
      const normalized = { ...payload.new, room: payload.new.room ?? payload.new.location ?? null };
      setFilters(homeId, current.map((f: any) => f.id === normalized.id ? normalized : f));
    } else if (payload.eventType === 'DELETE' && payload.old?.id) {
      setFilters(homeId, current.filter((f: any) => f.id !== payload.old.id));
    }
  }, [homeId, setFilters]);

  useRealTimeSubscription(
    { table: 'filters', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handleFilterChange
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const found = filters.find((f: any) => f.id === filterId);
    if (found) {
      hasLoadedRef.current = true;
      setFilterFound(true);
      reset({
        name: found.name || '',
        room: found.room || '',
        type: found.type || '',
        brand: found.brand || '',
        model: found.model || '',
        size: found.size || '',
        last_replaced: found.last_replaced || '',
        replacement_frequency: found.replacement_frequency?.toString() || '',
        notes: found.notes || '',
      });
    }
  }, [filters, filterId, reset]);

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

  const onSubmit = async (data: FilterFormInput) => {
    try {
      const transformed = transformFilterFormData(data as any);
      await updateFilter(homeId, filterId, transformed);
      showToast('Filter updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating filter:', error);
      showToast('Failed to update filter', 'error');
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
      'Delete filter',
      'Are you sure you want to delete this filter? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFilter(homeId, filterId);
              showToast('Filter deleted', 'success');
              router.back();
            } catch {
              showToast('Failed to delete filter', 'error');
            }
          },
        },
      ]
    );
  };

  if (!filterFound) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Filter</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Filter not found or has been deleted.
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
          Edit Filter
        </Text>
        <View style={styles.headerRightGroup}>
          <TouchableOpacity style={styles.deleteHeaderButton} onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveHeaderButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Text style={[styles.saveHeaderButtonText, { color: colors.background }]}>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Filter Name *</Text>
            <TextInput
              style={getInputStyle('name', !!errors.name)}
              value={formData.name || ''}
              onChangeText={text => { setValue('name', text); if (errors.name) clearErrors('name'); }}
              placeholder="e.g., Air Filter, HVAC Filter"
              placeholderTextColor={colors.textTertiary}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.name && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.name.message}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Room *</Text>
            <TextInput
              style={getInputStyle('room', !!errors.room)}
              value={formData.room || ''}
              onChangeText={text => { setValue('room', text); if (errors.room) clearErrors('room'); }}
              placeholder="e.g., Living Room, Basement"
              placeholderTextColor={colors.textTertiary}
              onFocus={() => setFocusedField('room')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.room && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.room.message}</Text>}
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
              <TextInput
                style={getInputStyle('type', !!errors.type)}
                value={formData.type || ''}
                onChangeText={text => { setValue('type', text); if (errors.type) clearErrors('type'); }}
                placeholder="e.g., HEPA, Carbon"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocusedField('type')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.type && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.type.message}</Text>}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Brand *</Text>
              <TextInput
                style={getInputStyle('brand', !!errors.brand)}
                value={formData.brand || ''}
                onChangeText={text => { setValue('brand', text); if (errors.brand) clearErrors('brand'); }}
                placeholder="e.g., 3M, Filtrete"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocusedField('brand')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.brand && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.brand.message}</Text>}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Model *</Text>
              <TextInput
                style={getInputStyle('model', !!errors.model)}
                value={formData.model || ''}
                onChangeText={text => { setValue('model', text); if (errors.model) clearErrors('model'); }}
                placeholder="e.g., MERV-13"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocusedField('model')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.model && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.model.message}</Text>}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Size *</Text>
              <TextInput
                style={getInputStyle('size', !!errors.size)}
                value={formData.size || ''}
                onChangeText={text => { setValue('size', text); if (errors.size) clearErrors('size'); }}
                placeholder="e.g., 16x20x1"
                placeholderTextColor={colors.textTertiary}
                onFocus={() => setFocusedField('size')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.size && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.size.message}</Text>}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Maintenance Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Replacement Frequency (months) *</Text>
            <TextInput
              style={getInputStyle('replacement_frequency', !!errors.replacement_frequency)}
              value={formData.replacement_frequency || ''}
              onChangeText={text => { setValue('replacement_frequency', text); if (errors.replacement_frequency) clearErrors('replacement_frequency'); }}
              placeholder="e.g., 3, 6, 12"
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              onFocus={() => setFocusedField('replacement_frequency')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.replacement_frequency && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.replacement_frequency.message}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <DatePicker
              label="Last Replaced"
              value={formData.last_replaced || null}
              placeholder="Select last replacement date"
              onChange={dateString => { setValue('last_replaced', dateString || ''); if (errors.last_replaced) clearErrors('last_replaced'); }}
              helperText="When was this filter last replaced?"
              isOptional={true}
            />
            {errors.last_replaced && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.last_replaced.message}</Text>}
          </View>

          <View style={styles.fieldGroup}>
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
              placeholder="Any additional notes about this filter..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              onFocus={() => setFocusedField('notes')}
              onBlur={() => setFocusedField(null)}
            />
            {errors.notes && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.notes.message}</Text>}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function EditFilterScreenWrapper() {
  return <EditFilterScreen />;
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
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteHeaderButton: { padding: 6, borderRadius: 8 },
  saveHeaderButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveHeaderButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, fontWeight: '600' },
  headerRight: { width: 60 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 2 },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 15, fontWeight: '600' },
  textInput: { fontFamily: FONTS.body, borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 100 },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1, gap: 6 },
  fieldError: { fontFamily: FONTS.body, fontSize: 12, fontWeight: '500' },
  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  notFoundText: { fontFamily: FONTS.body, fontSize: 16, textAlign: 'center' },
});
