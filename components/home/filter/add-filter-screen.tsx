import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFilters } from '../../../lib/contexts/FiltersContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import DatePicker from '../../DatePicker';
import ScreenHeader from '../../layouts/layout/ScreenHeader';

export default function   AddFilterScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createFilter } = useFilters(homeId);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    type: '',
    brand: '',
    model: '',
    size: '',
    last_replaced: '' as string | null,
    replacement_frequency: '',
    notes: '',
  });

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const roomRef = useRef<TextInput>(null);
  const typeRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const sizeRef = useRef<TextInput>(null);
  const replacementFreqRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a filter name');
      nameRef.current?.focus();
      return;
    }

    if (!formData.room.trim()) {
      Alert.alert('Error', 'Please enter a room');
      roomRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await createFilter({
        name: formData.name.trim(),
        room: formData.room.trim(),
        type: formData.type.trim() || null,
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        size: formData.size.trim() || null,
        last_replaced: formData.last_replaced || null,
        replacement_frequency: formData.replacement_frequency ? parseInt(formData.replacement_frequency) : null,
        notes: formData.notes.trim() || null,
      });
      
      showToast(`${formData.name} filter added successfully!`, 'success');
      
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
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="e.g., Air Filter, Water Filter, HVAC Filter"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => roomRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Room *</Text>
          <TextInput
            ref={roomRef}
            style={getInputStyle('room')}
            value={formData.room}
            onChangeText={text => setFormData({ ...formData, room: text })}
            placeholder="e.g., Living Room, Kitchen, Basement"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => typeRef.current?.focus()}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Type</Text>
              <TextInput
                ref={typeRef}
                style={getInputStyle('type')}
                value={formData.type}
                onChangeText={text => setFormData({ ...formData, type: text })}
                placeholder="e.g., HEPA, Carbon, Pleated"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('type')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => brandRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
              <TextInput
                ref={brandRef}
                style={getInputStyle('brand')}
                value={formData.brand}
                onChangeText={text => setFormData({ ...formData, brand: text })}
                placeholder="e.g., 3M, Honeywell, Filtrete"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('brand')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => modelRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Model</Text>
              <TextInput
                ref={modelRef}
                style={getInputStyle('model')}
                value={formData.model}
                onChangeText={text => setFormData({ ...formData, model: text })}
                placeholder="e.g., FPR-10, MERV-13"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('model')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => sizeRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Size</Text>
              <TextInput
                ref={sizeRef}
                style={getInputStyle('size')}
                value={formData.size}
                onChangeText={text => setFormData({ ...formData, size: text })}
                placeholder="e.g., 16x20x1, 14x14x1"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('size')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => replacementFreqRef.current?.focus()}
              />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Maintenance Information</Text>

          <DatePicker
            label="Last Replaced"
            value={formData.last_replaced || null}
            placeholder="Select last replacement date"
            onChange={(date) => setFormData({ ...formData, last_replaced: date })}
            helperText="When was this filter last replaced?"
            isOptional={true}
          />

          <Text style={[styles.label, { color: colors.text }]}>Replacement Frequency (months)</Text>
          <TextInput
            ref={replacementFreqRef}
            style={getInputStyle('replacement_frequency')}
            value={formData.replacement_frequency}
            onChangeText={text => setFormData({ ...formData, replacement_frequency: text })}
            placeholder="e.g., 3, 6, 12"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            onFocus={() => handleFocus('replacement_frequency')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={getTextAreaStyle()}
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
            placeholder="Any additional notes about this filter..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => handleFocus('notes')}
            onBlur={handleBlur}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
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
}); 