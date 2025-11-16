import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useToast } from '../../lib/contexts/ToastContext';
import { homeFormSchema, transformHomeFormData } from '../../lib/schemas/home/homeFormSchema';
import { googlePlacesService } from '../../lib/services/GooglePlacesService';
import { useHomesStore } from '../../lib/stores/homesStore';
import DatePicker from '../DatePicker';
import AddressAutocomplete from '../forms/AddressAutocomplete';
import FoundationSelector from '../forms/FoundationSelector';
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
      city: '',
      state: '',
      zip: '',
      bedrooms: '',
      bathrooms: '',
      square_footage: '',
      year_built: '',
      purchase_date: '',
      foundation_type: undefined,
      warranty_info: '',
      notes: '',
      image_url: '',
      latitude: undefined,
      longitude: undefined,
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
  const yearBuiltRef = useRef<TextInput>(null);
  const warrantyRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const isSubmittingRef = useRef(false);

  const handlePlaceSelect = async (placeId: string) => {
    try {
      const details = await googlePlacesService.getPlaceDetails(placeId);
      if (details) {
        setValue('address', details.address);
        setValue('city', details.city);
        setValue('state', details.state);
        setValue('zip', details.zip);
        setValue('latitude', details.latitude);
        setValue('longitude', details.longitude);
        clearErrors(['address', 'city', 'state', 'zip']);
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
            placeholderTextColor={colors.textSecondary}
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

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>City</Text>
              <TextInput
                style={[
                  getInputStyle('city'),
                  errors.city && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.city || ''}
                onChangeText={text => {
                  setValue('city', text);
                  if (errors.city) clearErrors('city');
                }}
                placeholder="City"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('city')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => bedroomsRef.current?.focus()}
              />
              {errors.city && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.city.message}
                </Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>State</Text>
              <TextInput
                style={[
                  getInputStyle('state'),
                  errors.state && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.state || ''}
                onChangeText={text => {
                  setValue('state', text);
                  if (errors.state) clearErrors('state');
                }}
                placeholder="State"
                placeholderTextColor={colors.textSecondary}
                onFocus={() => handleFocus('state')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => bedroomsRef.current?.focus()}
              />
              {errors.state && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.state.message}
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>ZIP Code</Text>
          <TextInput
            style={[
              getInputStyle('zip'),
              errors.zip && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.zip || ''}
            onChangeText={text => {
              setValue('zip', text);
              if (errors.zip) clearErrors('zip');
            }}
            placeholder="12345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            onFocus={() => handleFocus('zip')}
            onBlur={handleBlur}
            returnKeyType="next"
            onSubmitEditing={() => bedroomsRef.current?.focus()}
          />
          {errors.zip && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.zip.message}
            </Text>
          )}

          <PhotoManager
            label="Home Photo"
            homeId={tempHomeId}
            currentImageUrl={formData.image_url || ''}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
            latitude={formData.latitude || undefined}
            longitude={formData.longitude || undefined}
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
                value={formData.bedrooms || ''}
                onChangeText={text => {
                  setValue('bedrooms', text);
                  if (errors.bedrooms) clearErrors('bedrooms');
                }}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
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
                value={formData.bathrooms || ''}
                onChangeText={text => {
                  setValue('bathrooms', text);
                  if (errors.bathrooms) clearErrors('bathrooms');
                }}
                placeholder="2.5"
                placeholderTextColor={colors.textSecondary}
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
                value={formData.square_footage || ''}
                onChangeText={text => {
                  setValue('square_footage', text);
                  if (errors.square_footage) clearErrors('square_footage');
                }}
                placeholder="2500"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onFocus={() => handleFocus('square_footage')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => yearBuiltRef.current?.focus()}
              />
              {errors.square_footage && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.square_footage.message}
                </Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Year Built</Text>
              <TextInput
                ref={yearBuiltRef}
                style={[
                  getInputStyle('year_built'),
                  errors.year_built && { borderColor: colors.error, borderWidth: 2 }
                ]}
                value={formData.year_built || ''}
                onChangeText={text => {
                  setValue('year_built', text);
                  if (errors.year_built) clearErrors('year_built');
                }}
                placeholder="1995"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onFocus={() => handleFocus('year_built')}
                onBlur={handleBlur}
                returnKeyType="next"
                onSubmitEditing={() => warrantyRef.current?.focus()}
              />
              {errors.year_built && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.year_built.message}
                </Text>
              )}
            </View>
          </View>

          <FoundationSelector
            label="Foundation Type"
            value={formData.foundation_type || ''}
            onChange={(value) => {
              setValue('foundation_type', value as any);
              if (errors.foundation_type) clearErrors('foundation_type');
            }}
            isFocused={focusedField === 'foundation_type'}
            onFocus={() => handleFocus('foundation_type')}
            onBlur={handleBlur}
          />
          {errors.foundation_type && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.foundation_type.message}
            </Text>
          )}

          <DatePicker
            label="Purchase Date"
            value={formData.purchase_date || null}
            placeholder="Select purchase date"
            onChange={(date) => {
              setValue('purchase_date', date || '');
              if (errors.purchase_date) clearErrors('purchase_date');
            }}
            helperText="When did you purchase this home?"
            isOptional={true}
          />
          {errors.purchase_date && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.purchase_date.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Warranty Information</Text>
          <TextInput
            ref={warrantyRef}
            style={[
              getInputStyle('warranty_info'),
              errors.warranty_info && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.warranty_info || ''}
            onChangeText={text => {
              setValue('warranty_info', text);
              if (errors.warranty_info) clearErrors('warranty_info');
            }}
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
          {errors.warranty_info && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.warranty_info.message}
            </Text>
          )}

          <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
          <TextInput
            ref={notesRef}
            style={[
              getTextAreaStyle(),
              errors.notes && { borderColor: colors.error, borderWidth: 2 }
            ]}
            value={formData.notes || ''}
            onChangeText={text => {
              setValue('notes', text);
              if (errors.notes) clearErrors('notes');
            }}
            placeholder="Any additional notes about your home..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => handleFocus('notes')}
            onBlur={handleBlur}
            returnKeyType="done"
          />
          {errors.notes && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.notes.message}
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
  errorText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});