import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useWarranties } from '../../lib/contexts/WarrantiesContext';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddWarrantyScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createWarranty } = useWarranties(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    warranty_start_date: '',
    warranty_end_date: '',
    provider: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.item_name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await createWarranty(formData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add warranty.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader title="Add Warranty" showBackButton />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Item Name"
          value={formData.item_name}
          onChangeText={text => setFormData({ ...formData, item_name: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Warranty Start Date (YYYY-MM-DD)"
          value={formData.warranty_start_date}
          onChangeText={text => setFormData({ ...formData, warranty_start_date: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Warranty End Date (YYYY-MM-DD)"
          value={formData.warranty_end_date}
          onChangeText={text => setFormData({ ...formData, warranty_end_date: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Provider"
          value={formData.provider}
          onChangeText={text => setFormData({ ...formData, provider: text })}
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
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Add Warranty</Text>}
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