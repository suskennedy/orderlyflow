import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
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

const VENDOR_CATEGORIES = [
  'Plumber',
  'Electrician',
  'HVAC',
  'Landscaping',
  'Cleaning',
  'Handyman',
  'Contractor',
  'Painter',
  'Roofer',
  'Flooring',
  'Appliance Repair',
  'Pest Control',
  'Security',
  'Pool Service',
  'Other',
];

export default function AddVendorScreen() {
  const { user } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Contractor',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    notes: '',
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.from('vendors').insert([
        {
          name: formData.name.trim(),
          category: formData.category || null,
          contact_name: formData.contact_name.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          website: formData.website.trim() || null,
          notes: formData.notes.trim() || null,
          user_id: user.id,
        },
      ]);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Refresh dashboard stats
      await fetchDashboardStats();

      Alert.alert('Success', 'Vendor added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', `Failed to add vendor: ${error.message || 'Unknown error'}`);
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
        <Text style={styles.title}>Add New Vendor</Text>
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
            <Text style={styles.label}>Vendor Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., ABC Plumbing Services"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(itemValue) => setFormData({ ...formData, category: itemValue })}
                style={styles.picker}
              >
                <Picker.Item label="Select a category..." value="" />
                {VENDOR_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contact Person</Text>
            <TextInput
              style={styles.input}
              placeholder="John Smith"
              value={formData.contact_name}
              onChangeText={(text) => setFormData({ ...formData, contact_name: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="contact@vendor.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.vendor.com"
              value={formData.website}
              onChangeText={(text) => setFormData({ ...formData, website: text })}
              placeholderTextColor="#9CA3AF"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="123 Business Street, City, State 12345"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Services offered, pricing notes, quality of work, etc..."
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
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  bottomSpacing: {
    height: 120,
  },
}); 