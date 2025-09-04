import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTasks } from '../../lib/contexts/TasksContext';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';

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

interface GroupedVendors {
  [key: string]: Vendor[];
}

// Contact interface removed - using direct phone book integration

// Comprehensive vendor categories (for future dropdown implementation)
// const VENDOR_CATEGORIES = [
//   'HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Cleaning', 'Pest Control',
//   'Roofing', 'Painting', 'Flooring', 'Appliance Repair', 'Security Systems',
//   'Pool/Spa Service', 'General Contractor', 'Handyman', 'Window/Door',
//   'Concrete/Masonry', 'Tree Service', 'Carpet Cleaning', 'Gutter Cleaning',
//   'Snow Removal', 'Other'
// ];

export default function VendorsScreen() {
  const { vendors, loading, refreshing, onRefresh, deleteVendor } = useVendors();
  const { homeTasks } = useTasks();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByCategory, setSearchByCategory] = useState(false);
  
  // Phone book integration states
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  
  // Category dropdown state (for future use)
  // const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  // const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Removed flatListRef - no longer needed without alphabet index

  // Filter vendors based on search query
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    
    if (searchByCategory) {
      return vendors.filter(vendor => 
        vendor.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.contact_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }, [vendors, searchQuery, searchByCategory]);

  // Group vendors alphabetically
  const groupedVendors = useMemo(() => {
    const grouped: GroupedVendors = {};
    
    filteredVendors.forEach(vendor => {
      const firstLetter = vendor.name.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(vendor);
    });
    
    return grouped;
  }, [filteredVendors]);

  // Get tasks assigned to a specific vendor
  const getVendorTasks = useCallback((vendorId: string) => {
    return homeTasks.filter(task => task.assigned_vendor_id === vendorId);
  }, [homeTasks]);

  // Load contacts using Expo Contacts API
  const loadContactsFromPhoneBook = async () => {
    try {
      setLoadingContacts(true);
      
      // Request permission using Expo Contacts API
      console.log('Requesting contacts permission...');
      const { status } = await Contacts.requestPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Please allow access to contacts to use this feature. You can enable this in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              Linking.openURL('app-settings:');
            }}
          ]
        );
        return;
      }

      // Permission granted, load contacts with required fields
      console.log('Loading contacts with Expo API...');
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Company
        ],
      });
      
      console.log('Raw contacts loaded:', data.length);
      console.log('Sample contact structure:', data.length > 0 ? JSON.stringify(data[0], null, 2) : 'No contacts');
      processExpoContacts(data);
      
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert(
        'Error', 
        'Failed to access contacts. Please try again.'
      );
    } finally {
      setLoadingContacts(false);
    }
  };

  // Process Expo contacts and show selection
  const processExpoContacts = (allContacts: any[]) => {
    try {
      console.log('Processing contacts...');
      
      // Filter contacts that have phone numbers or emails and names
      const validContacts = allContacts
        .filter(contact => {
          // Check for phone numbers
          const hasPhone = contact.phoneNumbers && Array.isArray(contact.phoneNumbers) && contact.phoneNumbers.length > 0;
          // Check for emails - note: expo-contacts uses 'emails' not 'emailAddresses'
          const hasEmail = contact.emails && Array.isArray(contact.emails) && contact.emails.length > 0;
          // Check for name
          const hasName = contact.name || contact.firstName || contact.lastName;
          
          const isValid = (hasPhone || hasEmail) && hasName;
          if (!isValid) {
            console.log('Filtered out contact:', {
              hasPhone,
              hasEmail,
              hasName,
              name: contact.name,
              firstName: contact.firstName,
              lastName: contact.lastName
            });
          }
          
          return isValid;
        })
        .map((contact, index) => {
          // Build display name
          const displayName = contact.name || 
            `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
            'Unknown Contact';
          
          // Get phone number
          let phone = '';
          if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
            const phoneObj = contact.phoneNumbers[0];
            phone = phoneObj.number || phoneObj.digits || '';
          }
          
          // Get email
          let email = '';
          if (contact.emails && contact.emails.length > 0) {
            const emailObj = contact.emails[0];
            email = emailObj.email || emailObj.address || '';
          }
          
          const processedContact = {
            name: contact.company || displayName,
            contact_name: displayName,
            phone: phone,
            email: email,
            company: contact.company || null
          };
          
          if (index < 3) {
            console.log(`Processed contact ${index}:`, processedContact);
          }
          
          return processedContact;
        })
        .filter(contact => contact.name && contact.name.trim() !== '');
      
      console.log('Valid contacts found:', validContacts.length);
      console.log('First 3 valid contacts:', validContacts.slice(0, 3));
      
      if (validContacts.length === 0) {
        Alert.alert(
          'No Contacts Found',
          'No contacts with phone numbers or email addresses were found in your phone book.'
        );
        return;
      }

      // Show contact selection in modal
      setContacts(validContacts);
      setShowContactsModal(true);
      
    } catch (error) {
      console.error('Error processing contacts:', error);
      Alert.alert(
        'Error', 
        'Failed to process contacts. Please try again.'
      );
    }
  };

  // Handle contact selection from modal
  const handleContactSelection = (contact: any) => {
    try {
      console.log('Selected contact:', contact);
      setShowContactsModal(false);
      
      // Navigate to add vendor with pre-filled data
      router.push({
        pathname: '/(vendors)/add',
        params: {
          name: contact.name || '',
          contact_name: contact.contact_name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          company: contact.company || ''
        }
      });
      
    } catch (error) {
      console.error('Error handling contact selection:', error);
      Alert.alert('Error', 'Failed to select contact. Please try again.');
    }
  };

  // Removed old selectContact function - using direct phone book integration now

  // Removed old action handlers - contact info is now directly clickable

  const handleDelete = (vendor: Vendor) => {
    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to delete ${vendor.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteVendor(vendor.id),
          style: 'destructive'
        }
      ]
    );
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => {
    const vendorTasks = getVendorTasks(item.id);
    
    return (
      <View style={[styles.vendorCard, { backgroundColor: colors.surface }]}>
        {/* Delete button in top right corner */}
        <TouchableOpacity
          style={[styles.deleteButtonTopRight, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.vendorHeader}
          onPress={() => router.push(`/(vendors)/${item.id}`)}
        >
          <View style={styles.vendorInfo}>
            <Text style={[styles.vendorName, { color: colors.text }]}>{item.name}</Text>
            {item.contact_name && (
              <Text style={[styles.vendorContact, { color: colors.textSecondary }]}>
                {item.contact_name}
              </Text>
            )}
            {item.category && (
              <Text style={[styles.vendorCategory, { color: colors.textTertiary }]}>
                {item.category}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        
        {/* Contact Information - Clickable */}
        <View style={styles.contactInfo}>
          {item.phone && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>{item.phone}</Text>
            </TouchableOpacity>
          )}
          {item.email && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(`mailto:${item.email}`)}
            >
              <Ionicons name="mail" size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>{item.email}</Text>
            </TouchableOpacity>
          )}
          {item.website && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => Linking.openURL(item.website!)}
            >
              <Ionicons name="globe" size={16} color={colors.primary} />
              <Text style={[styles.contactText, { color: colors.primary }]}>{item.website}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Assigned Tasks */}
        {vendorTasks.length > 0 && (
          <View style={styles.assignedTasks}>
            <Text style={[styles.assignedTasksTitle, { color: colors.text }]}>
              Assigned Tasks ({vendorTasks.length})
            </Text>
            {vendorTasks.slice(0, 3).map((task: any, index: number) => (
              <View key={task.id} style={styles.taskItem}>
                <Ionicons 
                  name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'} 
                  size={14} 
                  color={task.status === 'completed' ? colors.success : colors.textSecondary} 
                />
                <Text style={[styles.taskTitle, { color: colors.textSecondary }]}>
                  {task.title}
                </Text>
              </View>
            ))}
            {vendorTasks.length > 3 && (
              <Text style={[styles.moreTasks, { color: colors.textTertiary }]}>
                +{vendorTasks.length - 3} more tasks
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
    </View>
  );

  // Removed alphabet sidebar - was causing UI issues

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading vendors...</Text>
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Vendors</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.contactsButton, { 
              backgroundColor: colors.surface,
              marginRight: 8 
            }]}
            onPress={() => {
              console.log('Loading contacts from phone book...');
              loadContactsFromPhoneBook();
            }}
            disabled={loadingContacts}
          >
            <Ionicons 
              name={loadingContacts ? "refresh" : "people"} 
              size={20} 
              color={loadingContacts ? colors.primary : colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(vendors)/add')}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={searchByCategory ? "Search by category..." : "Search vendors..."}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={[styles.searchToggle, { backgroundColor: searchByCategory ? colors.primary : colors.background }]}
          onPress={() => setSearchByCategory(!searchByCategory)}
        >
          <Text style={[styles.searchToggleText, { color: searchByCategory ? colors.background : colors.text }]}>
            {searchByCategory ? 'Cat' : 'Name'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vendor List */}
      <View style={styles.content}>
        {filteredVendors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Vendors Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first vendor to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.addFirstButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(vendors)/add')}
              >
                <Ionicons name="add" size={16} color={colors.textInverse} />
                <Text style={[styles.addFirstButtonText, { color: colors.textInverse }]}>
                  Add Your First Vendor
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={Object.entries(groupedVendors).map(([letter, vendors]) => ({
              title: letter,
              data: vendors
            }))}
            renderItem={({ item, index }) => (
              <View key={`section_${item.title}_${index}`}>
                {renderSectionHeader({ section: { title: item.title } })}
                {item.data.map((vendor: any, vendorIndex: number) => (
                  <View key={`vendor_${vendor.id}_${vendorIndex}`}>
                    {renderVendorItem({ item: vendor })}
                  </View>
                ))}
              </View>
            )}
            keyExtractor={(item, index) => `section_${item.title}_${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            style={styles.flatListStyle}
          />
        )}
      </View>

      {/* Contacts Selection Modal */}
      <Modal
        visible={showContactsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowContactsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Contact ({contacts.length} found)
              </Text>
              <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={contacts}
              keyExtractor={(item, index) => `contact-${index}`}
              renderItem={({ item: contact }) => (
                <TouchableOpacity
                  style={[styles.modalContactItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleContactSelection(contact)}
                >
                  <View style={styles.modalContactInfo}>
                    <Text style={[styles.contactName, { color: colors.text }]}>
                      {contact.name}
                    </Text>
                    {contact.contact_name !== contact.name && (
                      <Text style={[styles.contactPersonName, { color: colors.textSecondary }]}>
                        Contact: {contact.contact_name}
                      </Text>
                    )}
                    {contact.phone && (
                      <Text style={[styles.contactPhone, { color: colors.textTertiary }]}>
                        📞 {contact.phone}
                      </Text>
                    )}
                    {contact.email && (
                      <Text style={[styles.contactEmail, { color: colors.textTertiary }]}>
                        ✉️ {contact.email}
                      </Text>
                    )}
                    {contact.company && (
                      <Text style={[styles.contactCompany, { color: colors.textSecondary }]}>
                        🏢 {contact.company}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
              style={styles.contactsList}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    marginLeft: 10,
  },
  searchToggle: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginLeft: 10,
  },
  searchToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  flatListStyle: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  vendorCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  vendorHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  vendorInfo: {
    width: '100%',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendorContact: {
    fontSize: 14,
    marginTop: 2,
  },
  vendorCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButtonTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  contactInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 4,
  },
  modalContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  assignedTasks: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  assignedTasksTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    marginLeft: 8,
    fontSize: 12,
  },
  moreTasks: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Alphabet index styles removed
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  addFirstButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Contacts Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  contactsList: {
    flex: 1,
  },
  modalContactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactPersonName: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 13,
    marginBottom: 2,
  },
  contactCompany: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});