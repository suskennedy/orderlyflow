import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import DatePicker from '../../../components/DatePicker';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useDashboard } from '../../../lib/hooks/useDashboard';
import { supabase } from '../../../lib/supabase';

const INVENTORY_CATEGORIES = [
  'Appliances',
  'Filters',
  'Light Fixtures',
  'Paint Colors',
  'Tiles',
  'Cabinets',
  'Tools',
  'Hardware',
  'Cleaning Supplies',
  'Maintenance Items',
  'Seasonal Items',
  'Emergency Supplies',
  'Other',
];

interface Home {
  id: string;
  name: string;
}

export default function AddInventoryScreen() {
  const { user } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [homes, setHomes] = useState<Home[]>([]);
  const [homesLoading, setHomesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    serial_number: '',
    location: '',
    quantity: '',
    purchase_date: '',
    purchase_cost: '',
    warranty_expiration: '',
    home_id: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchHomes();
    }
  }, [user?.id]);

  const fetchHomes = async () => {
    try {
      setHomesLoading(true);
      
      if (!user?.id) {
        console.log('No user ID available');
        return;
      }
      
      console.log('Fetching homes for user:', user.id);
      
      const { data, error } = await supabase
        .from('homes')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched homes:', data);
      setHomes(data || []);
    } catch (error) {
      console.error('Error fetching homes:', error);
      Alert.alert('Error', 'Failed to load homes. Please try again.');
    } finally {
      setHomesLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('appliances').insert([
        {
          name: formData.name,
          brand: formData.brand || null,
          model: formData.model || null,
          serial_number: formData.serial_number || null,
          location: formData.location || null,
          purchase_date: formData.purchase_date || null,
          warranty_expiration: formData.warranty_expiration || null,
          home_id: formData.home_id || null,
          notes: formData.notes || null,
        },
      ]);

      if (error) throw error;

      // Refresh dashboard stats
      await fetchDashboardStats();

      Alert.alert('Success', 'Inventory item added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      Alert.alert('Error', 'Failed to add inventory item');
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
        <Text style={styles.title}>Add Inventory Item</Text>
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
          <Text style={styles.sectionTitle}>Item Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kitchen Refrigerator, Air Filter"
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
                {INVENTORY_CATEGORIES.map((category) => (
                  <Picker.Item key={category} label={category} value={category} />
                ))}
              </Picker>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Brand</Text>
              <TextInput
                style={styles.input}
                placeholder="Samsung"
                value={formData.brand}
                onChangeText={(text) => setFormData({ ...formData, brand: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Model</Text>
              <TextInput
                style={styles.input}
                placeholder="RF28R7351SG"
                value={formData.model}
                onChangeText={(text) => setFormData({ ...formData, model: text })}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Serial Number</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC123456789"
              value={formData.serial_number}
              onChangeText={(text) => setFormData({ ...formData, serial_number: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Assignment</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kitchen, Basement, Garage"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign to Home</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.home_id}
                onValueChange={(itemValue) => setFormData({ ...formData, home_id: itemValue })}
                style={styles.picker}
                enabled={!homesLoading}
              >
                <Picker.Item 
                  label={homesLoading ? "Loading homes..." : homes.length === 0 ? "No homes found - Add a home first" : "Select a home..."} 
                  value="" 
                />
                {homes.map((home) => (
                  <Picker.Item key={home.id} label={home.name} value={home.id} />
                ))}
              </Picker>
            </View>
            {homes.length === 0 && !homesLoading && (
              <TouchableOpacity 
                style={styles.addHomeButton}
                onPress={() => router.push('/(dashboard)/homes/add')}
              >
                <Ionicons name="add-circle" size={16} color="#4F46E5" />
                <Text style={styles.addHomeButtonText}>Add your first home</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="1"
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Information</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <DatePicker
                label="Purchase Date"
                value={formData.purchase_date}
                placeholder="Select date"
                onChange={(dateString) => setFormData({ ...formData, purchase_date: dateString as string})}
                isOptional={true}
                testID="purchase-date-picker"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Purchase Cost</Text>
              <TextInput
                style={styles.input}
                placeholder="$1,299.99"
                value={formData.purchase_cost}
                onChangeText={(text) => setFormData({ ...formData, purchase_cost: text })}
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Warranty Expiration</Text>
            <DatePicker
              label="Warranty Expiration"
              value={formData.warranty_expiration}
              placeholder="Select date"
              onChange={(dateString) => setFormData({ ...formData, warranty_expiration: dateString as string })}
              helperText="When the warranty expires"
              isOptional={true}
              testID="warranty-date-picker"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Installation notes, maintenance schedule, manual location, etc..."
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomSpacing: {
    height: 120,
  },
  addHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addHomeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
});