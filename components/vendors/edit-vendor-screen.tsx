import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRealTimeSubscription } from '../../lib/hooks/useRealTimeSubscription';
import { useVendorsStore } from '../../lib/stores/vendorsStore';

interface Vendor {
  id: string;
  name: string;
  category?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

const VENDOR_CATEGORIES = [
  'Organizer',
  'Plumber',
  'Electrician',
  'HVAC',
  'Landscaper',
  'Painter',
  'Carpenter',
  'Roofing',
  'Pest Control',
  'Cleaning Service',
  'Security',
  'Other'
];

export default function EditVendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const vendors = useVendorsStore(state => state.vendors);
  const updateVendor = useVendorsStore(state => state.updateVendor);
  const fetchVendors = useVendorsStore(state => state.fetchVendors);
  const setVendors = useVendorsStore(state => state.setVendors);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Initial data fetch
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchVendors(user.id);
    }
    return () => {
      hasFetchedRef.current = false;
    };
  }, [user?.id, fetchVendors]);
  
  // Real-time subscription for vendors
  const handleVendorChange = useCallback((payload: any) => {
    if (payload.new?.user_id === user?.id || payload.old?.user_id === user?.id) {
      const eventType = payload.eventType;
      const currentVendors = useVendorsStore.getState().vendors;

      if (eventType === 'INSERT') {
        setVendors([payload.new, ...currentVendors]);
      } 
      else if (eventType === 'UPDATE') {
        setVendors(
          currentVendors.map(vendor => 
            vendor.id === payload.new.id ? payload.new : vendor
          )
        );
      } 
      else if (eventType === 'DELETE') {
        setVendors(
          currentVendors.filter(vendor => vendor.id !== payload.old.id)
        );
      }
    }
  }, [user?.id, setVendors]);
  
  useRealTimeSubscription(
    { 
      table: 'vendors',
      filter: user?.id ? `user_id=eq.${user.id}` : undefined
    },
    handleVendorChange
  );
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Dropdown state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [dropdownTitle, setDropdownTitle] = useState('');

  useEffect(() => {
    if (id && vendors.length > 0) {
      const foundVendor = vendors.find(v => v.id === id);
      if (foundVendor) {
        setVendor(foundVendor);
        // Populate form with existing data
        setName(foundVendor.name || '');
        setCategory(foundVendor.category || '');
        setContactName(foundVendor.contact_name || '');
        setPhone(foundVendor.phone || '');
        setEmail(foundVendor.email || '');
        setWebsite(foundVendor.website || '');
        setAddress(foundVendor.address || '');
        setNotes(foundVendor.notes || '');
      }
    }
  }, [id, vendors]);

  if (!vendor) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vendor Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            The vendor you&apos;re looking for doesn&apos;t exist.
          </Text>
        </View>
      </View>
    );
  }

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
        setCategory(value);
        break;
    }
    closeDropdown();
  };

  const handleUpdateVendor = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a vendor name');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      setLoading(true);

      const vendorUpdates = {
        name: name.trim(),
        category: category,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null
      };

      await updateVendor(vendor.id, vendorUpdates);
      
      Alert.alert('Success', 'Vendor updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating vendor:', error);
      Alert.alert('Error', 'Failed to update vendor. Please try again.');
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
        return category;
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Vendor</Text>
        <TouchableOpacity
          style={[styles.saveButton, { 
            backgroundColor: loading ? colors.textSecondary : colors.primary 
          }]}
          onPress={handleUpdateVendor}
          disabled={loading}
        >
          <Ionicons name="checkmark" size={20} color={colors.background} />
        </TouchableOpacity>
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
              borderColor: colors.border 
            }]}
            placeholder="Enter vendor name"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={255}
          />
        </View>

        {/* Category */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Category *</Text>
          {renderDropdownButton(
            category,
            () => openDropdown('category', VENDOR_CATEGORIES, 'Select category'),
            'Select category'
          )}
        </View>

        {/* Contact Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Contact Name</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter contact person name"
            placeholderTextColor={colors.textSecondary}
            value={contactName}
            onChangeText={setContactName}
            maxLength={255}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter email address"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={255}
          />
        </View>

        {/* Website */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Website</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter website URL"
            placeholderTextColor={colors.textSecondary}
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
            maxLength={255}
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter address"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* Notes */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Notes</Text>
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: colors.surface,
              color: colors.text,
              borderColor: colors.border 
            }]}
            placeholder="Enter additional notes"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
        </View>

        {/* Update Vendor Button */}
        <TouchableOpacity
          style={[styles.updateButton, { 
            backgroundColor: loading ? colors.textSecondary : colors.primary 
          }]}
          onPress={handleUpdateVendor}
          disabled={loading}
        >
          <Ionicons name="save" size={24} color={colors.background} />
          <Text style={[styles.updateButtonText, { color: colors.background }]}>
            {loading ? 'Updating...' : 'Update Vendor'}
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  updateButtonText: {
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
