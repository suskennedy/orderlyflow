import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import { APPLIANCE_TYPES, ApplianceFormData, applianceFormSchema, transformApplianceFormData } from '../../../lib/schemas/home/applianceFormSchema';
import { useAppliancesStore } from '../../../lib/stores/appliancesStore';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

export default function AddApplianceScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const createAppliance = useAppliancesStore(state => state.createAppliance);
  const { colors } = useTheme();
  const { showToast } = useToast();
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
    }
  });

  const formData = watch();

  // Refs for input fields
  const brandRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const locationRef = useRef<TextInput>(null);
  const manualUrlRef = useRef<TextInput>(null);
  const warrantyUrlRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const onSubmit = async (data: ApplianceFormData) => {
    setLoading(true);
    try {
      const transformedData = transformApplianceFormData(data);
      await createAppliance(homeId || '', transformedData);

      showToast(`${data.type} added successfully!`, 'success');

      // Navigate back after a short delay to ensure toast is visible
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error creating appliance:', error);
      showToast('Failed to add appliance. Please try again.', 'error');
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
      <ScreenHeader title="Add Appliance" showBackButton />
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Appliance Type *</Text>
          <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Picker
              selectedValue={formData.type}
              onValueChange={(itemValue) => setValue('type', itemValue)}
              style={[{ color: colors.text }]}
              dropdownIconColor={colors.text}
            >
              {APPLIANCE_TYPES.map((type) => (
                <Picker.Item key={type} label={type} value={type} />
              ))}
            </Picker>
          </View>
          {errors.type && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.type.message}
            </Text>
          )}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Brand *</Text>
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
                placeholder="e.g., Samsung, LG, Whirlpool"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('brand')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => modelRef.current?.focus()}
              />
              {errors.brand && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.brand.message}
                </Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Model *</Text>
              <TextInput
                ref={modelRef}
                style={[
                  getInputStyle('model'),
                  errors.model && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.model}
                onChangeText={text => {
                  setValue('model', text);
                  if (errors.model) clearErrors('model');
                }}
                placeholder="e.g., WF45R6100AW"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('model')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => locationRef.current?.focus()}
              />
              {errors.model && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.model.message}
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Location *</Text>
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
            placeholder="e.g., Kitchen, Living Room, Basement"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('location')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => manualUrlRef.current?.focus()}
          />
          {errors.location && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.location.message}
            </Text>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Purchase Information</Text>



          <Text style={[styles.label, { color: colors.text }]}>Manual URL</Text>
          <TextInput
            ref={manualUrlRef}
            style={[
              getInputStyle('manual_url'),
              errors.manual_url && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.manual_url}
            onChangeText={text => {
              setValue('manual_url', text);
              if (errors.manual_url) clearErrors('manual_url');
            }}
            placeholder="https://example.com/manual.pdf"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            onFocus={() => handleFocus('manual_url')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => warrantyUrlRef.current?.focus()}
          />
          {errors.manual_url && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.manual_url.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Warranty URL</Text>
          <TextInput
            ref={warrantyUrlRef}
            style={[
              getInputStyle('warranty_url'),
              errors.warranty_url && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.warranty_url}
            onChangeText={text => {
              setValue('warranty_url', text);
              if (errors.warranty_url) clearErrors('warranty_url');
            }}
            placeholder="https://example.com/warranty.pdf"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            onFocus={() => handleFocus('warranty_url')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />
          {errors.warranty_url && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.warranty_url.message}
            </Text>
          )}

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
            placeholder="Any additional notes about this appliance..."
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
            <Ionicons name="hardware-chip" size={24} color={colors.textInverse} />
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
              {loading ? 'Adding...' : 'Add Appliance'}
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
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
}); 