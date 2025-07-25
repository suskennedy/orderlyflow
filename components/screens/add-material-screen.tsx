import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMaterials } from '../../lib/contexts/MaterialsContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import DatePicker from '../DatePicker';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddMaterialScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createMaterial } = useMaterials(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    type: '',
    brand: '',
    source: '',
    purchase_date: '' as string | null,
    notes: '',
  });

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const roomRef = useRef<TextInput>(null);
  const typeRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const sourceRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a material name');
      nameRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      await createMaterial({
        name: formData.name.trim(),
        room: formData.room.trim() || null,
        type: formData.type.trim() || null,
        brand: formData.brand.trim() || null,
        source: formData.source.trim() || null,
        purchase_date: formData.purchase_date || null,
        notes: formData.notes.trim() || null,
      });
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
          
          <Text style={[styles.label, { color: colors.text }]}>Material Name *</Text>
          <TextInput
            ref={nameRef}
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="e.g., Carpet, Tile, Paint, Light Fixture"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => roomRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Room</Text>
          <TextInput
            ref={roomRef}
            style={getInputStyle('room')}
            value={formData.room}
            onChangeText={text => setFormData({ ...formData, room: text })}
            placeholder="e.g., Living Room, Kitchen, Bathroom"
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
                placeholder="e.g., Carpet, Tile, Paint, Light"
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
                placeholder="e.g., Home Depot, Lowe's, Sherwin-Williams"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('brand')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => sourceRef.current?.focus()}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Source</Text>
          <TextInput
            ref={sourceRef}
            style={getInputStyle('source')}
            value={formData.source}
            onChangeText={text => setFormData({ ...formData, source: text })}
            placeholder="e.g., Home Depot, Local Store, Online"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('source')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Purchase Information</Text>

          <DatePicker
            label="Purchase Date"
            value={formData.purchase_date || null}
            placeholder="Select purchase date"
            onChange={(date) => setFormData({ ...formData, purchase_date: date })}
            helperText="When did you purchase this material?"
            isOptional={true}
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={getTextAreaStyle()}
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
            placeholder="Any additional notes about this material..."
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