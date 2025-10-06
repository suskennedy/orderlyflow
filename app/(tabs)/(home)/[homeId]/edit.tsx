import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatePicker from '../../../../components/DatePicker';
import AddressAutocomplete from '../../../../components/forms/AddressAutocomplete';
import FoundationSelector from '../../../../components/forms/FoundationSelector';
import PhotoManager from '../../../../components/forms/PhotoManager';
import { useHomes } from '../../../../lib/contexts/HomesContext';
import { useTheme } from '../../../../lib/contexts/ThemeContext';
import { useToast } from '../../../../lib/contexts/ToastContext';
import { googlePlacesService, PlaceDetails } from '../../../../lib/services/GooglePlacesService';

export default function EditHomeScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const { getHomeById, updateHome } = useHomes();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  
  const home = getHomeById(homeId);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  
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
    purchase_date: '' as string | null,
    foundation_type: '',
    warranty_info: '',
    notes: '',
    image_url: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    if (home) {
      setFormData({
        name: home.name || '',
        address: home.address || '',
        city: home.city || '',
        state: home.state || '',
        zip: home.zip || '',
        bedrooms: home.bedrooms?.toString() || '',
        bathrooms: home.bathrooms?.toString() || '',
        square_footage: home.square_footage?.toString() || '',
        year_built: home.year_built?.toString() || '',
        purchase_date: home.purchase_date || '',
        foundation_type: home.foundation_type || '',
        warranty_info: home.warranty_info || '',
        notes: home.notes || '',
        image_url: home.image_url || '',
        latitude: home.latitude,
        longitude: home.longitude,
      });
    }
  }, [home]);

  if (!home) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Home</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Home not found or has been deleted.
          </Text>
        </View>
      </View>
    );
  }

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.textInput,
      { 
        backgroundColor: colors.surface, 
        color: colors.text, 
        borderColor: isFocused ? colors.primary : colors.border,
        borderWidth: isFocused ? 2 : 1,
      }
    ];
  };

  const getTextAreaStyle = () => {
    const isFocused = focusedField === 'notes';
    return [
      styles.textArea,
      { 
        backgroundColor: colors.surface, 
        color: colors.text, 
        borderColor: isFocused ? colors.primary : colors.border,
        borderWidth: isFocused ? 2 : 1,
      }
    ];
  };

  const handlePlaceSelect = async (placeId: string) => {
    try {
      const details = await googlePlacesService.getPlaceDetails(placeId);
      if (details) {
        setPlaceDetails(details);
        setFormData(prev => ({
          ...prev,
          address: details.address,
          city: details.city,
          state: details.state,
          zip: details.zip,
          latitude: details.latitude,
          longitude: details.longitude,
        }));
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Home name is required');
      return;
    }

    setLoading(true);
    try {
      await updateHome(homeId, {
        name: formData.name.trim(),
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip: formData.zip || null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        purchase_date: formData.purchase_date || null,
        foundation_type: formData.foundation_type || null,
        warranty_info: formData.warranty_info || null,
        notes: formData.notes || null,
        image_url: formData.image_url || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      
      showToast('Home updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating home:', error);
      Alert.alert('Error', 'Failed to update home');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard Changes', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Home</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Basic Information */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <Text style={[styles.label, { color: colors.text }]}>Home Name *</Text>
          <TextInput
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., Lake House, Main Residence"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
          />

          <AddressAutocomplete
            label="Address"
            value={formData.address}
            placeholder="Start typing your address..."
            onChange={(address) => setFormData({ ...formData, address })}
            onPlaceSelect={handlePlaceSelect}
            isFocused={focusedField === 'address'}
            onFocus={() => handleFocus('address')}
            onBlur={handleBlur}
          />

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>City</Text>
              <TextInput
                style={getInputStyle('city')}
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('city')}
                onBlur={handleBlur}
                returnKeyType="next"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>State</Text>
              <TextInput
                style={getInputStyle('state')}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="State"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('state')}
                onBlur={handleBlur}
                returnKeyType="next"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>ZIP Code</Text>
          <TextInput
            style={getInputStyle('zip')}
            value={formData.zip}
            onChangeText={(text) => setFormData({ ...formData, zip: text })}
            placeholder="12345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            onFocus={() => handleFocus('zip')}
            onBlur={handleBlur}
            returnKeyType="next"
          />

          <PhotoManager
            label="Home Photo"
            homeId={homeId}
            currentImageUrl={formData.image_url}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            latitude={formData.latitude || undefined}
            longitude={formData.longitude || undefined}
          />

          {/* Property Details */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Details</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
              <TextInput
                style={getInputStyle('bedrooms')}
                value={formData.bedrooms}
                onChangeText={(text) => setFormData({ ...formData, bedrooms: text.replace(/[^0-9]/g, '') })}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('bedrooms')}
                onBlur={handleBlur}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
              <TextInput
                style={getInputStyle('bathrooms')}
                value={formData.bathrooms}
                onChangeText={(text) => setFormData({ ...formData, bathrooms: text.replace(/[^0-9.]/g, '') })}
                placeholder="2.5"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('bathrooms')}
                onBlur={handleBlur}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Square Footage</Text>
              <TextInput
                style={getInputStyle('square_footage')}
                value={formData.square_footage}
                onChangeText={(text) => setFormData({ ...formData, square_footage: text.replace(/[^0-9]/g, '') })}
                placeholder="2500"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('square_footage')}
                onBlur={handleBlur}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Year Built</Text>
              <TextInput
                style={getInputStyle('year_built')}
                value={formData.year_built}
                onChangeText={(text) => setFormData({ ...formData, year_built: text.replace(/[^0-9]/g, '') })}
                placeholder="1995"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('year_built')}
                onBlur={handleBlur}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>

          <FoundationSelector
            label="Foundation Type"
            value={formData.foundation_type}
            onChange={(value) => setFormData({ ...formData, foundation_type: value })}
            isFocused={focusedField === 'foundation_type'}
            onFocus={() => handleFocus('foundation_type')}
            onBlur={handleBlur}
          />

          <DatePicker
            label="Purchase Date"
            value={formData.purchase_date || null}
            placeholder="Select purchase date"
            onChange={(date) => setFormData({ ...formData, purchase_date: date })}
            helperText="When did you purchase this home?"
            isOptional={true}
          />

          <Text style={[styles.label, { color: colors.text }]}>Warranty Information</Text>
          <TextInput
            style={getInputStyle('warranty_info')}
            value={formData.warranty_info}
            onChangeText={(text) => setFormData({ ...formData, warranty_info: text })}
            placeholder="Enter warranty details, expiration dates, etc."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => handleFocus('warranty_info')}
            onBlur={handleBlur}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={getTextAreaStyle()}
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            placeholder="Any additional notes about your home..."
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('notes')}
            onBlur={handleBlur}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            returnKeyType="done"
          />
        </View>
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
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  form: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 