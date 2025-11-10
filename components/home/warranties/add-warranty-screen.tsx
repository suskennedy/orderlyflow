import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import { useWarranties } from '../../../lib/hooks/useWarranties';
import { WarrantyFormData, transformWarrantyFormData, warrantyFormSchema } from '../../../lib/schemas/home/warrantyFormSchema';
import DatePicker from '../../DatePicker';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

export default function AddWarrantyScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createWarranty } = useWarranties(homeId);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // React Hook Form setup
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
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

  const onSubmit = async (data: WarrantyFormData) => {
    setLoading(true);
    try {
      const warrantyData = transformWarrantyFormData(data);
      await createWarranty(warrantyData);
      
      showToast(`${data.item_name} warranty added successfully!`, 'success');
      
      // Navigate back after a short delay to ensure toast is visible
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error creating warranty:', error);
      showToast('Failed to add warranty. Please try again.', 'error');
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
      <ScreenHeader title="Add Warranty" showBackButton />
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <Text style={[styles.label, { color: colors.text }]}>Item Name *</Text>
          <TextInput
            style={[
              getInputStyle('item_name'),
              errors.item_name && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.item_name}
            onChangeText={text => {
              setValue('item_name', text);
              if (errors.item_name) clearErrors('item_name');
            }}
            placeholder="e.g., HVAC System, Roof, Appliances"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('item_name')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.item_name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.item_name.message}
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
            placeholder="e.g., Kitchen, Living Room, Exterior"
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

          <Text style={[styles.label, { color: colors.text }]}>Provider *</Text>
          <TextInput
            style={[
              getInputStyle('provider'),
              errors.provider && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.provider}
            onChangeText={text => {
              setValue('provider', text);
              if (errors.provider) clearErrors('provider');
            }}
            placeholder="e.g., Home Warranty Company, Manufacturer"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('provider')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.provider && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.provider.message}
            </Text>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Warranty Dates</Text>

          <DatePicker
            label="Warranty Start Date"
            value={formData.warranty_start_date || null}
            placeholder="Select warranty start date"
            onChange={(date) => {
              setValue('warranty_start_date', date || '');
              if (errors.warranty_start_date) clearErrors('warranty_start_date');
            }}
            helperText="When did the warranty begin?"
            isOptional={true}
          />
          {errors.warranty_start_date && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.warranty_start_date.message}
            </Text>
          )}

          <DatePicker
            label="Warranty End Date"
            value={formData.warranty_end_date || null}
            placeholder="Select warranty end date"
            onChange={(date) => {
              setValue('warranty_end_date', date || '');
              if (errors.warranty_end_date) clearErrors('warranty_end_date');
            }}
            helperText="When does the warranty expire?"
            isOptional={true}
          />
          {errors.warranty_end_date && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.warranty_end_date.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[
              getTextAreaStyle(),
              errors.notes && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.notes || ''}
            onChangeText={text => {
              setValue('notes', text);
              if (errors.notes) clearErrors('notes');
            }}
            placeholder="Any additional notes about this warranty..."
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
            <Ionicons name="shield-checkmark" size={24} color={colors.textInverse} />
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>
              {loading ? 'Adding...' : 'Add Warranty'}
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
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
}); 