import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function VendorsScreen() {
  const { vendors, loading, refreshing, onRefresh, deleteVendor } = useVendors();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByCategory, setSearchByCategory] = useState(false);

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

  // Get alphabet for index
  const alphabet = useMemo(() => {
    // Return complete alphabet instead of just the letters that have vendors
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }, []);

  const handleCall = (vendor: Vendor) => {
    if (!vendor.phone) {
      Alert.alert('No Phone Number', 'This vendor does not have a phone number.');
      return;
    }
    
    Alert.alert(
      'Call Vendor',
      `Call ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${vendor.phone}`)
        }
      ]
    );
  };

  const handleEmail = (vendor: Vendor) => {
    if (!vendor.email) {
      Alert.alert('No Email', 'This vendor does not have an email address.');
      return;
    }
    
    Alert.alert(
      'Email Vendor',
      `Send email to ${vendor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email', 
          onPress: () => Linking.openURL(`mailto:${vendor.email}`)
        }
      ]
    );
  };

  const handleSchedule = (vendor: Vendor) => {
    if (!vendor.website) {
      Alert.alert('No Website', 'This vendor does not have a website for online scheduling.');
      return;
    }
    
    Alert.alert(
      'Schedule Appointment',
      `Open ${vendor.name}'s website for scheduling?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Website', 
          onPress: () => Linking.openURL(vendor.website!)
        }
      ]
    );
  };

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

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <View style={[styles.vendorCard, { backgroundColor: colors.surface }]}>
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
      
      {/* Action Buttons */}
      <View style={styles.vendorActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleCall(item)}
        >
          <Ionicons name="call" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleSchedule(item)}
        >
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
          onPress={() => handleEmail(item)}
        >
          <Ionicons name="mail" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
    </View>
  );

  const renderAlphabetIndex = () => (
    <View style={styles.alphabetIndex}>
      {alphabet.map(letter => (
        <TouchableOpacity
          key={letter}
          style={styles.alphabetButton}
          onPress={() => {
            // Scroll to section logic would go here
          }}
        >
          <Text style={[styles.alphabetText, { color: colors.textSecondary }]}>{letter}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(vendors)/add')}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
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
                {item.data.map((vendor, vendorIndex) => (
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
          />
        )}
      </View>

      {/* Alphabet Index */}
      {filteredVendors.length > 0 && renderAlphabetIndex()}
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  vendorActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  actionButtonText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
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
  alphabetIndex: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -50 }],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alphabetButton: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  alphabetText: {
    fontSize: 11,
    fontWeight: '600',
  },
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
});