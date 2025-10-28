import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFilters } from '../../../lib/contexts/FiltersContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import { FilterFormData, filterFormSchema, transformFilterFormData } from '../../../lib/schemas/home/filterFormSchema';
import DatePicker from '../../DatePicker';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

export default function AddFilterScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createFilter } = useFilters(homeId);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { 
    control, 
    handleSubmit, 
    watch, 
    setValue, 
    clearErrors, 
    formState: { errors } 
  } = useForm<FilterFormData>({
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
    }
  });

  const formData = watch();

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const roomRef = useRef<TextInput>(null);
  const typeRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const sizeRef = useRef<TextInput>(null);
  const replacementFreqRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const onSubmit = async (data: FilterFormData) => {
    setLoading(true);
    try {
      const transformedData = transformFilterFormData(data);
      await createFilter(transformedData);
      
      showToast(`${data.name} filter added successfully!`, 'success');
      
      // Navigate back after a short delay to ensure toast is visible
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error creating filter:', error);
      showToast('Failed to add filter. Please try again.', 'error');
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
      <ScreenHeader title="Add Filter" showBackButton />
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <Text style={[styles.label, { color: colors.text }]}>Filter Name *</Text>
          <TextInput
            ref={nameRef}
            style={[
              getInputStyle('name'),
              errors.name && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.name}
            onChangeText={text => {
              setValue('name', text);
              if (errors.name) clearErrors('name');
            }}
            placeholder="e.g., Air Filter, Water Filter, HVAC Filter"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => roomRef.current?.focus()}
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.name.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Room *</Text>
          <TextInput
            ref={roomRef}
            style={[
              getInputStyle('room'),
              errors.room && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.room}
            onChangeText={text => {
              setValue('room', text);
              if (errors.room) clearErrors('room');
            }}
            placeholder="e.g., Living Room, Kitchen, Basement"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => typeRef.current?.focus()}
          />
          {errors.room && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.room.message}
            </Text>
          )}

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Type *</Text>
              <TextInput
                ref={typeRef}
                style={[
                  getInputStyle('type'),
                  errors.type && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.type}
                onChangeText={text => {
                  setValue('type', text);
                  if (errors.type) clearErrors('type');
                }}
                placeholder="e.g., HEPA, Carbon, Pleated"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('type')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => brandRef.current?.focus()}
              />
              {errors.type && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.type.message}
                </Text>
              )}
            </View>
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
                placeholder="e.g., 3M, Honeywell, Filtrete"
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
          </View>

          <View style={styles.row}>
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
                placeholder="e.g., FPR-10, MERV-13"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('model')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => sizeRef.current?.focus()}
              />
              {errors.model && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.model.message}
                </Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Size *</Text>
              <TextInput
                ref={sizeRef}
                style={[
                  getInputStyle('size'),
                  errors.size && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.size}
                onChangeText={text => {
                  setValue('size', text);
                  if (errors.size) clearErrors('size');
                }}
                placeholder="e.g., 16x20x1, 14x14x1"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('size')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => replacementFreqRef.current?.focus()}
              />
              {errors.size && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.size.message}
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Maintenance Information</Text>

          <DatePicker
            label="Last Replaced"
            value={formData.last_replaced || null}
            placeholder="Select last replacement date"
            onChange={(date) => {
              setValue('last_replaced', date || '');
              if (errors.last_replaced) clearErrors('last_replaced');
            }}
            helperText="When was this filter last replaced?"
            isOptional={true}
          />
          {errors.last_replaced && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.last_replaced.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Replacement Frequency (months)</Text>
          <TextInput
            ref={replacementFreqRef}
            style={[
              getInputStyle('replacement_frequency'),
              errors.replacement_frequency && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.replacement_frequency}
            onChangeText={text => {
              setValue('replacement_frequency', text);
              if (errors.replacement_frequency) clearErrors('replacement_frequency');
            }}
            placeholder="e.g., 3, 6, 12"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            onFocus={() => handleFocus('replacement_frequency')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />
          {errors.replacement_frequency && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.replacement_frequency.message}
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
            placeholder="Any additional notes about this filter..."
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
            <Ionicons name="funnel" size={24} color={colors.textInverse} />
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
              {loading ? 'Adding...' : 'Add Filter'}
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
}); 