import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppliances } from '../../lib/contexts/AppliancesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import DatePicker from '../DatePicker';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddApplianceScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createAppliance } = useAppliances();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    room: '',
    purchase_date: '' as string | null,
    warranty_expiration: '' as string | null,
    manual_url: '',
    purchased_store: '',
    notes: '',
  });

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const modelRef = useRef<TextInput>(null);
  const roomRef = useRef<TextInput>(null);
  const manualUrlRef = useRef<TextInput>(null);
  const purchasedStoreRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an appliance name');
      nameRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await createAppliance({
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        model: formData.model.trim() || null,
        purchase_date: formData.purchase_date || null,
        warranty_expiration: formData.warranty_expiration || null,
        manual_url: formData.manual_url.trim() || null,
        notes: formData.notes.trim() || null,
        room: formData.room.trim() || null,
        purchased_store: formData.purchased_store.trim() || null,
      });
      
      showToast(`${formData.name} added successfully!`, 'success');
      
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
          
          <Text style={[styles.label, { color: colors.text }]}>Appliance Name *</Text>
          <TextInput
            ref={nameRef}
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="e.g., Oven 1, Refrigerator, Dishwasher"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => brandRef.current?.focus()}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
              <TextInput
                ref={brandRef}
                style={getInputStyle('brand')}
                value={formData.brand}
                onChangeText={text => setFormData({ ...formData, brand: text })}
                placeholder="e.g., Samsung, LG, Whirlpool"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('brand')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => modelRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Model</Text>
              <TextInput
                ref={modelRef}
                style={getInputStyle('model')}
                value={formData.model}
                onChangeText={text => setFormData({ ...formData, model: text })}
                placeholder="e.g., WF45R6100AW"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('model')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => roomRef.current?.focus()}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Room</Text>
          <TextInput
            ref={roomRef}
            style={getInputStyle('room')}
            value={formData.room}
            onChangeText={text => setFormData({ ...formData, room: text })}
            placeholder="e.g., Kitchen, Living Room, Basement"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => manualUrlRef.current?.focus()}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Purchase Information</Text>

          <DatePicker
            label="Purchase Date"
            value={formData.purchase_date || null}
            placeholder="Select purchase date"
            onChange={(date) => setFormData({ ...formData, purchase_date: date })}
            helperText="When did you purchase this appliance?"
            isOptional={true}
          />

          <DatePicker
            label="Warranty Expiration"
            value={formData.warranty_expiration || null}
            placeholder="Select warranty expiration date"
            onChange={(date) => setFormData({ ...formData, warranty_expiration: date })}
            helperText="When does the warranty expire?"
            isOptional={true}
          />

          <Text style={[styles.label, { color: colors.text }]}>Manual URL</Text>
          <TextInput
            ref={manualUrlRef}
            style={getInputStyle('manual_url')}
            value={formData.manual_url}
            onChangeText={text => setFormData({ ...formData, manual_url: text })}
            placeholder="https://example.com/manual.pdf"
            placeholderTextColor={colors.textSecondary}
            keyboardType="url"
            onFocus={() => handleFocus('manual_url')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Purchased Store</Text>
          <TextInput
            ref={purchasedStoreRef}
            style={getInputStyle('purchased_store')}
            value={formData.purchased_store}
            onChangeText={text => setFormData({ ...formData, purchased_store: text })}
            placeholder="e.g., Home Depot, Best Buy, Local Store"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('purchased_store')}
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
            placeholder="Any additional notes about this appliance..."
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
}); 