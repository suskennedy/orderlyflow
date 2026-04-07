import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { INSTALLATION_TYPES, POOL_TYPES, PoolFormData, poolFormSchema, transformPoolFormData } from '../../../lib/schemas/home/poolFormSchema';
import { usePoolsStore } from '../../../lib/stores/poolsStore';
import { FONTS } from '../../../lib/typography';
import { matchesHomeScopedRow } from '../../../lib/utils/realtimeHomeScoped';

const EMPTY_ARRAY: any[] = [];

export default function EditPoolScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const params = useLocalSearchParams();
  const poolId = params.id as string;

  const pools = usePoolsStore(state => state.poolsByHome[homeId] || EMPTY_ARRAY);
  const updatePool = usePoolsStore(state => state.updatePool);
  const deletePool = usePoolsStore(state => state.deletePool);
  const fetchPools = usePoolsStore(state => state.fetchPools);
  const setPools = usePoolsStore(state => state.setPools);

  const lastHomeIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [poolFound, setPoolFound] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<PoolFormData>({
    resolver: zodResolver(poolFormSchema),
    defaultValues: {
      name: 'Pool',
      salt_water_vs_chlorine: POOL_TYPES[0],
      in_ground_vs_above_ground: INSTALLATION_TYPES[0],
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchPools(homeId);
    }
  }, [homeId, fetchPools]);

  const handlePoolChange = useCallback((payload: any) => {
    const store = usePoolsStore.getState();
    const current = store.poolsByHome[homeId] || [];
    const ids = current.map((p: { id: string }) => p.id);
    if (!matchesHomeScopedRow(homeId, payload, ids)) return;
    if (payload.eventType === 'INSERT') {
      if (!current.some((p: any) => p.id === payload.new.id)) setPools(homeId, [payload.new, ...current]);
    } else if (payload.eventType === 'UPDATE') {
      setPools(homeId, current.map((p: any) => p.id === payload.new.id ? payload.new : p));
    } else if (payload.eventType === 'DELETE' && payload.old?.id) {
      setPools(homeId, current.filter((p: any) => p.id !== payload.old.id));
    }
  }, [homeId, setPools]);

  useRealTimeSubscription(
    { table: 'pools', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handlePoolChange
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const found = pools.find((p: any) => p.id === poolId);
    if (found) {
      hasLoadedRef.current = true;
      setPoolFound(true);
      reset({
        name: (found as { name?: string }).name?.trim() || 'Pool',
        salt_water_vs_chlorine: (POOL_TYPES.includes(found.salt_water_vs_chlorine as any) ? found.salt_water_vs_chlorine : POOL_TYPES[0]) as any,
        in_ground_vs_above_ground: (INSTALLATION_TYPES.includes(found.in_ground_vs_above_ground as any) ? found.in_ground_vs_above_ground : INSTALLATION_TYPES[0]) as any,
        notes: found.notes || '',
      });
    }
  }, [pools, poolId, reset]);

  const handleFocus = (fieldName: string) => setFocusedField(fieldName);
  const handleBlur = () => setFocusedField(null);

  const onSubmit = async (data: PoolFormData) => {
    try {
      const transformed = transformPoolFormData(data);
      await updatePool(homeId, poolId, transformed as any);
      showToast('Pool updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating pool:', error);
      showToast('Failed to update pool', 'error');
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
      'Delete Pool',
      'Are you sure you want to delete this pool? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePool(homeId, poolId);
              showToast('Pool deleted', 'success');
              router.back();
            } catch {
              showToast('Failed to delete pool', 'error');
            }
          },
        },
      ]
    );
  };

  if (!poolFound) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Pool</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Pool not found or has been deleted.
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
          Edit Pool
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pool Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Pool name *</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: errors.name ? colors.error : focusedField === 'name' ? colors.primary : colors.border,
                borderWidth: errors.name || focusedField === 'name' ? 2 : 1,
              },
            ]}
            value={formData.name || ''}
            onChangeText={(text) => {
              setValue('name', text);
              if (errors.name) clearErrors('name');
            }}
            placeholder="e.g., Main pool, Spa"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
          />
          {errors.name && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.name.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Water Type *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: errors.salt_water_vs_chlorine ? colors.error : colors.border }]}>
            <Picker
              selectedValue={formData.salt_water_vs_chlorine}
              onValueChange={val => setValue('salt_water_vs_chlorine', val)}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              {POOL_TYPES.map(t => (
                <Picker.Item key={t} label={t.replace('_', ' ').toUpperCase()} value={t} />
              ))}
            </Picker>
          </View>
          {errors.salt_water_vs_chlorine && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.salt_water_vs_chlorine.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Installation Type *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: errors.in_ground_vs_above_ground ? colors.error : colors.border }]}>
            <Picker
              selectedValue={formData.in_ground_vs_above_ground}
              onValueChange={val => setValue('in_ground_vs_above_ground', val)}
              style={{ color: colors.text }}
              dropdownIconColor={colors.text}
            >
              {INSTALLATION_TYPES.map(t => (
                <Picker.Item key={t} label={t.replace('_', ' ').toUpperCase()} value={t} />
              ))}
            </Picker>
          </View>
          {errors.in_ground_vs_above_ground && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.in_ground_vs_above_ground.message}</Text>}

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
            placeholder="Any additional notes about this pool..."
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
  saveButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, fontWeight: '600' },
  headerRight: { width: 60 },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  form: { gap: 16 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 18, fontWeight: '700', marginTop: 8, marginBottom: 4 },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 15, fontWeight: '600', marginBottom: 6 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 100 },
  fieldError: { fontFamily: FONTS.body, fontSize: 12, marginTop: 3, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontFamily: FONTS.body, fontSize: 16, textAlign: 'center' },
  pickerContainer: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
});
