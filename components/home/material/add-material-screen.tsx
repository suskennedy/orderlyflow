import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { FONTS } from '../../../lib/typography';
import { MATERIAL_TYPES, MaterialFormData, materialFormSchema, transformMaterialFormData } from '../../../lib/schemas/home/materialFormSchema';
import { useMaterialsStore } from '../../../lib/stores/materialsStore';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

export default function AddMaterialScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const createMaterial = useMaterialsStore(state => state.createMaterial);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors }
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      type: MATERIAL_TYPES[0],
      location: '',
      brand: '',
      notes: '',
    }
  });

  const formData = watch();

  // Refs for input fields
  const locationRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const onSubmit = async (data: MaterialFormData) => {
    setLoading(true);
    try {
      const transformedData = transformMaterialFormData(data);
      await createMaterial(homeId, transformedData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add material. Please try again.');
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
      <ScreenHeader title="Add Material" showBackButton />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Material Type *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(itemValue) => setValue('type', itemValue)}
              style={[{ color: colors.text }]}
              dropdownIconColor={colors.text}
            >
              {MATERIAL_TYPES.map((typeOption) => (
                <Picker.Item key={typeOption} label={typeOption} value={typeOption} />
              ))}
            </Picker>
          </View>
          {errors.type && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.type.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Location / Room *</Text>
          <TextInput
            ref={locationRef}
            style={[
              getInputStyle('location'),
              errors.location && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.location}
            onChangeText={text => {
              setValue('location', text);
              if (errors.location) clearErrors('location');
            }}
            placeholder="e.g., Living Room, Kitchen Backsplash"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('location')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => brandRef.current?.focus()}
          />
          {errors.location && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.location.message}
            </Text>
          )}

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
            <TextInput
              ref={brandRef}
              style={[
                getInputStyle('brand'),
                errors.brand && { borderColor: colors.error, borderWidth: 2 }
              ]}
              value={formData.brand}
              onChangeText={text => {
                setValue('brand', text);
                if (errors.brand) clearErrors('brand');
              }}
              placeholder="e.g., Home Depot, Lowe's, Sherwin-Williams"
              placeholderTextColor={colors.textTertiary}
              onFocus={() => handleFocus('brand')}
              onBlur={handleBlur}
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
            />
            {errors.brand && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.brand.message}
              </Text>
            )}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={[
              getTextAreaStyle(),
              errors.notes && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.notes}
            onChangeText={text => {
              setValue('notes', text);
              if (errors.notes) clearErrors('notes');
            }}
            placeholder="Any additional notes about this material..."
            placeholderTextColor={colors.textTertiary}
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
            <Ionicons name="construct" size={24} color={colors.textInverse} />
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
              {loading ? 'Adding...' : 'Add Material'}
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
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontFamily: FONTS.body,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    fontFamily: FONTS.body,
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
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
}); 