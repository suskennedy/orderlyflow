import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import ScreenHeader from '../layout/ScreenHeader';

export default function HomeInfoScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { getHomeById, updateHome } = useHomes();
  const home = getHomeById(homeId);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(home);

  if (!formData) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateHome(homeId, formData);
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update home info.');
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ label, value, field, keyboardType = 'default' }: {
    label: string;
    value: string | number | null;
    field: string;
    keyboardType?: 'default' | 'numeric';
  }) => (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
          value={String((formData as any)[field] || '')}
          onChangeText={text => setFormData({ ...formData, [field]: text })}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader 
        title="Home Info" 
        showBackButton 
      />
      <TouchableOpacity 
        style={[styles.editButton, { backgroundColor: colors.primary }]}
        onPress={() => setIsEditing(!isEditing)}
      >
        <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color={colors.textInverse} />
      </TouchableOpacity>
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <InfoRow label="Address" value={home?.address || null} field="address" />
        <InfoRow label="Square Footage" value={home?.square_footage || null} field="square_footage" keyboardType="numeric" />
        <InfoRow label="Bedrooms" value={home?.bedrooms || null} field="bedrooms" keyboardType="numeric" />
        <InfoRow label="Bathrooms" value={home?.bathrooms || null} field="bathrooms" keyboardType="numeric" />
        <InfoRow label="Year Built" value={home?.year_built || null} field="year_built" keyboardType="numeric" />
        <InfoRow label="Purchase Date" value={home?.purchase_date || null} field="purchase_date" />

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
  },
  infoRow: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
  },
  input: {
    fontSize: 18,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 12,
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 25,
    padding: 10,
    zIndex: 1,
  },
}); 