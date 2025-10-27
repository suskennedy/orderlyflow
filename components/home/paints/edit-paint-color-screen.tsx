import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePaints } from '../../../lib/contexts/PaintsContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';

interface PaintColor {
  id: string;
  name: string;
  room: string | null;
  brand: string | null;
  color_code: string | null;
  color_hex: string | null;
  notes: string | null;
}

export default function  EditPaintColorScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();  
  const { paints, updatePaint } = usePaints(homeId);
  const paintId = useLocalSearchParams<{ id: string }>();

  const [paint, setPaint] = useState<PaintColor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    brand: '',
    color_code: '',
    color_hex: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const foundPaint = paints.find((p: any) => p.id === paintId);
    if (foundPaint) {
      setPaint(foundPaint);
      setFormData({
        name: foundPaint.name || '',
        room: foundPaint.room || '',
        brand: foundPaint.brand || '',
        color_code: foundPaint.color_code || '',
        color_hex: foundPaint.color_hex || '',
        notes: foundPaint.notes || ''
      });
    }
  }, [paints, paintId]);

  const handleSave = async () => {
    if (!paint) return;

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Paint name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updatePaint(paintId.id, {
        name: formData.name.trim(),
        room: formData.room || null,  
        brand: formData.brand || null,
        color_code: formData.color_code || null,
        color_hex: formData.color_hex || null,
        notes: formData.notes || null
      });
      
      Alert.alert('Success', 'Paint color updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating paint:', error);
      Alert.alert('Error', 'Failed to update paint color');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  // Function to validate and format hex color
  const handleColorHexChange = (text: string) => {
    let formattedText = text;
    
    // Add # if not present
    if (text && !text.startsWith('#')) {
      formattedText = '#' + text;
    }
    
    // Remove invalid characters and limit length
    formattedText = formattedText.replace(/[^#0-9A-Fa-f]/g, '').substring(0, 7);
    
    setFormData({ ...formData, color_hex: formattedText });
  };

  if (!paint) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Paint Color</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Paint color not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Paint Color</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Paint Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Paint Name *</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter paint name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Room</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.room}
              onChangeText={(text) => setFormData({ ...formData, room: text })}
              placeholder="Enter room location"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Brand</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.brand}
              onChangeText={(text) => setFormData({ ...formData, brand: text })}
              placeholder="Enter paint brand"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color Code</Text>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.color_code}
              onChangeText={(text) => setFormData({ ...formData, color_code: text })}
              placeholder="e.g., SW 7006, BM OC-17"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Hex Color Code</Text>
            <View style={styles.colorInputContainer}>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                  flex: 1,
                  marginRight: 12
                }]}
                value={formData.color_hex}
                onChangeText={handleColorHexChange}
                placeholder="#FFFFFF"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                maxLength={7}
              />
              {formData.color_hex && (
                <View 
                  style={[
                    styles.colorPreview, 
                    { backgroundColor: formData.color_hex || '#ccc' }
                  ]} 
                />
              )}
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional Notes</Text>
            <TextInput
              style={[styles.textArea, { 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Enter any additional notes or information"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
