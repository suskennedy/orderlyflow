import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useToast } from '../../../lib/contexts/ToastContext';
import { useWarranties } from '../../../lib/contexts/WarrantiesContext';
import DatePicker from '../../DatePicker';
import ScreenHeader from '../../layout/ScreenHeader';

export default function AddWarrantyScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createWarranty } = useWarranties(homeId);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    room: '',
    warranty_start_date: '' as string | null,
    warranty_end_date: '' as string | null,
    provider: '',
    notes: '',
  });

  // Refs for input fields
  const itemNameRef = useRef<TextInput>(null);
  const roomRef = useRef<TextInput>(null);
  const providerRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!formData.item_name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      itemNameRef.current?.focus();
      return;
    }

    if (!formData.room.trim()) {
      Alert.alert('Error', 'Please enter a room');
      roomRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await createWarranty({
        item_name: formData.item_name.trim(),
        room: formData.room.trim(),
        warranty_start_date: formData.warranty_start_date || null,
        warranty_end_date: formData.warranty_end_date || null,
        provider: formData.provider.trim() || null,
        notes: formData.notes.trim() || null,
      });
      
      showToast(`${formData.item_name} warranty added successfully!`, 'success');
      
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
            ref={itemNameRef}
            style={getInputStyle('item_name')}
            value={formData.item_name}
            onChangeText={text => setFormData({ ...formData, item_name: text })}
            placeholder="e.g., HVAC System, Roof, Appliances"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('item_name')}
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
            placeholder="e.g., Kitchen, Living Room, Exterior"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => providerRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Provider</Text>
          <TextInput
            ref={providerRef}
            style={getInputStyle('provider')}
            value={formData.provider}
            onChangeText={text => setFormData({ ...formData, provider: text })}
            placeholder="e.g., Home Warranty Company, Manufacturer"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('provider')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Warranty Dates</Text>

          <DatePicker
            label="Warranty Start Date"
            value={formData.warranty_start_date || null}
            placeholder="Select warranty start date"
            onChange={(date) => setFormData({ ...formData, warranty_start_date: date })}
            helperText="When did the warranty begin?"
            isOptional={true}
          />

          <DatePicker
            label="Warranty End Date"
            value={formData.warranty_end_date || null}
            placeholder="Select warranty end date"
            onChange={(date) => setFormData({ ...formData, warranty_end_date: date })}
            helperText="When does the warranty expire?"
            isOptional={true}
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={getTextAreaStyle()}
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
            placeholder="Any additional notes about this warranty..."
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
}); 