import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaints } from '../../lib/contexts/PaintsContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import ScreenHeader from '../layout/ScreenHeader';

// Paint color database for autopopulation
const PAINT_COLORS: { [key: string]: { color_hex: string; color_code: string; brand?: string } } = {
  'white': { color_hex: '#FFFFFF', color_code: 'WHITE' },
  'black': { color_hex: '#000000', color_code: 'BLACK' },
  'gray': { color_hex: '#808080', color_code: 'GRAY' },
  'beige': { color_hex: '#F5F5DC', color_code: 'BEIGE' },
  'cream': { color_hex: '#FFFDD0', color_code: 'CREAM' },
  'ivory': { color_hex: '#FFFFF0', color_code: 'IVORY' },
  'navy': { color_hex: '#000080', color_code: 'NAVY' },
  'blue': { color_hex: '#0000FF', color_code: 'BLUE' },
  'red': { color_hex: '#FF0000', color_code: 'RED' },
  'green': { color_hex: '#008000', color_code: 'GREEN' },
  'yellow': { color_hex: '#FFFF00', color_code: 'YELLOW' },
  'orange': { color_hex: '#FFA500', color_code: 'ORANGE' },
  'purple': { color_hex: '#800080', color_code: 'PURPLE' },
  'pink': { color_hex: '#FFC0CB', color_code: 'PINK' },
  'brown': { color_hex: '#A52A2A', color_code: 'BROWN' },
  'tan': { color_hex: '#D2B48C', color_code: 'TAN' },
  'sage': { color_hex: '#9CAF88', color_code: 'SAGE' },
  'mint': { color_hex: '#98FF98', color_code: 'MINT' },
  'lavender': { color_hex: '#E6E6FA', color_code: 'LAVENDER' },
  'coral': { color_hex: '#FF7F50', color_code: 'CORAL' },
  'teal': { color_hex: '#008080', color_code: 'TEAL' },
  'maroon': { color_hex: '#800000', color_code: 'MAROON' },
  'olive': { color_hex: '#808000', color_code: 'OLIVE' },
  'gold': { color_hex: '#FFD700', color_code: 'GOLD' },
  'silver': { color_hex: '#C0C0C0', color_code: 'SILVER' },
  'charcoal': { color_hex: '#36454F', color_code: 'CHARCOAL' },
  'slate': { color_hex: '#708090', color_code: 'SLATE' },
  'taupe': { color_hex: '#483C32', color_code: 'TAUPE' },
  'mauve': { color_hex: '#E0B0FF', color_code: 'MAUVE' },
  'peach': { color_hex: '#FFCBA4', color_code: 'PEACH' },
  'rose': { color_hex: '#FF007F', color_code: 'ROSE' },
  'indigo': { color_hex: '#4B0082', color_code: 'INDIGO' },
  'turquoise': { color_hex: '#40E0D0', color_code: 'TURQUOISE' },
  'emerald': { color_hex: '#50C878', color_code: 'EMERALD' },
  'ruby': { color_hex: '#E0115F', color_code: 'RUBY' },
  'sapphire': { color_hex: '#0F52BA', color_code: 'SAPPHIRE' },
  'amethyst': { color_hex: '#9966CC', color_code: 'AMETHYST' },
  'jade': { color_hex: '#00A36C', color_code: 'JADE' },
  'crimson': { color_hex: '#DC143C', color_code: 'CRIMSON' },
  'burgundy': { color_hex: '#800020', color_code: 'BURGUNDY' },
  'forest': { color_hex: '#228B22', color_code: 'FOREST' },
  'ocean': { color_hex: '#006994', color_code: 'OCEAN' },
  'sunset': { color_hex: '#FD5E53', color_code: 'SUNSET' },
  'sunrise': { color_hex: '#FF6B35', color_code: 'SUNRISE' },
  'midnight': { color_hex: '#191970', color_code: 'MIDNIGHT' },
  'dawn': { color_hex: '#F4E4BC', color_code: 'DAWN' },
  'dusk': { color_hex: '#4E598C', color_code: 'DUSK' },
  'warm': { color_hex: '#FFB347', color_code: 'WARM' },
  'cool': { color_hex: '#87CEEB', color_code: 'COOL' },
  'neutral': { color_hex: '#F5F5F5', color_code: 'NEUTRAL' },
  'accent': { color_hex: '#FF6B6B', color_code: 'ACCENT' },
  'highlight': { color_hex: '#FFD93D', color_code: 'HIGHLIGHT' },
  'shadow': { color_hex: '#2F2F2F', color_code: 'SHADOW' },
  'light': { color_hex: '#F8F8FF', color_code: 'LIGHT' },
  'dark': { color_hex: '#1A1A1A', color_code: 'DARK' },
};

export default function AddPaintColorScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createPaint } = usePaints(homeId);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    brand: '',
    color_code: '',
    color_hex: '',
    notes: '',
  });

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const roomRef = useRef<TextInput>(null);
  const brandRef = useRef<TextInput>(null);
  const colorCodeRef = useRef<TextInput>(null);
  const colorHexRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const handlePaintNameChange = (text: string) => {
    setFormData({ ...formData, name: text });
    
    // Auto-populate color based on paint name
    const paintName = text.toLowerCase().trim();
    const matchingColor = PAINT_COLORS[paintName];
    
    if (matchingColor) {
      setFormData(prev => ({
        ...prev,
        name: text,
        color_hex: matchingColor.color_hex,
        color_code: matchingColor.color_code,
        brand: matchingColor.brand || prev.brand,
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a paint name');
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
      await createPaint({
        name: formData.name.trim(),
        room: formData.room.trim(),
        brand: formData.brand.trim() || null,
        color_code: formData.color_code.trim() || null,
        color_hex: formData.color_hex.trim() || null,
        notes: formData.notes.trim() || null,
      });
      
      showToast(`${formData.name} paint color added successfully!`, 'success');
      
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
            ref={nameRef}
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={handlePaintNameChange}
            placeholder="e.g., White, Navy Blue, Sage Green"
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
            placeholder="e.g., Living Room, Kitchen, Bedroom"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('room')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => brandRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Brand</Text>
          <TextInput
            ref={brandRef}
            style={getInputStyle('brand')}
            value={formData.brand}
            onChangeText={text => setFormData({ ...formData, brand: text })}
            placeholder="e.g., Sherwin-Williams, Behr, Benjamin Moore"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('brand')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => colorCodeRef.current?.focus()}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Color Information</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Color Code</Text>
              <TextInput
                ref={colorCodeRef}
                style={getInputStyle('color_code')}
                value={formData.color_code}
                onChangeText={text => setFormData({ ...formData, color_code: text })}
                placeholder="e.g., SW-7005, BM-OC-17"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('color_code')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => colorHexRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Color Hex</Text>
              <TextInput
                ref={colorHexRef}
                style={getInputStyle('color_hex')}
                value={formData.color_hex}
                onChangeText={text => setFormData({ ...formData, color_hex: text })}
                placeholder="e.g., #FFFFFF"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('color_hex')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => notesRef.current?.focus()}
              />
            </View>
          </View>

          {formData.color_hex && (
            <View style={styles.colorPreview}>
              <Text style={[styles.label, { color: colors.text }]}>Color Preview</Text>
              <View style={[styles.colorSwatch, { backgroundColor: formData.color_hex }]} />
            </View>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={getTextAreaStyle()}
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
            placeholder="Any additional notes about this paint color..."
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
}); 