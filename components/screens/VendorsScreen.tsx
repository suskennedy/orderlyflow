import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
  View
} from 'react-native';
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
  const { vendors, loading, refreshing, onRefresh } = useVendors();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter vendors based on search query
  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors;
    
    return vendors.filter(vendor => 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

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
    return Object.keys(groupedVendors).sort();
  }, [groupedVendors]);

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={[styles.vendorItem, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/(dashboard)/vendors/${item.id}`)}
    >
      <View style={styles.vendorInfo}>
        <Text style={[styles.vendorName, { color: colors.text }]}>{item.name}</Text>
        {item.contact_name && (
          <Text style={[styles.contactName, { color: colors.textSecondary }]}>
            {item.contact_name}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
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
          style={styles.alphabetItem}
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
      <View style={[styles.header, { backgroundColor: colors.primaryLight }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
              onPress={() => router.push('/(dashboard)/' as RelativePathString)}
            >
              <Ionicons name="home" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}
              onPress={() => router.push('/(dashboard)/profile')}
            >
              <Ionicons name="person" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Vendors</Text>
          
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(dashboard)/vendors/add')}
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
          placeholder="Q Search"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
                onPress={() => router.push('/(dashboard)/vendors/add')}
              >
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
            renderItem={({ item }) => (
              <View>
                {renderSectionHeader({ section: { title: item.title } })}
                {item.data.map(vendor => renderVendorItem({ item: vendor }))}
              </View>
            )}
            keyExtractor={(item) => item.title}
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
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  vendorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactName: {
    fontSize: 14,
    marginTop: 2,
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
    right: 10,
    top: '50%',
    transform: [{ translateY: -50 }],
    backgroundColor: 'transparent',
  },
  alphabetItem: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    marginBottom: 5,
  },
  alphabetText: {
    fontSize: 12,
    fontWeight: 'bold',
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
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  addFirstButtonText: {
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