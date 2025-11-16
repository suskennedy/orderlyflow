import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useAuth } from '../../lib/hooks/useAuth';
import { PRIORITY_OPTIONS, transformVendorFormData, VENDOR_CATEGORIES, VendorFormData, vendorFormSchema } from '../../lib/schemas/vendors/vendorFormSchema';
import { useVendorsStore } from '../../lib/stores/vendorsStore';

export default function AddVendorScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const addVendor = useVendorsStore(state => state.addVendor);
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [dropdownTitle, setDropdownTitle] = useState('');

  const { 
    handleSubmit, 
    watch, 
    setValue, 
    clearErrors, 
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

  const formData = watch();

  // Pre-fill form with contact data if provided
  useEffect(() => {
    if (params.name) {
      setValue('name', String(params.name));
    }
    if (params.contact_name) {
      setValue('contact_name', String(params.contact_name));
    }
    if (params.phone) {
      setValue('phone', String(params.phone));
    }
    if (params.email) {
      setValue('email', String(params.email));
    }
    if (params.company) {
      setValue('name', String(params.company));
    }
  }, [params, setValue]);

  const openDropdown = (type: string, items: string[], title: string) => {
    setActiveDropdown(type);
    setDropdownItems(items);
    setDropdownTitle(title);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const handleDropdownSelect = (value: string) => {
    switch (activeDropdown) {
      case 'category':
        setValue('category', value as any);
        if (errors.category) clearErrors('category');
        break;
      case 'priority':
        setValue('priority', value as any);
        if (errors.priority) clearErrors('priority');
        break;
    }
    closeDropdown();
  };

  const onSubmit = async (data: VendorFormData) => {
    try {
      setLoading(true);

      const transformedData = transformVendorFormData(data);
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      await addVendor(user.id, transformedData as any);
      
      Alert.alert('Success', 'Vendor added successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding vendor:', error);
      Alert.alert('Error', 'Failed to add vendor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDropdownButton = (
    selectedValue: string,
    onPress: () => void,
    placeholder: string
  ) => (
    <TouchableOpacity
      style={[styles.dropdownButton, { 
        backgroundColor: colors.background,
        borderColor: colors.border 
      }]}
      onPress={onPress}
    >
      <Text style={[styles.dropdownText, { color: selectedValue ? colors.text : colors.textSecondary }]}>
        {selectedValue || placeholder}
      </Text>
      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  const getSelectedValue = () => {
    switch (activeDropdown) {
      case 'category':
        return formData.category;
      case 'priority':
        return formData.priority;
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Vendor</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Vendor Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Vendor Name *</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.name ? colors.error : colors.border,
              borderWidth: errors.name ? 2 : 1
            }]}
            placeholder="Enter vendor name"
            placeholderTextColor={colors.textSecondary}
            value={formData.name}
            onChangeText={text => {
              setValue('name', text);
              if (errors.name) clearErrors('name');
            }}
            maxLength={255}
          />
          {errors.name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.name.message}
            </Text>
          )}
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
          {renderDropdownButton(
            formData.category,
            () => openDropdown('category', VENDOR_CATEGORIES as unknown as string[], 'Select category'),
            'Select category'
          )}
          {errors.category && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.category.message}
            </Text>
          )}
        </View>

        {/* Contact Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.contact_name ? colors.error : colors.border,
              borderWidth: errors.contact_name ? 2 : 1
            }]}
            placeholder="Enter contact person name"
            placeholderTextColor={colors.textSecondary}
            value={formData.contact_name}
            onChangeText={text => {
              setValue('contact_name', text);
              if (errors.contact_name) clearErrors('contact_name');
            }}
            maxLength={255}
          />
          {errors.contact_name && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.contact_name.message}
            </Text>
          )}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.phone ? colors.error : colors.border,
              borderWidth: errors.phone ? 2 : 1
            }]}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textSecondary}
            value={formData.phone}
            onChangeText={text => {
              setValue('phone', text);
              if (errors.phone) clearErrors('phone');
            }}
            keyboardType="phone-pad"
            maxLength={20}
          />
          {errors.phone && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.phone.message}
            </Text>
          )}
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.email ? colors.error : colors.border,
              borderWidth: errors.email ? 2 : 1
            }]}
            placeholder="Enter email address"
            placeholderTextColor={colors.textSecondary}
            value={formData.email}
            onChangeText={text => {
              setValue('email', text);
              if (errors.email) clearErrors('email');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={255}
          />
          {errors.email && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.email.message}
            </Text>
          )}
        </View>

        {/* Website */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Website</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.website ? colors.error : colors.border,
              borderWidth: errors.website ? 2 : 1
            }]}
            placeholder="Enter website URL"
            placeholderTextColor={colors.textSecondary}
            value={formData.website}
            onChangeText={text => {
              setValue('website', text);
              if (errors.website) clearErrors('website');
            }}
            keyboardType="url"
            autoCapitalize="none"
            maxLength={255}
          />
          {errors.website && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.website.message}
            </Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.address ? colors.error : colors.border,
              borderWidth: errors.address ? 2 : 1
            }]}
            placeholder="Enter address"
            placeholderTextColor={colors.textSecondary}
            value={formData.address}
            onChangeText={text => {
              setValue('address', text);
              if (errors.address) clearErrors('address');
            }}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          {errors.address && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.address.message}
            </Text>
          )}
        </View>

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
          {renderDropdownButton(
            formData.priority,
            () => openDropdown('priority', PRIORITY_OPTIONS as unknown as string[], 'Select priority'),
            'Select priority'
          )}
          {errors.priority && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.priority.message}
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: errors.notes ? colors.error : colors.border,
              borderWidth: errors.notes ? 2 : 1
            }]}
            placeholder="Enter additional notes"
            placeholderTextColor={colors.textSecondary}
            value={formData.notes}
            onChangeText={text => {
              setValue('notes', text);
              if (errors.notes) clearErrors('notes');
            }}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          {errors.notes && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.notes.message}
            </Text>
          )}
        </View>

        {/* Add Vendor Button */}
        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: loading ? colors.textSecondary : colors.primary 
          }]}
          onPress={handleSubmit(onSubmit as any)}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={24} color={colors.background} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>
            {loading ? 'Adding Vendor...' : 'Add Vendor'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={activeDropdown !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{dropdownTitle}</Text>
              <TouchableOpacity onPress={closeDropdown}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {dropdownItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.modalItem, { 
                    backgroundColor: getSelectedValue() === item ? colors.primaryLight : 'transparent'
                  }]}
                  onPress={() => handleDropdownSelect(item)}
                >
                  <Text style={[styles.modalItemText, { 
                    color: getSelectedValue() === item ? colors.primary : colors.text 
                  }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
}); 