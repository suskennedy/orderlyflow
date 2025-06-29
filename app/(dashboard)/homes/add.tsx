import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useDashboard } from '../../../lib/hooks/useDashboard';
import { supabase } from '../../../lib/supabase';

export default function AddHomeScreen() {
  const { user } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    bedrooms: '',
    bathrooms: '',
    square_footage: '',
    year_built: '',
    purchase_date: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a home name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('homes').insert([
        {
          name: formData.name,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
          bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
          square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
          year_built: formData.year_built ? parseInt(formData.year_built) : null,
          purchase_date: formData.purchase_date || null,
          notes: formData.notes || null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      // Refresh dashboard stats
      await fetchDashboardStats();

      Alert.alert('Success', 'Home added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding home:', error);
      Alert.alert('Error', 'Failed to add home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Home</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Home Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Main House, Vacation Home"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main Street"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="CA"
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholderTextColor="#9CA3AF"
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>ZIP Code</Text>
              <TextInput
                style={styles.input}
                placeholder="12345"
                value={formData.zip}
                onChangeText={(text) => setFormData({ ...formData, zip: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Bedrooms</Text>
              <TextInput
                style={styles.input}
                placeholder="3"
                value={formData.bedrooms}
                onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Bathrooms</Text>
              <TextInput
                style={styles.input}
                placeholder="2.5"
                value={formData.bathrooms}
                onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Square Footage</Text>
              <TextInput
                style={styles.input}
                placeholder="2000"
                value={formData.square_footage}
                onChangeText={(text) => setFormData({ ...formData, square_footage: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Year Built</Text>
              <TextInput
                style={styles.input}
                placeholder="1995"
                value={formData.year_built}
                onChangeText={(text) => setFormData({ ...formData, year_built: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.purchase_date}
              onChangeText={(text) => setFormData({ ...formData, purchase_date: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional information about this home..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomSpacing: {
    height: 40,
  },
}); 