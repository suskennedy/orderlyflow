import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { homeFormSchema, SEWER_TYPES, transformHomeFormData, WATER_SOURCES } from '../../lib/schemas/home/homeFormSchema';
import { googlePlacesService } from '../../lib/services/GooglePlacesService';
import { useHomesStore } from '../../lib/stores/homesStore';
import AddressAutocomplete from '../forms/AddressAutocomplete';
import PhotoManager from '../forms/PhotoManager';
import ScreenHeader from '../layouts/layout/ScreenHeader';

export default function AddHomeScreen() {
  const createHome = useHomesStore(state => state.createHome);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Use input type (before transformation) for the form
  type HomeFormInput = z.input<typeof homeFormSchema>;

  // React Hook Form setup
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
  } = useForm<HomeFormInput>({
    resolver: zodResolver(homeFormSchema) as any,
    defaultValues: {
      name: '',
      address: '',
      bedrooms: '',
      bathrooms: '',
      square_footage: '',
      image_url: '',
      sewer_vs_septic: undefined,
      water_source: undefined,
      water_heater_location: '',
    },
  });

  const formData = watch();

  // Generate a temporary home ID for image uploads
  const tempHomeId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Refs for input fields
  const nameRef = useRef<TextInput>(null);
  const bedroomsRef = useRef<TextInput>(null);
  const bathroomsRef = useRef<TextInput>(null);
  const squareFootageRef = useRef<TextInput>(null);

  const isSubmittingRef = useRef(false);

  const handlePlaceSelect = async (placeId: string) => {
    try {
      const details = await googlePlacesService.getPlaceDetails(placeId);
      if (details) {
        const fullAddress = [details.address, details.city, details.state, details.zip]
          .filter(Boolean)
          .join(', ');
        setValue('address', fullAddress);
        clearErrors('address');
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setValue('image_url', imageUrl);
    clearErrors('image_url');
  };

  const handleImageRemove = () => {
    setValue('image_url', '');
  };

  const onSubmit = async (data: HomeFormInput) => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current || loading) {
      console.log('Submission already in progress, ignoring duplicate click');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Parse the form data through the schema to get the transformed type
      const parsedData = homeFormSchema.parse(data);
      const homeData = transformHomeFormData(parsedData);
      console.log('Creating home with data:', homeData);
      await createHome(homeData);

      showToast(`${data.name} home added successfully!`, 'success');

      // Navigate back after a short delay to ensure toast is visible
      setTimeout(() => {
        router.push('/(home)');
      }, 500);

    } catch (error) {
      console.error('Error creating home:', error);
      showToast('Failed to add home. Please try again.', 'error');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
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
            style={[
              getInputStyle('name'),
              errors.name && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.name}
            onChangeText={text => {
              setValue('name', text);
              if (errors.name) clearErrors('name');
            }}
            placeholder="e.g., Lake House, Main Residence"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => bedroomsRef.current?.focus()}
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.name.message}
            </Text>
          )}

          <AddressAutocomplete
            label="Address"
            value={formData.address || ''}
            placeholder="Start typing your address..."
            onChange={(address) => {
              setValue('address', address);
              if (errors.address) clearErrors('address');
            }}
            onPlaceSelect={handlePlaceSelect}
            isFocused={focusedField === 'address'}
            onFocus={() => handleFocus('address')}
            onBlur={handleBlur}
          />
          {errors.address && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.address.message}
            </Text>
          )}

          <PhotoManager
            label="Home Photo"
            homeId={tempHomeId}
            currentImageUrl={formData.image_url || ''}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
          {errors.image_url && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.image_url.message}
            </Text>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Details</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
              <TextInput
                ref={bedroomsRef}
                style={[
                  getInputStyle('bedrooms'),
                  errors.bedrooms && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.bedrooms !== null && formData.bedrooms !== undefined ? String(formData.bedrooms) : ''}
                onChangeText={text => {
                  setValue('bedrooms', text);
                  if (errors.bedrooms) clearErrors('bedrooms');
                }}
                placeholder="3"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                onFocus={() => handleFocus('bedrooms')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => bathroomsRef.current?.focus()}
              />
              {errors.bedrooms && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.bedrooms.message}
                </Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
              <TextInput
                ref={bathroomsRef}
                style={[
                  getInputStyle('bathrooms'),
                  errors.bathrooms && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.bathrooms !== null && formData.bathrooms !== undefined ? String(formData.bathrooms) : ''}
                onChangeText={text => {
                  setValue('bathrooms', text);
                  if (errors.bathrooms) clearErrors('bathrooms');
                }}
                placeholder="2.5"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                onFocus={() => handleFocus('bathrooms')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => squareFootageRef.current?.focus()}
              />
              {errors.bathrooms && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.bathrooms.message}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Square Footage</Text>
              <TextInput
                ref={squareFootageRef}
                style={[
                  getInputStyle('square_footage'),
                  errors.square_footage && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.square_footage !== null && formData.square_footage !== undefined ? String(formData.square_footage) : ''}
                onChangeText={text => {
                  setValue('square_footage', text);
                  if (errors.square_footage) clearErrors('square_footage');
                }}
                placeholder="2500"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                onFocus={() => handleFocus('square_footage')}
                onBlur={handleBlur}
                returnKeyType="done"
              />
              {errors.square_footage && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.square_footage.message}
                </Text>
              )}
            </View>
          </View>

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
                onPress={() => setValue('sewer_vs_septic', type as any)}
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
                onPress={() => setValue('water_source', src as any)}
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
            value={formData.water_heater_location || ''}
            onChangeText={text => {
              setValue('water_heater_location', text);
              if (errors.water_heater_location) clearErrors('water_heater_location');
            }}
            placeholder="e.g., Basement utility closet, Garage"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('water_heater_location')}
            onBlur={handleBlur}
            returnKeyType="done"
          />
          {errors.water_heater_location && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.water_heater_location.message}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit(onSubmit)}
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
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 5,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    fontFamily: FONTS.body,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    fontFamily: FONTS.body,
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
    fontFamily: FONTS.bodySemiBold,
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
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
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