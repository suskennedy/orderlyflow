import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFilters } from '../../lib/contexts/FiltersContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddFilterScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createFilter } = useFilters(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    brand: '',
    last_changed_date: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await createFilter(formData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add filter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader title="Add Filter" showBackButton />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Filter Name"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Size (e.g., 20x20x1)"
          value={formData.size}
          onChangeText={text => setFormData({ ...formData, size: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Brand"
          value={formData.brand}
          onChangeText={text => setFormData({ ...formData, brand: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Last Changed Date (YYYY-MM-DD)"
          value={formData.last_changed_date}
          onChangeText={text => setFormData({ ...formData, last_changed_date: text })}
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
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Add Filter</Text>}
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