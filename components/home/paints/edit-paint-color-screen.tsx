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
import { FONTS } from '../../../lib/typography';
import { useToast } from '../../../lib/contexts/ToastContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { PaintColorFormData, paintColorFormSchema, transformPaintColorFormData } from '../../../lib/schemas/home/paintColorFormSchema';
import { usePaintsStore } from '../../../lib/stores/paintsStore';

const EMPTY_ARRAY: any[] = [];

export default function EditPaintColorScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const params = useLocalSearchParams();
  const paintId = params.id as string;

  const paints = usePaintsStore(state => state.paintsByHome[homeId] || EMPTY_ARRAY);
  const updatePaint = usePaintsStore(state => state.updatePaint);
  const fetchPaints = usePaintsStore(state => state.fetchPaints);
  const setPaints = usePaintsStore(state => state.setPaints);

  const lastHomeIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [paintFound, setPaintFound] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<PaintColorFormData>({
    resolver: zodResolver(paintColorFormSchema),
    defaultValues: {
      paint_color_name: '',
      room: '',
      color_code: '',
      finish: '',
      wallpaper: false,
      trim_color: '',
      notes: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchPaints(homeId);
    }
  }, [homeId, fetchPaints]);

  const handlePaintChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = usePaintsStore.getState();
    const current = store.paintsByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      if (!current.some((p: any) => p.id === payload.new.id)) setPaints(homeId, [payload.new, ...current]);
    } else if (payload.eventType === 'UPDATE') {
      setPaints(homeId, current.map((p: any) => p.id === payload.new.id ? payload.new : p));
    } else if (payload.eventType === 'DELETE') {
      setPaints(homeId, current.filter((p: any) => p.id !== payload.old.id));
    }
  }, [homeId, setPaints]);

  useRealTimeSubscription(
    { table: 'paint_colors', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handlePaintChange
  );

  useEffect(() => {
    if (hasLoadedRef.current) return;
    const found = paints.find((p: any) => p.id === paintId);
    if (found) {
      hasLoadedRef.current = true;
      setPaintFound(true);
      reset({
        paint_color_name: found.paint_color_name || '',
        room: found.room || '',
        color_code: found.color_code || '',
        finish: found.finish || '',
        wallpaper: found.wallpaper || false,
        trim_color: found.trim_color || '',
        notes: found.notes || '',
      });
    }
  }, [paints, paintId, reset]);

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

  const onSubmit = async (data: PaintColorFormData) => {
    try {
      const transformed = transformPaintColorFormData(data);
      await updatePaint(homeId, paintId, transformed);
      showToast('Paint color updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating paint:', error);
      showToast('Failed to update paint color', 'error');
    }
  };

  const handleCancel = () => {
    Alert.alert('Discard Changes?', 'You have unsaved changes. Are you sure you want to discard them?', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (!paintFound) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Paint Color</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Paint color not found or has been deleted.
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Paint Color</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Paint Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Paint Name *</Text>
          <TextInput
            style={getInputStyle('paint_color_name', !!errors.paint_color_name)}
            value={formData.paint_color_name || ''}
            onChangeText={text => { setValue('paint_color_name', text); if (errors.paint_color_name) clearErrors('paint_color_name'); }}
            placeholder="e.g., White, Navy Blue, Sage Green"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('paint_color_name')}
            onBlur={handleBlur}
          />
          {errors.paint_color_name && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.paint_color_name.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Room *</Text>
          <TextInput
            style={getInputStyle('room', !!errors.room)}
            value={formData.room || ''}
            onChangeText={text => { setValue('room', text); if (errors.room) clearErrors('room'); }}
            placeholder="e.g., Living Room, Kitchen"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
          />
          {errors.room && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.room.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Color Code</Text>
          <TextInput
            style={getInputStyle('color_code', !!errors.color_code)}
            value={formData.color_code || ''}
            onChangeText={text => { setValue('color_code', text); if (errors.color_code) clearErrors('color_code'); }}
            placeholder="e.g., SW-7005"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('color_code')}
            onBlur={handleBlur}
          />
          {errors.color_code && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.color_code.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Finish</Text>
          <TextInput
            style={getInputStyle('finish', !!errors.finish)}
            value={formData.finish || ''}
            onChangeText={text => { setValue('finish', text); if (errors.finish) clearErrors('finish'); }}
            placeholder="e.g., Matte, Eggshell, Semi-Gloss"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('finish')}
            onBlur={handleBlur}
          />
          {errors.finish && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.finish.message}</Text>}

          <Text style={[styles.label, { color: colors.text }]}>Trim Color</Text>
          <TextInput
            style={getInputStyle('trim_color', !!errors.trim_color)}
            value={formData.trim_color || ''}
            onChangeText={text => { setValue('trim_color', text); if (errors.trim_color) clearErrors('trim_color'); }}
            placeholder="e.g., Pure White"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('trim_color')}
            onBlur={handleBlur}
          />
          {errors.trim_color && <Text style={[styles.fieldError, { color: colors.error }]}>{errors.trim_color.message}</Text>}

          <View style={styles.switchContainer}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Is Wallpaper?</Text>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                formData.wallpaper && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setValue('wallpaper', !formData.wallpaper)}
            >
              {formData.wallpaper && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
            </TouchableOpacity>
          </View>

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
            placeholder="Any additional notes about this paint color..."
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
