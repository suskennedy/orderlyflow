import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHomes } from '../../lib/contexts/HomesContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { googlePlacesService, PlaceDetails } from '../../lib/services/GooglePlacesService';
import DatePicker from '../DatePicker';
import AddressAutocomplete from '../forms/AddressAutocomplete';
import FoundationSelector from '../forms/FoundationSelector';
import PhotoManager from '../forms/PhotoManager';
import ScreenHeader from '../layout/ScreenHeader';

export default function AddHomeScreen() {
  const { createHome } = useHomes();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
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

  // Generate a temporary home ID for image uploads
  const tempHomeId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const bedroomsRef = useRef<TextInput>(null);
  const bathroomsRef = useRef<TextInput>(null);
  const squareFootageRef = useRef<TextInput>(null);
  const yearBuiltRef = useRef<TextInput>(null);
  const warrantyRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

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
      Alert.alert('Error', 'Please enter a home name');
      nameRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const homeData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip: formData.zip.trim() || null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        purchase_date: formData.purchase_date || null,
        foundation_type: formData.foundation_type || null,
        warranty_info: formData.warranty_info.trim() || null,
        notes: formData.notes.trim() || null,
        image_url: formData.image_url || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
      };

      await createHome(homeData);
      
      showToast(`${formData.name} home added successfully!`, 'success');
      
      // Navigate back after a short delay to ensure toast is visible
      setTimeout(() => {
        router.push('/(home)');
      }, 500);
      
    } catch (error) {
      console.error('Error creating home:', error);
      showToast('Failed to add home. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getInputStyle = (fieldName: string) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.input,
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Adding Home" showBackButton />
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.loadingIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <Text style={[styles.loadingTitle, { color: colors.text }]}>Creating Your Home</Text>
            <Text style={[styles.loadingSubtitle, { color: colors.textSecondary }]}>
              Please wait while we set up your home profile...
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Add New Home" showBackButton />
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <Text style={[styles.label, { color: colors.text }]}>Home Name *</Text>
          <TextInput
            ref={nameRef}
            style={getInputStyle('name')}
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
            placeholder="e.g., Lake House, Main Residence"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => bedroomsRef.current?.focus()}
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
                onChangeText={text => setFormData({ ...formData, city: text })}
                placeholder="City"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('city')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => bedroomsRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>State</Text>
              <TextInput
                style={getInputStyle('state')}
                value={formData.state}
                onChangeText={text => setFormData({ ...formData, state: text })}
                placeholder="State"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('state')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => bedroomsRef.current?.focus()}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>ZIP Code</Text>
          <TextInput
            style={getInputStyle('zip')}
            value={formData.zip}
            onChangeText={text => setFormData({ ...formData, zip: text })}
            placeholder="12345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            onFocus={() => handleFocus('zip')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => bedroomsRef.current?.focus()}
          />

          <PhotoManager
            label="Home Photo"
            homeId={tempHomeId}
            currentImageUrl={formData.image_url}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            latitude={formData.latitude || undefined}
            longitude={formData.longitude || undefined}
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Details</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
              <TextInput
                ref={bedroomsRef}
                style={getInputStyle('bedrooms')}
                value={formData.bedrooms}
                onChangeText={text => setFormData({ ...formData, bedrooms: text })}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onFocus={() => handleFocus('bedrooms')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => bathroomsRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
              <TextInput
                ref={bathroomsRef}
                style={getInputStyle('bathrooms')}
                value={formData.bathrooms}
                onChangeText={text => setFormData({ ...formData, bathrooms: text })}
                placeholder="2.5"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onFocus={() => handleFocus('bathrooms')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => squareFootageRef.current?.focus()}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Square Footage</Text>
              <TextInput
                ref={squareFootageRef}
                style={getInputStyle('square_footage')}
                value={formData.square_footage}
                onChangeText={text => setFormData({ ...formData, square_footage: text })}
                placeholder="2500"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onFocus={() => handleFocus('square_footage')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => yearBuiltRef.current?.focus()}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Year Built</Text>
              <TextInput
                ref={yearBuiltRef}
                style={getInputStyle('year_built')}
                value={formData.year_built}
                onChangeText={text => setFormData({ ...formData, year_built: text })}
                placeholder="1995"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onFocus={() => handleFocus('year_built')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => warrantyRef.current?.focus()}
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
            ref={warrantyRef}
            style={getInputStyle('warranty_info')}
            value={formData.warranty_info}
            onChangeText={text => setFormData({ ...formData, warranty_info: text })}
            placeholder="Enter warranty details, expiration dates, etc."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            onFocus={() => handleFocus('warranty_info')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => notesRef.current?.focus()}
          />

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={getTextAreaStyle()}
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
            placeholder="Any additional notes about your home..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => handleFocus('notes')}
            onBlur={handleBlur}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons name="home" size={24} color={colors.textInverse} />
            <Text style={[styles.saveButtonText, { color: colors.textInverse }]}>Create Home</Text>
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
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});