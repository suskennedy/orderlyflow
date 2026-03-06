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
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { SEWER_TYPES, WATER_SOURCES } from '../../lib/schemas/home/homeFormSchema';
import { googlePlacesService, PlaceDetails } from '../../lib/services/GooglePlacesService';
import { useHomesStore } from '../../lib/stores/homesStore';
import AddressAutocomplete from '../forms/AddressAutocomplete';
import PhotoManager from '../forms/PhotoManager';

export default function EditHomeScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const getHomeById = useHomesStore(state => state.getHomeById);
  const updateHome = useHomesStore(state => state.updateHome);
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
    bedrooms: '',
    bathrooms: '',
    square_footage: '',
    sewer_vs_septic: '',
    water_source: '',
    water_heater_location: '',
    image_url: '',
  });

  useEffect(() => {
    if (home) {
      setFormData({
        name: home.name || '',
        address: home.address || '',
        bedrooms: home.bedrooms?.toString() || '',
        bathrooms: home.bathrooms?.toString() || '',
        square_footage: home.square_footage?.toString() || '',
        sewer_vs_septic: home.sewer_vs_septic || '',
        water_source: home.water_source || '',
        water_heater_location: home.water_heater_location || '',
        image_url: home.image_url || '',
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
          address: [details.address, details.city, details.state, details.zip].filter(Boolean).join(', '),
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
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : null,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : null,
        sewer_vs_septic: formData.sewer_vs_septic || null,
        water_source: formData.water_source || null,
        water_heater_location: formData.water_heater_location || null,
        image_url: formData.image_url || null,
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

          <PhotoManager
            label="Home Photo"
            homeId={homeId}
            currentImageUrl={formData.image_url}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
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
            returnKeyType="done"
          />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Utilities & Systems</Text>

          <Text style={[styles.label, { color: colors.text }]}>Sewer Type</Text>
          <View style={styles.segmentedRow}>
            {SEWER_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segmentedButton,
                  {
                    backgroundColor: formData.sewer_vs_septic === type ? colors.primary : colors.surface,
                    borderColor: formData.sewer_vs_septic === type ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, sewer_vs_septic: type })}
              >
                <Ionicons
                  name={type === 'sewer' ? 'water-outline' : 'leaf-outline'}
                  size={18}
                  color={formData.sewer_vs_septic === type ? colors.textInverse : colors.text}
                />
                <Text
                  style={[
                    styles.segmentedButtonText,
                    { color: formData.sewer_vs_septic === type ? colors.textInverse : colors.text },
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Water Source</Text>
          <View style={styles.segmentedRow}>
            {WATER_SOURCES.map((src) => (
              <TouchableOpacity
                key={src}
                style={[
                  styles.segmentedButton,
                  {
                    backgroundColor: formData.water_source === src ? colors.primary : colors.surface,
                    borderColor: formData.water_source === src ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFormData({ ...formData, water_source: src })}
              >
                <Ionicons
                  name={src === 'city' ? 'business-outline' : 'water-outline'}
                  size={18}
                  color={formData.water_source === src ? colors.textInverse : colors.text}
                />
                <Text
                  style={[
                    styles.segmentedButtonText,
                    { color: formData.water_source === src ? colors.textInverse : colors.text },
                  ]}
                >
                  {src === 'city' ? 'City Water' : 'Well Water'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Water Heater Location</Text>
          <TextInput
            style={getInputStyle('water_heater_location')}
            value={formData.water_heater_location}
            onChangeText={(text) => setFormData({ ...formData, water_heater_location: text })}
            placeholder="e.g., Basement utility closet"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => handleFocus('water_heater_location')}
            onBlur={handleBlur}
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
  segmentedRow: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  segmentedButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
