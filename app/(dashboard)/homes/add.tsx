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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from '../../../components/DatePicker';
import { useHomes } from '../../../lib/contexts/HomesContext';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import { useDashboard } from '../../../lib/hooks/useDashboard';
import { supabase } from '../../../lib/supabase';

export default function AddHomeScreen() {
  const { user } = useAuth();
  const { fetchDashboardStats } = useDashboard();
  const { addHome } = useHomes();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
      // Create the home object
      const newHome = {
        id: Date.now().toString(), // Temporary ID, will be replaced by Supabase
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
      };

      // Immediately add to local state for UI update
      addHome(newHome);

      // Then save to Supabase
      const { data, error } = await supabase.from('homes').insert([
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
      ]).select();

      if (error) throw error;

      // Refresh dashboard stats
      await fetchDashboardStats();

      // Navigate back - note we don't need to alert since UI already updated
      router.back();
    } catch (error) {
      console.error('Error adding home:', error);
      Alert.alert('Error', 'Failed to add home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { 
        backgroundColor: colors.surface,
        borderBottomColor: colors.border,
        paddingTop: Platform.OS === 'ios' ? insets.top + 16 : 16
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Add New Home</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Home Name *</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="e.g., Main House, Vacation Home"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Address</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="123 Main Street"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>City</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="City"
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>State</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="CA"
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholderTextColor={colors.textTertiary}
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>ZIP Code</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="12345"
                value={formData.zip}
                onChangeText={(text) => setFormData({ ...formData, zip: text })}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Details</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bedrooms</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="3"
                value={formData.bedrooms}
                onChangeText={(text) => setFormData({ ...formData, bedrooms: text })}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Bathrooms</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="2.5"
                value={formData.bathrooms}
                onChangeText={(text) => setFormData({ ...formData, bathrooms: text })}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Square Footage</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="2000"
                value={formData.square_footage}
                onChangeText={(text) => setFormData({ ...formData, square_footage: text })}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Year Built</Text>
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  color: colors.text
                }]}
                placeholder="1995"
                value={formData.year_built}
                onChangeText={(text) => setFormData({ ...formData, year_built: text })}
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <DatePicker
              label="Purchase Date"
              value={formData.purchase_date}
              placeholder="Select purchase date"
              onChange={(dateString) => setFormData({ ...formData, purchase_date: dateString as string})}
              isOptional={true}
              testID="purchase-date-picker"
              helperText="When you purchased this property"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Notes</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, styles.textArea, { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text
              }]}
              placeholder="Any additional information about this home..."
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholderTextColor={colors.textTertiary}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
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
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
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