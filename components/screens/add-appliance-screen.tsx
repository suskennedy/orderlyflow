import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppliances } from '../../lib/contexts/AppliancesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddApplianceScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { createAppliance } = useAppliances(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    purchase_date: '',
    purchased_store: '',
    warranty_length: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await createAppliance(formData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add appliance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader title="Add Appliance" showBackButton />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Appliance Name"
          value={formData.name}
          onChangeText={text => setFormData({ ...formData, name: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Brand"
          value={formData.brand}
          onChangeText={text => setFormData({ ...formData, brand: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Model"
          value={formData.model}
          onChangeText={text => setFormData({ ...formData, model: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Purchase Date (YYYY-MM-DD)"
          value={formData.purchase_date}
          onChangeText={text => setFormData({ ...formData, purchase_date: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Purchased Store"
          value={formData.purchased_store}
          onChangeText={text => setFormData({ ...formData, purchased_store: text })}
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder="Warranty Length"
          value={formData.warranty_length}
          onChangeText={text => setFormData({ ...formData, warranty_length: text })}
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
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Add Appliance</Text>}
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