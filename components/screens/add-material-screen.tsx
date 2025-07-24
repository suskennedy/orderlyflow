import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMaterials } from '../../lib/contexts/MaterialsContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddMaterialScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createMaterial } = useMaterials(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    source: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await createMaterial(formData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add material.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader title="Add Material" showBackButton />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Material Name"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Type (e.g., Carpet, Tile)"
          value={formData.type}
          onChangeText={text => setFormData({ ...formData, type: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Source (e.g., Home Depot)"
          value={formData.source}
          onChangeText={text => setFormData({ ...formData, source: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, height: 100 }]}
          placeholder="Notes"
          value={formData.notes}
          onChangeText={text => setFormData({ ...formData, notes: text })}
          multiline
        />
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Add Material</Text>}
        </TouchableOpacity>
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
    gap: 16,
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 