import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useRealTimeSubscription } from '../../../lib/hooks/useRealTimeSubscription';
import { usePaintsStore } from '../../../lib/stores/paintsStore';

interface PaintColor {
  id: string;
  name: string;
  room: string | null;
  color_code: string | null;
  finish: string | null;
  wallpaper: boolean | null;
  trim_color: string | null;
  notes: string | null;
}

export default function EditPaintColorScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const paints = usePaintsStore(state => state.paintsByHome[homeId] || []);
  const updatePaint = usePaintsStore(state => state.updatePaint);
  const fetchPaints = usePaintsStore(state => state.fetchPaints);
  const setPaints = usePaintsStore(state => state.setPaints);

  const lastHomeIdRef = useRef<string | null>(null);

  // Initial data fetch
  useEffect(() => {
    if (homeId && homeId !== lastHomeIdRef.current) {
      lastHomeIdRef.current = homeId;
      fetchPaints(homeId);
    }
  }, [homeId, fetchPaints]);

  // Real-time subscription
  const handlePaintChange = useCallback((payload: any) => {
    if (payload.new?.home_id !== homeId && payload.old?.home_id !== homeId) return;
    const store = usePaintsStore.getState();
    const currentPaints = store.paintsByHome[homeId] || [];
    if (payload.eventType === 'INSERT') {
      const newPaint = payload.new;
      if (!currentPaints.some(p => p.id === newPaint.id)) {
        setPaints(homeId, [newPaint, ...currentPaints]);
      }
    } else if (payload.eventType === 'UPDATE') {
      setPaints(homeId, currentPaints.map(p => p.id === payload.new.id ? payload.new : p));
    } else if (payload.eventType === 'DELETE') {
      setPaints(homeId, currentPaints.filter(p => p.id !== payload.old.id));
    }
  }, [homeId, setPaints]);

  useRealTimeSubscription(
    { table: 'paint_colors', filter: homeId ? `home_id=eq.${homeId}` : undefined },
    handlePaintChange
  );
  const paintId = useLocalSearchParams<{ id: string }>();

  const [paint, setPaint] = useState<PaintColor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    color_code: '',
    finish: '',
    wallpaper: false,
    trim_color: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const foundPaint = paints.find((p: any) => p.id === paintId.id);
    if (foundPaint) {
      setPaint(foundPaint);
      setFormData({
        name: foundPaint.name || '',
        room: foundPaint.room || '',
        color_code: foundPaint.color_code || '',
        finish: foundPaint.finish || '',
        wallpaper: foundPaint.wallpaper || false,
        trim_color: foundPaint.trim_color || '',
        notes: foundPaint.notes || ''
      });
    }
  }, [paints, paintId.id]);

  const handleSave = async () => {
    if (!paint) return;

    if (!formData.name.trim()) {
      Alert.alert('Error', 'Paint name is required');
      return;
    }

    setIsLoading(true);
    try {
      await updatePaint(homeId, paintId.id, {
        name: formData.name.trim(),
        room: formData.room || null,
        color_code: formData.color_code || null,
        finish: formData.finish || null,
        wallpaper: formData.wallpaper,
        trim_color: formData.trim_color || null,
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Finish</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.finish}
              onChangeText={(text) => setFormData({ ...formData, finish: text })}
              placeholder="e.g., Matte, Eggshell"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Trim Color</Text>
            <TextInput
              style={[styles.textInput, {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }]}
              value={formData.trim_color}
              onChangeText={(text) => setFormData({ ...formData, trim_color: text })}
              placeholder="e.g., Pure White"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>Is Wallpaper?</Text>
            <TouchableOpacity
              style={[
                styles.checkbox,
                { borderColor: colors.border },
                formData.wallpaper && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setFormData({ ...formData, wallpaper: !formData.wallpaper })}
            >
              {formData.wallpaper && <Ionicons name="checkmark" size={16} color={colors.textInverse} />}
            </TouchableOpacity>
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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
