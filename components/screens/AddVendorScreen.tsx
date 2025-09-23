import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useVendors } from '../../lib/contexts/VendorsContext';

const VENDOR_CATEGORIES = [
  'Appliances',
  'Architect',
  'Builder',
  'Carpenter',
  'Cleaning',
  'Closets',
  'Drywall',
  'Electrician',
  'Fencing',
  'Flooring',
  'Garage Door',
  'Handyman',
  'HVAC',
  'Interior Designs',
  'Landscape',
  'Masonry / Concrete',
  'Organizer',
  'Painter',
  'Pest Control',
  'Plumber',
  'Pool / Spa',
  'Roofing',
  'Security',
  'Solar Panel',
  'Well / Water Treatment',
  'Windows',
  'Other',
];

const PRIORITY_OPTIONS = [
  'Primary',
  'Secondary'
];

export default function AddVendorScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { addVendor } = useVendors();
  const params = useLocalSearchParams();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [priority, setPriority] = useState('Primary');

  // Pre-fill form with contact data if provided
  useEffect(() => {
    if (params.name) {
      setName(String(params.name));
    }
    if (params.contact_name) {
      setContactName(String(params.contact_name));
    }
    if (params.phone) {
      setPhone(String(params.phone));
    }
    if (params.email) {
      setEmail(String(params.email));
    }
    if (params.company) {
      setName(String(params.company));
    }
  }, [params]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownItems, setDropdownItems] = useState<string[]>([]);
  const [dropdownTitle, setDropdownTitle] = useState('');

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
      case 'priority':
        setPriority(value);
        break;
    }
    closeDropdown();
  };

  const handleAddVendor = async () => {
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

      const vendorData = {
        name: name.trim(),
        category: category,
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null
      };

      const newVendor = await addVendor(vendorData as any);
      
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
        return category;
      case 'priority':
        return priority;
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

        {/* Priority */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Priority</Text>
          {renderDropdownButton(
            priority,
            () => openDropdown('priority', PRIORITY_OPTIONS, 'Select priority'),
            'Select priority'
          )}
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

        {/* Add Vendor Button */}
        <TouchableOpacity
          style={[styles.addButton, { 
            backgroundColor: loading ? colors.textSecondary : colors.primary 
          }]}
          onPress={handleAddVendor}
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
}); 