import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import { paintColorFormSchema, transformPaintColorFormData } from '../../../lib/schemas/home/paintColorFormSchema';
import { usePaintsStore } from '../../../lib/stores/paintsStore';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

// Paint color database for autopopulation
const PAINT_COLORS: { [key: string]: { color_code: string; } } = {
  'white': { color_code: 'WHITE' },
  'black': { color_code: 'BLACK' },
  'gray': { color_code: 'GRAY' },
  'beige': { color_code: 'BEIGE' },
  'cream': { color_code: 'CREAM' },
  'ivory': { color_code: 'IVORY' },
  'navy': { color_code: 'NAVY' },
  'blue': { color_code: 'BLUE' },
  'red': { color_code: 'RED' },
  'green': { color_code: 'GREEN' },
  'yellow': { color_code: 'YELLOW' },
  'orange': { color_code: 'ORANGE' },
  'purple': { color_code: 'PURPLE' },
  'pink': { color_code: 'PINK' },
  'brown': { color_code: 'BROWN' },
  'tan': { color_code: 'TAN' },
  'sage': { color_code: 'SAGE' },
  'mint': { color_code: 'MINT' },
  'lavender': { color_code: 'LAVENDER' },
  'coral': { color_code: 'CORAL' },
  'teal': { color_code: 'TEAL' },
  'maroon': { color_code: 'MAROON' },
  'olive': { color_code: 'OLIVE' },
  'gold': { color_code: 'GOLD' },
  'silver': { color_code: 'SILVER' },
  'charcoal': { color_code: 'CHARCOAL' },
  'slate': { color_code: 'SLATE' },
  'taupe': { color_code: 'TAUPE' },
  'mauve': { color_code: 'MAUVE' },
  'peach': { color_code: 'PEACH' },
  'rose': { color_code: 'ROSE' },
  'indigo': { color_code: 'INDIGO' },
  'turquoise': { color_code: 'TURQUOISE' },
  'emerald': { color_code: 'EMERALD' },
  'ruby': { color_code: 'RUBY' },
  'sapphire': { color_code: 'SAPPHIRE' },
  'amethyst': { color_code: 'AMETHYST' },
  'jade': { color_code: 'JADE' },
  'crimson': { color_code: 'CRIMSON' },
  'burgundy': { color_code: 'BURGUNDY' },
  'forest': { color_code: 'FOREST' },
  'ocean': { color_code: 'OCEAN' },
  'sunset': { color_code: 'SUNSET' },
  'sunrise': { color_code: 'SUNRISE' },
  'midnight': { color_code: 'MIDNIGHT' },
  'dawn': { color_code: 'DAWN' },
  'dusk': { color_code: 'DUSK' },
  'warm': { color_code: 'WARM' },
  'cool': { color_code: 'COOL' },
  'neutral': { color_code: 'NEUTRAL' },
  'accent': { color_code: 'ACCENT' },
  'highlight': { color_code: 'HIGHLIGHT' },
  'shadow': { color_code: 'SHADOW' },
  'light': { color_code: 'LIGHT' },
  'dark': { color_code: 'DARK' },
};

export default function AddPaintColorScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const createPaint = usePaintsStore(state => state.createPaint);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // React Hook Form setup
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm({
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

  const handlePaintNameChange = (text: string) => {
    setValue('paint_color_name', text);
    if (errors.paint_color_name) clearErrors('paint_color_name');

    // Auto-populate color based on paint name
    const paintName = text.toLowerCase().trim();
    const matchingColor = PAINT_COLORS[paintName];

    if (matchingColor) {
      setValue('color_code', matchingColor.color_code);
      if (errors.color_code) clearErrors('color_code');
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const paintData = transformPaintColorFormData(data);
      await createPaint(homeId, paintData);

      showToast(`${data.paint_color_name} paint color added successfully!`, 'success');

      // Navigate back after a short delay to ensure toast is visible
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error creating paint:', error);
      showToast('Failed to add paint color. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.input,
      {
        backgroundColor: colors.surface,
        color: colors.text,
        borderColor: isFocused ? colors.primary : colors.border,
        borderWidth: isFocused ? 2 : 1,
      }
    ];
  };

  const getTextAreaStyle = () => {
    const isFocused = focusedField === 'notes';
    return [
      styles.textArea,
      {
        backgroundColor: colors.surface,
        color: colors.text,
        borderColor: isFocused ? colors.primary : colors.border,
        borderWidth: isFocused ? 2 : 1,
      }
    ];
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Add Paint Color" showBackButton />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Paint Name *</Text>
          <TextInput
            style={[
              getInputStyle('paint_color_name'),
              errors.paint_color_name && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.paint_color_name}
            onChangeText={handlePaintNameChange}
            placeholder="e.g., White, Navy Blue, Sage Green"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('paint_color_name')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.paint_color_name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.paint_color_name.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Room *</Text>
          <TextInput
            style={[
              getInputStyle('room'),
              errors.room && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.room}
            onChangeText={text => {
              setValue('room', text);
              if (errors.room) clearErrors('room');
            }}
            placeholder="e.g., Living Room, Kitchen, Bedroom"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.room && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.room.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Color Code</Text>
          <TextInput
            style={[
              getInputStyle('color_code'),
              errors.color_code && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.color_code}
            onChangeText={text => {
              setValue('color_code', text);
              if (errors.color_code) clearErrors('color_code');
            }}
            placeholder="e.g., SW-7005"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('color_code')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.color_code && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.color_code.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Finish</Text>
          <TextInput
            style={[
              getInputStyle('finish'),
              errors.finish && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.finish}
            onChangeText={text => {
              setValue('finish', text);
              if (errors.finish) clearErrors('finish');
            }}
            placeholder="e.g., Matte, Eggshell, Semi-Gloss"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('finish')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.finish && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.finish.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Trim Color</Text>
          <TextInput
            style={[
              getInputStyle('trim_color'),
              errors.trim_color && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.trim_color}
            onChangeText={text => {
              setValue('trim_color', text);
              if (errors.trim_color) clearErrors('trim_color');
            }}
            placeholder="e.g., Pure White"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('trim_color')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.trim_color && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.trim_color.message}
            </Text>
          )}

          <View style={styles.switchContainer}>
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Is Wallpaper?</Text>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                formData.wallpaper && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setValue('wallpaper', !formData.wallpaper)}
            >
              {formData.wallpaper && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[
              getTextAreaStyle(),
              errors.notes && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.notes}
            onChangeText={text => {
              setValue('notes', text);
              if (errors.notes) clearErrors('notes');
            }}
            placeholder="Any additional notes about this paint color..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => handleFocus('notes')}
            onBlur={handleBlur}
            returnKeyType="done"
          />
          {errors.notes && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.notes.message}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Ionicons name="color-palette" size={24} color={colors.textInverse} />
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
              {loading ? 'Adding...' : 'Add Paint Color'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  colorPreview: {
    alignItems: 'center',
    marginTop: 10,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
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