import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
import { z } from 'zod';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { FONTS } from '../../lib/typography';
import { useToast } from '../../lib/contexts/ToastContext';
import { homeFormSchema, SEWER_TYPES, transformHomeFormData, WATER_SOURCES } from '../../lib/schemas/home/homeFormSchema';
import { googlePlacesService, PlaceDetails } from '../../lib/services/GooglePlacesService';
import { useHomesStore } from '../../lib/stores/homesStore';
import AddressAutocomplete from '../forms/AddressAutocomplete';
import PhotoManager from '../forms/PhotoManager';

type HomeFormInput = z.input<typeof homeFormSchema>;

export default function EditHomeScreen() {
  const { homeId } = useLocalSearchParams<{ homeId: string }>();
  const getHomeById = useHomesStore(state => state.getHomeById);
  const updateHome = useHomesStore(state => state.updateHome);
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const hasLoadedRef = useRef(false);

  const home = getHomeById(homeId);

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm<HomeFormInput>({
    resolver: zodResolver(homeFormSchema) as any,
    defaultValues: {
      name: '',
      address: '',
      bedrooms: '',
      bathrooms: '',
      square_footage: '',
      sewer_vs_septic: undefined,
      water_source: undefined,
      water_heater_location: '',
      image_url: '',
    },
  });

  const formData = watch();

  useEffect(() => {
    if (home && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      reset({
        name: home.name || '',
        address: home.address || '',
        bedrooms: home.bedrooms?.toString() || '',
        bathrooms: home.bathrooms?.toString() || '',
        square_footage: home.square_footage?.toString() || '',
        sewer_vs_septic: (home.sewer_vs_septic as any) || undefined,
        water_source: (home.water_source as any) || undefined,
        water_heater_location: home.water_heater_location || '',
        image_url: home.image_url || '',
      });
    }
  }, [home, reset]);

  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  if (!home) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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

  const handleFocus = (fieldName: string) => setFocusedField(fieldName);
  const handleBlur = () => setFocusedField(null);

  const getInputStyle = (fieldName: string, hasError?: boolean) => {
    const isFocused = focusedField === fieldName;
    return [
      styles.textInput,
      {
        backgroundColor: colors.surface,
        color: colors.text,
        borderColor: hasError ? colors.error : isFocused ? colors.primary : colors.border,
        borderWidth: hasError || isFocused ? 2 : 1,
      }
    ];
  };

  const handlePlaceSelect = async (placeId: string) => {
    try {
      const details: PlaceDetails | null = await googlePlacesService.getPlaceDetails(placeId);
      if (details) {
        setValue('address', [details.address, details.city, details.state, details.zip].filter(Boolean).join(', '));
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
    try {
      const parsedData = homeFormSchema.parse(data);
      const homeData = transformHomeFormData(parsedData);
      await updateHome(homeId, homeData);
      showToast('Home updated successfully!', 'success');
      router.back();
    } catch (error) {
      console.error('Error updating home:', error);
      showToast('Failed to update home', 'error');
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
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Home</Text>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {isSubmitting ? 'Saving...' : 'Save'}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

          <Text style={[styles.label, { color: colors.text }]}>Home Name *</Text>
          <TextInput
            style={getInputStyle('name', !!errors.name)}
            value={formData.name || ''}
            onChangeText={text => { setValue('name', text); if (errors.name) clearErrors('name'); }}
            placeholder="e.g., Lake House, Main Residence"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('name')}
            onBlur={handleBlur}
            returnKeyType="next"
          />
          {errors.name && (
            <Text style={[styles.fieldError, { color: colors.error }]}>{errors.name.message}</Text>
          )}

          <AddressAutocomplete
            label="Address"
            value={formData.address || ''}
            placeholder="Start typing your address..."
            onChange={address => { setValue('address', address); if (errors.address) clearErrors('address'); }}
            onPlaceSelect={handlePlaceSelect}
            isFocused={focusedField === 'address'}
            onFocus={() => handleFocus('address')}
            onBlur={handleBlur}
          />
          {errors.address && (
            <Text style={[styles.fieldError, { color: colors.error }]}>{errors.address.message}</Text>
          )}

          <PhotoManager
            label="Home Photo"
            homeId={homeId}
            currentImageUrl={formData.image_url || ''}
            onImageUpload={handleImageUpload}
            onImageRemove={handleImageRemove}
          />
          {errors.image_url && (
            <Text style={[styles.fieldError, { color: colors.error }]}>{errors.image_url.message}</Text>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Details</Text>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
              <TextInput
                style={getInputStyle('bedrooms', !!errors.bedrooms)}
                value={formData.bedrooms !== null && formData.bedrooms !== undefined ? String(formData.bedrooms) : ''}
                onChangeText={text => { setValue('bedrooms', text.replace(/[^0-9]/g, '')); if (errors.bedrooms) clearErrors('bedrooms'); }}
                placeholder="3"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                onFocus={() => handleFocus('bedrooms')}
                onBlur={handleBlur}
              />
              {errors.bedrooms && (
                <Text style={[styles.fieldError, { color: colors.error }]}>{errors.bedrooms.message}</Text>
              )}
            </View>
            <View style={styles.halfWidth}>
              <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
              <TextInput
                style={getInputStyle('bathrooms', !!errors.bathrooms)}
                value={formData.bathrooms !== null && formData.bathrooms !== undefined ? String(formData.bathrooms) : ''}
                onChangeText={text => { setValue('bathrooms', text.replace(/[^0-9.]/g, '')); if (errors.bathrooms) clearErrors('bathrooms'); }}
                placeholder="2.5"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
                onFocus={() => handleFocus('bathrooms')}
                onBlur={handleBlur}
              />
              {errors.bathrooms && (
                <Text style={[styles.fieldError, { color: colors.error }]}>{errors.bathrooms.message}</Text>
              )}
            </View>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Square Footage</Text>
          <TextInput
            style={getInputStyle('square_footage', !!errors.square_footage)}
            value={formData.square_footage !== null && formData.square_footage !== undefined ? String(formData.square_footage) : ''}
            onChangeText={text => { setValue('square_footage', text.replace(/[^0-9]/g, '')); if (errors.square_footage) clearErrors('square_footage'); }}
            placeholder="2500"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
            onFocus={() => handleFocus('square_footage')}
            onBlur={handleBlur}
          />
          {errors.square_footage && (
            <Text style={[styles.fieldError, { color: colors.error }]}>{errors.square_footage.message}</Text>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Utilities & Systems</Text>

          <Text style={[styles.label, { color: colors.text }]}>Sewer Type</Text>
          <View style={styles.segmentedRow}>
            {SEWER_TYPES.map(type => (
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
                <Text style={[styles.segmentedButtonText, { color: formData.sewer_vs_septic === type ? colors.textInverse : colors.text }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Water Source</Text>
          <View style={styles.segmentedRow}>
            {WATER_SOURCES.map(src => (
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
                <Text style={[styles.segmentedButtonText, { color: formData.water_source === src ? colors.textInverse : colors.text }]}>
                  {src === 'city' ? 'City Water' : 'Well Water'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text }]}>Water Heater Location</Text>
          <TextInput
            style={getInputStyle('water_heater_location', !!errors.water_heater_location)}
            value={formData.water_heater_location || ''}
            onChangeText={text => { setValue('water_heater_location', text); if (errors.water_heater_location) clearErrors('water_heater_location'); }}
            placeholder="e.g., Basement utility closet"
            placeholderTextColor={colors.textTertiary}
            onFocus={() => handleFocus('water_heater_location')}
            onBlur={handleBlur}
            returnKeyType="done"
          />
          {errors.water_heater_location && (
            <Text style={[styles.fieldError, { color: colors.error }]}>{errors.water_heater_location.message}</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: { padding: 8, borderRadius: 8 },
  headerTitle: { fontFamily: FONTS.heading, fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, fontWeight: '600' },
  headerRight: { width: 60 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  form: { gap: 20 },
  sectionTitle: { fontFamily: FONTS.heading, fontSize: 20, fontWeight: '700', marginTop: 10, marginBottom: 5 },
  label: { fontFamily: FONTS.bodySemiBold, fontSize: 16, fontWeight: '600', marginBottom: 8 },
  textInput: { fontFamily: FONTS.body, borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  fieldError: { fontFamily: FONTS.body, fontSize: 12, marginTop: 4, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontFamily: FONTS.body, fontSize: 16, textAlign: 'center' },
  segmentedRow: { flexDirection: 'row', gap: 12 },
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
  segmentedButtonText: { fontFamily: FONTS.bodySemiBold, fontSize: 15, fontWeight: '600' },
});
