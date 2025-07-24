import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

  const InfoRow = ({ label, value, field, keyboardType = 'default' }: any) => (
    <View style={styles.infoRow}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
          value={String(formData[field] || '')}
          onChangeText={text => setFormData({ ...formData, [field]: text })}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScreenHeader 
        title="Home Info" 
        showBackButton 
        rightButton={
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color={colors.primary} />
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <InfoRow label="Address" value={home?.address} field="address" />
        <InfoRow label="Square Footage" value={home?.square_footage} field="square_footage" keyboardType="numeric" />
        <InfoRow label="Bedrooms" value={home?.bedrooms} field="bedrooms" keyboardType="numeric" />
        <InfoRow label="Bathrooms" value={home?.bathrooms} field="bathrooms" keyboardType="numeric" />
        <InfoRow label="Year Built" value={home?.year_built} field="year_built" keyboardType="numeric" />
        <InfoRow label="Purchase Date" value={home?.purchase_date} field="purchase_date" />

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
}); 