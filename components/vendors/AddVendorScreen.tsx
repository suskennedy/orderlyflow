import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
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
import { PRIORITY_OPTIONS, transformVendorFormData, VENDOR_CATEGORIES, VendorFormData, vendorFormSchema } from '../../lib/schemas/vendors/vendorFormSchema';
import { useVendorsStore } from '../../lib/stores/vendorsStore';
import { getVendorCategoryInfo } from '../../lib/utils/vendorIcons';

export default function AddVendorScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const addVendor = useVendorsStore(state => state.addVendor);
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema) as any,
    defaultValues: {
      name: '',
      category: 'Appliances' as any,
      contact_name: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      priority: 'Primary',
      notes: '',
    }
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  // Pre-fill form with contact data if provided
  useEffect(() => {
    if (params.name) setValue('name', String(params.name));
    if (params.contact_name) setValue('contact_name', String(params.contact_name));
    if (params.phone) setValue('phone', String(params.phone));
    if (params.email) setValue('email', String(params.email));
    if (params.company) setValue('name', String(params.company));
  }, [params, setValue]);

  const onSubmit = async (data: VendorFormData) => {
    try {
      setLoading(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const transformedData = transformVendorFormData(data);
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      await addVendor(user.id, transformedData as any);

      Alert.alert('Success', `${data.name} added to your vendors!`, [
        { text: 'Great', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', 'Failed to add vendor. Please try again.');
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Vendor</Text>
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
                label="Vendor or Company Name *"
                placeholder="e.g. Acme Plumbing"
                value={value || ''}
                onChangeText={onChange}
                error={errors.name?.message}
                icon="business-outline"
              />
            )}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Category *</Text>
          <TouchableOpacity
            style={[styles.dropdownTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.dropdownValue}>
              <Ionicons
                name={getVendorCategoryInfo(selectedCategory).icon as any}
                size={20}
                color={getVendorCategoryInfo(selectedCategory).color}
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.dropdownText, { color: colors.text }]}>{selectedCategory}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={{ marginTop: 20 }}>
            <Controller
              control={control}
              name="contact_name"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Contact Person"
                  placeholder="e.g. John Doe"
                  value={value || ''}
                  onChangeText={onChange}
                  icon="person-outline"
                />
              )}
            />
          </View>

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Phone Number"
                placeholder="e.g. +1 234 567 890"
                value={value || ''}
                onChangeText={onChange}
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
                label="Email Address"
                placeholder="e.g. contact@acme.com"
                value={value || ''}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="website"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Website"
                placeholder="e.g. https://acme.com"
                value={value || ''}
                onChangeText={onChange}
                keyboardType="url"
                autoCapitalize="none"
                icon="globe-outline"
              />
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Address"
                placeholder="Enter full address..."
                value={value || ''}
                onChangeText={onChange}
                multiline
                numberOfLines={2}
                icon="location-outline"
              />
            )}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
          <TouchableOpacity
            style={[styles.dropdownTrigger, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowPriorityModal(true)}
          >
            <View style={styles.dropdownValue}>
              <Ionicons name="star-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>{selectedPriority}</Text>
            </View>
            <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={{ marginTop: 20 }}>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <FormInput
                  label="Notes"
                  placeholder="Any extra info about this vendor..."
                  value={value || ''}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={4}
                  icon="document-text-outline"
                />
              )}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Saving...' : 'Add Vendor'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {VENDOR_CATEGORIES.map((cat) => {
                const { icon, color } = getVendorCategoryInfo(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalItem, selectedCategory === cat && { backgroundColor: color + '10' }]}
                    onPress={() => {
                      setValue('category', cat as any);
                      setShowCategoryModal(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Ionicons name={icon as any} size={20} color={color} style={{ marginRight: 15 }} />
                    <Text style={[styles.modalItemText, { color: colors.text }, selectedCategory === cat && { fontWeight: 'bold', color: color }]}>
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

      {/* Priority Modal */}
      <Modal visible={showPriorityModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '40%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Priority</Text>
              <TouchableOpacity onPress={() => setShowPriorityModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 10 }}>
              {PRIORITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.modalItem}
                  onPress={() => {
                    setValue('priority', opt as any);
                    setShowPriorityModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, { color: colors.text }, selectedPriority === opt && { fontWeight: 'bold', color: colors.primary }]}>
                    {opt}
                  </Text>
                  {selectedPriority === opt && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
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
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  dropdownValue: { flexDirection: 'row', alignItems: 'center' },
  dropdownText: { fontSize: 16, fontFamily: 'Jost_400Regular' },
  submitButton: { padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 30, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalList: { flex: 1 },
  modalItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 5 },
  modalItemText: { flex: 1, fontSize: 16, fontFamily: 'Jost_400Regular' }
});