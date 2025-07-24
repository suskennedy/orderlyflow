import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddHomeScreen() {
  const { createHome } = useHomes();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    image_url: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a home name');
      return;
    }

    setLoading(true);
    try {
      const homeData = { ...formData };
      if (!homeData.image_url) {
        homeData.image_url = `https://source.unsplash.com/random/800x600/?house&sig=${Date.now()}`;
      }
      await createHome(homeData);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create home. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader title="Add Home" showBackButton />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Home Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="e.g., Lake House"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.label, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={formData.address}
            onChangeText={text => setFormData({ ...formData, address: text })}
            placeholder="e.g., 123 Maple Ave"
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.label, { color: colors.text }]}>Image URL (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
            value={formData.image_url}
            onChangeText={text => setFormData({ ...formData, image_url: text })}
            placeholder="https://example.com/image.png"
            placeholderTextColor={colors.textSecondary}
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <>
                <Ionicons name="add" size={24} color={colors.textInverse} />
                <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>Add Home</Text>
              </>
            )}
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
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});