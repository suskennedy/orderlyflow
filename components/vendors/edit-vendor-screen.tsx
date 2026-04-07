import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FormInput from '../../components/auth/FormInput';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { transformVendorFormData, VENDOR_CATEGORIES, VendorFormData, vendorFormSchema } from '../../lib/schemas/vendors/vendorFormSchema';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import { getVendorCategoryInfo } from '../../lib/utils/vendorIcons';

const CATEGORY_MODAL_LIST_MAX = Math.round(Dimensions.get('window').height * 0.55);

function normalizeCategory(raw: string | null | undefined): VendorFormData['category'] {
  if (!raw) return null;
  return (VENDOR_CATEGORIES as readonly string[]).includes(raw) ? (raw as VendorFormData['category']) : null;
}

export default function EditVendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const vendors = useVendorsStore(state => state.vendors);
  const updateVendor = useVendorsStore(state => state.updateVendor);
  const fetchVendors = useVendorsStore(state => state.fetchVendors);

  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema) as any,
  });

  const selectedCategory = watch('category');
  const categoryIcon = getVendorCategoryInfo(selectedCategory ?? undefined);

  useEffect(() => {
    if (id && vendors.length > 0) {
      const foundVendor = vendors.find(v => v.id === id);
      if (foundVendor) {
        reset({
          name: foundVendor.name || '',
          category: normalizeCategory(foundVendor.category),
          phone: foundVendor.phone || '',
          email: foundVendor.email || '',
          notes: foundVendor.notes || '',
        });
      }
    }
  }, [id, vendors, reset]);

  useEffect(() => {
    if (user?.id) fetchVendors(user.id);
  }, [user?.id, fetchVendors]);

  const onSubmit = async (data: VendorFormData) => {
    try {
      setLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const transformedData = transformVendorFormData(data);
      await updateVendor(id as string, transformedData as any);

      Alert.alert('Success', 'Vendor updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating vendor:', error);
      Alert.alert('Error', 'Failed to update vendor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={[colors.primary + '20', 'transparent']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Vendor</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Vendor name *"
                placeholder="e.g. Acme Plumbing"
                value={value || ''}
                onChangeText={onChange}
                error={errors.name?.message}
                icon="business-outline"
              />
            )}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Category (optional)</Text>
          <TouchableOpacity
            style={[styles.dropdownTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.dropdownValue}>
              <Ionicons
                name={categoryIcon.icon as any}
                size={20}
                color={categoryIcon.color}
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {selectedCategory ?? 'Tap to choose — plumber, electrician, etc.'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Phone *"
                placeholder="e.g. +1 234 567 890"
                value={value || ''}
                onChangeText={onChange}
                error={errors.phone?.message}
                keyboardType="phone-pad"
                icon="call-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Email (optional)"
                placeholder="e.g. contact@acme.com"
                value={value || ''}
                onChangeText={onChange}
                error={errors.email?.message}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Notes (optional)"
                placeholder="Anything else to remember…"
                value={value || ''}
                onChangeText={onChange}
                error={errors.notes?.message}
                multiline
                numberOfLines={4}
                icon="document-text-outline"
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={{ maxHeight: CATEGORY_MODAL_LIST_MAX }}
              contentContainerStyle={styles.modalListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <TouchableOpacity
                style={[styles.modalItem, selectedCategory == null && { backgroundColor: colors.primaryLight }]}
                onPress={() => {
                  setValue('category', null);
                  setShowCategoryModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name="remove-circle-outline" size={20} color={colors.textSecondary} style={{ marginRight: 15 }} />
                <Text style={[styles.modalItemText, { color: colors.text }, selectedCategory == null && { fontWeight: 'bold' }]}>
                  No category
                </Text>
                {selectedCategory == null && <Ionicons name="checkmark" size={20} color={colors.primary} />}
              </TouchableOpacity>
              {VENDOR_CATEGORIES.map((cat) => {
                const { icon, color } = getVendorCategoryInfo(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalItem, selectedCategory === cat && { backgroundColor: color + '10' }]}
                    onPress={() => {
                      setValue('category', cat as VendorFormData['category']);
                      setShowCategoryModal(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons name={icon as any} size={20} color={color} style={{ marginRight: 15 }} />
                    <Text style={[styles.modalItemText, { color: colors.text }, selectedCategory === cat && { fontWeight: 'bold', color }]}>
                      {cat}
                    </Text>
                    {selectedCategory === cat && <Ionicons name="checkmark" size={20} color={color} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', fontFamily: 'CormorantGaramond_700Bold' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  formSection: { gap: 0 },
  label: { fontSize: 14, fontFamily: 'Jost_600SemiBold', marginBottom: 8 },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  dropdownValue: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dropdownText: { fontSize: 16, fontFamily: 'Jost_400Regular', flex: 1 },
  submitButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '88%', padding: 20, paddingBottom: 28 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalListContent: { paddingBottom: 8 },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 5 },
  modalItemText: { flex: 1, fontSize: 16, fontFamily: 'Jost_400Regular' }
});
